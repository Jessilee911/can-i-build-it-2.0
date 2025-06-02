import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import * as fs from 'fs/promises';
import * as path from 'path';
import fetch from 'node-fetch';
const pdfParse = require('pdf-parse');

interface ScrapedDocument {
  url: string;
  title: string;
  content: string;
  type: 'html' | 'pdf';
  lastUpdated: Date;
  source: 'mbie' | 'legislation' | 'council';
  category: string;
}

export class BuildingCodeScraper {
  private browser: any;
  private documents: ScrapedDocument[] = [];

  async initialize() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  async scrapeExemptBuildingWork(): Promise<ScrapedDocument[]> {
    console.log('Scraping MBIE exempt building work guidance...');
    
    const urls = [
      'https://www.building.govt.nz/building-code-compliance/building-consent/work-that-doesnt-need-consent/',
      'https://www.building.govt.nz/building-code-compliance/building-consent/exempt-building-work/'
    ];

    const scrapedDocs: ScrapedDocument[] = [];

    for (const url of urls) {
      try {
        const page = await this.browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2' });
        
        const content = await page.content();
        const $ = cheerio.load(content);
        
        // Extract main content
        const title = $('h1').text().trim();
        const mainContent = $('.main-content, .content, article').text().trim();
        
        // Find PDF links
        const pdfLinks = $('a[href$=".pdf"]').map((i, el) => $(el).attr('href')).get();
        
        scrapedDocs.push({
          url,
          title,
          content: mainContent,
          type: 'html',
          lastUpdated: new Date(),
          source: 'mbie',
          category: 'exempt_work'
        });

        // Download and process PDFs
        for (const pdfLink of pdfLinks) {
          const fullPdfUrl = new URL(pdfLink, url).href;
          const pdfDoc = await this.downloadAndParsePDF(fullPdfUrl);
          if (pdfDoc) {
            scrapedDocs.push(pdfDoc);
          }
        }

        await page.close();
      } catch (error) {
        console.error(`Error scraping ${url}:`, error);
      }
    }

    return scrapedDocs;
  }

  async scrapeBuildingActSchedule1(): Promise<ScrapedDocument | null> {
    console.log('Scraping Building Act Schedule 1...');
    
    try {
      const url = 'https://www.legislation.govt.nz/act/public/2004/0072/latest/DLM307529.html';
      const page = await this.browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle2' });
      
      const content = await page.content();
      const $ = cheerio.load(content);
      
      // Extract Schedule 1 content with structure preserved
      const scheduleContent = $('.section').map((i, el) => {
        const $el = $(el);
        const heading = $el.find('.heading').text().trim();
        const text = $el.find('.text').text().trim();
        return `${heading}\n${text}`;
      }).get().join('\n\n');

      await page.close();

      return {
        url,
        title: 'Building Act 2004 - Schedule 1',
        content: scheduleContent,
        type: 'html',
        lastUpdated: new Date(),
        source: 'legislation',
        category: 'schedule_1'
      };
    } catch (error) {
      console.error('Error scraping Building Act Schedule 1:', error);
      return null;
    }
  }

  async downloadAndParsePDF(url: string): Promise<ScrapedDocument | null> {
    try {
      console.log(`Downloading PDF: ${url}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to download PDF: ${response.statusText}`);
      }

      const buffer = await response.buffer();
      const pdfData = await pdfParse(buffer);
      
      return {
        url,
        title: path.basename(url, '.pdf'),
        content: pdfData.text,
        type: 'pdf',
        lastUpdated: new Date(),
        source: 'mbie',
        category: 'guidance_document'
      };
    } catch (error) {
      console.error(`Error processing PDF ${url}:`, error);
      return null;
    }
  }

  async scrapeAucklandCouncilGuidance(): Promise<ScrapedDocument[]> {
    console.log('Scraping Auckland Council building guidance...');
    
    const urls = [
      'https://www.aucklandcouncil.govt.nz/building-and-consents/building-consents/Pages/default.aspx',
      'https://www.aucklandcouncil.govt.nz/building-and-consents/building-consents/exempt-building-work/Pages/default.aspx'
    ];

    const scrapedDocs: ScrapedDocument[] = [];

    for (const url of urls) {
      try {
        const page = await this.browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2' });
        
        const content = await page.content();
        const $ = cheerio.load(content);
        
        const title = $('h1').text().trim();
        const mainContent = $('.main-content, .content').text().trim();
        
        scrapedDocs.push({
          url,
          title,
          content: mainContent,
          type: 'html',
          lastUpdated: new Date(),
          source: 'council',
          category: 'auckland_guidance'
        });

        await page.close();
      } catch (error) {
        console.error(`Error scraping Auckland Council ${url}:`, error);
      }
    }

    return scrapedDocs;
  }

  async saveDocuments(documents: ScrapedDocument[], basePath: string = './data/building_documents') {
    await fs.mkdir(basePath, { recursive: true });
    
    for (const doc of documents) {
      const dirPath = path.join(basePath, doc.source, doc.category);
      await fs.mkdir(dirPath, { recursive: true });
      
      const filename = `${doc.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
      const filepath = path.join(dirPath, filename);
      
      await fs.writeFile(filepath, JSON.stringify(doc, null, 2));
    }
    
    console.log(`Saved ${documents.length} documents to ${basePath}`);
  }

  async scrapeAllSources(): Promise<ScrapedDocument[]> {
    console.log('Starting comprehensive building code data collection...');
    
    await this.initialize();
    
    try {
      const allDocuments: ScrapedDocument[] = [];
      
      // Scrape MBIE exempt work guidance
      const mbieExemptDocs = await this.scrapeExemptBuildingWork();
      allDocuments.push(...mbieExemptDocs);
      
      // Scrape Building Act Schedule 1
      const schedule1Doc = await this.scrapeBuildingActSchedule1();
      if (schedule1Doc) {
        allDocuments.push(schedule1Doc);
      }
      
      // Scrape Auckland Council guidance
      const aucklandDocs = await this.scrapeAucklandCouncilGuidance();
      allDocuments.push(...aucklandDocs);
      
      // Save all documents
      await this.saveDocuments(allDocuments);
      
      this.documents = allDocuments;
      console.log(`Successfully collected ${allDocuments.length} building code documents`);
      
      return allDocuments;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  searchDocuments(query: string, category?: string): ScrapedDocument[] {
    const searchTerm = query.toLowerCase();
    
    return this.documents.filter(doc => {
      const matchesCategory = !category || doc.category === category;
      const matchesContent = doc.content.toLowerCase().includes(searchTerm) ||
                           doc.title.toLowerCase().includes(searchTerm);
      
      return matchesCategory && matchesContent;
    });
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

export const buildingCodeScraper = new BuildingCodeScraper();

import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { pdfProcessor } from './pdf-processor';
import { storage } from './storage';

interface MBIEDocument {
  title: string;
  url: string;
  lastModified: string;
  checksum: string;
  documentType: 'building_code' | 'guidance' | 'planning_rules';
}

interface MonitorConfig {
  email: {
    smtp_server: string;
    smtp_port: number;
    sender_email: string;
    sender_password: string;
    recipient_emails: string[];
  };
  monitoring: {
    check_interval_hours: number;
    download_pdfs: boolean;
    pdf_storage_path: string;
  };
}

export class MBIEUpdateMonitor {
  private config: MonitorConfig;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private knownDocuments: Map<string, MBIEDocument> = new Map();

  constructor(configPath?: string) {
    this.config = this.loadConfig(configPath);
    this.loadKnownDocuments();
  }

  private loadConfig(configPath?: string): MonitorConfig {
    const defaultConfig: MonitorConfig = {
      email: {
        smtp_server: process.env.SMTP_SERVER || 'smtp.gmail.com',
        smtp_port: parseInt(process.env.SMTP_PORT || '587'),
        sender_email: process.env.SENDER_EMAIL || '',
        sender_password: process.env.SENDER_PASSWORD || '',
        recipient_emails: [process.env.ADMIN_EMAIL || 'admin@example.com']
      },
      monitoring: {
        check_interval_hours: 6,
        download_pdfs: true,
        pdf_storage_path: './server/downloaded_pdfs/'
      }
    };

    if (configPath && fs.existsSync(configPath)) {
      const configFile = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return { ...defaultConfig, ...configFile };
    }

    return defaultConfig;
  }

  private loadKnownDocuments() {
    const knownDocsPath = path.join(import.meta.dirname || '.', 'known_mbie_documents.json');
    if (fs.existsSync(knownDocsPath)) {
      const knownDocs = JSON.parse(fs.readFileSync(knownDocsPath, 'utf-8'));
      this.knownDocuments = new Map(Object.entries(knownDocs));
    }
  }

  private saveKnownDocuments() {
    const knownDocsPath = path.join(import.meta.dirname || '.', 'known_mbie_documents.json');
    const knownDocsObj = Object.fromEntries(this.knownDocuments);
    fs.writeFileSync(knownDocsPath, JSON.stringify(knownDocsObj, null, 2));
  }

  async checkForUpdates(): Promise<MBIEDocument[]> {
    console.log('🔍 Checking MBIE for document updates...');
    
    const updatedDocuments: MBIEDocument[] = [];
    
    try {
      // Check Building Code documents
      const buildingCodeUpdates = await this.checkBuildingCodeUpdates();
      updatedDocuments.push(...buildingCodeUpdates);

      // Check Guidance documents
      const guidanceUpdates = await this.checkGuidanceDocuments();
      updatedDocuments.push(...guidanceUpdates);

      // Check Amendment notices
      const amendmentUpdates = await this.checkAmendmentNotices();
      updatedDocuments.push(...amendmentUpdates);

      if (updatedDocuments.length > 0) {
        console.log(`📄 Found ${updatedDocuments.length} updated documents`);
        await this.processUpdatedDocuments(updatedDocuments);
        await this.notifyUpdates(updatedDocuments);
      } else {
        console.log('✅ No updates found');
      }

    } catch (error) {
      console.error('❌ Error checking for updates:', error);
      await this.notifyError(error as Error);
    }

    return updatedDocuments;
  }

  private async checkBuildingCodeUpdates(): Promise<MBIEDocument[]> {
    const buildingCodeUrl = 'https://www.building.govt.nz/building-code-compliance/building-code/';
    const updates: MBIEDocument[] = [];

    try {
      const response = await axios.get(buildingCodeUrl);
      const $ = cheerio.load(response.data);

      // Look for PDF links in building code sections
      $('a[href$=".pdf"]').each((_, element) => {
        const link = $(element);
        const href = link.attr('href');
        const title = link.text().trim() || link.attr('title') || '';

        if (href && this.isBuildingCodeDocument(title)) {
          const fullUrl = href.startsWith('http') ? href : `https://www.building.govt.nz${href}`;
          const checksum = this.generateChecksum(fullUrl + title);

          const document: MBIEDocument = {
            title,
            url: fullUrl,
            lastModified: new Date().toISOString(),
            checksum,
            documentType: 'building_code'
          };

          if (this.isDocumentUpdated(document)) {
            updates.push(document);
            this.knownDocuments.set(checksum, document);
          }
        }
      });

    } catch (error) {
      console.error('Error checking building code updates:', error);
    }

    return updates;
  }

  private async checkGuidanceDocuments(): Promise<MBIEDocument[]> {
    const guidanceUrl = 'https://www.building.govt.nz/building-code-compliance/building-code/guidance/';
    const updates: MBIEDocument[] = [];

    try {
      const response = await axios.get(guidanceUrl);
      const $ = cheerio.load(response.data);

      $('a[href$=".pdf"]').each((_, element) => {
        const link = $(element);
        const href = link.attr('href');
        const title = link.text().trim() || link.attr('title') || '';

        if (href && this.isGuidanceDocument(title)) {
          const fullUrl = href.startsWith('http') ? href : `https://www.building.govt.nz${href}`;
          const checksum = this.generateChecksum(fullUrl + title);

          const document: MBIEDocument = {
            title,
            url: fullUrl,
            lastModified: new Date().toISOString(),
            checksum,
            documentType: 'guidance'
          };

          if (this.isDocumentUpdated(document)) {
            updates.push(document);
            this.knownDocuments.set(checksum, document);
          }
        }
      });

    } catch (error) {
      console.error('Error checking guidance documents:', error);
    }

    return updates;
  }

  private async checkAmendmentNotices(): Promise<MBIEDocument[]> {
    const amendmentUrl = 'https://www.building.govt.nz/building-code-compliance/building-code/amendments/';
    const updates: MBIEDocument[] = [];

    try {
      const response = await axios.get(amendmentUrl);
      const $ = cheerio.load(response.data);

      $('a[href$=".pdf"]').each((_, element) => {
        const link = $(element);
        const href = link.attr('href');
        const title = link.text().trim() || link.attr('title') || '';

        if (href && this.isAmendmentDocument(title)) {
          const fullUrl = href.startsWith('http') ? href : `https://www.building.govt.nz${href}`;
          const checksum = this.generateChecksum(fullUrl + title);

          const document: MBIEDocument = {
            title,
            url: fullUrl,
            lastModified: new Date().toISOString(),
            checksum,
            documentType: 'guidance'
          };

          if (this.isDocumentUpdated(document)) {
            updates.push(document);
            this.knownDocuments.set(checksum, document);
          }
        }
      });

    } catch (error) {
      console.error('Error checking amendment notices:', error);
    }

    return updates;
  }

  private isBuildingCodeDocument(title: string): boolean {
    const buildingCodePatterns = [
      /^[A-Z]\d+\s+/,  // B1, E2, G12, etc.
      /building code/i,
      /acceptable solution/i,
      /verification method/i
    ];

    return buildingCodePatterns.some(pattern => pattern.test(title));
  }

  private isGuidanceDocument(title: string): boolean {
    const guidancePatterns = [
      /guidance/i,
      /guide/i,
      /handbook/i,
      /manual/i
    ];

    return guidancePatterns.some(pattern => pattern.test(title));
  }

  private isAmendmentDocument(title: string): boolean {
    const amendmentPatterns = [
      /amendment/i,
      /change/i,
      /update/i,
      /revision/i
    ];

    return amendmentPatterns.some(pattern => pattern.test(title));
  }

  private generateChecksum(content: string): string {
    return createHash('md5').update(content).digest('hex');
  }

  private isDocumentUpdated(document: MBIEDocument): boolean {
    const existing = this.knownDocuments.get(document.checksum);
    return !existing || existing.lastModified !== document.lastModified;
  }

  private async processUpdatedDocuments(documents: MBIEDocument[]) {
    if (!this.config.monitoring.download_pdfs) {
      return;
    }

    // Ensure download directory exists
    fs.mkdirSync(this.config.monitoring.pdf_storage_path, { recursive: true });

    for (const document of documents) {
      try {
        console.log(`📥 Downloading: ${document.title}`);
        
        // Download PDF
        const response = await axios.get(document.url, { responseType: 'arraybuffer' });
        const filename = `${document.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        const filepath = path.join(this.config.monitoring.pdf_storage_path, filename);
        
        fs.writeFileSync(filepath, response.data);

        // Process with existing PDF processor
        await pdfProcessor.processPDF(filepath, {
          title: document.title,
          authority: 'MBIE',
          documentType: document.documentType === 'amendment' ? 'guidance' : document.documentType,
          version: 'Latest'
        });

        console.log(`✅ Processed: ${document.title}`);

      } catch (error) {
        console.error(`❌ Error processing ${document.title}:`, error);
      }
    }

    // Save updated known documents
    this.saveKnownDocuments();
  }

  private async notifyUpdates(documents: MBIEDocument[]) {
    if (!this.config.email.sender_email) {
      console.log('📧 Email not configured, skipping notification');
      return;
    }

    const subject = `🏗️ MBIE Building Code Updates Detected - ${documents.length} documents`;
    const body = this.generateUpdateEmail(documents);

    // Here you would integrate with your email service
    // For now, just log the notification
    console.log('📧 Would send email notification:', { subject, recipients: this.config.email.recipient_emails });
  }

  private async notifyError(error: Error) {
    if (!this.config.email.sender_email) {
      return;
    }

    const subject = '❌ MBIE Monitor Error';
    const body = `Error occurred while monitoring MBIE updates:\n\n${error.message}\n\nStack trace:\n${error.stack}`;

    console.log('📧 Would send error notification:', { subject, body });
  }

  private generateUpdateEmail(documents: MBIEDocument[]): string {
    let email = `
🏗️ MBIE Building Code Updates Detected

The following ${documents.length} document(s) have been updated:

`;

    documents.forEach((doc, index) => {
      email += `
${index + 1}. ${doc.title}
   Type: ${doc.documentType}
   URL: ${doc.url}
   Last Modified: ${doc.lastModified}

`;
    });

    email += `
These documents have been automatically downloaded and processed into the knowledge base.

The building assessment system has been updated with the latest information.

---
This is an automated notification from the MBIE Building Code Monitor.
    `;

    return email;
  }

  startMonitoring() {
    if (this.monitoringInterval) {
      console.log('⚠️ Monitoring is already running');
      return;
    }

    const intervalMs = this.config.monitoring.check_interval_hours * 60 * 60 * 1000;
    
    console.log(`🚀 Starting MBIE monitoring (checking every ${this.config.monitoring.check_interval_hours} hours)`);
    
    // Check immediately
    this.checkForUpdates();
    
    // Set up periodic checking
    this.monitoringInterval = setInterval(() => {
      this.checkForUpdates();
    }, intervalMs);
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('🛑 Stopped MBIE monitoring');
    }
  }

  getStatus() {
    return {
      isRunning: !!this.monitoringInterval,
      checkInterval: this.config.monitoring.check_interval_hours,
      knownDocuments: this.knownDocuments.size,
      lastCheck: new Date().toISOString()
    };
  }
}

// Singleton instance
export const mbieMonitor = new MBIEUpdateMonitor();

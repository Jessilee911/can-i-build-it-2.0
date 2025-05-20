import fetch from "node-fetch";
import { load } from "cheerio";
import { ScrapingJob, InsertProperty } from "@shared/schema";
import { storage } from "./storage";

class Scraper {
  private activeJobs: Map<number, NodeJS.Timeout> = new Map();

  async startJob(job: ScrapingJob): Promise<void> {
    // Update job status to running
    await storage.updateScrapingJob(job.id, { status: "running" });
    
    // Log the start of the job
    await storage.createActivity({
      type: "scraping",
      message: `Started scraping job for ${job.targetUrl}`,
      timestamp: new Date(),
      jobId: job.id,
      metadata: { job }
    });

    // Start the scraping process with rate limiting
    const intervalId = setInterval(async () => {
      try {
        // Check if job should continue
        const updatedJob = await storage.getScrapingJob(job.id);
        if (!updatedJob || updatedJob.status !== "running") {
          this.stopJob(job.id);
          return;
        }

        // Perform scraping
        const success = await this.scrapeUrl(updatedJob);
        
        // If max pages reached or scraping is complete, stop the job
        if (!success || (updatedJob.maxPages && updatedJob.totalRecords >= updatedJob.maxPages)) {
          await this.completeJob(job.id);
        }
      } catch (error) {
        // Log the error
        console.error(`Error in scraping job ${job.id}:`, error);
        await storage.createActivity({
          type: "error",
          message: `Error in scraping job: ${(error as Error).message}`,
          timestamp: new Date(),
          jobId: job.id,
          metadata: { error: (error as Error).message }
        });
        
        // Update error count
        const updatedJob = await storage.getScrapingJob(job.id);
        if (updatedJob) {
          await storage.updateScrapingJob(job.id, { 
            errorCount: updatedJob.errorCount + 1 
          });
          
          // If too many errors, stop the job
          if (updatedJob.errorCount >= 5) {
            await this.failJob(job.id, "Too many errors occurred");
          }
        }
      }
    }, (60 * 1000) / job.rateLimit); // Convert rate limit (requests per minute) to milliseconds
    
    // Store the interval ID to be able to stop it later
    this.activeJobs.set(job.id, intervalId);
  }

  stopJob(jobId: number): void {
    const intervalId = this.activeJobs.get(jobId);
    if (intervalId) {
      clearInterval(intervalId);
      this.activeJobs.delete(jobId);
    }
  }

  async completeJob(jobId: number): Promise<void> {
    this.stopJob(jobId);
    
    const job = await storage.getScrapingJob(jobId);
    if (!job) return;
    
    await storage.updateScrapingJob(jobId, { 
      status: "completed", 
      completedAt: new Date() 
    });
    
    await storage.createActivity({
      type: "scraping",
      message: `Completed scraping job. Collected ${job.totalRecords} records.`,
      timestamp: new Date(),
      jobId: jobId,
      metadata: { totalRecords: job.totalRecords }
    });
  }

  async failJob(jobId: number, reason: string): Promise<void> {
    this.stopJob(jobId);
    
    await storage.updateScrapingJob(jobId, { 
      status: "failed", 
      completedAt: new Date() 
    });
    
    await storage.createActivity({
      type: "error",
      message: `Scraping job failed: ${reason}`,
      timestamp: new Date(),
      jobId: jobId,
      metadata: { reason }
    });
  }

  async scrapeUrl(job: ScrapingJob): Promise<boolean> {
    // Simulate a web request and parsing
    try {
      const response = await fetch(job.targetUrl, {
        headers: job.requestHeaders as Record<string, string> || {},
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const html = await response.text();
      const $ = load(html);
      
      // Parse the selectors
      const selectors = job.dataSelectors?.split('\n') || [];
      
      if (selectors.length === 0 && !job.useAI) {
        throw new Error("No selectors provided and AI mode is disabled");
      }
      
      // Process selectors or use "AI" to extract data
      const extractedData: Record<string, any> = {};
      
      if (selectors.length > 0) {
        selectors.forEach(selector => {
          if (!selector.trim()) return;
          
          try {
            const elements = $(selector.trim());
            if (elements.length > 0) {
              const key = selector.trim().split(' ').pop() || 'data';
              extractedData[key] = elements.map((i, el) => $(el).text().trim()).get();
            }
          } catch (error) {
            console.warn(`Failed to extract data with selector ${selector}:`, error);
          }
        });
      } else if (job.useAI) {
        // Simulate AI extraction by finding common property data patterns
        extractedData.addresses = $('[class*="address"], [id*="address"], [class*="location"], [id*="location"]')
          .map((i, el) => $(el).text().trim()).get();
        
        extractedData.prices = $('[class*="price"], [id*="price"], [class*="value"], [id*="value"]')
          .map((i, el) => $(el).text().trim()).get();
          
        extractedData.propertyTypes = $('[class*="type"], [id*="type"], [class*="category"], [id*="category"]')
          .map((i, el) => $(el).text().trim()).get();
          
        extractedData.coordinates = $('[data-lat], [data-lng], [data-latitude], [data-longitude]')
          .map((i, el) => {
            const $el = $(el);
            const lat = $el.attr('data-lat') || $el.attr('data-latitude');
            const lng = $el.attr('data-lng') || $el.attr('data-longitude');
            if (lat && lng) return `${lat},${lng}`;
            return null;
          })
          .get()
          .filter(Boolean);
      }
      
      // Process the extracted data into property objects
      const properties: InsertProperty[] = [];
      
      // Determine the maximum number of items across all keys
      const maxItems = Math.max(...Object.values(extractedData)
        .filter(Array.isArray)
        .map(arr => arr.length));
      
      // Create property objects
      for (let i = 0; i < maxItems; i++) {
        const property: InsertProperty = {
          propertyId: `P-${Date.now()}-${i}`,
          address: extractedData.addresses?.[i] || extractedData.address?.[i] || "Unknown",
          location: extractedData.coordinates?.[i] || extractedData.location?.[i] || "",
          propertyType: extractedData.propertyTypes?.[i] || extractedData.type?.[i] || "Unknown",
          source: job.targetUrl,
          collectedAt: new Date(),
          jobId: job.id,
          data: {}
        };
        
        // Add all other extracted data
        for (const [key, values] of Object.entries(extractedData)) {
          if (Array.isArray(values) && values[i] !== undefined) {
            property.data[key] = values[i];
          }
        }
        
        properties.push(property);
      }
      
      // Save the extracted properties
      for (const property of properties) {
        await storage.createProperty(property);
      }
      
      return true;
    } catch (error) {
      console.error(`Scraping error for ${job.targetUrl}:`, error);
      throw error;
    }
  }
}

export const scraper = new Scraper();

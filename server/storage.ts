import {
  DataSource,
  InsertDataSource,
  ScrapingJob,
  InsertScrapingJob,
  Property,
  InsertProperty,
  Activity,
  InsertActivity,
} from "@shared/schema";

export interface IStorage {
  // Data Sources
  getDataSources(): Promise<DataSource[]>;
  getDataSource(id: number): Promise<DataSource | undefined>;
  createDataSource(dataSource: InsertDataSource): Promise<DataSource>;
  updateDataSource(id: number, dataSource: Partial<InsertDataSource>): Promise<DataSource | undefined>;
  deleteDataSource(id: number): Promise<boolean>;

  // Scraping Jobs
  getScrapingJobs(): Promise<ScrapingJob[]>;
  getScrapingJob(id: number): Promise<ScrapingJob | undefined>;
  getScrapingJobsByStatus(status: string): Promise<ScrapingJob[]>;
  createScrapingJob(job: InsertScrapingJob): Promise<ScrapingJob>;
  updateScrapingJob(id: number, job: Partial<ScrapingJob>): Promise<ScrapingJob | undefined>;
  
  // Properties
  getProperties(limit?: number, offset?: number): Promise<Property[]>;
  getProperty(id: number): Promise<Property | undefined>;
  getPropertiesByJobId(jobId: number): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  searchProperties(query: Partial<Property>): Promise<Property[]>;
  
  // Activities
  getActivities(limit?: number): Promise<Activity[]>;
  getActivitiesByJobId(jobId: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Stats
  getTotalScans(): Promise<number>;
  getTotalRecords(): Promise<number>;
  getTotalDataSources(): Promise<number>;
}

export class MemStorage implements IStorage {
  private dataSources: Map<number, DataSource>;
  private scrapingJobs: Map<number, ScrapingJob>;
  private properties: Map<number, Property>;
  private activities: Map<number, Activity>;
  
  private dataSourceId: number;
  private jobId: number;
  private propertyId: number;
  private activityId: number;

  constructor() {
    this.dataSources = new Map();
    this.scrapingJobs = new Map();
    this.properties = new Map();
    this.activities = new Map();
    
    this.dataSourceId = 1;
    this.jobId = 1;
    this.propertyId = 1;
    this.activityId = 1;
    
    // Add some initial data sources
    this.createDataSource({
      name: "County Property Records",
      url: "https://county.gov/property-records",
      type: "Property",
      description: "Official county property records database",
      isActive: true,
    });
    
    this.createDataSource({
      name: "City GIS Database",
      url: "https://city.gov/gis",
      type: "GIS",
      description: "City Geographic Information System portal",
      isActive: true,
    });
    
    this.createDataSource({
      name: "Real Estate Listings",
      url: "https://realestate.com/listings",
      type: "Property",
      description: "Commercial real estate listing service",
      isActive: true,
    });
  }

  // Data Sources
  async getDataSources(): Promise<DataSource[]> {
    return Array.from(this.dataSources.values());
  }

  async getDataSource(id: number): Promise<DataSource | undefined> {
    return this.dataSources.get(id);
  }

  async createDataSource(dataSource: InsertDataSource): Promise<DataSource> {
    const id = this.dataSourceId++;
    const newDataSource: DataSource = { ...dataSource, id };
    this.dataSources.set(id, newDataSource);
    return newDataSource;
  }

  async updateDataSource(id: number, dataSource: Partial<InsertDataSource>): Promise<DataSource | undefined> {
    const existing = this.dataSources.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...dataSource };
    this.dataSources.set(id, updated);
    return updated;
  }

  async deleteDataSource(id: number): Promise<boolean> {
    return this.dataSources.delete(id);
  }

  // Scraping Jobs
  async getScrapingJobs(): Promise<ScrapingJob[]> {
    return Array.from(this.scrapingJobs.values());
  }

  async getScrapingJob(id: number): Promise<ScrapingJob | undefined> {
    return this.scrapingJobs.get(id);
  }

  async getScrapingJobsByStatus(status: string): Promise<ScrapingJob[]> {
    return Array.from(this.scrapingJobs.values()).filter(job => job.status === status);
  }

  async createScrapingJob(job: InsertScrapingJob): Promise<ScrapingJob> {
    const id = this.jobId++;
    const now = new Date();
    const newJob: ScrapingJob = {
      ...job,
      id,
      status: "pending",
      startedAt: now,
      totalRecords: 0,
      errorCount: 0,
    };
    this.scrapingJobs.set(id, newJob);
    
    // Create activity for job creation
    await this.createActivity({
      type: "scraping",
      message: `Started scraping job for ${job.targetUrl}`,
      timestamp: now,
      jobId: id,
      metadata: { targetUrl: job.targetUrl },
    });
    
    return newJob;
  }

  async updateScrapingJob(id: number, job: Partial<ScrapingJob>): Promise<ScrapingJob | undefined> {
    const existing = this.scrapingJobs.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...job };
    this.scrapingJobs.set(id, updated);
    return updated;
  }

  // Properties
  async getProperties(limit: number = 100, offset: number = 0): Promise<Property[]> {
    const properties = Array.from(this.properties.values());
    return properties.slice(offset, offset + limit);
  }

  async getProperty(id: number): Promise<Property | undefined> {
    return this.properties.get(id);
  }

  async getPropertiesByJobId(jobId: number): Promise<Property[]> {
    return Array.from(this.properties.values()).filter(property => property.jobId === jobId);
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    const id = this.propertyId++;
    const newProperty: Property = { ...property, id };
    this.properties.set(id, newProperty);
    
    // Update job total records count
    if (property.jobId) {
      const job = await this.getScrapingJob(property.jobId);
      if (job) {
        await this.updateScrapingJob(property.jobId, {
          totalRecords: job.totalRecords + 1,
        });
      }
    }
    
    return newProperty;
  }

  async searchProperties(query: Partial<Property>): Promise<Property[]> {
    return Array.from(this.properties.values()).filter(property => {
      for (const [key, value] of Object.entries(query)) {
        // Skip undefined values in the query
        if (value === undefined) continue;
        
        // Simple string matching for text fields
        if (typeof property[key as keyof Property] === 'string') {
          const propValue = property[key as keyof Property] as string;
          if (!propValue.toLowerCase().includes((value as string).toLowerCase())) {
            return false;
          }
        } else if (property[key as keyof Property] !== value) {
          return false;
        }
      }
      return true;
    });
  }

  // Activities
  async getActivities(limit: number = 20): Promise<Activity[]> {
    const activities = Array.from(this.activities.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return activities.slice(0, limit);
  }

  async getActivitiesByJobId(jobId: number): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter(activity => activity.jobId === jobId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const id = this.activityId++;
    const newActivity: Activity = { ...activity, id };
    this.activities.set(id, newActivity);
    return newActivity;
  }

  // Stats
  async getTotalScans(): Promise<number> {
    return this.scrapingJobs.size;
  }

  async getTotalRecords(): Promise<number> {
    return this.properties.size;
  }

  async getTotalDataSources(): Promise<number> {
    return this.dataSources.size;
  }
}

export const storage = new MemStorage();

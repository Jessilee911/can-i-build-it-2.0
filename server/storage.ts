import {
  DataSource,
  InsertDataSource,
  ScrapingJob,
  InsertScrapingJob,
  Property,
  InsertProperty,
  Activity,
  InsertActivity,
  User,
  UpsertUser,
  dataSources,
  scrapingJobs,
  properties,
  activities,
  users
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, like, and, or, SQL } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserSubscription(id: string, data: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    subscriptionTier?: string;
    subscriptionStatus?: string;
    subscriptionExpiresAt?: Date;
  }): Promise<User | undefined>;

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

export class DatabaseStorage implements IStorage {
  
  constructor() {
    // We'll initialize the database with seed data if needed
    this.seedInitialData();
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.id, id));
    return results.length > 0 ? results[0] : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!email) return undefined;
    const results = await db.select().from(users).where(eq(users.email, email));
    return results.length > 0 ? results[0] : undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserSubscription(id: string, data: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    subscriptionTier?: string;
    subscriptionStatus?: string;
    subscriptionExpiresAt?: Date;
  }): Promise<User | undefined> {
    const updated = await db.update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    
    return updated.length > 0 ? updated[0] : undefined;
  }

  private async seedInitialData() {
    // Check if we have data sources
    const existingDataSources = await db.select().from(dataSources);
    
    if (existingDataSources.length === 0) {
      // Add data sources related to building regulations and zoning
      await this.createDataSource({
        name: "Auckland Council GeoMaps",
        url: "https://geomapspublic.aucklandcouncil.govt.nz",
        type: "GIS",
        description: "Official Auckland Council mapping for zoning and property information",
        isActive: true,
      });
      
      await this.createDataSource({
        name: "LINZ Data Service",
        url: "https://data.linz.govt.nz",
        type: "GIS",
        description: "Land Information New Zealand geospatial data",
        isActive: true,
      });
      
      await this.createDataSource({
        name: "Building Code NZ",
        url: "https://www.building.govt.nz/building-code-compliance",
        type: "Building Code",
        description: "New Zealand Building Code regulations and compliance documents",
        isActive: true,
      });
      
      await this.createDataSource({
        name: "District Plan",
        url: "https://unitaryplan.aucklandcouncil.govt.nz",
        type: "Planning",
        description: "Auckland Unitary Plan zoning and district regulations",
        isActive: true,
      });
    }
  }

  // Data Sources
  async getDataSources(): Promise<DataSource[]> {
    return await db.select().from(dataSources);
  }

  async getDataSource(id: number): Promise<DataSource | undefined> {
    const results = await db.select().from(dataSources).where(eq(dataSources.id, id));
    return results.length > 0 ? results[0] : undefined;
  }

  async createDataSource(dataSource: InsertDataSource): Promise<DataSource> {
    const newDataSource = await db.insert(dataSources).values(dataSource).returning();
    return newDataSource[0];
  }

  async updateDataSource(id: number, dataSource: Partial<InsertDataSource>): Promise<DataSource | undefined> {
    const updated = await db.update(dataSources)
      .set(dataSource)
      .where(eq(dataSources.id, id))
      .returning();
    
    return updated.length > 0 ? updated[0] : undefined;
  }

  async deleteDataSource(id: number): Promise<boolean> {
    const deleted = await db.delete(dataSources)
      .where(eq(dataSources.id, id))
      .returning();
    
    return deleted.length > 0;
  }

  // Scraping Jobs
  async getScrapingJobs(): Promise<ScrapingJob[]> {
    return await db.select().from(scrapingJobs);
  }

  async getScrapingJob(id: number): Promise<ScrapingJob | undefined> {
    const results = await db.select().from(scrapingJobs).where(eq(scrapingJobs.id, id));
    return results.length > 0 ? results[0] : undefined;
  }

  async getScrapingJobsByStatus(status: string): Promise<ScrapingJob[]> {
    return await db.select().from(scrapingJobs).where(eq(scrapingJobs.status, status));
  }

  async createScrapingJob(job: InsertScrapingJob): Promise<ScrapingJob> {
    const now = new Date();
    
    const newJob = await db.insert(scrapingJobs).values({
      ...job,
      status: "pending",
      startedAt: now,
      completedAt: null,
      totalRecords: 0,
      errorCount: 0,
      dataSelectors: job.dataSelectors || null,
      maxPages: job.maxPages || null,
      config: job.config || {},
      requestHeaders: job.requestHeaders || {}
    }).returning();
    
    // Create activity for job creation
    await this.createActivity({
      type: "scraping",
      message: `Started scraping job for ${job.targetUrl}`,
      timestamp: now,
      jobId: newJob[0].id,
      metadata: { targetUrl: job.targetUrl },
    });
    
    return newJob[0];
  }

  async updateScrapingJob(id: number, job: Partial<ScrapingJob>): Promise<ScrapingJob | undefined> {
    const updated = await db.update(scrapingJobs)
      .set(job)
      .where(eq(scrapingJobs.id, id))
      .returning();
    
    return updated.length > 0 ? updated[0] : undefined;
  }

  // Properties
  async getProperties(limit: number = 100, offset: number = 0): Promise<Property[]> {
    return await db.select().from(properties).limit(limit).offset(offset);
  }

  async getProperty(id: number): Promise<Property | undefined> {
    const results = await db.select().from(properties).where(eq(properties.id, id));
    return results.length > 0 ? results[0] : undefined;
  }

  async getPropertiesByJobId(jobId: number): Promise<Property[]> {
    return await db.select().from(properties).where(eq(properties.jobId, jobId));
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    // Ensure all required fields are properly set
    const propertyToInsert = {
      ...property,
      address: property.address || null,
      location: property.location || null,
      propertyType: property.propertyType || null,
      jobId: property.jobId || null,
      data: property.data || {}
    };
    
    const newProperty = await db.insert(properties).values(propertyToInsert).returning();
    
    // Update job total records count if there's a job ID
    if (property.jobId) {
      const job = await this.getScrapingJob(property.jobId);
      if (job) {
        await this.updateScrapingJob(property.jobId, {
          totalRecords: (job.totalRecords || 0) + 1,
        });
      }
    }
    
    return newProperty[0];
  }

  async searchProperties(query: Partial<Property>): Promise<Property[]> {
    // Build a dynamic where clause based on the query
    const whereClauses: SQL[] = [];
    
    if (query.propertyType) {
      whereClauses.push(like(properties.propertyType, `%${query.propertyType}%`));
    }
    
    if (query.address) {
      whereClauses.push(like(properties.address, `%${query.address}%`));
    }
    
    if (query.source) {
      whereClauses.push(like(properties.source, `%${query.source}%`));
    }
    
    if (query.jobId) {
      whereClauses.push(eq(properties.jobId, query.jobId));
    }
    
    // If no conditions, return all properties
    if (whereClauses.length === 0) {
      return this.getProperties();
    }
    
    // Combine all conditions with OR for flexible searching
    return await db.select().from(properties).where(or(...whereClauses));
  }

  // Activities
  async getActivities(limit: number = 20): Promise<Activity[]> {
    return await db.select().from(activities)
      .orderBy(desc(activities.timestamp))
      .limit(limit);
  }

  async getActivitiesByJobId(jobId: number): Promise<Activity[]> {
    return await db.select().from(activities)
      .where(eq(activities.jobId, jobId))
      .orderBy(desc(activities.timestamp));
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const activityToInsert = {
      ...activity,
      jobId: activity.jobId || null,
      metadata: activity.metadata || {}
    };
    
    const newActivity = await db.insert(activities).values(activityToInsert).returning();
    
    return newActivity[0];
  }

  // Stats
  async getTotalScans(): Promise<number> {
    const result = await db.select({ count: scrapingJobs }).from(scrapingJobs);
    return result.length;
  }

  async getTotalRecords(): Promise<number> {
    const result = await db.select({ count: properties }).from(properties);
    return result.length;
  }

  async getTotalDataSources(): Promise<number> {
    const result = await db.select({ count: dataSources }).from(dataSources);
    return result.length;
  }
}

export const storage = new DatabaseStorage();

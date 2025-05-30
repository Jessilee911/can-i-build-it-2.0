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
  BuildingCodeSection,
  InsertBuildingCodeSection,
  PlanningRule,
  InsertPlanningRule,
  ConsentRequirement,
  InsertConsentRequirement,
  DocumentSource,
  InsertDocumentSource,
  ChatSession,
  InsertChatSession,
  ChatMessage,
  InsertChatMessage,
  PremiumRequest,
  InsertPremiumRequest,
  dataSources,
  scrapingJobs,
  properties,
  activities,
  users,
  buildingCodeSections,
  planningRules,
  consentRequirements,
  documentSources,
  chatSessions,
  chatMessages
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, like, and, or, SQL } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
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

  // Knowledge Base Operations
  // Building Code Sections
  getBuildingCodeSections(filters?: { category?: string; code?: string }): Promise<BuildingCodeSection[]>;
  getBuildingCodeSection(id: number): Promise<BuildingCodeSection | undefined>;
  createBuildingCodeSection(section: InsertBuildingCodeSection): Promise<BuildingCodeSection>;
  updateBuildingCodeSection(id: number, section: Partial<InsertBuildingCodeSection>): Promise<BuildingCodeSection | undefined>;
  searchBuildingCodeSections(query: string): Promise<BuildingCodeSection[]>;

  // Planning Rules
  getPlanningRules(filters?: { region?: string; zone?: string; council?: string }): Promise<PlanningRule[]>;
  getPlanningRule(id: number): Promise<PlanningRule | undefined>;
  createPlanningRule(rule: InsertPlanningRule): Promise<PlanningRule>;
  updatePlanningRule(id: number, rule: Partial<InsertPlanningRule>): Promise<PlanningRule | undefined>;
  searchPlanningRules(query: string, region?: string): Promise<PlanningRule[]>;

  // Consent Requirements
  getConsentRequirements(filters?: { activityType?: string; region?: string }): Promise<ConsentRequirement[]>;
  getConsentRequirement(id: number): Promise<ConsentRequirement | undefined>;
  createConsentRequirement(requirement: InsertConsentRequirement): Promise<ConsentRequirement>;
  updateConsentRequirement(id: number, requirement: Partial<InsertConsentRequirement>): Promise<ConsentRequirement | undefined>;
  searchConsentRequirements(activityType: string): Promise<ConsentRequirement[]>;

  // Document Sources
  getDocumentSources(): Promise<DocumentSource[]>;
  getDocumentSource(id: number): Promise<DocumentSource | undefined>;
  createDocumentSource(document: InsertDocumentSource): Promise<DocumentSource>;
  updateDocumentSource(id: number, document: Partial<InsertDocumentSource>): Promise<DocumentSource | undefined>;

  // Chat History Operations
  getChatSessions(userId: string): Promise<ChatSession[]>;
  getChatSession(id: number): Promise<ChatSession | undefined>;
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  updateChatSession(id: number, updates: Partial<InsertChatSession>): Promise<ChatSession | undefined>;
  deleteChatSession(id: number): Promise<boolean>;
  
  getChatMessages(sessionId: number): Promise<ChatMessage[]>;
  addChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  updateChatMessage(id: number, content: string): Promise<ChatMessage | undefined>;
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

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.emailVerificationToken, token));
    return user;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.passwordResetToken, token));
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
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

  // Building Code Sections
  async getBuildingCodeSections(filters?: { category?: string; code?: string }): Promise<BuildingCodeSection[]> {
    let query = db.select().from(buildingCodeSections).where(eq(buildingCodeSections.isActive, true));
    
    if (filters?.category) {
      query = query.where(eq(buildingCodeSections.category, filters.category));
    }
    if (filters?.code) {
      query = query.where(eq(buildingCodeSections.code, filters.code));
    }
    
    return await query;
  }

  async getBuildingCodeSection(id: number): Promise<BuildingCodeSection | undefined> {
    const result = await db.select().from(buildingCodeSections).where(eq(buildingCodeSections.id, id));
    return result[0];
  }

  async createBuildingCodeSection(section: InsertBuildingCodeSection): Promise<BuildingCodeSection> {
    const result = await db.insert(buildingCodeSections).values(section).returning();
    return result[0];
  }

  async updateBuildingCodeSection(id: number, section: Partial<InsertBuildingCodeSection>): Promise<BuildingCodeSection | undefined> {
    const result = await db.update(buildingCodeSections).set(section).where(eq(buildingCodeSections.id, id)).returning();
    return result[0];
  }

  async searchBuildingCodeSections(query: string): Promise<BuildingCodeSection[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    return await db.select().from(buildingCodeSections)
      .where(
        and(
          eq(buildingCodeSections.isActive, true),
          or(
            like(buildingCodeSections.title, searchTerm),
            like(buildingCodeSections.content, searchTerm),
            like(buildingCodeSections.code, searchTerm)
          )
        )
      );
  }

  // Planning Rules
  async getPlanningRules(filters?: { region?: string; zone?: string; council?: string }): Promise<PlanningRule[]> {
    let query = db.select().from(planningRules).where(eq(planningRules.isActive, true));
    
    if (filters?.region) {
      query = query.where(eq(planningRules.region, filters.region));
    }
    if (filters?.zone) {
      query = query.where(eq(planningRules.zone, filters.zone));
    }
    if (filters?.council) {
      query = query.where(eq(planningRules.council, filters.council));
    }
    
    return await query;
  }

  async getPlanningRule(id: number): Promise<PlanningRule | undefined> {
    const result = await db.select().from(planningRules).where(eq(planningRules.id, id));
    return result[0];
  }

  async createPlanningRule(rule: InsertPlanningRule): Promise<PlanningRule> {
    const result = await db.insert(planningRules).values(rule).returning();
    return result[0];
  }

  async updatePlanningRule(id: number, rule: Partial<InsertPlanningRule>): Promise<PlanningRule | undefined> {
    const result = await db.update(planningRules).set(rule).where(eq(planningRules.id, id)).returning();
    return result[0];
  }

  async searchPlanningRules(query: string, region?: string): Promise<PlanningRule[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    let whereConditions = and(
      eq(planningRules.isActive, true),
      or(
        like(planningRules.ruleTitle, searchTerm),
        like(planningRules.zone, searchTerm),
        like(planningRules.ruleNumber, searchTerm)
      )
    );

    if (region) {
      whereConditions = and(whereConditions, eq(planningRules.region, region));
    }

    return await db.select().from(planningRules).where(whereConditions);
  }

  // Consent Requirements
  async getConsentRequirements(filters?: { activityType?: string; region?: string }): Promise<ConsentRequirement[]> {
    let query = db.select().from(consentRequirements).where(eq(consentRequirements.isActive, true));
    
    if (filters?.activityType) {
      query = query.where(eq(consentRequirements.activityType, filters.activityType));
    }
    if (filters?.region) {
      query = query.where(eq(consentRequirements.region, filters.region));
    }
    
    return await query;
  }

  async getConsentRequirement(id: number): Promise<ConsentRequirement | undefined> {
    const result = await db.select().from(consentRequirements).where(eq(consentRequirements.id, id));
    return result[0];
  }

  async createConsentRequirement(requirement: InsertConsentRequirement): Promise<ConsentRequirement> {
    const result = await db.insert(consentRequirements).values(requirement).returning();
    return result[0];
  }

  async updateConsentRequirement(id: number, requirement: Partial<InsertConsentRequirement>): Promise<ConsentRequirement | undefined> {
    const result = await db.update(consentRequirements).set(requirement).where(eq(consentRequirements.id, id)).returning();
    return result[0];
  }

  async searchConsentRequirements(activityType: string): Promise<ConsentRequirement[]> {
    const searchTerm = `%${activityType.toLowerCase()}%`;
    return await db.select().from(consentRequirements)
      .where(
        and(
          eq(consentRequirements.isActive, true),
          or(
            like(consentRequirements.activityType, searchTerm),
            like(consentRequirements.description, searchTerm)
          )
        )
      );
  }

  // Document Sources
  async getDocumentSources(): Promise<DocumentSource[]> {
    return await db.select().from(documentSources).where(eq(documentSources.isActive, true));
  }

  async getDocumentSource(id: number): Promise<DocumentSource | undefined> {
    const result = await db.select().from(documentSources).where(eq(documentSources.id, id));
    return result[0];
  }

  async createDocumentSource(document: InsertDocumentSource): Promise<DocumentSource> {
    const result = await db.insert(documentSources).values(document).returning();
    return result[0];
  }

  async updateDocumentSource(id: number, document: Partial<InsertDocumentSource>): Promise<DocumentSource | undefined> {
    const result = await db.update(documentSources).set(document).where(eq(documentSources.id, id)).returning();
    return result[0];
  }

  // Chat History Operations
  async getChatSessions(userId: string): Promise<ChatSession[]> {
    return await db.select().from(chatSessions)
      .where(and(
        eq(chatSessions.userId, userId),
        eq(chatSessions.isActive, true)
      ))
      .orderBy(desc(chatSessions.updatedAt));
  }

  async getChatSession(id: number): Promise<ChatSession | undefined> {
    const result = await db.select().from(chatSessions).where(eq(chatSessions.id, id));
    return result[0];
  }

  async createChatSession(session: InsertChatSession): Promise<ChatSession> {
    const result = await db.insert(chatSessions).values(session).returning();
    return result[0];
  }

  async updateChatSession(id: number, updates: Partial<InsertChatSession>): Promise<ChatSession | undefined> {
    const result = await db.update(chatSessions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(chatSessions.id, id))
      .returning();
    return result[0];
  }

  async deleteChatSession(id: number): Promise<boolean> {
    const result = await db.update(chatSessions)
      .set({ isActive: false })
      .where(eq(chatSessions.id, id))
      .returning();
    return result.length > 0;
  }
  
  async getChatMessages(sessionId: number): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(chatMessages.timestamp);
  }

  async addChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const result = await db.insert(chatMessages).values(message).returning();
    return result[0];
  }

  async updateChatMessage(id: number, content: string): Promise<ChatMessage | undefined> {
    const result = await db.update(chatMessages)
      .set({ content })
      .where(eq(chatMessages.id, id))
      .returning();
    return result[0];
  }

  // Premium request operations
  async createPremiumRequest(requestData: InsertPremiumRequest): Promise<PremiumRequest> {
    const [request] = await db
      .insert(premiumRequests)
      .values(requestData)
      .returning();
    return request;
  }

  async getPremiumRequests(): Promise<PremiumRequest[]> {
    return await db.select().from(premiumRequests).orderBy(desc(premiumRequests.createdAt));
  }

  async getPremiumRequestById(id: number): Promise<PremiumRequest | undefined> {
    const [request] = await db.select().from(premiumRequests).where(eq(premiumRequests.id, id));
    return request;
  }
}

export const storage = new DatabaseStorage();

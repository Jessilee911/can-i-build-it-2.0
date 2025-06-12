import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  }
);

// Users table for subscribers
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique().notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  // Password authentication fields
  passwordHash: varchar("password_hash"), // For email/password auth
  emailVerified: boolean("email_verified").default(false),
  emailVerificationToken: varchar("email_verification_token"),
  passwordResetToken: varchar("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  // Account type and status
  authProvider: varchar("auth_provider").default("email"), // 'email', 'replit', 'google', etc.
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // Subscription data
  stripeCustomerId: varchar("stripe_customer_id").unique(),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionTier: varchar("subscription_tier"),
  subscriptionStatus: varchar("subscription_status"),
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Data source table to keep track of different data sources
export const dataSources = pgTable("data_sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  type: text("type").notNull(), // GIS, Property, etc.
  description: text("description"),
  isActive: boolean("is_active").default(true),
});

export const insertDataSourceSchema = createInsertSchema(dataSources).omit({
  id: true,
});

// Scraping jobs table
export const scrapingJobs = pgTable("scraping_jobs", {
  id: serial("id").primaryKey(),
  sourceId: integer("source_id").references(() => dataSources.id),
  status: text("status").notNull(), // pending, running, completed, failed
  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at"),
  targetUrl: text("target_url").notNull(),
  rateLimit: integer("rate_limit").notNull(),
  maxPages: integer("max_pages"),
  dataSelectors: text("data_selectors"),
  useAI: boolean("use_ai").default(false),
  outputFormat: text("output_format").notNull(),
  totalRecords: integer("total_records").default(0),
  errorCount: integer("error_count").default(0),
  config: jsonb("config"), // Additional configuration options
  requestHeaders: jsonb("request_headers"), // Headers to send with requests
});

export const insertScrapingJobSchema = createInsertSchema(scrapingJobs).omit({
  id: true,
  status: true,
  startedAt: true,
  completedAt: true,
  totalRecords: true,
  errorCount: true,
});

// Property data table
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  propertyId: text("property_id").notNull(),
  address: text("address"),
  location: text("location"), // Coordinates as text "lat,lng"
  propertyType: text("property_type"),
  source: text("source").notNull(),
  collectedAt: timestamp("collected_at").notNull(),
  jobId: integer("job_id").references(() => scrapingJobs.id),
  data: jsonb("data"), // All other property data as JSON
});

export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
});

// Activity log table
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // scraping, export, error, etc.
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  jobId: integer("job_id").references(() => scrapingJobs.id),
  metadata: jsonb("metadata"), // Additional metadata about the activity
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
});

// Building Code Knowledge Base
export const buildingCodeSections = pgTable("building_code_sections", {
  id: serial("id").primaryKey(),
  code: varchar("code").notNull(), // e.g., "B1", "E2", "G12"
  title: text("title").notNull(),
  section: varchar("section"), // e.g., "3.1.2", "4.5"
  content: text("content").notNull(),
  category: varchar("category").notNull(), // structural, fire, weathertightness, etc.
  subcategory: varchar("subcategory"), // specific area within category
  applicableTo: text("applicable_to").array(), // residential, commercial, industrial
  requirements: text("requirements").array(), // specific requirements
  acceptableSolutions: text("acceptable_solutions").array(),
  verificationMethods: text("verification_methods").array(),
  sourceDocument: text("source_document").notNull(),
  documentVersion: varchar("document_version"),
  lastUpdated: timestamp("last_updated").defaultNow(),
  isActive: boolean("is_active").default(true),
});

export const insertBuildingCodeSchema = createInsertSchema(buildingCodeSections).omit({
  id: true,
  lastUpdated: true,
});

// Regional Planning Rules
export const planningRules = pgTable("planning_rules", {
  id: serial("id").primaryKey(),
  region: varchar("region").notNull(), // Auckland, Wellington, Canterbury, etc.
  council: varchar("council").notNull(), // Auckland Council, Wellington City Council
  planName: text("plan_name").notNull(), // Auckland Unitary Plan, Wellington District Plan
  zone: varchar("zone").notNull(), // Residential - Single House, Mixed Housing Urban
  ruleNumber: varchar("rule_number"), // e.g., "H4.6.2"
  ruleTitle: text("rule_title").notNull(),
  activityStatus: varchar("activity_status").notNull(), // Permitted, Restricted Discretionary, etc.
  standards: jsonb("standards"), // height limits, setbacks, site coverage, etc.
  assessmentCriteria: text("assessment_criteria").array(),
  exemptions: text("exemptions").array(),
  relatedRules: varchar("related_rules").array(),
  sourceDocument: text("source_document").notNull(),
  documentSection: varchar("document_section"),
  effectiveDate: timestamp("effective_date"),
  lastUpdated: timestamp("last_updated").defaultNow(),
  isActive: boolean("is_active").default(true),
});

export const insertPlanningRuleSchema = createInsertSchema(planningRules).omit({
  id: true,
  lastUpdated: true,
});

// Consent Requirements Database
export const consentRequirements = pgTable("consent_requirements", {
  id: serial("id").primaryKey(),
  activityType: varchar("activity_type").notNull(), // new_dwelling, addition, renovation, etc.
  buildingType: varchar("building_type"), // residential, commercial, industrial
  description: text("description").notNull(),
  buildingConsentRequired: boolean("building_consent_required").notNull(),
  resourceConsentRequired: boolean("resource_consent_required").notNull(),
  exemptionConditions: text("exemption_conditions").array(),
  applicableZones: varchar("applicable_zones").array(),
  region: varchar("region"), // if region-specific
  council: varchar("council"), // if council-specific
  estimatedCost: varchar("estimated_cost"), // fee range
  estimatedTimeframe: varchar("estimated_timeframe"), // processing time
  requiredDocuments: text("required_documents").array(),
  professionalRequirements: text("professional_requirements").array(),
  sourceReference: text("source_reference").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow(),
  isActive: boolean("is_active").default(true),
});

export const insertConsentRequirementSchema = createInsertSchema(consentRequirements).omit({
  id: true,
  lastUpdated: true,
});

// Document Sources - for tracking PDF documents and their processing
export const documentSources = pgTable("document_sources", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  title: text("title").notNull(),
  documentType: varchar("document_type").notNull(), // building_code, planning_rules, guidance, amendment
  authority: varchar("authority").notNull(), // MBIE, Auckland Council, etc.
  region: varchar("region"), // if region-specific
  version: varchar("version"),
  publishDate: timestamp("publish_date"),
  uploadDate: timestamp("upload_date").defaultNow(),
  processingStatus: varchar("processing_status").default("pending"), // pending, processing, completed, error
  extractedSections: integer("extracted_sections").default(0),
  filePath: text("file_path"),
  checksum: varchar("checksum"), // for detecting document updates
  isActive: boolean("is_active").default(true),
});

export const insertDocumentSourceSchema = createInsertSchema(documentSources).omit({
  id: true,
  uploadDate: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = Omit<InsertUser, "id"> & { id: string };

export type DataSource = typeof dataSources.$inferSelect;
export type InsertDataSource = z.infer<typeof insertDataSourceSchema>;

export type ScrapingJob = typeof scrapingJobs.$inferSelect;
export type InsertScrapingJob = z.infer<typeof insertScrapingJobSchema>;

export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type BuildingCodeSection = typeof buildingCodeSections.$inferSelect;
export type InsertBuildingCodeSection = z.infer<typeof insertBuildingCodeSchema>;

export type PlanningRule = typeof planningRules.$inferSelect;
export type InsertPlanningRule = z.infer<typeof insertPlanningRuleSchema>;

export type ConsentRequirement = typeof consentRequirements.$inferSelect;
export type InsertConsentRequirement = z.infer<typeof insertConsentRequirementSchema>;

// Chat History for logged-in users
export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => chatSessions.id),
  role: varchar("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  metadata: jsonb("metadata"), // For storing additional context like property address
});

export const insertChatSessionSchema = createInsertSchema(chatSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true,
});

export type DocumentSource = typeof documentSources.$inferSelect;
export type InsertDocumentSource = z.infer<typeof insertDocumentSourceSchema>;

export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

// Premium assessment requests table
export const premiumRequests = pgTable("premium_requests", {
  id: serial("id").primaryKey(),
  fullName: varchar("full_name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone"),
  propertyAddress: varchar("property_address").notNull(),
  projectDescription: text("project_description").notNull(),
  status: varchar("status", { enum: ["pending", "in_progress", "completed", "cancelled"] }).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPremiumRequestSchema = createInsertSchema(premiumRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type PremiumRequest = typeof premiumRequests.$inferSelect;
export type InsertPremiumRequest = z.infer<typeof insertPremiumRequestSchema>;

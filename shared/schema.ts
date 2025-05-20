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
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
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

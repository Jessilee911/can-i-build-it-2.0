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
  documentType: varchar("document_type").notNull(), // building_code, planning_rules, guidance
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
  status: varchar("status", { enum: ["pending", "processing", "completed", "cancelled"] }).default("pending"),
  reportContent: text("report_content"),
  reportData: jsonb("report_data"),
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
import React, { useState, useRef } from 'react';
import { Search, MapPin, FileText, Download, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

const PropertyZoningApp = () => {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const reportRef = useRef(null);

  // Mock data for demonstration - in production, this would come from APIs
  const mockPropertyData = {
    address: "123 Queen Street, Auckland Central, Auckland 1010",
    lotDp: "Lot 1 DP 12345",
    zone: "City Centre Zone",
    overlays: [
      "Special Character Areas Overlay - Residential",
      "Historic Heritage Overlay",
      "Outstanding Natural Feature Overlay"
    ],
    controls: [
      "Building Height Control: 32m maximum",
      "Floor Area Ratio: 8:1 maximum",
      "Minimum Building Setback: 0m from front boundary"
    ],
    floodHazards: {
      catchment: "Waitemata Harbour Catchment",
      floodProne: false,
      details: "Property is outside the 1% AEP flood plain"
    },
    overlandFlow: "No overland flow paths detected",
    naturalHazards: [
      "Liquefaction Susceptibility: Low",
      "Land Instability: None identified"
    ],
    specialCharacter: [
      "Residential Special Character Areas Overlay",
      "Character Area: Ponsonby"
    ],
    windZone: "Zone 3 (High Wind)",
    earthquakeZone: "Zone 3 (High Seismic)",
    snowZone: "Zone 1 (No Snow Loading)",
    corrosionZone: "Zone C (Coastal - High Corrosion)",
    arterialRoad: true,
    stormwater: true,
    wastewater: true,
    coordinates: { lat: -36.8485, lng: 174.7633 }
  };

  const handleAddressSearch = async () => {
    if (!address.trim()) {
      setError('Please enter a property address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In production, this would:
      // 1. Geocode the address using LINZ Address API
      // 2. Query LINZ Parcel Boundaries to get Lot/DP
      // 3. Query council ArcGIS services for zoning info
      // 4. Query various overlays and hazard layers

      setReport({
        ...mockPropertyData,
        address: address,
        timestamp: new Date().toLocaleString('en-NZ')
      });
    } catch (err) {
      setError('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!report) return;

    const reportContent = reportRef.current.innerText;
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Property_Report_${report.address.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <MapPin className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">NZ Property Zoning Report Generator</h1>
          </div>

          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Enter property address (e.g. 123 Queen Street, Auckland)"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleAddressSearch()}
              />
            </div>
            <button
              onClick={handleAddressSearch}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-700">{error}</span>
            </div>
          )}
        </div>

        {report && (
          <div className="bg-white rounded-lg shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-green-600" />
                <h2 className="text-2xl font-bold text-gray-800">Property Zoning Report</h2>
              </div>
              <button
                onClick={downloadReport}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Download className="w-4 h-4" />
                Download Report
              </button>
            </div>

            <div ref={reportRef} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2">Property Details</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>Address:</strong> {report.address}</div>
                      <div><strong>Lot and DP:</strong> {report.lotDp}</div>
                      <div><strong>Coordinates:</strong> {report.coordinates.lat}, {report.coordinates.lng}</div>
                      <div><strong>Report Generated:</strong> {report.timestamp}</div>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2">District/Planning Zone</h3>
                    <div className="text-sm">{report.zone}</div>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2">Building Controls</h3>
                    <ul className="text-sm space-y-1">
                      {report.controls.map((control, idx) => (
                        <li key={idx}>• {control}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2">Overlays</h3>
                    <ul className="text-sm space-y-1">
                      {report.overlays.map((overlay, idx) => (
                        <li key={idx}>• {overlay}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 bg-orange-50 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2">Special Character Zones</h3>
                    <ul className="text-sm space-y-1">
                      {report.specialCharacter.map((zone, idx) => (
                        <li key={idx}>• {zone}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 bg-red-50 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2">Natural Hazards</h3>
                    <ul className="text-sm space-y-1">
                      {report.naturalHazards.map((hazard, idx) => (
                        <li key={idx}>• {hazard}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-1">Wind Zone</h4>
                  <div className="text-sm">{report.windZone}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-1">Earthquake Zone</h4>
                  <div className="text-sm">{report.earthquakeZone}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-1">Snow Zone</h4>
                  <div className="text-sm">{report.snowZone}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-1">Corrosion Zone</h4>
                  <div className="text-sm">{report.corrosionZone}</div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-3">Flood Hazards & Hydrology</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Catchment:</strong> {report.floodHazards.catchment}
                  </div>
                  <div>
                    <strong>Details:</strong> {report.floodHazards.details}
                  </div>
                </div>
                <div className="mt-2 text-sm">
                  <strong>Overland Flow Paths:</strong> {report.overlandFlow}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {report.arterialRoad ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
                    <span className="font-semibold">Main Arterial Road</span>
                  </div>
                  <div className="text-sm mt-1">{report.arterialRoad ? 'Yes' : 'No'}</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {report.stormwater ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
                    <span className="font-semibold">Stormwater Pipe</span>
                  </div>
                  <div className="text-sm mt-1">{report.stormwater ? 'Detected' : 'Not Detected'}</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {report.wastewater ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
                    <span className="font-semibold">Wastewater Pipe</span>
                  </div>
                  <div className="text-sm mt-1">{report.wastewater ? 'Detected' : 'Not Detected'}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyZoningApp;
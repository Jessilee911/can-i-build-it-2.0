import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { scraper } from "./scraper";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  createCheckoutSession,
  ONE_TIME_PLANS,
  SUBSCRIPTION_PLANS,
  handleStripeWebhook
} from "./stripe";
import {
  insertDataSourceSchema,
  insertScrapingJobSchema,
  insertPropertySchema,
  insertActivitySchema
} from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);
  
  // Create router for API routes
  const apiRouter = app;
  
  // ==================== Authentication Routes ====================
  // User info route - returns the current authenticated user
  apiRouter.get("/api/auth/user", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  // ==================== Subscription/Payment Routes ====================
  // Get available pricing plans
  apiRouter.get("/api/pricing", (req: Request, res: Response) => {
    res.json({
      onetime: ONE_TIME_PLANS,
      subscription: SUBSCRIPTION_PLANS
    });
  });
  
  // Create checkout session for payment
  apiRouter.post("/api/checkout", isAuthenticated, async (req: any, res: Response) => {
    const { planId, isSubscription = false } = req.body;
    
    if (!planId) {
      return res.status(400).json({ message: "Plan ID is required" });
    }
    
    try {
      const userId = req.user.claims.sub;
      const email = req.user.claims.email;
      
      // Host URLs for success and cancel
      const host = `${req.protocol}://${req.get('host')}`;
      const successUrl = `${host}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${host}/pricing`;
      
      const session = await createCheckoutSession(
        planId,
        isSubscription,
        userId,
        email,
        successUrl,
        cancelUrl
      );
      
      // For free plan, no payment needed
      if (session.freeAccess) {
        // Update user subscription status for free tier
        await storage.updateUserSubscription(userId, {
          subscriptionTier: planId,
          subscriptionStatus: 'active',
          subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        });
        
        return res.json({ success: true, free: true });
      }
      
      res.json({ success: true, sessionId: session.sessionId, url: session.url });
    } catch (error) {
      console.error("Checkout error:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });
  
  // Stripe webhook handler
  apiRouter.post("/api/webhook", async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'] as string;
    
    if (!signature) {
      return res.status(400).json({ message: "Missing Stripe signature" });
    }
    
    try {
      await handleStripeWebhook(signature, req.body);
      res.json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(400).json({ message: "Webhook error" });
    }
  });

  // ==================== Data Sources Routes ====================
  apiRouter.get("/api/data-sources", async (req: Request, res: Response) => {
    const dataSources = await storage.getDataSources();
    return res.json(dataSources);
  });

  apiRouter.get("/api/data-sources/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const dataSource = await storage.getDataSource(id);
    if (!dataSource) {
      return res.status(404).json({ message: "Data source not found" });
    }

    return res.json(dataSource);
  });

  apiRouter.post("/api/data-sources", async (req: Request, res: Response) => {
    try {
      const dataSource = insertDataSourceSchema.parse(req.body);
      const newDataSource = await storage.createDataSource(dataSource);
      return res.status(201).json(newDataSource);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      return res.status(500).json({ message: "Failed to create data source" });
    }
  });

  apiRouter.put("/api/data-sources/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    try {
      const updates = insertDataSourceSchema.partial().parse(req.body);
      const updated = await storage.updateDataSource(id, updates);

      if (!updated) {
        return res.status(404).json({ message: "Data source not found" });
      }

      return res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      return res.status(500).json({ message: "Failed to update data source" });
    }
  });

  apiRouter.delete("/api/data-sources/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const success = await storage.deleteDataSource(id);
    if (!success) {
      return res.status(404).json({ message: "Data source not found" });
    }

    return res.status(204).end();
  });

  // ==================== Scraping Jobs Routes ====================
  apiRouter.get("/api/scraping-jobs", async (req: Request, res: Response) => {
    const status = req.query.status as string | undefined;
    
    if (status) {
      const jobs = await storage.getScrapingJobsByStatus(status);
      return res.json(jobs);
    }
    
    const jobs = await storage.getScrapingJobs();
    return res.json(jobs);
  });

  apiRouter.get("/api/scraping-jobs/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const job = await storage.getScrapingJob(id);
    if (!job) {
      return res.status(404).json({ message: "Scraping job not found" });
    }

    return res.json(job);
  });

  apiRouter.post("/api/scraping-jobs", async (req: Request, res: Response) => {
    try {
      const job = insertScrapingJobSchema.parse(req.body);
      const newJob = await storage.createScrapingJob(job);
      
      // Start the scraping job asynchronously
      scraper.startJob(newJob).catch(error => {
        console.error(`Error in scraping job ${newJob.id}:`, error);
      });
      
      return res.status(201).json(newJob);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      return res.status(500).json({ message: "Failed to create scraping job" });
    }
  });

  // ==================== Properties Routes ====================
  apiRouter.get("/api/properties", async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string || "100");
    const offset = parseInt(req.query.offset as string || "0");
    const jobId = req.query.jobId ? parseInt(req.query.jobId as string) : undefined;
    
    if (jobId) {
      const properties = await storage.getPropertiesByJobId(jobId);
      return res.json(properties);
    }
    
    const properties = await storage.getProperties(limit, offset);
    return res.json(properties);
  });

  apiRouter.get("/api/properties/search", async (req: Request, res: Response) => {
    const query: any = {};
    
    // Add search parameters to query
    if (req.query.propertyType) query.propertyType = req.query.propertyType;
    if (req.query.source) query.source = req.query.source;
    if (req.query.address) query.address = req.query.address;
    
    const properties = await storage.searchProperties(query);
    return res.json(properties);
  });

  apiRouter.get("/api/properties/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const property = await storage.getProperty(id);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    return res.json(property);
  });

  // ==================== Activities Routes ====================
  apiRouter.get("/api/activities", async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string || "20");
    const jobId = req.query.jobId ? parseInt(req.query.jobId as string) : undefined;
    
    if (jobId) {
      const activities = await storage.getActivitiesByJobId(jobId);
      return res.json(activities);
    }
    
    const activities = await storage.getActivities(limit);
    return res.json(activities);
  });

  // ==================== Property Assessment Routes ====================
  // Property assessment using RAG and real NZ data
  apiRouter.post("/api/assess-property", async (req: Request, res: Response) => {
    try {
      const { query, address } = req.body;
      
      if (!query || query.length < 5) {
        return res.status(400).json({ message: "Query is required and must be at least 5 characters" });
      }

      // Import RAG functions
      const { generateRAGResponse, analyzeQuery } = await import('./rag');
      
      // Analyze the query to understand what the user is asking
      const queryAnalysis = analyzeQuery(query);
      
      // Generate response using RAG (Retrieval Augmented Generation)
      const ragResponse = await generateRAGResponse(query, { address, analysis: queryAnalysis });
      
      // Check if the response mentions personalized property report
      const showReportCTA = ragResponse.includes('personalized property report') || 
                           ragResponse.includes('property-specific details') ||
                           ragResponse.includes('tailored to your exact address');
      
      return res.json({
        message: ragResponse,
        queryAnalysis,
        showReportCTA,
        needsOfficialData: true,
        suggestedDataSources: [
          "LINZ Data Service API - for property boundaries and ownership",
          "Auckland Council GeoMaps API - for zoning information", 
          "Building.govt.nz - for building consent requirements",
          "Regional council APIs - for resource consent rules"
        ]
      });
    } catch (error) {
      console.error("Property assessment error:", error);
      res.status(500).json({ message: "Failed to assess property" });
    }
  });

  // ==================== Stats Routes ====================
  apiRouter.get("/api/stats", async (req: Request, res: Response) => {
    const totalScans = await storage.getTotalScans();
    const totalRecords = await storage.getTotalRecords();
    const totalDataSources = await storage.getTotalDataSources();
    
    return res.json({
      totalScans,
      totalRecords,
      totalDataSources
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}

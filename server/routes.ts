import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { scraper } from "./scraper";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateRAGResponse } from "./rag";
import { setupKnowledgeRoutes } from "./routes-knowledge";
import Stripe from "stripe";
import {
  createCheckoutSession,
  ONE_TIME_PLANS,
  SUBSCRIPTION_PLANS,
  STRIPE_PAYMENT_LINKS,
  handleStripeWebhook
} from "./stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
import {
  insertDataSourceSchema,
  insertScrapingJobSchema,
  insertPropertySchema,
  insertActivitySchema
} from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session management for email/password authentication
  const session = (await import("express-session")).default;
  const MemoryStore = (await import("memorystore")).default(session);

  app.use(session({
    secret: process.env.SESSION_SECRET || 'development-secret-key-change-in-production',
    store: new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax'
    },
    name: 'canibuild.session'
  }));

  // Setup Replit authentication
  await setupAuth(app);

  // Create router for API routes
  const apiRouter = app;

  // Setup knowledge base routes
  await setupKnowledgeRoutes(app);

  // Custom authentication middleware that handles both Replit auth and email/password auth
  const customAuth = async (req: any, res: Response, next: any) => {
    // Check for session-based authentication (email/password)
    if (req.session?.user) {
      req.user = req.session.user;
      return next();
    }

    // Check for Replit authentication
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      return next();
    }

    // If neither auth method is available, return 401
    return res.status(401).json({ message: "Authentication required" });
  };

  // ==================== Authentication Routes ====================
  // User info route - returns the current authenticated user
  apiRouter.get("/api/auth/user", async (req: any, res: Response) => {
    try {
      // Handle session-based user (email/password auth)
      if (req.session?.user) {
        return res.json(req.session.user);
      }

      // Handle Replit authenticated user
      if (req.isAuthenticated && req.isAuthenticated() && req.user) {
        const userId = req.user.claims?.sub;
        if (userId) {
          const user = await storage.getUser(userId);
          if (user) {
            return res.json(user);
          }
        }
      }

      res.status(401).json({ message: "Not authenticated" });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ==================== Chat History Routes ====================
  // Get user's chat sessions
  apiRouter.get("/api/chat-sessions", customAuth, async (req: any, res: Response) => {
    try {
      // Get user ID from either session-based auth or Replit auth
      const userId = req.session?.user?.id || req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }

      const sessions = await storage.getChatSessions(userId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching chat sessions:", error);
      res.status(500).json({ message: "Failed to fetch chat sessions" });
    }
  });

  // Create new chat session
  apiRouter.post("/api/chat-sessions", customAuth, async (req: any, res: Response) => {
    try {
      const userId = req.session?.user?.id || req.user?.claims?.sub;
      const { title } = req.body;

      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }

      const session = await storage.createChatSession({
        userId,
        title: title || "New Chat",
      });

      res.json(session);
    } catch (error) {
      console.error("Error creating chat session:", error);
      res.status(500).json({ message: "Failed to create chat session" });
    }
  });

  // Get messages for a chat session
  apiRouter.get("/api/chat-sessions/:id/messages", isAuthenticated, async (req: any, res: Response) => {
    try {
      const sessionId = parseInt(req.params.id);
      const messages = await storage.getChatMessages(sessionId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  // Add message to chat session
  apiRouter.post("/api/chat-sessions/:id/messages", isAuthenticated, async (req: any, res: Response) => {
    try {
      const sessionId = parseInt(req.params.id);
      const { role, content, metadata } = req.body;

      const message = await storage.addChatMessage({
        sessionId,
        role,
        content,
        metadata,
      });

      res.json(message);
    } catch (error) {
      console.error("Error adding chat message:", error);
      res.status(500).json({ message: "Failed to add chat message" });
    }
  });

  // Delete chat session
  apiRouter.delete("/api/chat-sessions/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      const sessionId = parseInt(req.params.id);
      const success = await storage.deleteChatSession(sessionId);

      if (success) {
        res.json({ message: "Chat session deleted successfully" });
      } else {
        res.status(404).json({ message: "Chat session not found" });
      }
    } catch (error) {
      console.error("Error deleting chat session:", error);
      res.status(500).json({ message: "Failed to delete chat session" });
    }
  });

  // ==================== Email/Password Authentication Routes ====================
  // User registration
  apiRouter.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { firstName, lastName, email, password } = req.body;

      console.log("Registration attempt for:", email);

      if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long" });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Please enter a valid email address" });
      }

      const { registerUser } = await import("./auth");
      const result = await registerUser({ firstName, lastName, email, password });

      console.log("Registration result:", result);

      if (result.success) {
        res.status(201).json({ message: result.message, user: result.user });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      console.error("Registration error details:", error);
      res.status(500).json({ message: "Registration failed. Please try again." });
    }
  });

  // User login
  apiRouter.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const { loginUser } = await import("./auth");
      const result = await loginUser({ email, password });

      if (result.success && result.user) {
        // Set user session
        (req.session as any).user = result.user;
        res.json({ message: result.message, user: result.user });
      } else {
        res.status(401).json({ message: result.message });
      }
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed. Please try again." });
    }
  });

  // Email verification
  apiRouter.get("/api/auth/verify-email", async (req: Request, res: Response) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== "string") {
        return res.status(400).json({ message: "Invalid verification token" });
      }

      const { verifyEmail } = await import("./auth");
      const result = await verifyEmail(token);

      if (result.success) {
        res.json({ message: result.message });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ message: "Email verification failed. Please try again." });
    }
  });

  // Password reset request
  apiRouter.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const { requestPasswordReset } = await import("./auth");
      const result = await requestPasswordReset(email);

      res.json({ message: result.message });
    } catch (error) {
      console.error("Password reset request error:", error);
      res.status(500).json({ message: "Password reset request failed. Please try again." });
    }
  });

  // Password reset
  apiRouter.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required" });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long" });
      }

      const { resetPassword } = await import("./auth");
      const result = await resetPassword(token, password);

      if (result.success) {
        res.json({ message: result.message });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "Password reset failed. Please try again." });
    }
  });

  // User logout
  apiRouter.post("/api/auth/logout", async (req: Request, res: Response) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destroy error:", err);
          return res.status(500).json({ message: "Logout failed" });
        }
        res.json({ message: "Logged out successfully" });
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Logout failed. Please try again." });
    }
  });

  // Update user profile
  apiRouter.put("/api/auth/profile", async (req: any, res: Response) => {
    try {
      // Check if user is authenticated (simple session check)
      if (!req.session?.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { firstName, lastName, email } = req.body;
      const userId = req.session.user.id;

      // Update user in database
      const updatedUser = await storage.updateUser(userId, {
        firstName,
        lastName,
        email,
      });

      if (updatedUser) {
        // Update session
        req.session.user = {
          ...req.session.user,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          email: updatedUser.email,
        };

        res.json({ 
          message: "Profile updated successfully", 
          user: {
            id: updatedUser.id,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            email: updatedUser.email,
            emailVerified: updatedUser.emailVerified,
            profileImageUrl: updatedUser.profileImageUrl,
          }
        });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ message: "Profile update failed. Please try again." });
    }
  });

  // Get current user (for both session-based and Replit auth)
  apiRouter.get("/api/auth/me", async (req: any, res: Response) => {
    try {
      // Handle session-based user (email/password auth)
      if (req.session?.user) {
        const user = await storage.getUser(req.session.user.id);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        return res.json({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          emailVerified: user.emailVerified,
          profileImageUrl: user.profileImageUrl,
        });
      }

      // Handle Replit authenticated user
      if (req.isAuthenticated && req.isAuthenticated() && req.user) {
        const userId = req.user?.claims?.sub;
        if (userId) {
          const user = await storage.getUser(userId);
          if (user) {
            return res.json(user);
          }
        }
      }

      res.status(401).json({ message: "Not authenticated" });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user data" });
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
  apiRouter.post("/api/create-payment-intent", async (req: Request, res: Response) => {
    try {
      const { planId, amount } = req.body;

      if (!amount || amount < 50) { // Minimum $0.50
        return res.status(400).json({ message: "Invalid amount" });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount), // Amount should already be in cents
        currency: "nzd",
        metadata: {
          planId: planId || 'unknown'
        }
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Payment intent creation error:", error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  apiRouter.post("/api/generate-report", async (req: Request, res: Response) => {
    try {
      const { planId, propertyAddress, projectDescription, budgetRange, timeframe } = req.body;

      console.log(`Redirecting to chat for ${propertyAddress}...`);

      // Instead of generating static reports, redirect to chat interface
      res.json({ 
        success: true, 
        message: "Redirecting to chat interface",
        redirect: "/chat",
        projectData: {
          propertyAddress,
          projectDescription,
          budgetRange: budgetRange || "Not specified",
          timeframe: timeframe || "Not specified",
          planId: planId || "basic"
        }
      });
    } catch (error: any) {
      console.error("Chat redirect error:", error);
      res.status(500).json({ message: "Error processing request: " + error.message });
    }
  });

  // Checkout endpoint for paid plans
  apiRouter.post("/api/checkout", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { planId } = req.body;

      if (!planId) {
        return res.status(400).json({ message: "Plan ID is required" });
      }

      const userId = req.user.claims.sub;

      // Check if it's the free plan
      if (planId === 'basic') {
        // Update user subscription status for free tier
        await storage.updateUserSubscription(userId, {
          subscriptionTier: planId,
          subscriptionStatus: 'active',
          subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        });

        return res.json({ success: true, free: true });
      }

      // Get the Stripe payment link for this plan
      const paymentLink = STRIPE_PAYMENT_LINKS[planId];

      if (!paymentLink) {
        return res.status(400).json({ message: "No payment link available for this plan" });
      }

      // Return the payment link URL for redirect
      res.json({ 
        success: true,
        url: paymentLink,
        redirectToStripe: true
      });
    } catch (error: any) {
      console.error("Checkout error:", error);
      res.status(500).json({ message: "Error processing checkout: " + error.message });
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

  apiRouter.post("/api/checkout", isAuthenticated, async (req: any, res: Response) => {
    const { planId, isSubscription = false } = req.body;

    if (!planId) {
      return res.status(400).json({ message: "Plan ID is required" });
    }

    try {
      const userId = req.user.claims.sub;

      // Check if it's the free plan
      if (planId === 'basic') {
        // Update user subscription status for free tier
        await storage.updateUserSubscription(userId, {
          subscriptionTier: planId,
          subscriptionStatus: 'active',
          subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        });

        return res.json({ success: true, free: true });
      }

      // Get the Stripe payment link for this plan
      const paymentLink = STRIPE_PAYMENT_LINKS[planId];

      if (!paymentLink) {
        return res.status(400).json({ message: "No payment link available for this plan" });
      }

      // Return the payment link URL for redirect
      res.json({ 
        success: true,
        url: paymentLink,
        redirectToStripe: true
      });
    } catch (error: any) {
      console.error("Checkout error:", error);
      res.status(500).json({ message: "Error processing checkout: " + error.message });
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

  // ==================== PDF Reading Routes ====================
  // Read uploaded PDF files
  apiRouter.post("/api/read-pdf", async (req: Request, res: Response) => {
    try {
      const { filename } = req.body;

      if (!filename) {
        return res.status(400).json({ error: "Filename is required" });
      }

      const { PDFReader } = await import('./pdf-reader');
      const content = await PDFReader.readUploadedFile(filename);

      if (content) {
        res.json({ 
          success: true, 
          filename, 
          content: content.substring(0, 5000), // Return first 5000 chars
          length: content.length 
        });
      } else {
        res.status(404).json({ error: `Could not read file: ${filename}` });
      }
    } catch (error: any) {
      console.error("PDF reading error:", error);
      res.status(500).json({ error: "Failed to read PDF file" });
    }
  });

  // Find specific Building Code clause in uploaded PDFs
  apiRouter.post("/api/find-clause", async (req: Request, res: Response) => {
    try {
      const { clauseNumber, uploadedFiles } = req.body;

      if (!clauseNumber) {
        return res.status(400).json({ error: "Clause number is required" });
      }

      const { PDFReader } = await import('./pdf-reader');
      const question = `What is ${clauseNumber}?`;
      const response = await PDFReader.answerBuildingCodeQuestion(question, uploadedFiles);

      res.json({ 
        success: true, 
        clauseNumber, 
        response 
      });
    } catch (error: any) {
      console.error("Clause search error:", error);
      res.status(500).json({ error: "Failed to find clause" });
    }
  });

  // Get list of available PDF files
  apiRouter.get("/api/available-pdfs", async (req: Request, res: Response) => {
    try {
      const { PDFReader } = await import('./pdf-reader');
      const availablePDFs = PDFReader.getAvailablePDFs();

      res.json({ 
        success: true, 
        files: availablePDFs,
        count: availablePDFs.length 
      });
    } catch (error: any) {
      console.error("PDF listing error:", error);
      res.status(500).json({ error: "Failed to list PDF files" });
    }
  });

  // ==================== Chat Routes ====================
  // Chat endpoint for plan-based conversational agent
  apiRouter.post("/api/chat", async (req: Request, res: Response) => {
    try {
      const { message, plan, conversationHistory } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: "Message is required" });
      }

      console.log('Chat request received:', { message: message.substring(0, 100), plan });

      // Check if message is asking for specific Building Code clause
      const clauseMatch = message.match(/([A-Z]\d+(?:\s+\d+(?:\.\d+)*)?)/i);

      let response;
      try {
        if (clauseMatch) {
          // Try to answer from uploaded PDFs first
          try {
            const { PDFReader } = await import('./pdf-reader');
            const pdfResponse = await PDFReader.answerBuildingCodeQuestion(message);
            if (pdfResponse && !pdfResponse.includes('not found')) {
              response = pdfResponse;
            } else {
              // Fall back to RAG system
              response = await generatePlanBasedResponse(message, plan || 'basic', conversationHistory || []);
            }
          } catch (pdfError) {
            console.warn('PDF reader error, falling back to RAG:', pdfError);
            response = await generatePlanBasedResponse(message, plan || 'basic', conversationHistory || []);
          }
        } else {
          // Generate response based on user's plan level
          response = await generatePlanBasedResponse(message, plan || 'basic', conversationHistory || []);
        }

        console.log('Generated response length:', response ? response.length : 0);
        console.log('Generated response preview:', response ? response.substring(0, 200) : 'No response');

        if (!response || typeof response !== 'string' || response.trim().length === 0) {
          console.log('Empty or invalid response, using fallback');
          response = "I'm here to help with your property development questions. Could you tell me more about what specific aspect you'd like guidance on?";
        }

        console.log('Chat response generated successfully, length:', response.length);
        console.log('Sending response:', response.substring(0, 100) + '...');
        return res.json({ response });
      } catch (responseError) {
        console.error("Response generation error:", responseError);
        const fallbackResponse = "I'm experiencing some technical difficulties right now. Please try rephrasing your question, and I'll do my best to help you with your property development needs.";
        return res.json({ response: fallbackResponse });
      }
    } catch (error: any) {
      console.error("Chat endpoint error:", error);
      res.status(500).json({ error: "Failed to generate response" });
    }
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

      // Generate response using RAG (Retrieval Augmented Generation)
      const ragResponse = await generateRAGResponse(query, { address });

      // Check if the response mentions personalized property report
      const showReportCTA = ragResponse.includes('personalized property report') || 
                           ragResponse.includes('property-specific details') ||
                           ragResponse.includes('tailored to your exact address');

      return res.json({
        message: ragResponse,
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

  // ==================== Premium Chat API ====================
  // Premium assessment request endpoint
  apiRouter.post("/api/premium-assessment-request", async (req: Request, res: Response) => {
    try {
      const { insertPremiumRequestSchema } = await import("@shared/schema");
      const requestData = insertPremiumRequestSchema.parse(req.body);

      const premiumRequest = await storage.createPremiumRequest(requestData);

      console.log("Premium assessment request created:", {
        id: premiumRequest.id,
        email: premiumRequest.email,
        propertyAddress: premiumRequest.propertyAddress
      });

      // Generate comprehensive property report using Auckland Council data
      try {
        const { premiumPropertyAgent } = await import("./premium-property-agent");
        const report = await premiumPropertyAgent.generatePropertyReport(
          premiumRequest.propertyAddress,
          premiumRequest.projectDescription
        );

        const reportText = premiumPropertyAgent.formatReportAsText(report);

        // Send the report back to user
        res.json({
          success: true,
          message: "Premium assessment report generated successfully",
          requestId: premiumRequest.id,
          report: reportText,
          reportData: report
        });
      } catch (reportError: any) {
        console.error("Error generating property report:", reportError);

        // Still save the request but return basic response
        res.json({
          success: true,
          message: "Premium assessment request submitted successfully. Report generation in progress.",
          requestId: premiumRequest.id,
          note: "Detailed report will be provided within 24 hours due to data availability."
        });
      }
    } catch (error: any) {
      console.error("Error creating premium assessment request:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to submit premium assessment request"
      });
    }
  });

  // Test PDF reading endpoint
  apiRouter.get("/api/test-pdfs", async (req: Request, res: Response) => {
    try {
      const { PDFProcessor } = await import("./pdf-processor");
      const processor = new PDFProcessor();

      const availablePDFs = processor.getAvailablePDFs();

      // Test reading first PDF
      if (availablePDFs.length > 0) {
        const firstPDF = availablePDFs[0];
        const content = await processor.readUploadedPDF(firstPDF);

        res.json({
          availablePDFs,
          testFile: firstPDF,
          contentLength: content ? content.length : 0,
          contentPreview: content ? content.substring(0, 500) + '...' : 'Could not read file'
        });
      } else {
        res.json({
          availablePDFs: [],
          message: "No PDFs found in attached_assets"
        });
      }
    } catch (error) {
      console.error("PDF test error:", error);
      res.status(500).json({ error: "Failed to test PDF processing" });
    }
  });

  // Building code question endpoint
  apiRouter.post("/api/building-code-question", async (req: Request, res: Response) => {
    try {
      const { question } = req.body;

      if (!question) {
        return res.status(400).json({ message: "Question is required" });
      }

      const { BuildingCodeRAGService } = await import("./rag");
      const ragService = new BuildingCodeRAGService();

      const result = await ragService.answerBuildingCodeQuestion(question);

      res.json(result);
    } catch (error) {
      console.error("Building code question error:", error);
      res.status(500).json({ 
        message: "Failed to process building code question",
        answer: "An error occurred while searching the building code documents.",
        sources: [],
        clauseReferences: []
      });
    }
  });

  // Premium chat endpoint
  apiRouter.post("/api/premium-chat", async (req: Request, res: Response) => {
    try {
      const { message, conversationHistory = [], propertyAddress, projectDescription } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ message: "Message is required" });
      }

      // Enhanced premium response with property/project context
      const response = await generatePremiumResponse(message, conversationHistory, propertyAddress, projectDescription);

      res.json({ 
        message: response.content,
        features: response.features
      });
    } catch (error) {
      console.error("Premium chat error:", error);
      res.status(500).json({ message: "Error processing premium chat request" });
    }
  });

  // Premium report download
  apiRouter.get("/api/premium-report/download", async (req: Request, res: Response) => {
    try {
      const projectDetails = req.query;
      const reportBuffer = await generatePremiumPDF(projectDetails);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="premium-property-report.pdf"');
      res.send(reportBuffer);
    } catch (error) {
      console.error("Premium report download error:", error);
      res.status(500).json({ message: "Error generating premium report" });
    }
  });

  // Audio transcription endpoint
  apiRouter.post("/api/transcribe-audio", async (req: Request, res: Response) => {
    try {
      const transcription = await transcribeAudioFile(req);
      res.json({ text: transcription });
    } catch (error) {
      console.error("Audio transcription error:", error);
      res.status(500).json({ message: "Error transcribing audio" });
    }
  });

  // ==================== Address Search Routes ====================
  // Address search endpoint for New Zealand addresses
  apiRouter.get("/api/search-addresses", async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 3) {
        return res.json({ suggestions: [] });
      }

      // Use Google Maps Places API for comprehensive address data
      const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!googleMapsApiKey) {
        // Fallback to local search when Google Maps API key is not available
        const fallbackSuggestions = performLocalAddressSearch(query);
        return res.json({ 
          suggestions: fallbackSuggestions,
          notice: "Using local address database. For complete New Zealand address coverage, please configure Google Maps API key."
        });
      }

      // Use Google Places API Autocomplete for New Zealand addresses
      const encodedQuery = encodeURIComponent(query);
      const googleUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodedQuery}&components=country:nz&types=address&key=${googleMapsApiKey}`;

      const response = await fetch(googleUrl);

      if (!response.ok) {
        console.error(`Google Maps API error: ${response.status} ${response.statusText}`);
        // Fall back to local search on API failure
        const fallbackSuggestions = performLocalAddressSearch(query);
        return res.json({ 
          suggestions: fallbackSuggestions,
          notice: "Using local address database. Google Maps API temporarily unavailable."
        });
      }

      const data = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        // Fall back to local search on API error
        const fallbackSuggestions = performLocalAddressSearch(query);
        return res.json({ 
          suggestions: fallbackSuggestions,
          notice: "Using local address database. Google Maps API error."
        });
      }

      // Transform Google Places API data into our format
      const suggestions = (data.predictions || []).map((prediction: any, index: number) => {
        // Parse address components from structured_formatting
        const mainText = prediction.structured_formatting?.main_text || '';
        const secondaryText = prediction.structured_formatting?.secondary_text || '';

        return {
          id: `google-${prediction.place_id || index}`,
          fullAddress: prediction.description,
          streetName: mainText,
          suburb: secondaryText.split(',')[0]?.trim() || '',
          city: secondaryText.split(',')[1]?.trim() || '',
          postcode: '',
          region: 'New Zealand'
        };
      });

      res.json({ suggestions });
    } catch (error) {
      console.error('Address search error:', error);
      res.status(500).json({ 
        error: "Address search failed",
        message: "Unable to retrieve address suggestions"
      });
    }
  });

// Helper function for local address search fallback with comprehensive NZ addresses
function performLocalAddressSearch(query: string) {
  const comprehensiveNZAddresses = [
    // Auckland addresses
    { streetName: 'Queen Street', suburb: 'Auckland Central', city: 'Auckland', postcode: '1010', region: 'Auckland' },
    { streetName: 'Karangahape Road', suburb: 'Auckland Central', city: 'Auckland', postcode: '1010', region: 'Auckland' },
    { streetName: 'Ponsonby Road', suburb: 'Ponsonby', city: 'Auckland', postcode: '1011', region: 'Auckland' },
    { streetName: 'Dominion Road', suburb: 'Mount Eden', city: 'Auckland', postcode: '1024', region: 'Auckland' },
    { streetName: 'Great South Road', suburb: 'Newmarket', city: 'Auckland', postcode: '1023', region: 'Auckland' },
    { streetName: 'Manukau Road', suburb: 'Epsom', city: 'Auckland', postcode: '1023', region: 'Auckland' },
    { streetName: 'Broadway', suburb: 'Newmarket', city: 'Auckland', postcode: '1023', region: 'Auckland' },
    { streetName: 'Remuera Road', suburb: 'Remuera', city: 'Auckland', postcode: '1050', region: 'Auckland' },
    { streetName: 'Lake Road', suburb: 'Devonport', city: 'Auckland', postcode: '0624', region: 'Auckland' },
    { streetName: 'Tamaki Drive', suburb: 'Mission Bay', city: 'Auckland', postcode: '1071', region: 'Auckland' },

    // Wellington addresses
    { streetName: 'Lambton Quay', suburb: 'Wellington Central', city: 'Wellington', postcode: '6011', region: 'Wellington' },
    { streetName: 'Cuba Street', suburb: 'Wellington Central', city: 'Wellington', postcode: '6011', region: 'Wellington' },
    { streetName: 'Courtney Place', suburb: 'Wellington Central', city: 'Wellington', postcode: '6011', region: 'Wellington' },
    { streetName: 'Oriental Parade', suburb: 'Oriental Bay', city: 'Wellington', postcode: '6011', region: 'Wellington' },
    { streetName: 'The Terrace', suburb: 'Wellington Central', city: 'Wellington', postcode: '6011', region: 'Wellington' },
    { streetName: 'Bowen Street', suburb: 'Wellington Central', city: 'Wellington', postcode: '6011', region: 'Wellington' },
    { streetName: 'Adelaide Road', suburb: 'Newtown', city: 'Wellington', postcode: '6021', region: 'Wellington' },

    // Christchurch addresses
    { streetName: 'Cashel Street', suburb: 'Christchurch Central', city: 'Christchurch', postcode: '8011', region: 'Canterbury' },
    { streetName: 'Colombo Street', suburb: 'Christchurch Central', city: 'Christchurch', postcode: '8011', region: 'Canterbury' },
    { streetName: 'Worcester Street', suburb: 'Christchurch Central', city: 'Christchurch', postcode: '8011', region: 'Canterbury' },
    { streetName: 'Riccarton Road', suburb: 'Riccarton', city: 'Christchurch', postcode: '8041', region: 'Canterbury' },
    { streetName: 'Papanui Road', suburb: 'Papanui', city: 'Christchurch', postcode: '8053', region: 'Canterbury' },
    { streetName: 'Lincoln Road', suburb: 'Addington', city: 'Christchurch', postcode: '8024', region: 'Canterbury' },

    // Hamilton addresses
    { streetName: 'Victoria Street', suburb: 'Hamilton Central', city: 'Hamilton', postcode: '3204', region: 'Waikato' },
    { streetName: 'Ward Street', suburb: 'Hamilton Central', city: 'Hamilton', postcode: '3204', region: 'Waikato' },
    { streetName: 'Anglesea Street', suburb: 'Hamilton East', city: 'Hamilton', postcode: '3216', region: 'Waikato' },

    // Tauranga addresses
    { streetName: 'Devonport Road', suburb: 'Tauranga', city: 'Tauranga', postcode: '3110', region: 'Bay of Plenty' },
    { streetName: 'Cameron Road', suburb: 'Tauranga', city: 'Tauranga', postcode: '3110', region: 'Bay of Plenty' },
    { streetName: 'Fraser Street', suburb: 'Tauranga', city: 'Tauranga', postcode: '3110', region: 'Bay of Plenty' },

    // Dunedin addresses
    { streetName: 'George Street', suburb: 'Dunedin Central', city: 'Dunedin', postcode: '9016', region: 'Otago' },
    { streetName: 'Princes Street', suburb: 'Dunedin Central', city: 'Dunedin', postcode: '9016', region: 'Otago' },
    { streetName: 'Stuart Street', suburb: 'Dunedin Central', city: 'Dunedin', postcode: '9016', region: 'Otago' },

    // Rotorua addresses
    { streetName: 'Fenton Street', suburb: 'Rotorua Central', city: 'Rotorua', postcode: '3010', region: 'Bay of Plenty' },
    { streetName: 'Tutanekai Street', suburb: 'Rotorua Central', city: 'Rotorua', postcode: '3010', region: 'Bay of Plenty' },

    // Palmerston North addresses
    { streetName: 'Main Street', suburb: 'Palmerston North Central', city: 'Palmerston North', postcode: '4410', region: 'Manawatu' },
    { streetName: 'Broadway Avenue', suburb: 'Palmerston North Central', city: 'Palmerston North', postcode: '4410', region: 'Manawatu' },

    // New Plymouth addresses
    { streetName: 'Devon Street East', suburb: 'New Plymouth Central', city: 'New Plymouth', postcode: '4310', region: 'Taranaki' },
    { streetName: 'Devon Street West', suburb: 'New Plymouth Central', city: 'New Plymouth', postcode: '4310', region: 'Taranaki' },

    // Nelson addresses
    { streetName: 'Trafalgar Street', suburb: 'Nelson Central', city: 'Nelson', postcode: '7010', region: 'Tasman' },
    { streetName: 'Hardy Street', suburb: 'Nelson Central', city: 'Nelson', postcode: '7010', region: 'Tasman' }
  ];

  const lowerQuery = query.toLowerCase();

  // Enhanced fuzzy matching with scoring
  const matches = comprehensiveNZAddresses
    .map(addr => {
      let score = 0;
      const searchTerms = lowerQuery.split(' ').filter(term => term.length > 0);

      // Check each search term against address components
      searchTerms.forEach(term => {
        if (addr.streetName.toLowerCase().includes(term)) score += 10;
        if (addr.suburb.toLowerCase().includes(term)) score += 8;
        if (addr.city.toLowerCase().includes(term)) score += 6;
        if (addr.postcode.includes(term)) score += 5;
        if (addr.region.toLowerCase().includes(term)) score += 4;

        // Bonus for exact matches at start of words
        if (addr.streetName.toLowerCase().startsWith(term)) score += 5;
        if (addr.suburb.toLowerCase().startsWith(term)) score += 4;
        if (addr.city.toLowerCase().startsWith(term)) score += 3;
      });

      return { ...addr, score };
    })
    .filter(addr => addr.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((addr, index) => ({
      id: `local-${index}`,
      fullAddress: `${addr.streetName}, ${addr.suburb}, ${addr.city} ${addr.postcode}`,
      streetName: addr.streetName,
      suburb: addr.suburb,
      city: addr.city,
      postcode: addr.postcode,
      region: addr.region
    }));

  return matches;
}

  // Auckland Council API discovery endpoint
  apiRouter.get("/api/auckland-council/discover", async (req: Request, res: Response) => {
    try {
      const { aucklandCouncilAPI } = await import("./auckland-council-api");
      const collections = await aucklandCouncilAPI.discoverCollections();
      res.json({ collections });
    } catch (error) {
      console.error("Auckland Council API discovery error:", error);
      res.status(500).json({ message: "Failed to discover Auckland Council API collections" });
    }
  });

  // Enhanced property search using Auckland Council data
  apiRouter.post("/api/property/search-auckland", async (req: Request, res: Response) => {
    try {
      const { address } = req.body;

      if (!address || address.length < 5) {
        return res.status(400).json({ message: "Address is required and must be at least 5 characters" });
      }

      const { aucklandCouncilAPI } = await import("./auckland-council-api");
      const properties = await aucklandCouncilAPI.searchPropertyByAddress(address);

      if (properties.length > 0) {
        const formattedReports = properties.map(prop => 
          aucklandCouncilAPI.formatPropertyReport(prop)
        );

        res.json({
          success: true,
          address,
          properties,
          reports: formattedReports
        });
      } else {
        res.json({
          success: false,
          address,
          message: "No properties found for this address",
          properties: []
        });
      }
    } catch (error) {
      console.error("Auckland property search error:", error);
      res.status(500).json({ message: "Failed to search Auckland Council property data" });
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

  // Add PDF download route
  apiRouter.get("/api/report/:id/download", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const activity = await storage.getActivities().then(activities => 
        activities.find(a => a.id === parseInt(id))
      );

      if (!activity || !activity.metadata.reportData) {
        return res.status(404).json({ message: "Report not found" });
      }

      const reportData = activity.metadata.reportData;
      const pdfBuffer = await generatePDF(reportData);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="property-report-${reportData.propertyAddress.replace(/\s+/g, '-')}.pdf"`);
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error("PDF generation error:", error);
      res.status(500).json({ message: "Error generating PDF: " + error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Report generation function
async function generatePropertyReport(data: {
  propertyAddress: string;
  projectDescription: string;
  budgetRange: string;
  timeframe: string;
  planId: string;
}) {
  console.log(`Generating report for ${data.propertyAddress}...`);

  // Get property data from GIS sources
  const propertyData = await getPropertyData(data.propertyAddress);

  // Generate AI response using RAG for the user's project
  const aiAnalysis = await generateRAGResponse(
    `Property: ${data.propertyAddress}. Project: ${data.projectDescription}. Budget: ${data.budgetRange}. Timeframe: ${data.timeframe}. Provide detailed analysis for New Zealand building regulations, consent requirements, and development guidance.`
  );

  const report = {
    id: Date.now().toString(),
    propertyAddress: data.propertyAddress,
    projectDescription: data.projectDescription,
    budgetRange: data.budgetRange,
    timeframe: data.timeframe,
    planId: data.planId,
    generatedAt: new Date().toISOString(),

    // Property Information
    propertyData: {
      address: data.propertyAddress,
      windZone: propertyData.windZone || "Still to come",
      earthquakeZone: propertyData.earthquakeZone || "Still to come", 
      propertyZone: propertyData.propertyZone || "Still to come",
      districtPlan: propertyData.districtPlan || "Still to come",
      gisData: propertyData.gisData || "Still to come"
    },

    // AI Analysis
    analysis: {
      buildingConsent: aiAnalysis.includes("building consent") ? 
        aiAnalysis.substring(0, 500) + "..." : 
        "Based on your project description, building consent requirements will depend on the specific scope of work. Our AI analysis suggests reviewing the Building Act 2004 requirements for your project type.",

      zoneCompliance: "Zoning compliance analysis will be provided once GIS data integration is complete. This will include permitted activities, height restrictions, and setback requirements.",

      recommendations: [
        "Consult with a licensed building practitioner for detailed plans",
        "Check with local council for specific district plan requirements", 
        "Consider engaging a structural engineer for earthquake zone compliance",
        "Review wind zone requirements for building design"
      ]
    },

    // Project Specific
    projectGuidance: aiAnalysis,

    // Regulatory Requirements
    consents: {
      buildingConsent: "Assessment pending - will depend on project scope",
      resourceConsent: "Assessment pending - subject to district plan rules",
      otherPermits: "To be determined based on project specifics"
    }
  };

  return report;
}

// Get property data from various sources
async function getPropertyData(address: string) {
  // This would integrate with actual GIS APIs in the future
  // For now, return placeholder structure
  return {
    windZone: "Still to come", // Would integrate with NIWA/Met Service data
    earthquakeZone: "Still to come", // Would integrate with GeoNet/NZGD data
    propertyZone: "Still to come", // Would integrate with council GIS
    districtPlan: "Still to come", // Would integrate with council planning data
    gisData: "Still to come" // Would integrate with LINZ data
  };
}

// Email function (requires SendGrid setup)
async function sendReportEmail(email: string, propertyAddress: string, reportData: any) {
  // Check if SendGrid is configured
  if (!process.env.SENDGRID_API_KEY) {
    console.log("SendGrid not configured - skipping email");
    return;
  }

  // This would send the actual email with SendGrid
  console.log(`Email would be sent to ${email} for property ${propertyAddress}`);
}

// PDF generation function
async function generatePDF(reportData: any): Promise<Buffer> {
  // For now, create a simple text-based PDF structure
  // In production, you'd use a library like PDFKit or Puppeteer
  const pdfContent = `
Property Report
===============

Property Address: ${reportData.propertyAddress}
Generated: ${new Date(reportData.generatedAt).toLocaleDateString()}
Plan: ${reportData.planId}

PROJECT DETAILS
---------------
Description: ${reportData.projectDescription}
Budget Range: ${reportData.budgetRange}
Timeframe: ${reportData.timeframe}

PROPERTY INFORMATION
-------------------
Wind Zone: ${reportData.propertyData.windZone}
Earthquake Zone: ${reportData.propertyData.earthquakeZone}
Property Zone: ${reportData.propertyData.propertyZone}
District Plan: ${reportData.propertyData.districtPlan}

ANALYSIS & RECOMMENDATIONS
--------------------------
${reportData.analysis.buildingConsent}

Zone Compliance: ${reportData.analysis.zoneCompliance}

Recommendations:
${reportData.analysis.recommendations.map((r: string) => `• ${r}`).join('\n')}

PROJECT GUIDANCE
----------------
${reportData.projectGuidance}

CONSENT REQUIREMENTS
-------------------
Building Consent: ${reportData.consents.buildingConsent}
Resource Consent: ${reportData.consents.resourceConsent}
Other Permits: ${reportData.consents.otherPermits}

---
Report generated by Can I Build It? NZ Property Assessment Platform
  `;

  // Convert text to Buffer (in production, use proper PDF library)
  return Buffer.from(pdfContent, 'utf-8');
}

// Premium response generator with enhanced features
async function generatePremiumResponse(message: string, conversationHistory: any[], propertyAddress?: string, projectDescription?: string) {
  const context = conversationHistory.map(msg => `${msg.type}: ${msg.content}`).join('\n');

  // ALWAYS research property data when address is provided - this is critical for premium service
  let propertyResearchData = null;
  if (propertyAddress && propertyAddress.trim()) {
    try {
      console.log(`=== STARTING COMPREHENSIVE PROPERTY RESEARCH FOR: ${propertyAddress} ===`);
      const { researchProperty } = await import('./property-research');
      propertyResearchData = await researchProperty(propertyAddress.trim());
      console.log('=== PROPERTY RESEARCH COMPLETED ===');
      console.log('Research results:', JSON.stringify(propertyResearchData, null, 2));
    } catch (error) {
      console.error('=== PROPERTY RESEARCH FAILED ===', error);
    }
  } else {
    console.log('No property address provided - skipping research');
  }

  // Enhanced system prompt with property-specific context - same style as basic agent
  const premiumSystemPrompt = `You are an expert AI property advisor for New Zealand providing comprehensive premium guidance.

    You provide detailed, helpful analysis including:
    - Comprehensive building consent guidance and requirements
    - Detailed zoning information and compliance
    - Building code requirements and interpretation
    - Resource consent process and requirements
    - Development potential assessment
    - Cost estimates and timeline guidance
    - Regulatory compliance advice
    - Enhanced premium features with specific calculations and professional recommendations

    Be thorough and helpful. This is a premium service designed to provide maximum value to property owners.
    Focus on actionable advice and clear explanations of New Zealand building regulations.

    ${propertyAddress ? `Property: ${propertyAddress}` : ''}
    ${projectDescription ? `Project: ${projectDescription}` : ''}

    ${propertyResearchData ? `
    COMPREHENSIVE PROPERTY RESEARCH DATA:
    Property Address: ${propertyResearchData.propertyAddress}
    Lot and DP Number: ${propertyResearchData.lotAndDpNumber}
    District/Planning Zone: ${propertyResearchData.districtPlanningZone}
    Overlays: ${propertyResearchData.overlays.join(', ') || 'None identified'}
    Controls: ${propertyResearchData.controls.join(', ') || 'Standard controls apply'}
    Flood Hazards: ${propertyResearchData.floodHazards.join(', ') || 'No flood hazards identified'}
    Overland Flow Paths: ${propertyResearchData.overlandFlowPaths.join(', ') || 'No overland flow paths identified'}
    Natural Hazards: ${propertyResearchData.naturalHazards.join(', ') || 'No natural hazards identified'}
    Special Character Overlays: ${propertyResearchData.specialCharacterOverlays.join(', ') || 'No special character overlays'}
    Wind Zone: ${propertyResearchData.windZone}
    Earthquake Zone: ${propertyResearchData.earthquakeZone}
    Snow Zone: ${propertyResearchData.snowZone}
    Corrosion Zones: ${propertyResearchData.corrosionZones.join(', ')}
    Building Code Requirements: ${propertyResearchData.buildingCodeRequirements.join('; ')}
    Consent Requirements: ${propertyResearchData.consentRequirements.join('; ')}
    Additional Research Findings: ${propertyResearchData.additionalResearch.slice(0, 3).join('; ')}

    Use this comprehensive data to provide specific, accurate advice about building consent requirements and building code compliance for this exact property and location.` : ''}

    FORMATTING RULES:
    - Write in clear, natural language without markdown formatting
    - Do not use # hashtags, ## headings, #### subheadings, or ** bold formatting
    - Use simple text with line breaks for section separation
    - Write section titles as plain text followed by a colon
    - Use simple dashes (-) for bullet points when needed
    - Focus on clear, readable content without formatting symbols
    - Write in the same conversational style as the basic agent

    CITATION REQUIREMENTS:
    - Always include specific source references for all building regulations mentioned
    - Cite official websites like building.govt.nz, aucklandcouncil.govt.nz
    - Reference specific Building Act 2004 sections and Building Code clauses
    - Include links to MBIE guidance documents where relevant
    - Mention specific council planning documents and zones when applicable
    - Format citations naturally within the text, not as a separate section`;

  let enhancedQuery = `${premiumSystemPrompt}\n\nConversation context:\n${context}\n\nUser message: ${message}\n\nProvide detailed premium analysis.`;

  // Check if this is an automatic comprehensive report request
  if (message.includes("comprehensive building consent assessment") && propertyAddress && projectDescription) {
    enhancedQuery = `${premiumSystemPrompt}

Property: ${propertyAddress}
Project: ${projectDescription}

Generate a comprehensive property development assessment that includes all the specific property research data provided above. Structure your response to cover:

Building Consent Analysis:
- Based on the specific zoning, overlays, and hazards identified for this property
- Include exact consent requirements based on the property's characteristics
- Reference the specific DP number, zone, and any special overlays that apply

Cost Breakdown:
- Provide detailed cost estimates including council fees specific to Auckland
- Account for any additional requirements due to flood hazards, special character areas, or natural hazards
- Include professional fees for architects, engineers, and consultants

Regulatory Compliance:
- Address the specific wind zone, earthquake zone, and corrosion requirements for this location
- Include Building Code requirements specific to the identified hazards and zones
- Reference relevant Building Act 2004 sections and official sources

Write in a conversational, helpful tone. Include all the specific property details found in the research and provide actionable advice based on the exact characteristics of this property.`;
  }

  try {
    const response = await generateRAGResponse(enhancedQuery);

    // Comprehensive cleanup of all markdown formatting symbols
    let cleanResponse = response
      // First pass: Convert headers to bullet points
      .replace(/^###\s+/gm, '• ')
      .replace(/^####\s+/gm, '  - ')
      .replace(/\n###\s+/g, '\n• ')
      .replace(/\n####\s+/g, '\n  - ')
      // Second pass: Remove all remaining # symbols
      .replace(/#{1,6}\s*/g, '')
      // Third pass: Handle bold formatting
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      // Fourth pass: Convert any remaining ** at line starts
      .replace(/^\*\*(.+)/gm, '• $1')
      .replace(/\n\*\*(.+)/g, '\n• $1')
      // Final cleanup: Remove any orphaned symbols
      .replace(/\*{1,2}/g, '')
      .replace(/#{1,6}/g, '')
      .trim();

    // Analyze response to determine features used
    const features = {
      hasCalculations: cleanResponse.includes('$') || cleanResponse.includes('cost') || cleanResponse.includes('budget'),
      hasTimeline: cleanResponse.includes('week') || cleanResponse.includes('month') || cleanResponse.includes('timeline'),
      hasRegulations: cleanResponse.includes('consent') || cleanResponse.includes('code') || cleanResponse.includes('regulation'),
      hasDocuments: true // Premium always includes documentation capability
    };

    return {
      content: cleanResponse,
      features
    };
  } catch (error) {
    console.error('Error generating premium response:', error);
    return {
      content: "I'm experiencing technical difficulties with the premium analysis. Please try again in a moment.",
      features: { hasCalculations: false, hasTimeline: false, hasRegulations: false, hasDocuments: false }
    };
  }
}

// Premium PDF generation
async function generatePremiumPDF(projectDetails: any): Promise<Buffer> {
  const premiumContent = `
PREMIUM PROPERTY DEVELOPMENT REPORT
===================================

Property Analysis: ${projectDetails.address || 'Property Assessment'}
Generated: ${new Date().toLocaleDateString()}

EXECUTIVE SUMMARY
• Comprehensive building consent analysis
• Detailed cost breakdowns and timelines
• Risk assessment and mitigation strategies
• Professional recommendations

BUILDING CONSENT REQUIREMENTS
• Application process and documentation
• Estimated processing time: 20-30 working days
• Council fees: $2,500 - $4,500
• Additional consultant costs: $3,000 - $8,000

DEVELOPMENT TIMELINE
Phase 1: Design and Planning (2-4 months)
Phase 2: Consent Application (1-2 months) 
Phase 3: Construction (6-18 months)
Phase 4: Final Inspection (2-4 weeks)

COST ANALYSIS
Planning and Design: $15,000 - $25,000
Building Consent: $5,000 - $10,000
Construction: Variable based on scope
Professional Services: $8,000 - $15,000

RISK ASSESSMENT
• Weather delays: Medium risk
• Material cost fluctuations: High risk
• Consent processing delays: Low risk
• Neighbour objections: Low risk

RECOMMENDATIONS
• Engage licensed professionals early
• Allow 20% contingency in budget
• Consider seasonal construction timing
• Maintain regular council communication

This premium report provides professional-grade analysis suitable for decision-making and project planning.
  `;

  return Buffer.from(premiumContent, 'utf-8');
}

// Audio transcription using OpenAI Whisper
async function transcribeAudioFile(req: any): Promise<string> {
  const OpenAI = require('openai');

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is required for audio transcription');
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    // In a real implementation, you'd handle multipart form data properly
    // For now, we'll return a placeholder that works with the frontend
    const transcription = await openai.audio.transcriptions.create({
      file: req.file || req.body, // This would need proper file handling
      model: "whisper-1",
    });

    return transcription.text || "Could not transcribe audio. Please try typing your message.";
  } catch (error) {
    console.error('Whisper transcription error:', error);
    return "Audio transcription temporarily unavailable. Please type your message.";
  }
}

// Generate helpful property advice responses
async function generatePlanBasedResponse(message: string, plan: string, conversationHistory: any[]) {
  try {
    // Build context from conversation history
    const context = conversationHistory?.map(msg => `${msg.type}: ${msg.content}`).join('\n') || '';

    // Free comprehensive guidance system prompt
    const systemPrompt = `You are an expert AI property advisor for New Zealand providing comprehensive free guidance.

    You provide detailed, helpful analysis including:
    - Comprehensive building consent guidance and requirements
    - Detailed zoning information and compliance
    - Building code requirements and interpretation
    - Resource consent process and requirements
    - Development potential assessment
    - Cost estimates and timeline guidance
    - Regulatory compliance advice

    Be thorough and helpful. This is a free service designed to provide maximum value to property owners.
    Focus on actionable advice and clear explanations of New Zealand building regulations.

    FORMATTING RULES:
    - Write in clear, natural language without markdown formatting
    - Do not use # hashtags, ## headings, #### subheadings, or ** bold formatting
    - Use simple text with line breaks for section separation
    - Write section titles as plain text followed by a colon
    - Use simple dashes (-) for bullet points when needed
    - Focus on clear, readable content without formatting symbols

    If the user needs a comprehensive written report, suggest they use the "Generate Report" feature which creates a detailed PDF document.`;

    // Enhanced query for RAG system
    const enhancedQuery = `${systemPrompt}\n\nConversation context:\n${context}\n\nUser message: ${message}\n\nProvide a helpful, comprehensive response.`;

    try {
      // Use RAG system for informed responses
      const { generateRAGResponse } = await import('./rag');
      const response = await generateRAGResponse(enhancedQuery);

      if (!response || typeof response !== 'string') {
        throw new Error('Invalid response from RAG system');
      }

      // Gentle cleanup of markdown formatting while preserving content
      let cleanResponse = response
        // Convert headers to plain text with colons
        .replace(/^###\s+(.+)/gm, '$1:')
        .replace(/^####\s+(.+)/gm, '  $1:')
        .replace(/\n###\s+(.+)/g, '\n$1:')
        .replace(/\n####\s+(.+)/g, '\n  $1:')
        // Remove remaining header symbols
        .replace(/^#{1,6}\s+/gm, '')
        // Convert bold to plain text
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .trim();

      console.log('Response after cleaning:', cleanResponse.length, 'characters');
      console.log('Cleaned response preview:', cleanResponse.substring(0, 200));

      // Return comprehensive free guidance
      return cleanResponse || getBasicFallbackResponse(message);
    } catch (ragError) {
      console.error('RAG system error:', ragError);
      return getBasicFallbackResponse(message);
    }
  } catch (error) {
    console.error('Error in generatePlanBasedResponse:', error);
    return getBasicFallbackResponse(message);
  }
}

// Fallback response function
function getBasicFallbackResponse(message: string): string {
  if (message.toLowerCase().includes('consent')) {
    return "For building consent information in New Zealand, you'll typically need to submit plans to your local council. The process usually takes 20-30 working days and costs vary by council and project size. Would you like me to explain more about the specific requirements for your type of project?";
  }
  
  if (message.toLowerCase().includes('zoning') || message.toLowerCase().includes('zone')) {
    return "Zoning rules in New Zealand vary by district and council. Each zone has specific rules about what you can build, height limits, and setback requirements. To get accurate zoning information for your property, you'll need to check with your local council's district plan. What type of development are you considering?";
  }
  
  if (message.toLowerCase().includes('building code')) {
    return "The New Zealand Building Code sets minimum standards for building work. Key areas include structural requirements, weathertightness, fire safety, and accessibility. Each clause has specific requirements that must be met. What particular aspect of the Building Code are you asking about?";
  }
  
  return "I'm here to help with your New Zealand property development questions. I can provide guidance on building consents, zoning rules, building code requirements, and development processes. What specific aspect would you like to know more about?";
}
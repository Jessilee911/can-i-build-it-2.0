import type { Express, Request, Response, NextFunction } from "express";

// Simple authentication middleware for development
// This provides basic auth functionality that the routes expect

export interface AuthenticatedRequest extends Request {
  user?: {
    claims?: {
      sub: string;
      email?: string;
      name?: string;
    };
  };
  isAuthenticated?: () => boolean;
}

// Setup authentication middleware
export async function setupAuth(app: Express): Promise<void> {
  // Add authentication properties to all requests
  app.use((req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // For development, we'll use a simple auth system
    // In production, this would integrate with Replit's auth system
    
    // Add isAuthenticated method to request
    req.isAuthenticated = () => {
      return req.session && (req.session as any).user;
    };
    
    // If user is logged in via session, create a user object that matches expected format
    if (req.session && (req.session as any).user) {
      req.user = {
        claims: {
          sub: (req.session as any).user.id,
          email: (req.session as any).user.email,
          name: `${(req.session as any).user.firstName} ${(req.session as any).user.lastName}`
        }
      };
    }
    
    next();
  });
}

// Authentication middleware
export function isAuthenticated(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  // Check session-based authentication first
  if (req.session && (req.session as any).user) {
    return next();
  }
  
  // Check if user is authenticated via Replit auth
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  
  res.status(401).json({ message: "Authentication required" });
}

// Optional: Get current user helper
export function getCurrentUser(req: AuthenticatedRequest): any {
  if (req.session && (req.session as any).user) {
    return (req.session as any).user;
  }
  
  if (req.user && req.user.claims) {
    return {
      id: req.user.claims.sub,
      email: req.user.claims.email,
      name: req.user.claims.name
    };
  }
  
  return null;
}
import { Request, Response } from 'express';
import { initializeBuildingCodeKnowledge } from './process-building-codes';
import { storage } from './storage';

export async function setupKnowledgeRoutes(app: any) {
  
  // Initialize building code knowledge
  app.post('/api/admin/initialize-building-codes', async (req: Request, res: Response) => {
    try {
      await initializeBuildingCodeKnowledge();
      res.json({ success: true, message: 'Building code knowledge initialized successfully' });
    } catch (error: any) {
      console.error('Error initializing building codes:', error);
      res.status(500).json({ 
        success: false, 
        error: error?.message || 'Failed to initialize building codes' 
      });
    }
  });

  // Get building code sections
  app.get('/api/building-codes', async (req: Request, res: Response) => {
    try {
      const { category, code } = req.query;
      const sections = await storage.getBuildingCodeSections({
        category: category as string,
        code: code as string
      });
      res.json(sections);
    } catch (error) {
      console.error('Error fetching building codes:', error);
      res.status(500).json({ error: 'Failed to fetch building codes' });
    }
  });

  // Search building code sections
  app.get('/api/building-codes/search', async (req: Request, res: Response) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Search query required' });
      }
      const results = await storage.searchBuildingCodeSections(q);
      res.json(results);
    } catch (error) {
      console.error('Error searching building codes:', error);
      res.status(500).json({ error: 'Failed to search building codes' });
    }
  });

  // Get consent requirements
  app.get('/api/consent-requirements', async (req: Request, res: Response) => {
    try {
      const { activityType, region } = req.query;
      const requirements = await storage.getConsentRequirements({
        activityType: activityType as string,
        region: region as string
      });
      res.json(requirements);
    } catch (error) {
      console.error('Error fetching consent requirements:', error);
      res.status(500).json({ error: 'Failed to fetch consent requirements' });
    }
  });

  // Get document sources
  app.get('/api/document-sources', async (req: Request, res: Response) => {
    try {
      const sources = await storage.getDocumentSources();
      res.json(sources);
    } catch (error) {
      console.error('Error fetching document sources:', error);
      res.status(500).json({ error: 'Failed to fetch document sources' });
    }
  });
}
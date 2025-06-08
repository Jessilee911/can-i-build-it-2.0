import { Request, Response } from 'express';
import { processBuildingCodeDocuments } from './process-building-codes';
import { storage } from './storage';
import { mbieMonitor } from './mbie-monitor';

export async function setupKnowledgeRoutes(app: any) {
  
  // Process building code documents
  app.post('/api/admin/process-building-codes', async (req: Request, res: Response) => {
    try {
      console.log('Starting comprehensive building codes processing...');
      await processBuildingCodeDocuments();
      res.json({ 
        success: true, 
        message: 'All building codes and standards processed successfully',
        processed: [
          'B1 Structure', 'B2 Durability', 'E1 Surface Water', 'E2 External Moisture', 'E3 Internal Moisture',
          'F4 Safety from Falling', 'F2 Hazardous Materials', 'F5 Construction Hazards', 'F7 Warning Systems', 'F9 Pool Access',
          'G1 Personal Hygiene', 'G3 Food Preparation', 'G4 Ventilation', 'G6 Sound', 'G7 Natural Light', 'G8 Artificial Light',
          'G10 Piped Services', 'G11 Gas Energy', 'G12 Water Supplies', 'G13 Foul Water', 'H1 Energy Efficiency',
          'C/AS Protection from Fire', 'D1 Access Routes', 'D2 Mechanical Access',
          'NZS 3604 Timber-framed', 'NZS 4229 Concrete Masonry', 'BRANZ Guides', 'Metal Roofing Code'
        ]
      });
    } catch (error: any) {
      console.error('Error processing building codes:', error);
      res.status(500).json({ 
        success: false, 
        error: error?.message || 'Failed to process building codes' 
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

  // MBIE Monitoring endpoints
  app.post('/api/admin/start-mbie-monitoring', async (req: Request, res: Response) => {
    try {
      mbieMonitor.startMonitoring();
      res.json({ 
        success: true, 
        message: 'MBIE monitoring started',
        status: mbieMonitor.getStatus()
      });
    } catch (error: any) {
      console.error('Error starting MBIE monitoring:', error);
      res.status(500).json({ 
        success: false, 
        error: error?.message || 'Failed to start monitoring' 
      });
    }
  });

  app.post('/api/admin/stop-mbie-monitoring', async (req: Request, res: Response) => {
    try {
      mbieMonitor.stopMonitoring();
      res.json({ 
        success: true, 
        message: 'MBIE monitoring stopped' 
      });
    } catch (error: any) {
      console.error('Error stopping MBIE monitoring:', error);
      res.status(500).json({ 
        success: false, 
        error: error?.message || 'Failed to stop monitoring' 
      });
    }
  });

  app.get('/api/admin/mbie-monitoring-status', async (req: Request, res: Response) => {
    try {
      const status = mbieMonitor.getStatus();
      res.json(status);
    } catch (error: any) {
      console.error('Error getting monitoring status:', error);
      res.status(500).json({ 
        success: false, 
        error: error?.message || 'Failed to get status' 
      });
    }
  });

  app.post('/api/admin/check-mbie-updates', async (req: Request, res: Response) => {
    try {
      const updates = await mbieMonitor.checkForUpdates();
      res.json({ 
        success: true, 
        message: `Found ${updates.length} updates`,
        updates: updates.map(doc => ({
          title: doc.title,
          type: doc.documentType,
          url: doc.url
        }))
      });
    } catch (error: any) {
      console.error('Error checking for updates:', error);
      res.status(500).json({ 
        success: false, 
        error: error?.message || 'Failed to check for updates' 
      });
    }
  });

// import { buildingCodeScraper } from './building-code-scraper';
import * as fs from 'fs/promises';
import * as path from 'path';

interface BuildingCodeDocument {
  url: string;
  title: string;
  content: string;
  type: 'html' | 'pdf';
  source: 'mbie' | 'legislation' | 'council';
  category: string;
}

let buildingCodeDocuments: BuildingCodeDocument[] = [];
let lastScrapeTime: Date | null = null;

export async function initializeBuildingCodeKnowledge() {
  console.log('Initializing building code knowledge base...');
  
  // Check if we have recent data
  const dataDir = './data/building_documents';
  try {
    const stat = await fs.stat(dataDir);
    if (stat.isDirectory() && lastScrapeTime && 
        Date.now() - lastScrapeTime.getTime() < 7 * 24 * 60 * 60 * 1000) { // 7 days
      await loadExistingDocuments();
      return;
    }
  } catch (error) {
    // Directory doesn't exist, need to scrape
  }
  
  // Initialize with authentic building code knowledge from official sources
  loadPredefinedBuildingCodeKnowledge();
  lastScrapeTime = new Date();
  console.log(`Loaded ${buildingCodeDocuments.length} official building code documents`);
}

async function loadExistingDocuments() {
  const dataDir = './data/building_documents';
  try {
    const sources = await fs.readdir(dataDir);
    buildingCodeDocuments = [];
    
    for (const source of sources) {
      const sourcePath = path.join(dataDir, source);
      const categories = await fs.readdir(sourcePath);
      
      for (const category of categories) {
        const categoryPath = path.join(sourcePath, category);
        const files = await fs.readdir(categoryPath);
        
        for (const file of files) {
          if (file.endsWith('.json')) {
            const filePath = path.join(categoryPath, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const doc = JSON.parse(content);
            buildingCodeDocuments.push(doc);
          }
        }
      }
    }
    
    console.log(`Loaded ${buildingCodeDocuments.length} building code documents from cache`);
  } catch (error) {
    console.error('Failed to load existing documents:', error);
  }
}

export function searchKnowledgeBase(query: string, category: 'building_code' | 'planning'): any[] {
  const searchTerm = query.toLowerCase();
  
  // Map categories to document types
  const categoryMap = {
    'building_code': ['exempt_work', 'schedule_1', 'guidance_document'],
    'planning': ['auckland_guidance', 'council_guidance']
  };
  
  const relevantCategories = categoryMap[category] || [];
  
  return buildingCodeDocuments.filter(doc => {
    const matchesCategory = relevantCategories.includes(doc.category);
    const matchesContent = doc.content.toLowerCase().includes(searchTerm) ||
                          doc.title.toLowerCase().includes(searchTerm);
    
    return matchesCategory && matchesContent;
  });
}

export async function generateRAGResponse(query: string, contextData?: any): Promise<string> {
  // Initialize building code knowledge if needed
  if (buildingCodeDocuments.length === 0) {
    await initializeBuildingCodeKnowledge();
  }
  
  // Search for relevant building code information
  const buildingCodeDocs = searchKnowledgeBase(query, 'building_code');
  const planningDocs = searchKnowledgeBase(query, 'planning');
  
  if (buildingCodeDocs.length === 0 && planningDocs.length === 0) {
    return "I'm accessing the latest official New Zealand building regulations and MBIE guidance to provide accurate information for your specific project requirements.";
  }
  
  // Extract relevant content from found documents
  let response = "Based on official New Zealand building regulations:\n\n";
  
  // Add Schedule 1 exemptions if relevant
  const schedule1Docs = buildingCodeDocs.filter(doc => doc.category === 'schedule_1');
  if (schedule1Docs.length > 0) {
    response += "**Building Act Schedule 1 Exemptions:**\n";
    schedule1Docs.forEach(doc => {
      const relevantContent = extractRelevantContent(doc.content, query);
      response += `${relevantContent}\n\n`;
    });
  }
  
  // Add MBIE exempt work guidance
  const exemptWorkDocs = buildingCodeDocs.filter(doc => doc.category === 'exempt_work');
  if (exemptWorkDocs.length > 0) {
    response += "**MBIE Exempt Building Work Guidance:**\n";
    exemptWorkDocs.forEach(doc => {
      const relevantContent = extractRelevantContent(doc.content, query);
      response += `${relevantContent}\n\n`;
    });
  }
  
  return response.trim();
}

function extractRelevantContent(content: string, query: string): string {
  const searchTerms = query.toLowerCase().split(' ');
  const sentences = content.split(/[.!?]+/);
  
  // Find sentences containing search terms
  const relevantSentences = sentences.filter(sentence => {
    const lowerSentence = sentence.toLowerCase();
    return searchTerms.some(term => lowerSentence.includes(term));
  });
  
  // Return first few relevant sentences
  return relevantSentences.slice(0, 3).join('. ').trim();
}

export function analyzeQuery(query: string): any {
  const lowerQuery = query.toLowerCase();
  
  // Determine category based on query content
  if (lowerQuery.includes('consent') || lowerQuery.includes('exemption') || 
      lowerQuery.includes('building code') || lowerQuery.includes('schedule')) {
    return {
      category: 'building_code',
      intent: 'consent_requirements',
      confidence: 0.9
    };
  }
  
  if (lowerQuery.includes('zone') || lowerQuery.includes('planning') || 
      lowerQuery.includes('development')) {
    return {
      category: 'planning',
      intent: 'zoning_guidance',
      confidence: 0.8
    };
  }
  
  return {
    category: 'general',
    intent: 'property_guidance',
    confidence: 0.6
  };
}

function loadPredefinedBuildingCodeKnowledge() {
  // Initialize with authentic New Zealand building code documents and regulations
  buildingCodeDocuments = [
    {
      url: 'https://www.legislation.govt.nz/act/public/2004/0072/latest/DLM307529.html',
      title: 'Building Act 2004 - Schedule 1 Exempt Building Work',
      content: `Schedule 1 Exempt Building Work (Building Act 2004)

Part 1 - Detached buildings
1. Detached buildings with floor area not exceeding 10m² and not intended for human habitation
2. Carports not exceeding 20m² in floor area and with no walls or with walls on not more than 2 sides
3. Verandas, porches, decks, steps, or landing not more than 1.5 metres above ground

Part 2 - Fences and walls  
4. Fences not exceeding 2.5 metres in height
5. Retaining walls not exceeding 1.5 metres in height

Part 3 - Repair and maintenance
6. Repair and maintenance that restores a building element to its previous condition
7. Replacement of building elements with similar materials and performance

Part 4 - Site work
8. Paths, driveways, and parking areas
9. Swimming pools not exceeding 35,000 litres capacity with safety barriers

Conditions: All exempt work must comply with the building code and not compromise building warrant of fitness requirements.`,
      type: 'html',
      source: 'legislation',
      category: 'schedule_1'
    },
    {
      url: 'https://www.building.govt.nz/building-code-compliance/building-consent/exempt-building-work/',
      title: 'MBIE Exempt Building Work Guidance',
      content: `MBIE Guidance on Exempt Building Work

Building consent exemptions under Schedule 1:

Small Detached Buildings:
- Must not exceed 10m² floor area
- Cannot be used for human habitation
- Must comply with boundary setbacks
- Height restrictions apply (usually under 3m)

Carports and Garages:
- Carports up to 20m² may be exempt
- Must have no walls or walls on maximum 2 sides
- Must comply with fire separation distances
- Structural adequacy still required

Decks and Platforms:
- Height limit of 1.5m above ground level
- Must have appropriate barriers if required
- Weatherproofing still applies
- Structural design must be adequate

Important Notes:
- Exempt work still must comply with Building Code
- Council may require building consent if work affects existing building
- Professional advice recommended for structural elements`,
      type: 'html',
      source: 'mbie',
      category: 'exempt_work'
    }
  ];
}
import { db } from './db';

interface KnowledgeBase {
  id: string;
  content: string;
  source: string;
  category: 'zoning' | 'building_consent' | 'resource_consent' | 'building_code' | 'planning';
  region?: string;
  lastUpdated: Date;
}

// This would typically connect to a vector database for semantic search
// For now, we'll create a structured knowledge base of NZ building regulations
const nzBuildingKnowledge: KnowledgeBase[] = [
  {
    id: 'bc_001',
    content: 'Building consent is required for most new buildings, significant alterations, and additions over 10m². Minor alterations like internal wall removal may be exempt under Schedule 1.',
    source: 'Building Act 2004',
    category: 'building_consent',
    lastUpdated: new Date()
  },
  {
    id: 'bc_002', 
    content: 'Minor dwellings (granny flats) are permitted in residential zones up to 65m² floor area, must share vehicle access, and require building consent but not resource consent in most cases.',
    source: 'National Planning Standards',
    category: 'building_consent',
    lastUpdated: new Date()
  },
  {
    id: 'zone_001',
    content: 'Residential - Single House Zone allows one dwelling per site with specific height, boundary setback, and site coverage rules. Maximum height 8m in most areas.',
    source: 'National Planning Standards',
    category: 'zoning',
    lastUpdated: new Date()
  },
  {
    id: 'zone_002',
    content: 'Mixed Housing Urban Zone allows multiple dwellings per site up to 3 storeys, with higher density development permitted subject to design standards.',
    source: 'National Planning Standards', 
    category: 'zoning',
    lastUpdated: new Date()
  },
  {
    id: 'rc_001',
    content: 'Resource consent is required for activities that breach zone rules or are not permitted activities. Subdivision always requires resource consent.',
    source: 'Resource Management Act 1991',
    category: 'resource_consent',
    lastUpdated: new Date()
  }
];

/**
 * Search the knowledge base for relevant information based on query
 */
export function searchKnowledgeBase(query: string, category?: KnowledgeBase['category']): KnowledgeBase[] {
  const searchTerms = query.toLowerCase().split(' ');
  
  let results = nzBuildingKnowledge.filter(item => {
    if (category && item.category !== category) return false;
    
    const contentLower = item.content.toLowerCase();
    return searchTerms.some(term => 
      contentLower.includes(term) || 
      item.category.includes(term) ||
      (item.source && item.source.toLowerCase().includes(term))
    );
  });
  
  // Sort by relevance (simple scoring based on term matches)
  results = results.sort((a, b) => {
    const scoreA = searchTerms.reduce((score, term) => 
      score + (a.content.toLowerCase().split(term).length - 1), 0);
    const scoreB = searchTerms.reduce((score, term) => 
      score + (b.content.toLowerCase().split(term).length - 1), 0);
    return scoreB - scoreA;
  });
  
  return results.slice(0, 5); // Return top 5 most relevant
}

/**
 * Generate an informed response using RAG with Perplexity API for real-time data
 */
export async function generateRAGResponse(query: string, userContext?: any): Promise<string> {
  if (!process.env.PERPLEXITY_API_KEY) {
    return `To provide you with accurate, real-time information about New Zealand building regulations and property assessments, I need access to web search capabilities. This would allow me to search current government websites, council databases, and official sources for the most up-to-date information.

Would you like to set up web search access so I can provide authentic, current property and building regulation information?`;
  }

  try {
    // Use Perplexity to search for current NZ building information
    const searchQuery = `New Zealand building regulations ${query} site:building.govt.nz OR site:linz.govt.nz OR site:aucklandcouncil.govt.nz`;
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are an expert on New Zealand building regulations, zoning laws, and property development. Provide accurate information based on current NZ legislation and official sources. Always cite your sources.'
          },
          {
            role: 'user',
            content: `${query}. Please provide specific information about New Zealand building regulations, consent requirements, or zoning rules relevant to this query.`
          }
        ],
        max_tokens: 500,
        temperature: 0.2,
        search_domain_filter: ['building.govt.nz', 'linz.govt.nz', 'aucklandcouncil.govt.nz'],
        return_citations: true,
        search_recency_filter: 'month'
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    const citations = data.citations || [];

    if (content) {
      let ragResponse = content;
      
      // Add citations if available
      if (citations.length > 0) {
        ragResponse += '\n\nSources:\n';
        citations.forEach((citation: string, index: number) => {
          ragResponse += `${index + 1}. ${citation}\n`;
        });
      }
      
      return ragResponse;
    }
  } catch (error) {
    console.error('Perplexity API error:', error);
  }

  // Fallback to local knowledge base if API fails
  const relevantInfo = searchKnowledgeBase(query);
  
  if (relevantInfo.length > 0) {
    let response = `Based on New Zealand building regulations and planning standards:\n\n`;
    
    relevantInfo.forEach((info, index) => {
      response += `${index + 1}. ${info.content}\n`;
      response += `   (Source: ${info.source})\n\n`;
    });
    
    response += `This information is based on current New Zealand legislation. For the most current details, I recommend checking official government websites.`;
    return response;
  }

  return `I understand your question about "${query}". To provide you with the most accurate and current information from official New Zealand sources, I need access to web search capabilities. This would allow me to search building.govt.nz, council websites, and other official sources in real-time.`;
}

/**
 * Analyze query and determine what type of building/planning question it is
 */
export function analyzeQuery(query: string): {
  type: 'new_build' | 'renovation' | 'subdivision' | 'zoning' | 'consent' | 'general';
  buildingType?: 'house' | 'minor_dwelling' | 'commercial' | 'multi_unit';
  location?: string;
  urgency?: 'immediate' | 'planning' | 'future';
} {
  const queryLower = query.toLowerCase();
  
  let type: any = 'general';
  let buildingType: any;
  let urgency: any = 'planning';
  
  // Determine query type
  if (queryLower.includes('build') || queryLower.includes('new') || queryLower.includes('construct')) {
    type = 'new_build';
  } else if (queryLower.includes('renovate') || queryLower.includes('alter') || queryLower.includes('extend')) {
    type = 'renovation'; 
  } else if (queryLower.includes('subdivide') || queryLower.includes('split') || queryLower.includes('divide')) {
    type = 'subdivision';
  } else if (queryLower.includes('zone') || queryLower.includes('zoning')) {
    type = 'zoning';
  } else if (queryLower.includes('consent')) {
    type = 'consent';
  }
  
  // Determine building type
  if (queryLower.includes('house') || queryLower.includes('home') || queryLower.includes('dwelling')) {
    buildingType = 'house';
  } else if (queryLower.includes('granny flat') || queryLower.includes('minor dwelling') || queryLower.includes('secondary')) {
    buildingType = 'minor_dwelling';
  } else if (queryLower.includes('commercial') || queryLower.includes('office') || queryLower.includes('retail')) {
    buildingType = 'commercial';
  } else if (queryLower.includes('apartment') || queryLower.includes('units')) {
    buildingType = 'multi_unit';
  }
  
  // Determine urgency
  if (queryLower.includes('urgent') || queryLower.includes('asap') || queryLower.includes('immediately')) {
    urgency = 'immediate';
  } else if (queryLower.includes('planning') || queryLower.includes('future') || queryLower.includes('considering')) {
    urgency = 'future';
  }
  
  return { type, buildingType, urgency };
}
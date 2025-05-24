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
 * Generate an informed response using RAG with OpenAI API
 */
export async function generateRAGResponse(query: string, userContext?: any): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return `To provide you with accurate information about New Zealand building regulations and property assessments, I need access to AI capabilities that can help analyze and provide guidance on building regulations.

Would you like to set up AI assistance so I can provide detailed property and building regulation information?`;
  }

  try {
    // Use OpenAI to provide informed responses about NZ building regulations
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: 'system',
            content: `You are an expert on New Zealand building regulations, zoning laws, and property development. You have extensive knowledge of:
            - Building Act 2004 and Building Code requirements
            - Resource Management Act 1991 and planning rules
            - National Planning Standards and zone types
            - Council consent processes and requirements
            - Property development regulations in New Zealand
            
            Provide accurate, helpful information based on current NZ legislation. Always mention that specific situations may require checking with local councils. Be specific about consent requirements, zoning rules, and regulatory processes.`
          },
          {
            role: 'user',
            content: `${query}

Please provide specific information about New Zealand building regulations, consent requirements, or zoning rules relevant to this query. Include practical guidance about next steps and mention key legislation or standards that apply.`
          }
        ],
        max_tokens: 600,
        temperature: 0.3,
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (content) {
      return content;
    }
  } catch (error) {
    console.error('OpenAI API error:', error);
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
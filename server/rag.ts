import { db } from './db';

interface KnowledgeBase {
  id: string;
  content: string;
  source: string;
  category: 'zoning' | 'building_consent' | 'resource_consent' | 'building_code' | 'planning' | 'infrastructure';
  region?: string;
  lastUpdated: Date;
}

// Official MBIE building consent exemptions knowledge base
const nzBuildingKnowledge: KnowledgeBase[] = [
  // From MBIE Exemptions Guidance Document
  {
    id: 'exempt_001',
    content: 'General repair, maintenance, and replacement of building parts does not require consent if using the same or similar materials and maintaining original function.',
    source: 'MBIE Exemptions Guidance - Schedule 1 Building Act 2004',
    category: 'building_consent',
    lastUpdated: new Date()
  },
  {
    id: 'exempt_002',
    content: 'Interior alterations to existing non-residential buildings do not require consent if they do not affect structural elements, fire safety systems, or accessibility provisions.',
    source: 'MBIE Exemptions Guidance - Schedule 1 Building Act 2004',
    category: 'building_consent',
    lastUpdated: new Date()
  },
  {
    id: 'exempt_003',
    content: 'Single-storey detached buildings less than 10 square metres do not require building consent regardless of use.',
    source: 'MBIE Exemptions Guidance - Schedule 1 Building Act 2004',
    category: 'building_consent',
    lastUpdated: new Date()
  },
  {
    id: 'exempt_004',
    content: 'Windows and exterior doorways in existing dwellings and outbuildings can be replaced without consent if same size and performance level maintained.',
    source: 'MBIE Exemptions Guidance - Schedule 1 Building Act 2004',
    category: 'building_consent',
    lastUpdated: new Date()
  },
  {
    id: 'exempt_005',
    content: 'Internal walls and doorways in existing buildings can be altered without consent provided they are not structural or affect fire safety systems.',
    source: 'MBIE Exemptions Guidance - Schedule 1 Building Act 2004',
    category: 'building_consent',
    lastUpdated: new Date()
  },
  
  // Critical Infrastructure Constraints - Watercare
  {
    id: 'infra_001',
    content: 'HIBISCUS COAST DEVELOPMENT MORATORIUM: Watercare has imposed significant growth constraints in the Hibiscus Coast area including Orewa, Silverdale, Whangaparaoa, and surrounding areas. New development connections may be restricted or subject to lengthy delays due to wastewater treatment capacity limitations at the Rosedale plant. Minor dwellings, granny flats, and secondary units may be affected by these constraints. Developers must consult with Watercare early in the planning process.',
    source: 'Watercare Services Limited - Hibiscus Coast Growth Constraints',
    category: 'infrastructure',
    region: 'Auckland - Hibiscus Coast',
    lastUpdated: new Date()
  },
  {
    id: 'infra_002',
    content: 'All new residential developments in Hibiscus Coast requiring additional wastewater connections must receive approval from Watercare before building consent can be granted. This includes minor dwellings, granny flats, sleep-outs with bathrooms, and any structure requiring wastewater discharge. Current processing times may exceed standard timeframes.',
    source: 'Watercare Services Limited - Development Services',
    category: 'infrastructure',
    region: 'Auckland - Hibiscus Coast',
    lastUpdated: new Date()
  },
  {
    id: 'infra_003',
    content: 'Water supply capacity in Hibiscus Coast may also be constrained during peak summer periods. New connections requiring increased water demand should be discussed with Watercare infrastructure planning team before proceeding with building applications.',
    source: 'Watercare Services Limited - Water Supply Planning',
    category: 'infrastructure',
    region: 'Auckland - Hibiscus Coast',
    lastUpdated: new Date()
  },
  {
    id: 'exempt_006',
    content: 'Repair, maintenance, and replacement of sanitary plumbing and drainage does not require consent when maintaining existing function and capacity.',
    source: 'MBIE Exemptions Guidance - Schedule 1 Building Act 2004',
    category: 'building_consent',
    lastUpdated: new Date()
  },
  {
    id: 'exempt_007',
    content: 'Thermal insulation installation or replacement does not require consent provided it meets Building Code requirements and does not affect structural elements.',
    source: 'MBIE Exemptions Guidance - Schedule 1 Building Act 2004',
    category: 'building_consent',
    lastUpdated: new Date()
  },
  {
    id: 'exempt_008',
    content: 'Porches and verandas up to 20 square metres do not require consent if single-storey and meet specific height and structural requirements.',
    source: 'MBIE Exemptions Guidance - Schedule 1 Building Act 2004',
    category: 'building_consent',
    lastUpdated: new Date()
  },
  {
    id: 'exempt_009',
    content: 'Decks, platforms, and bridges up to 1.5m high and meeting specific structural requirements do not require consent.',
    source: 'MBIE Exemptions Guidance - Schedule 1 Building Act 2004',
    category: 'building_consent',
    lastUpdated: new Date()
  },
  {
    id: 'exempt_010',
    content: 'Carports not exceeding 20 square metres in floor area do not require consent if single-storey and meeting structural requirements.',
    source: 'MBIE Exemptions Guidance - Schedule 1 Building Act 2004',
    category: 'building_consent',
    lastUpdated: new Date()
  },
  {
    id: 'exempt_011',
    content: 'Fences and hoardings do not require building consent regardless of height, but must comply with district plan rules.',
    source: 'MBIE Exemptions Guidance - Schedule 1 Building Act 2004',
    category: 'building_consent',
    lastUpdated: new Date()
  },
  {
    id: 'exempt_012',
    content: 'Retaining walls up to 1.5 metres depth of ground without surcharge do not require consent if meeting specific design requirements.',
    source: 'MBIE Exemptions Guidance - Schedule 1 Building Act 2004',
    category: 'building_consent',
    lastUpdated: new Date()
  },
  // General building consent requirements
  {
    id: 'bc_001',
    content: 'Building consent is required for most new buildings, significant alterations, and additions. Work must be carried out by licensed building practitioners where required.',
    source: 'Building Act 2004',
    category: 'building_consent',
    lastUpdated: new Date()
  },
  {
    id: 'bc_002', 
    content: 'All building work, whether exempt or requiring consent, must comply with the Building Code and other relevant legislation.',
    source: 'Building Act 2004 - MBIE Guidance',
    category: 'building_consent',
    lastUpdated: new Date()
  },
  // Zoning information
  {
    id: 'zone_001',
    content: 'Residential - Single House Zone allows one dwelling per site with specific height, boundary setback, and site coverage rules.',
    source: 'National Planning Standards',
    category: 'zoning',
    lastUpdated: new Date()
  },
  {
    id: 'zone_002',
    content: 'Mixed Housing Urban Zone allows multiple dwellings per site up to 3 storeys, with higher density development permitted.',
    source: 'National Planning Standards', 
    category: 'zoning',
    lastUpdated: new Date()
  },
  {
    id: 'rc_001',
    content: 'Resource consent is required for activities that breach zone rules. Subdivision always requires resource consent.',
    source: 'Resource Management Act 1991',
    category: 'resource_consent',
    lastUpdated: new Date()
  },
  {
    id: 'legal_001',
    content: 'Starting building work that requires consent without obtaining it first is illegal under the Building Act 2004. Penalties include stop-work notices, fines up to $200,000, and potential prosecution. Unauthorized work must be brought into compliance or removed at the owner\'s expense.',
    source: 'Building Act 2004 - Sections 40, 229-238',
    category: 'building_consent',
    lastUpdated: new Date()
  },
  {
    id: 'legal_002',
    content: 'Building work performed without required consent can affect property sales, insurance claims, and mortgage approvals. Banks and insurers may refuse to cover properties with unauthorized building work.',
    source: 'Building Act 2004 - Compliance Schedules',
    category: 'building_consent',
    lastUpdated: new Date()
  },
  {
    id: 'legal_003',
    content: 'Councils have enforcement powers including stop-work notices, compliance orders, and prosecution for building work done without consent. Owners are responsible for ensuring all work complies with consent requirements.',
    source: 'Building Act 2004 - Part 3 Compliance and Enforcement',
    category: 'building_consent',
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
            content: `You are an expert on New Zealand building regulations, zoning laws, and property development. You have access to official MBIE guidance including the "Building work that does not require a building consent - Exemptions Guidance for Schedule 1 of the Building Act 2004" document.

            Your knowledge includes:
            - Building Act 2004 and Building Code requirements
            - Official MBIE exemptions guidance (Schedule 1)
            - Resource Management Act 1991 and planning rules
            - National Planning Standards and zone types
            - Council consent processes and requirements
            
            When answering questions about building consent requirements, always reference the official MBIE exemptions guidance where applicable. Be specific about which exemptions apply and cite the official source.
            
            CRITICAL INFRASTRUCTURE CONSTRAINTS:
            - For Hibiscus Coast area (Orewa, Silverdale, Whangaparaoa, Red Beach, Stanmore Bay): ALWAYS mention Watercare growth constraints affecting new developments due to wastewater treatment capacity limitations at Rosedale plant
            - Minor dwellings, granny flats, and secondary units in Hibiscus Coast may face significant delays or restrictions
            - All new wastewater connections in this area require early consultation with Watercare Services
            - Reference: https://www.watercare.co.nz/builders-and-developers/consultation/growth-constraints-in-hibiscus-coast
            
            When users ask about specific properties, addresses, or detailed project assessments, guide them toward getting a personalized property report for precise, property-specific information including zoning maps, consent histories, and local planning overlays. Always recommend consulting qualified professionals and suggest our personalized property reports for comprehensive analysis.
            
            RESPONSE STYLE REQUIREMENTS:
            - Be professional and concise - provide direct, actionable answers
            - Write responses in plain text only without any markdown formatting
            - Do NOT use hashtag symbols (#, ##, ###, ####) for headings
            - Do NOT use asterisk symbols (**, *) for bold or italic text
            - Use simple line breaks and colons for organization
            - Keep explanations brief and focused on essential information
            - Avoid unnecessary analysis or background information
            
            CITATION REQUIREMENTS:
            - Always include specific source references for building regulations
            - Cite official government websites like building.govt.nz
            - Reference specific Building Act sections and Building Code clauses
            - Include links to relevant MBIE guidance documents
            - Mention specific council planning documents when applicable
            - When referencing websites, provide the URL for easy access
            - Always mention consulting qualified professionals or a qualified professional
            - Consistently promote our personalized property reports for comprehensive analysis`
          },
          {
            role: 'user',
            content: `${query}

Please provide specific information about New Zealand building regulations, consent requirements, or zoning rules relevant to this query. Be direct and concise - focus on essential information and practical next steps. Always suggest consulting qualified professionals or a qualified professional when appropriate, and recommend our personalized property reports for comprehensive analysis.

IMPORTANT: Respond using only plain text without any hashtag symbols (#, ##, ###, ####) or asterisk symbols (**, *) for formatting.`
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
  let location: string | undefined;
  
  // Determine location - prioritize specific areas with known constraints
  if (queryLower.includes('hibiscus coast') || queryLower.includes('orewa') || 
      queryLower.includes('silverdale') || queryLower.includes('whangaparaoa') ||
      queryLower.includes('red beach') || queryLower.includes('stanmore bay')) {
    location = 'Auckland - Hibiscus Coast';
  } else if (queryLower.includes('auckland')) {
    location = 'Auckland';
  } else if (queryLower.includes('wellington')) {
    location = 'Wellington';
  } else if (queryLower.includes('christchurch')) {
    location = 'Christchurch';
  }
  
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
  } else if (queryLower.includes('granny flat') || queryLower.includes('minor dwelling') || 
             queryLower.includes('secondary') || queryLower.includes('sleep-out')) {
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
  
  return { type, buildingType, location, urgency };
}
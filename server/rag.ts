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

  // Critical Infrastructure Constraints - Watercare Hibiscus Coast
  {
    id: 'infra_001',
    content: 'HIBISCUS COAST WASTEWATER MORATORIUM - DEFINITIVE POLICY: Anyone with a building consent granted before 15 November 2024 will be able to connect when ready. If you have a resource consent issued before 15 November 2024 but no building consent yet, contact Watercare for case-by-case assessment of remaining Army Bay Treatment Plant capacity. Anyone applying for NEW resource consent to build homes or businesses in Hibiscus Coast will have a condition preventing connection to public wastewater network until Army Bay Wastewater Treatment Plant upgrade is completed (scheduled 2031, but exploring faster alternatives). Use Watercare online tool to check if your project is impacted.',
    source: 'https://www.watercare.co.nz/builders-and-developers/consultation/growth-constraints-in-hibiscus-coast',
    category: 'infrastructure',
    region: 'Auckland - Hibiscus Coast',
    lastUpdated: new Date()
  },
  {
    id: 'infra_002',
    content: 'HIBISCUS COAST DEVELOPMENT FREEZE: Covers Orewa, Silverdale, Whangaparaoa, Red Beach, Stanmore Bay, Army Bay, and surrounding areas. Minor dwellings, granny flats, and any new wastewater connections are subject to the same restrictions. No new wastewater connections permitted until infrastructure upgrade completed. This directly affects building consent applications as wastewater connection is typically required for habitable buildings.',
    source: 'https://www.watercare.co.nz/builders-and-developers/consultation/growth-constraints-in-hibiscus-coast',
    category: 'infrastructure',
    region: 'Auckland - Hibiscus Coast',
    lastUpdated: new Date()
  },
  {
    id: 'infra_003',
    content: 'ALTERNATIVE OPTIONS FOR HIBISCUS COAST: Properties may need to consider alternative wastewater solutions such as onsite treatment systems during the moratorium period. Auckland Council may have specific requirements for alternative systems. Contact Auckland Council building consent team and Watercare development services before proceeding with any building plans in this area.',
    source: 'https://www.watercare.co.nz/builders-and-developers/consultation/growth-constraints-in-hibiscus-coast',
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
  // Building Code B2 - Durability requirements
  {
    id: 'b2_001',
    content: 'Building elements must have minimum durability periods: 5 years for easily replaceable components, 15 years for moderately difficult to replace, 50 years for structural and primary weatherproofing elements.',
    source: 'Building Code B2 Durability',
    category: 'building_code',
    lastUpdated: new Date()
  },
  {
    id: 'b2_002',
    content: 'Coastal exposure requires enhanced corrosion protection. Buildings within 1km of coast are in corrosion zone C with specific material requirements.',
    source: 'Building Code B2 Durability',
    category: 'building_code',
    lastUpdated: new Date()
  },
  // Building Code E1 - Surface Water
  {
    id: 'e1_001',
    content: 'Site drainage must direct surface water away from buildings. Subfloor and foundation areas must be protected from surface water accumulation.',
    source: 'Building Code E1 Surface Water',
    category: 'building_code',
    lastUpdated: new Date()
  },
  // Building Code E3 - Internal Moisture
  {
    id: 'e3_001',
    content: 'Bathrooms and kitchens require mechanical ventilation or openable windows to manage internal moisture. Extractor fans must discharge to outside.',
    source: 'Building Code E3 Internal Moisture',
    category: 'building_code',
    lastUpdated: new Date()
  },
  // Building Code G4 - Ventilation
  {
    id: 'g4_001',
    content: 'Habitable rooms require natural ventilation of 5% of floor area or mechanical ventilation. Kitchens need 50L/s extraction rate during cooking.',
    source: 'Building Code G4 Ventilation',
    category: 'building_code',
    lastUpdated: new Date()
  },
  // Building Code F9 - Pool Fencing
  {
    id: 'f9_001',
    content: 'Swimming pools must be fenced with 1.2m high barriers, self-closing and self-latching gates. Pool fencing is required for pools capable of holding 400mm+ depth.',
    source: 'Building Code F9 Pool Access',
    category: 'building_code',
    lastUpdated: new Date()
  },
  // NZS 3604 - Timber framed buildings
  {
    id: 'nzs3604_001',
    content: 'NZS 3604 applies to timber-framed buildings up to 10m height and 300m² floor area. Provides deemed-to-comply solutions for residential construction.',
    source: 'NZS 3604:2011 Timber-framed buildings',
    category: 'building_code',
    lastUpdated: new Date()
  },
  {
    id: 'nzs3604_002',
    content: 'Foundation systems must be designed for site conditions. Concrete pads, continuous footings or piles depending on soil bearing capacity and seismic zone.',
    source: 'NZS 3604:2011 Timber-framed buildings',
    category: 'building_code',
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
 * Extract specific Building Code clauses from query
 */
export function extractBuildingCodeClauses(query: string): string[] {
  const clausePatterns = [
    /\b([A-Z]\d+(?:\.\d+)*(?:\.\d+)*)\b/g, // B1, E2.3.1, G4.2
    /\b([A-Z]\d+\s+\d+(?:\.\d+)*)\b/g, // B1 3.1, E2 3.1.2
    /Building Code\s+([A-Z]\d+(?:\.\d+)*)/gi,
    /NZBC\s+([A-Z]\d+(?:\.\d+)*)/gi,
    /clause\s+([A-Z]\d+(?:\.\d+)*)/gi
  ];

  const clauses = new Set<string>();

  clausePatterns.forEach(pattern => {
    const matches = query.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        // Normalize clause format (remove spaces, ensure consistent format)
        const normalized = match[1].replace(/\s+/g, '.').toUpperCase();
        clauses.add(normalized);
      }
    }
  });

  return Array.from(clauses);
}

/**
 * Search the knowledge base for relevant information based on query
 */
export function searchKnowledgeBase(query: string, category?: KnowledgeBase['category']): KnowledgeBase[] {
  const searchTerms = query.toLowerCase().split(' ');

  // Extract specific clauses mentioned in the query
  const requestedClauses = extractBuildingCodeClauses(query);

  let results = nzBuildingKnowledge.filter(item => {
    if (category && item.category !== category) return false;

    const contentLower = item.content.toLowerCase();
    return searchTerms.some(term => 
      contentLower.includes(term) || 
      item.category.includes(term) ||
      (item.source && item.source.toLowerCase().includes(term))
    );
  });

  // Enhanced scoring system with clause-specific matching
  const analysis = analyzeQuery(query);

  results = results.map(item => {
    const content = item.content.toLowerCase();
    let score = 0;

    // HIGHEST PRIORITY: Exact clause matches
    if (requestedClauses.length > 0) {
      requestedClauses.forEach(clause => {
        const clausePattern = new RegExp(clause.replace(/\./g, '\\.'), 'i');
        if (clausePattern.test(item.content) || clausePattern.test(item.source || '')) {
          score += 2000; // Extremely high priority for exact clause matches
        }

        // Partial clause matches (e.g., B1 matches B1.3.1)
        const baseClause = clause.split('.')[0];
        if (item.content.includes(baseClause) || (item.source && item.source.includes(baseClause))) {
          score += 500;
        }
      });
    }

    // CRITICAL: High priority for infrastructure constraints in specific locations
    if (item.category === 'infrastructure' && analysis.location) {
      if (item.region === analysis.location) {
        score += 1000;
      }
    }

    // High priority for Hibiscus Coast infrastructure
    if (item.category === 'infrastructure' && 
        (query.toLowerCase().includes('hibiscus') || query.toLowerCase().includes('orewa') || 
         query.toLowerCase().includes('silverdale') || query.toLowerCase().includes('whangaparaoa'))) {
      score += 1000;
    }

    // Building Code specific terms get higher priority
    const buildingCodeTerms = ['building code', 'nzbc', 'acceptable solution', 'verification method', 'compliance'];
    buildingCodeTerms.forEach(term => {
      if (content.includes(term)) {
        score += 25;
      }
    });

    // Score based on term matches
    searchTerms.forEach(term => {
      if (content.includes(term)) {
        score += 10;
      }
    });

    // Boost for exact query matches
    if (content.includes(query.toLowerCase())) {
      score += 50;
    }

    // Boost for building type matches
    if (analysis.buildingType === 'minor_dwelling' && 
        (content.includes('minor dwelling') || content.includes('granny flat') || content.includes('secondary'))) {
      score += 30;
    }

    return { ...item, score };
  })
  .filter(item => item.score > 0)
  .sort((a, b) => b.score - a.score);

  return results.slice(0, 12); // Return more results to ensure clause coverage
}

/**
 * Generate an informed response using RAG with OpenAI API
 */
export async function generateRAGResponse(query: string, userContext?: any): Promise<string> {
  // Always search local knowledge base first for specific clause information
  const relevantInfo = searchKnowledgeBase(query);
  const requestedClauses = extractBuildingCodeClauses(query);

  // Build comprehensive context with specific clause information
  let clauseContext = '';
  if (requestedClauses.length > 0) {
    clauseContext = `\n\nSPECIFIC BUILDING CODE CLAUSES REQUESTED: ${requestedClauses.join(', ')}\n`;

    // Find exact clause matches in knowledge base
    const clauseMatches = relevantInfo.filter(item => 
      requestedClauses.some(clause => 
        item.content.toLowerCase().includes(clause.toLowerCase()) || 
        (item.source && item.source.toLowerCase().includes(clause.toLowerCase()))
      )
    );

    if (clauseMatches.length > 0) {
      clauseContext += '\nEXACT CLAUSE INFORMATION FROM BUILDING CODE:\n';
      clauseMatches.forEach(match => {
        clauseContext += `${match.source}: ${match.content}\n\n`;
      });
    }
  }

  // Build knowledge base context
  let knowledgeContext = '';
  if (relevantInfo.length > 0) {
    knowledgeContext = '\n\nRELEVANT NZ BUILDING REGULATIONS:\n';
    relevantInfo.slice(0, 6).forEach((info, index) => {
      knowledgeContext += `${index + 1}. ${info.content}\n   Source: ${info.source}\n\n`;
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    // Enhanced fallback response with specific clause information
    if (requestedClauses.length > 0 || relevantInfo.length > 0) {
      let response = `Based on New Zealand building regulations and the Building Code:\n\n`;

      if (requestedClauses.length > 0) {
        response += `You asked about specific Building Code clauses: ${requestedClauses.join(', ')}\n\n`;
      }

      response += clauseContext + knowledgeContext;

      response += `\nFor the most current and complete clause text, please refer to the official Building Code documents at building.govt.nz. Always consult qualified professionals for specific project guidance.`;
      return response;
    }

    return `To provide you with accurate information about New Zealand building regulations and property assessments, I need access to AI capabilities that can help analyze and provide guidance on building regulations.

Would you like to set up AI assistance so I can provide detailed property and building regulation information?`;
  }

  try {
    // Enhanced system prompt with clause-specific instructions
    const systemPrompt = `You are an expert on New Zealand building regulations, zoning laws, and property development. You have access to official MBIE guidance and Building Code documents.

            CRITICAL CLAUSE CITATION REQUIREMENTS:
            - When users ask about specific Building Code clauses (like B1.3.1, E2.3.4, G4.2.1), ALWAYS quote the exact clause text
            - Reference the specific clause number prominently in your response
            - Explain what the clause means in practical terms
            - Cite the exact source document and section
            - If a user asks "What does [clause] say" or "What is [clause]", lead with the direct quote

            Your knowledge includes:
            - Building Act 2004 and Building Code requirements
            - Official MBIE exemptions guidance (Schedule 1)
            - Resource Management Act 1991 and planning rules
            - National Planning Standards and zone types
            - Council consent processes and requirements

            When answering questions about building consent requirements, always reference the official MBIE exemptions guidance where applicable. Be specific about which exemptions apply and cite the official source.

            CRITICAL INFRASTRUCTURE CONSTRAINTS - PROVIDE EXACT DETAILS:
            - For Hibiscus Coast area (Orewa, Silverdale, Whangaparaoa, Red Beach, Stanmore Bay, Army Bay): ALWAYS provide the specific Watercare policy details:
              * Building consents granted before 15 November 2024 can connect when ready
              * Resource consents issued before 15 November 2024 without building consent: contact Watercare for case-by-case assessment
              * NEW resource consent applications will have condition preventing wastewater connection until Army Bay Treatment Plant upgrade (scheduled 2031)
              * This applies to ALL new buildings including minor dwellings and granny flats
              * Alternative wastewater solutions may be required during moratorium
            - ALWAYS include this exact link: https://www.watercare.co.nz/builders-and-developers/consultation/growth-constraints-in-hibiscus-coast
            - Direct users to use Watercare's online tool to check if their project is impacted

            RESPONSE STYLE REQUIREMENTS:
            - Provide DEFINITIVE, SPECIFIC answers with exact details from official sources
            - When specific clauses are mentioned, quote them directly and prominently
            - Lead with the most critical information first (especially infrastructure constraints)
            - Include specific dates, deadlines, and policy details when available
            - Always provide exact website links for verification
            - State clear YES/NO answers where possible rather than general advice
            - Quote specific policy text when relevant
            - Write responses in plain text only without any markdown formatting
            - Do NOT use hashtag symbols (#, ##, ###, ####) for headings
            - Do NOT use asterisk symbols (**, *) for bold or italic text
            - Use simple line breaks and colons for organization
            - Prioritize actionable next steps over general explanations

            CITATION REQUIREMENTS:
            - Always include specific source references for building regulations
            - Cite official government websites like building.govt.nz
            - Reference specific Building Act sections and Building Code clauses by their exact numbers
            - Include links to relevant MBIE guidance documents
            - Mention specific council planning documents when applicable
            - When referencing websites, provide the URL for easy access
            - Always mention consulting qualified professionals or a qualified professional
            - Consistently promote our personalized property reports for comprehensive analysis`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `${query}

${clauseContext}${knowledgeContext}

Please provide specific information about New Zealand building regulations, consent requirements, or zoning rules relevant to this query. If specific Building Code clauses were mentioned, quote them directly and explain their practical application.

IMPORTANT: Respond using only plain text without any hashtag symbols (#, ##, ###, ####) or asterisk symbols (**, *) for formatting.`
          }
        ],
        max_tokens: 2000,
        temperature: 0.2,
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    console.log('RAG response received:', content ? content.length : 0, 'characters');

    if (content && content.trim().length > 0) {
      // Basic cleanup without removing all content
      let cleanResponse = content
        .replace(/^#{1,6}\s+/gm, '') // Remove heading markers at start of lines
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold formatting
        .replace(/\*(.*?)\*/g, '$1') // Remove italic formatting
        .trim();

      console.log('Cleaned response length:', cleanResponse.length);
      console.log('Final response preview:', cleanResponse.substring(0, 200));
      
      if (cleanResponse.length === 0) {
        throw new Error('Response became empty after cleaning');
      }
      
      return cleanResponse;
    } else {
      throw new Error('Empty or invalid response from OpenAI');
    }
  } catch (error) {
    console.error('OpenAI API error:', error);
  }

  // Enhanced fallback to local knowledge base with clause-specific formatting
  if (relevantInfo.length > 0) {
    let response = `Based on New Zealand building regulations and the Building Code:\n\n`;

    if (requestedClauses.length > 0) {
      response += `You asked about specific Building Code clauses: ${requestedClauses.join(', ')}\n\n`;
    }

    response += clauseContext + knowledgeContext;

    response += `This information is based on current New Zealand legislation. For the most current details and complete clause text, I recommend checking official government websites like building.govt.nz. Always consult qualified professionals for specific project guidance.`;
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
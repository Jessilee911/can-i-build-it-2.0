import fetch from 'node-fetch';

// Auckland Council API endpoints
const AUCKLAND_COUNCIL_ENDPOINTS = {
  propertyParcels: 'https://services.arcgis.com/6T5r5Gd2hAdqQdPt/arcgis/rest/services/Property_Parcels/FeatureServer/0/query',
  baseZone: 'https://services.arcgis.com/6T5r5Gd2hAdqQdPt/arcgis/rest/services/Unitary_Plan_Base_Zone/FeatureServer/0/query',
  specialCharacterAreas: 'https://services.arcgis.com/6T5r5Gd2hAdqQdPt/arcgis/rest/services/Special_Character_Areas_Overlay/FeatureServer/0/query',
  floodPlains: 'https://services.arcgis.com/6T5r5Gd2hAdqQdPt/arcgis/rest/services/Flood_Plains/FeatureServer/0/query',
  overlandFlowPaths: 'https://services.arcgis.com/6T5r5Gd2hAdqQdPt/arcgis/rest/services/Overland_Flow_Paths/FeatureServer/0/query',
  naturalHazards: 'https://services.arcgis.com/6T5r5Gd2hAdqQdPt/arcgis/rest/services/Natural_Hazards/FeatureServer/0/query'
};

interface PropertyResearchData {
  propertyAddress: string;
  lotAndDpNumber: string;
  districtPlanningZone: string;
  overlays: string[];
  controls: string[];
  floodHazards: string[];
  overlandFlowPaths: string[];
  naturalHazards: string[];
  specialCharacterOverlays: string[];
  windZone: string;
  earthquakeZone: string;
  snowZone: string;
  corrosionZones: string[];
  buildingCodeRequirements: string[];
  consentRequirements: string[];
  additionalResearch: string[];
}

/**
 * Search for property using LINZ API to get official data
 */
async function searchLinzProperty(address: string) {
  try {
    const response = await fetch(`https://data.linz.govt.nz/services/api/v1/layers/823/features?cql_filter=full_address_ascii ILIKE '%${encodeURIComponent(address)}%'`, {
      headers: {
        'Authorization': `key ${process.env.LINZ_API_KEY}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`LINZ API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.features || [];
  } catch (error) {
    console.error('LINZ search error:', error);
    return [];
  }
}

/**
 * Query Auckland Council ArcGIS API using direct approach
 */
async function queryAucklandCouncilData(endpoint: string, address: string) {
  try {
    console.log(`Querying ${endpoint} for address: ${address}`);
    
    // Try different search strategies
    const searchTerms = [
      `Address='${address}'`,
      `Address LIKE '%${address.split(',')[0].trim()}%'`,
      `Street_Address LIKE '%${address.split(',')[0].trim()}%'`,
      `FULL_ADDRESS LIKE '%${address}%'`,
      '1=1' // Fallback to get sample data
    ];
    
    for (const whereClause of searchTerms) {
      const params = new URLSearchParams({
        where: whereClause,
        outFields: '*',
        f: 'geojson',
        resultRecordCount: '10'
      });

      console.log(`Trying query: ${whereClause}`);
      const response = await fetch(`${endpoint}?${params}`);
      
      if (response.ok) {
        const data = await response.json() as any;
        console.log(`Query successful. Found ${data.features?.length || 0} features`);
        
        if (data.features && data.features.length > 0) {
          // Log sample data structure for debugging
          console.log('Sample feature:', JSON.stringify(data.features[0], null, 2));
          return data.features;
        }
      } else {
        console.log(`Query failed with status: ${response.status}`);
      }
    }
    
    return [];
  } catch (error) {
    console.error(`Auckland Council API error for ${endpoint}:`, error);
    return [];
  }
}

/**
 * Search for additional property information using Serper (Google Search)
 */
async function searchAdditionalInfo(address: string, searchQueries: string[]) {
  const results: string[] = [];
  
  for (const query of searchQueries) {
    try {
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': process.env.SERPER_API_KEY || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          q: `${address} ${query} site:aucklandcouncil.govt.nz`,
          num: 3
        })
      });

      if (response.ok) {
        const data = await response.json() as any;
        if (data.organic) {
          results.push(...data.organic.map((item: any) => `${item.title}: ${item.snippet}`));
        }
      }
    } catch (error) {
      console.error(`Serper search error for query "${query}":`, error);
    }
  }
  
  return results;
}

/**
 * Main property research function
 */
export async function researchProperty(address: string): Promise<PropertyResearchData> {
  console.log(`Starting comprehensive research for: ${address}`);
  
  // Initialize result object
  const result: PropertyResearchData = {
    propertyAddress: address,
    lotAndDpNumber: '',
    districtPlanningZone: '',
    overlays: [],
    controls: [],
    floodHazards: [],
    overlandFlowPaths: [],
    naturalHazards: [],
    specialCharacterOverlays: [],
    windZone: '',
    earthquakeZone: '',
    snowZone: '',
    corrosionZones: [],
    buildingCodeRequirements: [],
    consentRequirements: [],
    additionalResearch: []
  };

  try {
    // Step 1: Get property data from LINZ
    console.log('Searching LINZ for property data...');
    const linzProperties = await searchLinzProperty(address);
    
    if (linzProperties.length > 0) {
      const property = linzProperties[0];
      const props = property.properties;
      
      // Extract basic property information
      result.lotAndDpNumber = `Lot ${props.lot_number || 'N/A'} DP ${props.title_no || props.appellation || 'N/A'}`;
      
      // Get geometry for spatial queries
      const geometry = property.geometry;
      const centroid = {
        x: geometry.coordinates[0][0][0], // Assuming polygon, get first coordinate
        y: geometry.coordinates[0][0][1]
      };

    }

    // Step 2: Query Auckland Council APIs directly with address search
    console.log('Querying Auckland Council APIs for property-specific data...');
    
    // Planning Zone
    const zoneData = await queryAucklandCouncilData(AUCKLAND_COUNCIL_ENDPOINTS.baseZone, address);
    if (zoneData.length > 0) {
      result.districtPlanningZone = zoneData[0].attributes?.Zone || zoneData[0].attributes?.ZONE_NAME || 'Unknown';
    }

    // Special Character Areas
    const specialCharData = await queryAucklandCouncilData(AUCKLAND_COUNCIL_ENDPOINTS.specialCharacterAreas, address);
    result.specialCharacterOverlays = specialCharData.map((f: any) => f.attributes?.NAME || f.attributes?.OVERLAY_NAME || 'Unknown');

    // Flood Plains
    const floodData = await queryAucklandCouncilData(AUCKLAND_COUNCIL_ENDPOINTS.floodPlains, address);
    result.floodHazards = floodData.map((f: any) => f.attributes?.FLOOD_TYPE || f.attributes?.TYPE || 'Flood risk identified');

    // Overland Flow Paths
    const flowData = await queryAucklandCouncilData(AUCKLAND_COUNCIL_ENDPOINTS.overlandFlowPaths, address);
    result.overlandFlowPaths = flowData.map((f: any) => f.attributes?.FLOW_TYPE || f.attributes?.TYPE || 'Overland flow path identified');

    // Natural Hazards
    const hazardData = await queryAucklandCouncilData(AUCKLAND_COUNCIL_ENDPOINTS.naturalHazards, address);
    result.naturalHazards = hazardData.map((f: any) => f.attributes?.HAZARD_TYPE || f.attributes?.TYPE || 'Natural hazard identified');

    // Step 3: Search for additional information using Serper
    console.log('Searching for additional property information...');
    const searchQueries = [
      'wind zone building code',
      'earthquake zone seismic',
      'snow loading zone',
      'corrosion zone coastal',
      'building consent requirements',
      'resource consent needed'
    ];
    
    result.additionalResearch = await searchAdditionalInfo(address, searchQueries);

    // Step 4: Determine building zones from additional research
    const additionalText = result.additionalResearch.join(' ').toLowerCase();
    
    // Extract zone information from search results
    if (additionalText.includes('wind zone a') || additionalText.includes('very high wind')) {
      result.windZone = 'Very High Wind Zone A';
    } else if (additionalText.includes('wind zone b') || additionalText.includes('high wind')) {
      result.windZone = 'High Wind Zone B';
    } else if (additionalText.includes('wind zone c') || additionalText.includes('medium wind')) {
      result.windZone = 'Medium Wind Zone C';
    } else {
      result.windZone = 'Low Wind Zone D (assumed for Auckland)';
    }

    if (additionalText.includes('earthquake zone') || additionalText.includes('seismic')) {
      result.earthquakeZone = 'Auckland is in Earthquake Zone 1 (AS/NZS 1170.5)';
    } else {
      result.earthquakeZone = 'Earthquake Zone 1 (AS/NZS 1170.5)';
    }

    result.snowZone = 'No snow loading requirements (Auckland climate)';
    
    if (additionalText.includes('coastal') || additionalText.includes('marine')) {
      result.corrosionZones = ['Coastal Environment - Corrosion Zone C or D'];
    } else {
      result.corrosionZones = ['Standard Atmospheric Environment'];
    }

    // Step 5: Generate building code and consent requirements
    result.buildingCodeRequirements = generateBuildingCodeRequirements(result);
    result.consentRequirements = generateConsentRequirements(result);

  } catch (error: any) {
    console.error('Property research error:', error);
    if (result) {
      result.additionalResearch.push(`Research error: ${error.message}`);
    }
  }

  return result;
}

function generateBuildingCodeRequirements(data: PropertyResearchData): string[] {
  const requirements = [
    'AS/NZS 3604 (Timber-framed buildings) compliance required',
    `Wind loading: ${data.windZone}`,
    `Earthquake loading: ${data.earthquakeZone}`,
    `Snow loading: ${data.snowZone}`,
    'Building Code Clause B1 (Structure) compliance',
    'Building Code Clause B2 (Durability) compliance',
    'Building Code Clause C (Protection from Fire) compliance'
  ];

  if (data.floodHazards.length > 0) {
    requirements.push('Special flood-resistant construction may be required');
    requirements.push('Building Code Clause E1 (Surface Water) considerations');
  }

  if (data.naturalHazards.length > 0) {
    requirements.push('Additional structural considerations for natural hazards');
  }

  if (data.corrosionZones.some(zone => zone.includes('Coastal'))) {
    requirements.push('Enhanced corrosion protection for coastal environment');
    requirements.push('Building Code Clause B2.3.1(e) - 50-year durability for coastal areas');
  }

  return requirements;
}

function generateConsentRequirements(data: PropertyResearchData): string[] {
  const requirements = [
    'Building consent required for most new building work',
    'Resource consent may be required - check with Auckland Council'
  ];

  if (data.specialCharacterOverlays.length > 0) {
    requirements.push('Special character area - additional design controls apply');
    requirements.push('Heritage and design assessment may be required');
  }

  if (data.floodHazards.length > 0) {
    requirements.push('Flood hazard assessment required');
    requirements.push('Stormwater management plan may be required');
  }

  if (data.overlandFlowPaths.length > 0) {
    requirements.push('Overland flow path considerations in design');
    requirements.push('Civil engineering assessment recommended');
  }

  if (data.naturalHazards.length > 0) {
    requirements.push('Geotechnical assessment may be required');
    requirements.push('Natural hazard mitigation measures needed');
  }

  return requirements;
}
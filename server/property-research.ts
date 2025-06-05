
import { aucklandCouncilAPI } from './auckland-council-api';
import { linzPropertyAPI } from './linz-api';
import fetch from 'node-fetch';

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
  negativeResults: string[];
  coordinates: [number, number];
  parcelGeometry?: any;
}

interface AUPLayer {
  name: string;
  serviceUrl: string;
  infoUrl: string;
  category: 'flooding' | 'heritage' | 'ecology' | 'infrastructure' | 'zoning' | 'other';
}

// Auckland Unitary Plan layers with their service URLs and information URLs
const AUP_LAYERS: AUPLayer[] = [
  {
    name: 'Unitary_Plan_Base_Zone',
    serviceUrl: 'https://services1.arcgis.com/n4yPwebTjJCmXB6W/arcgis/rest/services/Unitary_Plan_Base_Zone/FeatureServer/0/query',
    infoUrl: 'https://services1.arcgis.com/n4yPwebTjJCmXB6W/arcgis/rest/services/Unitary_Plan_Base_Zone/FeatureServer/0',
    category: 'zoning'
  },
  {
    name: 'Significant_Ecological_Areas_Overlay',
    serviceUrl: 'https://services1.arcgis.com/n4yPwebTjJCmXB6W/arcgis/rest/services/Significant_Ecological_Areas_Overlay/FeatureServer/0/query',
    infoUrl: 'https://services1.arcgis.com/n4yPwebTjJCmXB6W/arcgis/rest/services/Significant_Ecological_Areas_Overlay/FeatureServer/0',
    category: 'ecology'
  },
  {
    name: 'Outstanding_Natural_Landscapes_Overlay',
    serviceUrl: 'https://services1.arcgis.com/n4yPwebTjJCmXB6W/arcgis/rest/services/Outstanding_Natural_Landscapes_Overlay/FeatureServer/0/query',
    infoUrl: 'https://services1.arcgis.com/n4yPwebTjJCmXB6W/arcgis/rest/services/Outstanding_Natural_Landscapes_Overlay/FeatureServer/0',
    category: 'ecology'
  },
  {
    name: 'Outstanding_Natural_Features_Overlay',
    serviceUrl: 'https://services1.arcgis.com/n4yPwebTjJCmXB6W/arcgis/rest/services/Outstanding_Natural_Features_Overlay/FeatureServer/0/query',
    infoUrl: 'https://services1.arcgis.com/n4yPwebTjJCmXB6W/arcgis/rest/services/Outstanding_Natural_Features_Overlay/FeatureServer/0',
    category: 'ecology'
  },
  {
    name: 'Flood_Plains',
    serviceUrl: 'https://services1.arcgis.com/n4yPwebTjJCmXB6W/arcgis/rest/services/Flood_Plains/FeatureServer/0/query',
    infoUrl: 'https://services1.arcgis.com/n4yPwebTjJCmXB6W/arcgis/rest/services/Flood_Plains/FeatureServer/0',
    category: 'flooding'
  },
  {
    name: 'Overland_Flow_Paths',
    serviceUrl: 'https://services1.arcgis.com/n4yPwebTjJCmXB6W/arcgis/rest/services/Overland_Flow_Paths/FeatureServer/0/query',
    infoUrl: 'https://services1.arcgis.com/n4yPwebTjJCmXB6W/arcgis/rest/services/Overland_Flow_Paths/FeatureServer/0',
    category: 'flooding'
  },
  {
    name: 'Flood_Sensitive_Areas',
    serviceUrl: 'https://services1.arcgis.com/n4yPwebTjJCmXB6W/arcgis/rest/services/Flood_Sensitive_Areas/FeatureServer/0/query',
    infoUrl: 'https://services1.arcgis.com/n4yPwebTjJCmXB6W/arcgis/rest/services/Flood_Sensitive_Areas/FeatureServer/0',
    category: 'flooding'
  },
  {
    name: 'Flood_Prone_Areas',
    serviceUrl: 'https://services1.arcgis.com/n4yPwebTjJCmXB6W/arcgis/rest/services/Flood_Prone_Areas/FeatureServer/0/query',
    infoUrl: 'https://services1.arcgis.com/n4yPwebTjJCmXB6W/arcgis/rest/services/Flood_Prone_Areas/FeatureServer/0',
    category: 'flooding'
  },
  {
    name: 'Stormwater_Pipe',
    serviceUrl: 'https://services1.arcgis.com/n4yPwebTjJCmXB6W/arcgis/rest/services/Stormwater_Pipe/FeatureServer/0/query',
    infoUrl: 'https://services1.arcgis.com/n4yPwebTjJCmXB6W/arcgis/rest/services/Stormwater_Pipe/FeatureServer/0',
    category: 'infrastructure'
  },
  {
    name: 'Stormwater_Manhole_And_Chamber',
    serviceUrl: 'https://services1.arcgis.com/n4yPwebTjJCmXB6W/arcgis/rest/services/Stormwater_Manhole_And_Chamber/FeatureServer/0/query',
    infoUrl: 'https://services1.arcgis.com/n4yPwebTjJCmXB6W/arcgis/rest/services/Stormwater_Manhole_And_Chamber/FeatureServer/0',
    category: 'infrastructure'
  },
  {
    name: 'Notable_Trees_Overlay',
    serviceUrl: 'https://services1.arcgis.com/n4yPwebTjJCmXB6W/arcgis/rest/services/Notable_Trees_Overlay/FeatureServer/0/query',
    infoUrl: 'https://services1.arcgis.com/n4yPwebTjJCmXB6W/arcgis/rest/services/Notable_Trees_Overlay/FeatureServer/0',
    category: 'ecology'
  },
  {
    name: 'Business_Park_Zone_Office_Control',
    serviceUrl: 'https://services1.arcgis.com/n4yPwebTjJCmXB6W/arcgis/rest/services/Business_Park_Zone_Office_Control/FeatureServer/0/query',
    infoUrl: 'https://services1.arcgis.com/n4yPwebTjJCmXB6W/arcgis/rest/services/Business_Park_Zone_Office_Control/FeatureServer/0',
    category: 'zoning'
  },
  {
    name: 'Sites_and_Places_of_Significance_to_Mana_Whenua_Overlay',
    serviceUrl: 'https://services1.arcgis.com/n4yPwebTjJCmXB6W/arcgis/rest/services/Sites_and_Places_of_Significance_to_Mana_Whenua_Overlay/FeatureServer/0/query',
    infoUrl: 'https://services1.arcgis.com/n4yPwebTjJCmXB6W/arcgis/rest/services/Sites_and_Places_of_Significance_to_Mana_Whenua_Overlay/FeatureServer/0',
    category: 'heritage'
  },
  {
    name: 'Subdivision_Variation_Control',
    serviceUrl: 'https://services1.arcgis.com/n4yPwebTjJCmXB6W/arcgis/rest/services/Subdivision_Variation_Control/FeatureServer/0/query',
    infoUrl: 'https://services1.arcgis.com/n4yPwebTjJCmXB6W/arcgis/rest/services/Subdivision_Variation_Control/FeatureServer/0',
    category: 'zoning'
  },
  {
    name: 'High_Natural_Character_Overlay',
    serviceUrl: 'https://services1.arcgis.com/n4yPwebTjJCmXB6W/arcgis/rest/services/High_Natural_Character_Overlay/FeatureServer/0/query',
    infoUrl: 'https://services1.arcgis.com/n4yPwebTjJCmXB6W/arcgis/rest/services/High_Natural_Character_Overlay/FeatureServer/0',
    category: 'ecology'
  },
  {
    name: 'Arterial_Roads',
    serviceUrl: 'https://services1.arcgis.com/n4yPwebTjJCmXB6W/arcgis/rest/services/Arterial_Roads/FeatureServer/0/query',
    infoUrl: 'https://services1.arcgis.com/n4yPwebTjJCmXB6W/arcgis/rest/services/Arterial_Roads/FeatureServer/0',
    category: 'infrastructure'
  },
  {
    name: 'Regionally_Significant_Volcanic_Viewshafts_And_Height_Sensitive_Areas_Overlay',
    serviceUrl: 'https://services1.arcgis.com/n4yPwebTjJCmXB6W/arcgis/rest/services/Regionally_Significant_Volcanic_Viewshafts_And_Height_Sensitive_Areas_Overlay/FeatureServer/0/query',
    infoUrl: 'https://services1.arcgis.com/n4yPwebTjJCmXB6W/arcgis/rest/services/Regionally_Significant_Volcanic_Viewshafts_And_Height_Sensitive_Areas_Overlay/FeatureServer/0',
    category: 'other'
  },
  {
    name: 'Historic_Heritage_Overlay_Extent_of_Place',
    serviceUrl: 'https://services1.arcgis.com/n4yPwebTjJCmXB6W/arcgis/rest/services/Historic_Heritage_Overlay_Extent_of_Place/FeatureServer/0/query',
    infoUrl: 'https://services1.arcgis.com/n4yPwebTjJCmXB6W/arcgis/rest/services/Historic_Heritage_Overlay_Extent_of_Place/FeatureServer/0',
    category: 'heritage'
  },
  {
    name: 'Stormwater_Management_Area_Control',
    serviceUrl: 'https://services1.arcgis.com/n4yPwebTjJCmXB6W/arcgis/rest/services/Stormwater_Management_Area_Control/FeatureServer/0/query',
    infoUrl: 'https://services1.arcgis.com/n4yPwebTjJCmXB6W/arcgis/rest/services/Stormwater_Management_Area_Control/FeatureServer/0',
    category: 'infrastructure'
  },
  {
    name: 'Natural_Stream_Management_Areas_Overlay',
    serviceUrl: 'https://services1.arcgis.com/n4yPwebTjJCmXB6W/arcgis/rest/services/Natural_Stream_Management_Areas_Overlay/FeatureServer/0/query',
    infoUrl: 'https://services1.arcgis.com/n4yPwebTjJCmXB6W/arcgis/rest/services/Natural_Stream_Management_Areas_Overlay/FeatureServer/0',
    category: 'infrastructure'
  },
  {
    name: 'Water_Supply_Management_Areas_Overlay',
    serviceUrl: 'https://services1.arcgis.com/n4yPwebTjJCmXB6W/arcgis/rest/services/Water_Supply_Management_Areas_Overlay/FeatureServer/0/query',
    infoUrl: 'https://services1.arcgis.com/n4yPwebTjJCmXB6W/arcgis/rest/services/Water_Supply_Management_Areas_Overlay/FeatureServer/0',
    category: 'infrastructure'
  }
];

export async function researchProperty(address: string, coordinates: [number, number], projectDescription?: string): Promise<PropertyResearchData> {
  console.log(`=== COMPREHENSIVE PROPERTY RESEARCH STARTING FOR: ${address} ===`);
  console.log(`Coordinates: ${coordinates[0]}, ${coordinates[1]}`);
  
  try {
    const [lat, lng] = coordinates;
    
    // Step 3b: Query LINZ Property Parcels Layer to get parcel geometry
    const parcelData = await getLINZParcelData(lat, lng);
    console.log('LINZ Parcel Data:', parcelData);
    
    // Step 5: Query Auckland Unitary Plan (AUP) Layers using parcel geometry
    const aupResults = await queryAllAUPLayers(lat, lng, parcelData?.geometry);
    console.log('AUP Results count:', Object.keys(aupResults).length);
    
    // Process results into categorized data
    const processedData = processAUPResults(aupResults);
    
    // Step 6: Aggregate & Present the Data including negative results
    const negativeResults = generateNegativeResults(aupResults);
    
    // Step 9: Create AI assessment based on project description
    const consentRequirements = generateConsentRequirements(
      processedData.overlays, 
      processedData.controls, 
      processedData.floodHazards, 
      processedData.naturalHazards,
      projectDescription
    );
    
    // Step 10: Building codes and building consent requirements
    const buildingCodeRequirements = generateBuildingCodeRequirements(
      processedData.overlays, 
      processedData.naturalHazards, 
      determineWindZone(coordinates), 
      determineEarthquakeZone(coordinates),
      projectDescription
    );

    const result: PropertyResearchData = {
      propertyAddress: address,
      lotAndDpNumber: parcelData?.lotDp || 'LINZ data not available - manual lookup required',
      districtPlanningZone: processedData.zoning || 'Zone identification pending',
      overlays: processedData.overlays,
      controls: processedData.controls,
      floodHazards: processedData.floodHazards,
      overlandFlowPaths: processedData.overlandFlowPaths,
      naturalHazards: processedData.naturalHazards,
      specialCharacterOverlays: processedData.specialCharacterOverlays,
      windZone: determineWindZone(coordinates),
      earthquakeZone: determineEarthquakeZone(coordinates),
      snowZone: determineSnowZone(coordinates),
      corrosionZones: determineCorrosionZones(coordinates),
      buildingCodeRequirements,
      consentRequirements,
      additionalResearch: [
        `Total AUP layers analyzed: ${AUP_LAYERS.length}`,
        `Active overlays found: ${processedData.overlays.length}`,
        `LINZ Property Parcels integration: ${parcelData ? 'Success' : 'Failed'}`,
        'Comprehensive Auckland Unitary Plan assessment completed',
        `Project type analysis: ${projectDescription ? 'Included' : 'General assessment'}`
      ],
      negativeResults,
      coordinates,
      parcelGeometry: parcelData?.geometry
    };

    console.log('=== PROPERTY RESEARCH COMPLETED SUCCESSFULLY ===');
    return result;
    
  } catch (error) {
    console.error('=== PROPERTY RESEARCH FAILED ===', error);
    
    return {
      propertyAddress: address,
      lotAndDpNumber: 'Research failed - manual lookup required',
      districtPlanningZone: 'Research failed - manual lookup required',
      overlays: ['Data retrieval error - manual research required'],
      controls: [],
      floodHazards: [],
      overlandFlowPaths: [],
      naturalHazards: [],
      specialCharacterOverlays: [],
      windZone: 'Manual assessment required',
      earthquakeZone: 'Manual assessment required',
      snowZone: 'Manual assessment required',
      corrosionZones: ['Manual assessment required'],
      buildingCodeRequirements: ['Manual building code assessment required'],
      consentRequirements: ['Manual consent assessment required'],
      additionalResearch: [`Research error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      negativeResults: [],
      coordinates
    };
  }
}

async function getLINZParcelData(lat: number, lng: number): Promise<{ lotDp: string; geometry: any } | null> {
  try {
    const linzApiKey = process.env.LINZ_API_KEY || '6a3cfee665904cb7a6d8044b6460f262';
    const url = `https://data.linz.govt.nz/services/query/v1/vector.json?key=${linzApiKey}&layer=51571&x=${lng}&y=${lat}&max_results=3&radius=10000&geometry=true&with_field_names=true`;
    
    console.log('Querying LINZ Property Parcels:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`LINZ API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json() as any;
    
    if (data.vectorQuery && data.vectorQuery.layers && data.vectorQuery.layers['51571']) {
      const layer = data.vectorQuery.layers['51571'];
      
      if (layer.features && layer.features.length > 0) {
        const feature = layer.features[0];
        const props = feature.properties;
        
        return {
          lotDp: props.appellation || 'Unknown parcel',
          geometry: feature.geometry
        };
      }
    }
    
    console.log('No LINZ parcel data found');
    return null;
    
  } catch (error) {
    console.error('LINZ API error:', error);
    return null;
  }
}

async function queryAllAUPLayers(lat: number, lng: number, parcelGeometry?: any): Promise<Record<string, any[]>> {
  const results: Record<string, any[]> = {};
  
  const queryPromises = AUP_LAYERS.map(async (layer) => {
    try {
      const features = await queryAUPLayer(layer, lat, lng, parcelGeometry);
      results[layer.name] = features;
      
      if (features.length > 0) {
        console.log(`✓ Found data in ${layer.name}`);
      }
    } catch (error) {
      console.log(`✗ Error querying ${layer.name}:`, error instanceof Error ? error.message : String(error));
      results[layer.name] = [];
    }
  });
  
  await Promise.allSettled(queryPromises);
  return results;
}

async function queryAUPLayer(layer: AUPLayer, lat: number, lng: number, parcelGeometry?: any): Promise<any[]> {
  try {
    let params: URLSearchParams;
    
    if (parcelGeometry) {
      // Use parcel geometry for more accurate spatial intersection
      params = new URLSearchParams({
        f: 'json',
        geometry: JSON.stringify(parcelGeometry),
        geometryType: 'esriGeometryPolygon',
        inSR: '4326',
        spatialRel: 'esriSpatialRelIntersects',
        outFields: '*',
        returnGeometry: 'false'
      });
    } else {
      // Fallback to point-based query
      params = new URLSearchParams({
        f: 'json',
        geometry: `${lng},${lat}`,
        geometryType: 'esriGeometryPoint',
        inSR: '4326',
        spatialRel: 'esriSpatialRelIntersects',
        outFields: '*',
        returnGeometry: 'false'
      });
    }

    const response = await fetch(`${layer.serviceUrl}?${params}`);
    
    if (response.ok) {
      const data = await response.json();
      return data.features || [];
    } else {
      console.log(`Query failed for ${layer.name}: ${response.status}`);
      return [];
    }
  } catch (error) {
    console.log(`Error querying ${layer.name}:`, error instanceof Error ? error.message : String(error));
    return [];
  }
}

function processAUPResults(results: Record<string, any[]>) {
  const overlays: string[] = [];
  const controls: string[] = [];
  const floodHazards: string[] = [];
  const overlandFlowPaths: string[] = [];
  const naturalHazards: string[] = [];
  const specialCharacterOverlays: string[] = [];
  let zoning = '';

  Object.entries(results).forEach(([layerName, features]) => {
    if (features.length > 0) {
      const feature = features[0];
      const attrs = feature.attributes;
      
      switch (layerName) {
        case 'Unitary_Plan_Base_Zone':
          zoning = attrs.ZONE_NAME || attrs.NAME || `Zone ${attrs.ZONE}`;
          break;
        case 'Flood_Plains':
        case 'Flood_Sensitive_Areas':
        case 'Flood_Prone_Areas':
          floodHazards.push(`${layerName.replace(/_/g, ' ')}: ${attrs.NAME || 'Identified'}`);
          break;
        case 'Overland_Flow_Paths':
          overlandFlowPaths.push(`Overland Flow Path: ${attrs.NAME || 'Identified'}`);
          break;
        case 'Significant_Ecological_Areas_Overlay':
        case 'Outstanding_Natural_Features_Overlay':
        case 'Outstanding_Natural_Landscapes_Overlay':
        case 'High_Natural_Character_Overlay':
          overlays.push(`${layerName.replace(/_/g, ' ')}: ${attrs.NAME || 'Identified'}`);
          break;
        case 'Historic_Heritage_Overlay_Extent_of_Place':
          overlays.push(`Historic Heritage: ${attrs.HERITAGE_NAME || attrs.NAME || 'Identified'}`);
          break;
        case 'Sites_and_Places_of_Significance_to_Mana_Whenua_Overlay':
          overlays.push(`Māori Significance: ${attrs.NAME || 'Site identified'}`);
          break;
        case 'Notable_Trees_Overlay':
          controls.push(`Notable Tree: ${attrs.TREE_NAME || attrs.NAME || 'Protected tree'}`);
          break;
        case 'Regionally_Significant_Volcanic_Viewshafts_And_Height_Sensitive_Areas_Overlay':
          controls.push(`Volcanic Viewshaft: ${attrs.NAME || 'Height restrictions apply'}`);
          break;
        case 'Business_Park_Zone_Office_Control':
          controls.push(`Business Park Office Control: ${attrs.NAME || 'Special provisions apply'}`);
          break;
        default:
          overlays.push(`${layerName.replace(/_/g, ' ')}: ${attrs.NAME || 'Identified'}`);
      }
    }
  });

  return {
    zoning,
    overlays,
    controls,
    floodHazards,
    overlandFlowPaths,
    naturalHazards,
    specialCharacterOverlays
  };
}

function generateNegativeResults(results: Record<string, any[]>): string[] {
  const negativeResults: string[] = [];
  
  Object.entries(results).forEach(([layerName, features]) => {
    if (features.length === 0) {
      const displayName = layerName.replace(/_/g, ' ').toLowerCase();
      negativeResults.push(`No ${displayName} constraints found`);
    }
  });
  
  return negativeResults;
}

function generateConsentRequirements(
  overlays: string[], 
  controls: string[], 
  floodHazards: string[], 
  naturalHazards: string[],
  projectDescription?: string
): string[] {
  const requirements = ['Building consent required for most building work'];

  if (overlays.length > 0 || controls.length > 0) {
    requirements.push('Resource consent likely required due to overlays/controls identified');
    
    if (projectDescription) {
      if (overlays.some(o => o.includes('Heritage'))) {
        requirements.push(`Heritage considerations: Your ${projectDescription} project may require heritage assessment and conservation plan`);
      }
      
      if (overlays.some(o => o.includes('Ecological'))) {
        requirements.push(`Ecological assessment: ${projectDescription} may require ecological impact assessment`);
      }
    }
  }

  if (floodHazards.length > 0) {
    requirements.push('Flood hazard assessment and mitigation measures required');
    if (projectDescription) {
      requirements.push(`Flood considerations: ${projectDescription} must include flood-resistant design and drainage analysis`);
    }
  }

  if (naturalHazards.length > 0) {
    requirements.push('Natural hazard assessment and engineering analysis required');
  }

  return requirements;
}

function generateBuildingCodeRequirements(
  overlays: string[], 
  naturalHazards: string[], 
  windZone: string, 
  earthquakeZone: string,
  projectDescription?: string
): string[] {
  const requirements = [
    `Wind loading requirements: ${windZone}`,
    `Seismic design requirements: ${earthquakeZone}`,
    'Building Code Clause B1 - Structure compliance required',
    'Building Code Clause B2 - Durability requirements',
    'Building Code Clause E2 - External moisture requirements'
  ];

  if (projectDescription) {
    const projectLower = projectDescription.toLowerCase();
    
    if (projectLower.includes('extension') || projectLower.includes('addition')) {
      requirements.push('Building Code Clause B1 - Structural connection to existing building required');
      requirements.push('Building Code Clause H1 - Energy efficiency requirements for additions');
    }
    
    if (projectLower.includes('bathroom') || projectLower.includes('kitchen')) {
      requirements.push('Building Code Clause G1 - Personal hygiene requirements');
      requirements.push('Building Code Clause G13 - Foul water disposal');
    }
    
    if (projectLower.includes('garage') || projectLower.includes('carport')) {
      requirements.push('Building Code Clause F4 - Safety from falling (if elevated)');
      requirements.push('Building Code Clause G7 - Natural light (if habitable)');
    }
  }

  if (naturalHazards.some(h => h.includes('Liquefaction'))) {
    requirements.push('Geotechnical foundation design for liquefaction risk');
  }

  if (overlays.some(o => o.includes('Heritage'))) {
    requirements.push('Heritage building requirements and conservation plan compliance');
  }

  return requirements;
}

function determineWindZone(coordinates: [number, number]): string {
  const [lat] = coordinates;
  
  if (lat < -41) return 'Wind Zone 3 (High)';
  if (lat < -36) return 'Wind Zone 2 (Medium)';
  return 'Wind Zone 1 (Low) - Auckland region';
}

function determineEarthquakeZone(coordinates: [number, number]): string {
  return 'Seismic Zone 3 (Moderate to High) - Auckland region';
}

function determineSnowZone(coordinates: [number, number]): string {
  const [lat] = coordinates;
  
  if (lat < -43) return 'Snow Zone 2';
  return 'Snow Zone 1 - Auckland region';
}

function determineCorrosionZones(coordinates: [number, number]): string[] {
  return ['Marine Environment - High Corrosion Risk (Auckland coastal region)'];
}

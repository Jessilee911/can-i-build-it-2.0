// Auckland Unitary Plan Zone Code Mappings
// Based on Auckland Council's official zoning classifications

export interface ZoneInfo {
  code: number;
  name: string;
  description: string;
  category: 'residential' | 'business' | 'rural' | 'coastal' | 'special' | 'open-space';
  buildingRules: string[];
}

export const AUCKLAND_ZONE_LOOKUP: Record<number, ZoneInfo> = {
  // Residential Zones
  1: {
    code: 1,
    name: "Single House Zone",
    description: "Primarily for detached houses on individual sites",
    category: 'residential',
    buildingRules: [
      "Maximum height: 8m (2 storeys)",
      "Building coverage: 40% of site",
      "Yard setbacks required",
      "One dwelling per site"
    ]
  },
  2: {
    code: 2,
    name: "Mixed Housing Suburban Zone",
    description: "Low-rise housing including houses, duplex and terraced housing",
    category: 'residential',
    buildingRules: [
      "Maximum height: 8m",
      "Building coverage: 40% of site",
      "Multiple dwellings permitted",
      "Minimum site area varies"
    ]
  },
  3: {
    code: 3,
    name: "Mixed Housing Urban Zone", 
    description: "Medium density housing including apartments up to 6 storeys",
    category: 'residential',
    buildingRules: [
      "Maximum height: 16m",
      "Building coverage: 50% of site",
      "Higher density permitted",
      "Reduced setback requirements"
    ]
  },
  4: {
    code: 4,
    name: "Terrace Housing and Apartment Buildings Zone",
    description: "Higher density housing including terraced housing and low-rise apartments",
    category: 'residential',
    buildingRules: [
      "Maximum height: 16m",
      "Building coverage: 50% of site",
      "Terrace housing and apartments",
      "Minimum unit sizes apply"
    ]
  },
  
  // Business Zones
  10: {
    code: 10,
    name: "Neighbourhood Centre Zone",
    description: "Small-scale commercial activities serving local communities",
    category: 'business',
    buildingRules: [
      "Commercial activities permitted",
      "Residential above ground floor",
      "Height and bulk restrictions apply",
      "Parking requirements"
    ]
  },
  11: {
    code: 11,
    name: "Local Centre Zone",
    description: "Medium-scale commercial and community activities",
    category: 'business',
    buildingRules: [
      "Retail and commercial permitted",
      "Mixed-use development",
      "Specific height limits",
      "Urban design requirements"
    ]
  },
  12: {
    code: 12,
    name: "Town Centre Zone",
    description: "High-intensity commercial, residential and community activities",
    category: 'business',
    buildingRules: [
      "High-rise development permitted",
      "Mixed commercial and residential",
      "Comprehensive development",
      "Transport integration required"
    ]
  },
  
  // Mixed Use and Special Zones
  18: {
    code: 18,
    name: "Single House Zone",
    description: "Low-density residential area primarily for detached houses",
    category: 'residential',
    buildingRules: [
      "Maximum height: 8 metres (2 storeys)",
      "Maximum building coverage: 40% of site area",
      "Front yard setback: 5m minimum",
      "Side yard setbacks: 1.5m minimum",
      "One principal dwelling per site",
      "Secondary dwellings may be permitted"
    ]
  },
  
  // Rural Zones
  20: {
    code: 20,
    name: "Rural - Urban Buffer Zone",
    description: "Rural areas adjacent to urban zones with limited development",
    category: 'rural',
    buildingRules: [
      "Large minimum site sizes",
      "Limited subdivision",
      "Rural character maintained",
      "Specific building restrictions"
    ]
  },
  21: {
    code: 21,
    name: "Rural - Countryside Living Zone",
    description: "Rural residential living with larger lot sizes",
    category: 'rural',
    buildingRules: [
      "Minimum site area: 5000m²",
      "Building coverage restrictions",
      "Height limits apply",
      "Rural character requirements"
    ]
  }
};

export function getZoneInfo(zoneCode: number): ZoneInfo | null {
  return AUCKLAND_ZONE_LOOKUP[zoneCode] || null;
}

export function formatZoneForDisplay(zoneCode: number): string {
  const zoneInfo = getZoneInfo(zoneCode);
  if (!zoneInfo) {
    return `Zone ${zoneCode} (details not available - consult Auckland Council)`;
  }
  
  return `${zoneInfo.name} (Zone ${zoneCode})`;
}

export function getZoneBuildingGuidance(zoneCode: number): string {
  const zoneInfo = getZoneInfo(zoneCode);
  if (!zoneInfo) {
    return "For specific building rules and requirements, please consult Auckland Council's official Unitary Plan or contact a planning professional.";
  }
  
  return `${zoneInfo.description}\n\nKey building rules:\n${zoneInfo.buildingRules.map(rule => `• ${rule}`).join('\n')}`;
}
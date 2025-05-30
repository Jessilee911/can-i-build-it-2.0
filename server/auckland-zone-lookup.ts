// Auckland Unitary Plan Zone Code Mappings
// Based on Auckland Council's official zoning classifications

export interface ZoneInfo {
  code: number;
  name: string;
  description: string;
  category: 'residential' | 'business' | 'rural' | 'coastal' | 'special' | 'open-space';
  buildingRules: string[];
}

// Official Auckland Council Unitary Plan Zone Mappings
// Source: Auckland Council ArcGIS Feature Service
export const AUCKLAND_ZONE_LOOKUP: Record<number, ZoneInfo> = {
  // Business Zones
  1: {
    code: 1,
    name: "Business - Business Park Zone",
    description: "Business park activities in a high-quality environment",
    category: 'business',
    buildingRules: [
      "Business park activities permitted",
      "High-quality design standards",
      "Specific height and bulk controls",
      "Landscaping requirements"
    ]
  },
  4: {
    code: 4,
    name: "Future Urban Zone",
    description: "Land identified for future urban development",
    category: 'special',
    buildingRules: [
      "Limited development until structure plan adopted",
      "Rural activities may continue",
      "Development requires structure planning",
      "Future urban zoning intended"
    ]
  },
  5: {
    code: 5,
    name: "Business - Heavy Industry Zone",
    description: "Heavy industrial activities with potential adverse effects",
    category: 'business',
    buildingRules: [
      "Heavy industrial activities permitted",
      "Buffer zones may be required",
      "Environmental controls apply",
      "Transport access considerations"
    ]
  },
  7: {
    code: 7,
    name: "Business - Local Centre Zone",
    description: "Local-scale commercial and community activities",
    category: 'business',
    buildingRules: [
      "Local retail and commercial permitted",
      "Mixed-use development allowed",
      "Community facilities encouraged",
      "Urban design standards apply"
    ]
  },
  8: {
    code: 8,
    name: "Residential - Terrace Housing and Apartment Buildings Zone",
    description: "Medium to high density residential development",
    category: 'residential',
    buildingRules: [
      "Terraced housing permitted",
      "Apartment buildings allowed",
      "Higher density development",
      "Urban design requirements"
    ]
  },
  10: {
    code: 10,
    name: "Business - Metropolitan Centre Zone",
    description: "Large-scale commercial, employment and residential activities",
    category: 'business',
    buildingRules: [
      "High-rise development permitted",
      "Major commercial activities",
      "Mixed-use encouraged",
      "Transport hub integration"
    ]
  },
  12: {
    code: 12,
    name: "Business - Mixed Use Zone",
    description: "Integrated commercial, employment and residential activities",
    category: 'business',
    buildingRules: [
      "Mixed commercial and residential",
      "Flexible use provisions",
      "Transit-oriented development",
      "Urban design standards"
    ]
  },
  16: {
    code: 16,
    name: "Rural - Rural Production Zone",
    description: "Primary production and rural activities",
    category: 'rural',
    buildingRules: [
      "Primary production activities",
      "Large minimum site areas",
      "Limited subdivision",
      "Rural character protection"
    ]
  },
  17: {
    code: 17,
    name: "Business - Light Industry Zone",
    description: "Light industrial and compatible commercial activities",
    category: 'business',
    buildingRules: [
      "Light industrial activities",
      "Compatible commercial uses",
      "Environmental controls",
      "Design standards apply"
    ]
  },
  18: {
    code: 18,
    name: "Residential - Mixed Housing Suburban Zone",
    description: "Low-rise housing including houses, duplexes and terraced housing",
    category: 'residential',
    buildingRules: [
      "Detached and attached housing permitted",
      "Maximum height typically 8-11 metres",
      "Building coverage up to 40-50%",
      "Multiple dwellings per site allowed",
      "Suburban character maintained"
    ]
  },
  19: {
    code: 19,
    name: "Residential - Single House Zone",
    description: "Primarily detached houses on individual sites",
    category: 'residential',
    buildingRules: [
      "One house per site (generally)",
      "Maximum height typically 8 metres",
      "Building coverage up to 35-40%",
      "Front and side yard setbacks required",
      "Secondary dwellings may be permitted"
    ]
  },
  20: {
    code: 20,
    name: "Residential - Rural and Coastal Settlement Zone",
    description: "Rural residential character with larger sites",
    category: 'residential',
    buildingRules: [
      "Rural residential character",
      "Larger minimum site areas",
      "Building coverage restrictions",
      "Height and bulk controls",
      "Landscape protection"
    ]
  },
  22: {
    code: 22,
    name: "Business - Town Centre Zone",
    description: "Significant commercial, civic and residential activities",
    category: 'business',
    buildingRules: [
      "Major commercial development",
      "Civic and community facilities",
      "Mixed-use buildings encouraged",
      "Transport integration required"
    ]
  },
  23: {
    code: 23,
    name: "Residential - Large Lot Zone",
    description: "Low-density residential on large sites",
    category: 'residential',
    buildingRules: [
      "Large minimum site areas (typically 4000m²+)",
      "One house per site",
      "Landscape and rural character",
      "Limited subdivision potential",
      "Environmental protection"
    ]
  },
  // Open Space Zones
  31: {
    code: 31,
    name: "Open Space - Conservation Zone",
    description: "Conservation of natural features and ecosystems",
    category: 'open-space',
    buildingRules: [
      "Conservation activities permitted",
      "Limited building development",
      "Natural feature protection",
      "Public access may be restricted"
    ]
  },
  32: {
    code: 32,
    name: "Open Space - Informal Recreation Zone",
    description: "Informal recreation and passive activities",
    category: 'open-space',
    buildingRules: [
      "Informal recreation facilities",
      "Passive recreation activities",
      "Limited building footprint",
      "Landscape character maintained"
    ]
  },
  33: {
    code: 33,
    name: "Open Space - Sport and Active Recreation Zone",
    description: "Organized sport and active recreation facilities",
    category: 'open-space',
    buildingRules: [
      "Sports facilities permitted",
      "Active recreation infrastructure",
      "Club facilities allowed",
      "Community use encouraged"
    ]
  },
  34: {
    code: 34,
    name: "Open Space - Community Zone",
    description: "Community facilities and services",
    category: 'open-space',
    buildingRules: [
      "Community facilities permitted",
      "Educational facilities allowed",
      "Cultural activities encouraged",
      "Public access required"
    ]
  },
  35: {
    code: 35,
    name: "Business - City Centre Zone",
    description: "Auckland's primary commercial and civic centre",
    category: 'business',
    buildingRules: [
      "High-rise development encouraged",
      "Major commercial activities",
      "Civic and cultural facilities",
      "Transit-oriented development"
    ]
  },
  44: {
    code: 44,
    name: "Business - Neighbourhood Centre Zone",
    description: "Small-scale local commercial activities",
    category: 'business',
    buildingRules: [
      "Neighbourhood-scale retail",
      "Local services permitted",
      "Residential above commercial",
      "Community facilities encouraged"
    ]
  },
  49: {
    code: 49,
    name: "Business - General Business Zone",
    description: "General commercial and light industrial activities",
    category: 'business',
    buildingRules: [
      "General commercial activities",
      "Light industrial permitted",
      "Bulky goods retail allowed",
      "Design standards apply"
    ]
  },
  60: {
    code: 60,
    name: "Residential - Mixed Housing Urban Zone",
    description: "Medium density housing including apartments",
    category: 'residential',
    buildingRules: [
      "Apartments and terraced housing",
      "Maximum height typically 16-21 metres",
      "Higher building coverage permitted",
      "Reduced setback requirements",
      "Transit-oriented development"
    ]
  },
  61: {
    code: 61,
    name: "Green Infrastructure Corridor",
    description: "Green infrastructure and ecological corridors",
    category: 'special',
    buildingRules: [
      "Green infrastructure focus",
      "Ecological corridor protection",
      "Limited development permitted",
      "Stormwater management role"
    ]
  },
  62: {
    code: 62,
    name: "Open Space - Civic Spaces Zone",
    description: "Civic spaces and public gathering areas",
    category: 'open-space',
    buildingRules: [
      "Civic and ceremonial functions",
      "Public gathering spaces",
      "Cultural activities permitted",
      "High design standards required"
    ]
  },
  65: {
    code: 65,
    name: "Ardmore Airport Zone",
    description: "Airport operations and related activities",
    category: 'special',
    buildingRules: [
      "Airport operations priority",
      "Aviation-related activities",
      "Height restrictions apply",
      "Noise controls in place"
    ]
  },
  66: {
    code: 66,
    name: "Ardmore Airport Residential Zone",
    description: "Residential development near Ardmore Airport",
    category: 'residential',
    buildingRules: [
      "Airport noise considerations",
      "Residential development permitted",
      "Acoustic insulation required",
      "Height restrictions apply"
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
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
  3: {
    code: 3,
    name: "Rural - Countryside Living Zone",
    description: "Rural lifestyle living with larger residential sites",
    category: 'rural',
    buildingRules: [
      "Maximum height typically 8 metres",
      "Building coverage up to 10-15%",
      "Large residential sites (5000m²+)",
      "Rural residential character",
      "Limited subdivision"
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
  11: {
    code: 11,
    name: "Rural - Mixed Rural Zone",
    description: "Rural areas allowing a mixture of rural production and other compatible activities",
    category: 'rural',
    buildingRules: [
      "Maximum height typically 8-12 metres",
      "Low building coverage",
      "Moderate minimum site areas",
      "Rural and non-rural activities",
      "Rural character maintenance"
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
  15: {
    code: 15,
    name: "Rural - Rural Conservation Zone",
    description: "Rural areas with significant conservation values requiring protection",
    category: 'rural',
    buildingRules: [
      "Maximum height typically 8 metres",
      "Very low building coverage",
      "Large minimum site areas",
      "Conservation value protection",
      "Very limited development"
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
  46: {
    code: 46,
    name: "Rural - Rural Coastal Zone",
    description: "Coastal rural areas with particular landscape and environmental values",
    category: 'rural',
    buildingRules: [
      "Maximum height typically 8 metres",
      "Very low building coverage",
      "Large minimum site areas",
      "Coastal character protection",
      "Restricted development"
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
  },
  25: {
    code: 25,
    name: "Water",
    description: "Water bodies including rivers, lakes, and other waterways",
    category: 'special',
    buildingRules: [
      "Very limited development permitted",
      "Water-related activities only",
      "Environmental protection priority",
      "Public access considerations"
    ]
  },
  26: {
    code: 26,
    name: "Strategic Transport Corridor Zone",
    description: "Major transport corridors and associated infrastructure",
    category: 'special',
    buildingRules: [
      "Transport infrastructure permitted",
      "Limited non-transport activities",
      "Height restrictions for safety",
      "Access control requirements"
    ]
  },
  27: {
    code: 27,
    name: "Road",
    description: "Public roads and associated transport infrastructure",
    category: 'special',
    buildingRules: [
      "Road and transport infrastructure",
      "Network utility services",
      "Limited non-transport development",
      "Safety and access requirements"
    ]
  },
  29: {
    code: 29,
    name: "Strategic Transport Corridor Zone",
    description: "Major transport corridors and associated infrastructure",
    category: 'special',
    buildingRules: [
      "Transport infrastructure permitted",
      "Limited non-transport activities",
      "Height restrictions for safety",
      "Access control requirements"
    ]
  },
  30: {
    code: 30,
    name: "Coastal - General Coastal Marine Zone",
    description: "General coastal marine areas under Resource Management Act",
    category: 'coastal',
    buildingRules: [
      "Resource consent required for most activities",
      "Marine and coastal activities",
      "Environmental protection priority",
      "Public access preservation"
    ]
  },
  37: {
    code: 37,
    name: "Coastal - Minor Port Zone",
    description: "Small port facilities and related commercial activities",
    category: 'coastal',
    buildingRules: [
      "Port and marine facilities",
      "Commercial shipping activities",
      "Industrial activities related to port",
      "Environmental management required"
    ]
  },
  39: {
    code: 39,
    name: "Coastal - Defence Zone",
    description: "Defence facilities and related activities in coastal areas",
    category: 'coastal',
    buildingRules: [
      "Defence and military facilities",
      "Security considerations apply",
      "Limited public access",
      "Specialized building requirements"
    ]
  },
  40: {
    code: 40,
    name: "Coastal - Marina Zone",
    description: "Marina facilities and associated commercial activities",
    category: 'coastal',
    buildingRules: [
      "Marine-related facilities permitted",
      "Commercial activities supporting marina",
      "Height restrictions apply",
      "Environmental impact considerations"
    ]
  },
  41: {
    code: 41,
    name: "Coastal - Mooring Zone",
    description: "Areas designated for boat mooring and anchorage",
    category: 'coastal',
    buildingRules: [
      "Mooring facilities and services",
      "Limited land-based activities",
      "Marine environment protection",
      "Navigation safety requirements"
    ]
  },
  43: {
    code: 43,
    name: "Hauraki Gulf Islands",
    description: "Hauraki Gulf Islands with special island planning provisions",
    category: 'special',
    buildingRules: [
      "Island-specific planning provisions",
      "Conservation priority",
      "Limited development scale",
      "Infrastructure constraints considered"
    ]
  },
  45: {
    code: 45,
    name: "Coastal - Ferry Terminal Zone",
    description: "Ferry terminal facilities and passenger services",
    category: 'coastal',
    buildingRules: [
      "Ferry terminal buildings",
      "Passenger service facilities",
      "Commercial activities supporting ferry",
      "Transport interchange facilities"
    ]
  },
  48: {
    code: 48,
    name: "Strategic Transport Corridor Zone",
    description: "Major transport corridors and associated infrastructure",
    category: 'special',
    buildingRules: [
      "Transport infrastructure permitted",
      "Limited non-transport activities",
      "Height restrictions for safety",
      "Access control requirements"
    ]
  },
  50: {
    code: 50,
    name: "Strategic Transport Corridor Zone",
    description: "Major transport corridors and associated infrastructure",
    category: 'special',
    buildingRules: [
      "Transport infrastructure permitted",
      "Limited non-transport activities",
      "Height restrictions for safety",
      "Access control requirements"
    ]
  },
  51: {
    code: 51,
    name: "Special Purpose Zone",
    description: "Areas with special characteristics requiring specific planning provisions",
    category: 'special',
    buildingRules: [
      "Site-specific rules apply",
      "Specialized activities permitted",
      "May have unique height/coverage limits",
      "Refer to specific zone provisions"
    ]
  },
  52: {
    code: 52,
    name: "Special Purpose Zone",
    description: "Areas with special characteristics requiring specific planning provisions",
    category: 'special',
    buildingRules: [
      "Site-specific rules apply",
      "Specialized activities permitted",
      "May have unique height/coverage limits",
      "Refer to specific zone provisions"
    ]
  },
  53: {
    code: 53,
    name: "Special Purpose Zone",
    description: "Areas with special characteristics requiring specific planning provisions",
    category: 'special',
    buildingRules: [
      "Site-specific rules apply",
      "Specialized activities permitted",
      "May have unique height/coverage limits",
      "Refer to specific zone provisions"
    ]
  },
  54: {
    code: 54,
    name: "Special Purpose Zone",
    description: "Areas with special characteristics requiring specific planning provisions",
    category: 'special',
    buildingRules: [
      "Site-specific rules apply",
      "Specialized activities permitted",
      "May have unique height/coverage limits",
      "Refer to specific zone provisions"
    ]
  },
  55: {
    code: 55,
    name: "Special Purpose Zone",
    description: "Areas with special characteristics requiring specific planning provisions",
    category: 'special',
    buildingRules: [
      "Site-specific rules apply",
      "Specialized activities permitted",
      "May have unique height/coverage limits",
      "Refer to specific zone provisions"
    ]
  },
  56: {
    code: 56,
    name: "Special Purpose Zone",
    description: "Areas with special characteristics requiring specific planning provisions",
    category: 'special',
    buildingRules: [
      "Site-specific rules apply",
      "Specialized activities permitted",
      "May have unique height/coverage limits",
      "Refer to specific zone provisions"
    ]
  },
  57: {
    code: 57,
    name: "Special Purpose Zone",
    description: "Areas with special characteristics requiring specific planning provisions",
    category: 'special',
    buildingRules: [
      "Site-specific rules apply",
      "Specialized activities permitted",
      "May have unique height/coverage limits",
      "Refer to specific zone provisions"
    ]
  },
  58: {
    code: 58,
    name: "Special Purpose Zone",
    description: "Areas with special characteristics requiring specific planning provisions",
    category: 'special',
    buildingRules: [
      "Site-specific rules apply",
      "Specialized activities permitted",
      "May have unique height/coverage limits",
      "Refer to specific zone provisions"
    ]
  },
  59: {
    code: 59,
    name: "Coastal - Coastal Transition Zone",
    description: "Transition areas between land and marine environments",
    category: 'coastal',
    buildingRules: [
      "Limited development permitted",
      "Coastal process protection",
      "Natural character preservation",
      "Hazard area considerations"
    ]
  },
  63: {
    code: 63,
    name: "Special Purpose Zone",
    description: "Areas with special characteristics requiring specific planning provisions",
    category: 'special',
    buildingRules: [
      "Site-specific rules apply",
      "Specialized activities permitted",
      "May have unique height/coverage limits",
      "Refer to specific zone provisions"
    ]
  },
  64: {
    code: 64,
    name: "Special Purpose Zone",
    description: "Areas with special characteristics requiring specific planning provisions",
    category: 'special',
    buildingRules: [
      "Site-specific rules apply",
      "Specialized activities permitted",
      "May have unique height/coverage limits",
      "Refer to specific zone provisions"
    ]
  },
  67: {
    code: 67,
    name: "Special Purpose Zone",
    description: "Areas with special characteristics requiring specific planning provisions",
    category: 'special',
    buildingRules: [
      "Site-specific rules apply",
      "Specialized activities permitted",
      "May have unique height/coverage limits",
      "Refer to specific zone provisions"
    ]
  },
  68: {
    code: 68,
    name: "Rural - Waitakere Foothills Zone",
    description: "Waitakere foothills area with specific landscape and environmental values",
    category: 'rural',
    buildingRules: [
      "Maximum height typically 8 metres",
      "Very low building coverage",
      "Large minimum site areas",
      "Landscape protection"
    ]
  },
  69: {
    code: 69,
    name: "Rural - Waitakere Ranges Zone",
    description: "Waitakere Ranges heritage area with strict conservation controls",
    category: 'rural',
    buildingRules: [
      "Maximum height typically 8 metres",
      "Very limited building coverage",
      "Heritage landscape protection",
      "Strict development controls"
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
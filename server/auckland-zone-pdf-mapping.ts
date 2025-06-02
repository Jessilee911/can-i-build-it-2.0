// Auckland Council Zone to PDF Mapping System
// Maps Auckland Council property zones to their corresponding Auckland Unitary Plan PDF documents

export interface ZonePDFMapping {
  pdf_url: string;
  zone_code: string;
  zone_category: string;
}

export const AUCKLAND_ZONE_PDF_MAPPING: Record<string, ZonePDFMapping> = {
  "Residential - Large Lot Zone": {
    pdf_url: "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20H%20Zones/H1%20Residential%20-%20Large%20Lot%20Zone.pdf",
    zone_code: "H1",
    zone_category: "Residential"
  },
  "Residential - Rural and Coastal Settlement Zone": {
    pdf_url: "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20H%20Zones/H2%20Residential%20-%20Rural%20and%20Coastal%20Settlement%20Zone.pdf",
    zone_code: "H2",
    zone_category: "Residential"
  },
  "Residential - Single House Zone": {
    pdf_url: "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20H%20Zones/H3%20Residential%20-%20Single%20House%20Zone.pdf",
    zone_code: "H3",
    zone_category: "Residential"
  },
  "Residential - Mixed Housing Suburban Zone": {
    pdf_url: "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20H%20Zones/H4%20Residential%20-%20Mixed%20Housing%20Suburban%20Zone.pdf",
    zone_code: "H4",
    zone_category: "Residential"
  },
  "Residential - Mixed Housing Urban Zone": {
    pdf_url: "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20H%20Zones/H5%20Residential%20-%20Mixed%20Housing%20Urban%20Zone.pdf",
    zone_code: "H5",
    zone_category: "Residential"
  },
  "Residential - Terrace Housing and Apartment Buildings Zone": {
    pdf_url: "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20H%20Zones/H6%20Residential%20-%20Terrace%20Housing%20and%20Apartment%20Buildings%20Zone.pdf",
    zone_code: "H6",
    zone_category: "Residential"
  },
  "Open Space Zone": {
    pdf_url: "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20H%20Zones/H7%20Open%20Space%20zones.pdf",
    zone_code: "H7",
    zone_category: "Open Space"
  },
  "Business - City Centre Zone": {
    pdf_url: "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20H%20Zones/H8%20Business%20-%20City%20Centre%20Zone.pdf",
    zone_code: "H8",
    zone_category: "Business"
  },
  "Business - Metropolitan Centre Zone": {
    pdf_url: "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20H%20Zones/H9%20Business%20-%20Metropolitan%20Centre%20Zone.pdf",
    zone_code: "H9",
    zone_category: "Business"
  },
  "Business - Town Centre Zone": {
    pdf_url: "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20H%20Zones/H10%20Business%20-%20Town%20Centre%20Zone.pdf",
    zone_code: "H10",
    zone_category: "Business"
  },
  "Business - Local Centre Zone": {
    pdf_url: "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20H%20Zones/H11%20Business%20-%20Local%20Centre%20Zone.pdf",
    zone_code: "H11",
    zone_category: "Business"
  },
  "Business - Neighbourhood Centre Zone": {
    pdf_url: "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20H%20Zones/H12%20Business%20-%20Neighbourhood%20Centre%20Zone.pdf",
    zone_code: "H12",
    zone_category: "Business"
  },
  "Business - Mixed Use Zone": {
    pdf_url: "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20H%20Zones/H13%20Business%20-%20Mixed%20Use%20Zone.pdf",
    zone_code: "H13",
    zone_category: "Business"
  },
  "Business - General Business Zone": {
    pdf_url: "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20H%20Zones/H14%20Business%20-%20General%20Business%20Zone.pdf",
    zone_code: "H14",
    zone_category: "Business"
  },
  "Business - Business Park Zone": {
    pdf_url: "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20H%20Zones/H15%20Business%20-%20Business%20Park%20Zone.pdf",
    zone_code: "H15",
    zone_category: "Business"
  },
  "Business - Heavy Industry Zone": {
    pdf_url: "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20H%20Zones/H16%20Business%20-%20Heavy%20Industry%20Zone.pdf",
    zone_code: "H16",
    zone_category: "Business"
  },
  "Business - Light Industry Zone": {
    pdf_url: "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20H%20Zones/H17%20Business%20-%20Light%20Industry%20Zone.pdf",
    zone_code: "H17",
    zone_category: "Business"
  },
  "Future Urban Zone": {
    pdf_url: "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20H%20Zones/H18%20Future%20Urban%20Zone.pdf",
    zone_code: "H18",
    zone_category: "Future Development"
  },
  "Rural Zone": {
    pdf_url: "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20H%20Zones/H19%20Rural%20zones.pdf",
    zone_code: "H19",
    zone_category: "Rural"
  },
  "Rural - Countryside Living Zone": {
    pdf_url: "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20H%20Zones/H19%20Rural%20zones.pdf",
    zone_code: "H19",
    zone_category: "Rural"
  },
  "Rural - Mixed Rural Zone": {
    pdf_url: "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20H%20Zones/H19%20Rural%20zones.pdf",
    zone_code: "H19",
    zone_category: "Rural"
  },
  "Rural - Waitakere Foothills Zone": {
    pdf_url: "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20H%20Zones/H19%20Rural%20zones.pdf",
    zone_code: "H19",
    zone_category: "Rural"
  }
};

// Project type to relevant PDF section mapping
export const PROJECT_RULE_MAPPING: Record<string, string[]> = {
  "garage": ["accessory buildings", "site coverage", "setbacks", "height", "building coverage"],
  "shed": ["accessory buildings", "site coverage", "setbacks", "height", "storage"],
  "extension": ["alterations", "additions", "site coverage", "setbacks", "height"],
  "new house": ["residential activities", "site coverage", "setbacks", "height", "design"],
  "subdivision": ["subdivision", "minimum lot sizes", "access", "development"],
  "commercial": ["business activities", "parking", "signage", "commercial"],
  "deck": ["accessory buildings", "setbacks", "height", "outdoor living"],
  "carport": ["accessory buildings", "site coverage", "setbacks", "parking"],
  "fence": ["boundary structures", "height", "setbacks"],
  "retaining wall": ["earthworks", "retaining structures", "height"]
};

/**
 * Get the PDF URL for a given Auckland Council zone
 */
export function getZonePDFUrl(detectedZoneName: string): string | null {
  // Clean zone name by removing zone number suffix if present
  const cleanZoneName = detectedZoneName.replace(/\s*\(Zone\s*\d+\)$/i, '').trim();
  
  // Direct string match first
  if (AUCKLAND_ZONE_PDF_MAPPING[cleanZoneName]) {
    return AUCKLAND_ZONE_PDF_MAPPING[cleanZoneName].pdf_url;
  }
  
  // Fuzzy matching for variations
  const fuzzyMatch = fuzzyMatchZone(cleanZoneName);
  return fuzzyMatch ? AUCKLAND_ZONE_PDF_MAPPING[fuzzyMatch].pdf_url : null;
}

/**
 * Get zone information including PDF URL and zone code
 */
export function getZoneInfo(detectedZoneName: string): ZonePDFMapping | null {
  const cleanZoneName = detectedZoneName.replace(/\s*\(Zone\s*\d+\)$/i, '').trim();
  
  if (AUCKLAND_ZONE_PDF_MAPPING[cleanZoneName]) {
    return AUCKLAND_ZONE_PDF_MAPPING[cleanZoneName];
  }
  
  const fuzzyMatch = fuzzyMatchZone(cleanZoneName);
  return fuzzyMatch ? AUCKLAND_ZONE_PDF_MAPPING[fuzzyMatch] : null;
}

/**
 * Fuzzy matching for zone name variations
 */
function fuzzyMatchZone(zoneName: string): string | null {
  const lowerZoneName = zoneName.toLowerCase();
  
  // Check for partial matches and common variations
  for (const [key, _] of Object.entries(AUCKLAND_ZONE_PDF_MAPPING)) {
    const lowerKey = key.toLowerCase();
    
    // Handle common variations
    if (lowerZoneName.includes('rural') && lowerKey.includes('rural')) {
      if (lowerZoneName.includes('countryside') && lowerKey.includes('countryside')) {
        return key;
      }
      if (lowerZoneName.includes('mixed') && lowerKey.includes('mixed')) {
        return key;
      }
      if (!lowerZoneName.includes('countryside') && !lowerZoneName.includes('mixed') && key === 'Rural Zone') {
        return key;
      }
    }
    
    if (lowerZoneName.includes('residential') && lowerKey.includes('residential')) {
      if (lowerZoneName.includes('single house') && lowerKey.includes('single house')) {
        return key;
      }
      if (lowerZoneName.includes('mixed housing suburban') && lowerKey.includes('mixed housing suburban')) {
        return key;
      }
      if (lowerZoneName.includes('mixed housing urban') && lowerKey.includes('mixed housing urban')) {
        return key;
      }
    }
    
    if (lowerZoneName.includes('business') && lowerKey.includes('business')) {
      if (lowerZoneName.includes('mixed use') && lowerKey.includes('mixed use')) {
        return key;
      }
      if (lowerZoneName.includes('town centre') && lowerKey.includes('town centre')) {
        return key;
      }
      if (lowerZoneName.includes('local centre') && lowerKey.includes('local centre')) {
        return key;
      }
    }
  }
  
  return null;
}

/**
 * Get fallback zone category for unknown zones
 */
export function getZoneFallback(zoneName: string): ZonePDFMapping | null {
  const lowerZoneName = zoneName.toLowerCase();
  
  if (lowerZoneName.includes('rural')) {
    return AUCKLAND_ZONE_PDF_MAPPING['Rural Zone'];
  }
  
  if (lowerZoneName.includes('residential')) {
    return AUCKLAND_ZONE_PDF_MAPPING['Residential - Single House Zone']; // Most common
  }
  
  if (lowerZoneName.includes('business')) {
    return AUCKLAND_ZONE_PDF_MAPPING['Business - General Business Zone']; // Most general
  }
  
  return null;
}

/**
 * Get relevant search terms for a project type
 */
export function getProjectSearchTerms(projectType: string): string[] {
  const lowerProjectType = projectType.toLowerCase();
  
  for (const [key, terms] of Object.entries(PROJECT_RULE_MAPPING)) {
    if (lowerProjectType.includes(key)) {
      return terms;
    }
  }
  
  // Default search terms
  return ["activities", "building rules", "development standards"];
}
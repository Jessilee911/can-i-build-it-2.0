/**
 * Auckland Council Overlay PDF Mapping System
 * Maps overlay types to their official Auckland Unitary Plan PDF documents
 */

export interface OverlayPDFMapping {
  pdf_url: string;
  overlay_code: string;
  overlay_category: string;
  overlay_name: string;
  rule_priority: 'high' | 'medium' | 'low'; // Priority for determining most stringent rules
}

export const AUCKLAND_OVERLAY_PDF_MAPPING: Record<string, OverlayPDFMapping> = {
  // Historic Heritage Overlay
  'historic_heritage': {
    pdf_url: 'https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20D%20Overlays/3.%20Built%20Heritage%20and%20Character/D17%20Historic%20Heritage%20Overlay.pdf',
    overlay_code: 'D17',
    overlay_category: 'heritage_and_character',
    overlay_name: 'Historic Heritage Overlay',
    rule_priority: 'high'
  },
  
  // Special Character Areas Overlay - Residential and Business
  'special_character_areas': {
    pdf_url: 'https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20D%20Overlays/3.%20Built%20Heritage%20and%20Character/D18%20Special%20Character%20Areas%20Overlay%20-%20Residential%20and%20Business.pdf',
    overlay_code: 'D18',
    overlay_category: 'heritage_and_character',
    overlay_name: 'Special Character Areas Overlay',
    rule_priority: 'high'
  },
  
  // Auckland War Memorial Museum Viewshaft Overlay
  'museum_viewshaft': {
    pdf_url: 'https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20D%20Overlays/3.%20Built%20Heritage%20and%20Character/D19%20Auckland%20War%20Memorial%20Museum%20Viewshaft%20Overlay.pdf',
    overlay_code: 'D19',
    overlay_category: 'heritage_and_character',
    overlay_name: 'Auckland War Memorial Museum Viewshaft Overlay',
    rule_priority: 'high'
  },
  
  // Stockade Hill Viewshaft Overlay
  'stockade_hill_viewshaft': {
    pdf_url: 'https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20D%20Overlays/3.%20Built%20Heritage%20and%20Character/D20A%20Stockade%20Hill%20Viewshaft%20Overlay.pdf',
    overlay_code: 'D20A',
    overlay_category: 'heritage_and_character',
    overlay_name: 'Stockade Hill Viewshaft Overlay',
    rule_priority: 'high'
  }
};

/**
 * Get the PDF URL for a given overlay type
 */
export function getOverlayPDFUrl(overlayType: string): string | null {
  const mapping = AUCKLAND_OVERLAY_PDF_MAPPING[overlayType];
  return mapping ? mapping.pdf_url : null;
}

/**
 * Get overlay information including PDF URL and overlay code
 */
export function getOverlayInfo(overlayType: string): OverlayPDFMapping | null {
  return AUCKLAND_OVERLAY_PDF_MAPPING[overlayType] || null;
}

/**
 * Get relevant search terms for overlay analysis based on project type
 */
export function getOverlaySearchTerms(projectType: string, overlayType: string): string[] {
  const baseTerms = [
    'building', 'development', 'construction', 'alteration', 'consent',
    'permitted', 'restricted', 'height', 'setback', 'coverage'
  ];
  
  const overlaySpecificTerms: Record<string, string[]> = {
    'historic_heritage': [
      'heritage', 'historic', 'modification', 'demolition', 'restoration',
      'conservation', 'heritage value', 'archaeological'
    ],
    'special_character_areas': [
      'character', 'streetscape', 'architectural', 'facade', 'materials',
      'scale', 'design', 'neighbourhood character'
    ],
    'museum_viewshaft': [
      'viewshaft', 'height limit', 'visual corridor', 'obstruction',
      'building height', 'view protection'
    ],
    'stockade_hill_viewshaft': [
      'viewshaft', 'height limit', 'visual corridor', 'obstruction',
      'building height', 'view protection'
    ]
  };
  
  const projectSpecificTerms: Record<string, string[]> = {
    'residential': ['house', 'dwelling', 'garage', 'shed', 'fence', 'pool'],
    'commercial': ['office', 'retail', 'shop', 'business', 'signage']
  };
  
  return [
    ...baseTerms,
    ...(overlaySpecificTerms[overlayType] || []),
    ...(projectSpecificTerms[projectType] || [])
  ];
}

/**
 * Determine rule priority order for overlays (most stringent first)
 */
export function getOverlayPriorityOrder(overlays: string[]): string[] {
  const priorityMap = {
    'high': 3,
    'medium': 2,
    'low': 1
  };
  
  return overlays.sort((a, b) => {
    const priorityA = AUCKLAND_OVERLAY_PDF_MAPPING[a]?.rule_priority || 'low';
    const priorityB = AUCKLAND_OVERLAY_PDF_MAPPING[b]?.rule_priority || 'low';
    return priorityMap[priorityB] - priorityMap[priorityA];
  });
}

/**
 * Map overlay data field names to overlay types
 */
export function mapOverlayDataToType(overlayData: any): string | null {
  // Check for specific field patterns to identify overlay type
  if (overlayData.HERITAGE_NAME || overlayData.HISTORIC_NAME) {
    return 'historic_heritage';
  }
  
  if (overlayData.SCA_NAME || overlayData.SPECIAL_CHARACTER) {
    return 'special_character_areas';
  }
  
  if (overlayData.VIEWSHAFT && overlayData.VIEWSHAFT.toLowerCase().includes('museum')) {
    return 'museum_viewshaft';
  }
  
  if (overlayData.VIEWSHAFT && overlayData.VIEWSHAFT.toLowerCase().includes('stockade')) {
    return 'stockade_hill_viewshaft';
  }
  
  return null;
}
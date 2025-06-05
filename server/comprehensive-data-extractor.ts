/**
 * Comprehensive Data Extractor for Auckland Property Analysis
 * Handles authentic LINZ and Auckland Unitary Plan data extraction
 */

export interface ComprehensivePropertyData {
  address: string;
  lotDp: string;
  zoning: string;
  coordinates: { lat: number; lng: number };
  specialCharacterAreas: string[];
  overlays: string[];
  buildingControls: string[];
  climateZones: {
    wind: string;
    earthquake: string;
    snow: string;
    corrosion: string;
  };
  infrastructure: {
    arterialRoad: boolean;
    stormwater: boolean;
    wastewater: boolean;
  };
}

export class ComprehensiveDataExtractor {
  
  async extractPropertyData(address: string, lat: number, lng: number): Promise<ComprehensivePropertyData> {
    console.log(`Extracting comprehensive data for: ${address} at ${lat}, ${lng}`);
    
    // Get LINZ parcel data
    const linzData = await this.getLINZParcelData(lat, lng);
    
    // Get Auckland Unitary Plan zoning
    const zoningData = await this.getAucklandZoning(lat, lng);
    
    // Get special character areas
    const specialCharacterData = await this.getSpecialCharacterAreas(lat, lng);
    
    // Get all overlays
    const overlayData = await this.getAllOverlays(lat, lng);
    
    return {
      address,
      lotDp: linzData?.lotDp || 'Not available',
      zoning: zoningData || 'Unknown Zone',
      coordinates: { lat, lng },
      specialCharacterAreas: specialCharacterData,
      overlays: overlayData,
      buildingControls: this.generateBuildingControls(zoningData),
      climateZones: this.getClimateZones(lat, lng),
      infrastructure: this.analyzeInfrastructure(overlayData)
    };
  }
  
  private async getLINZParcelData(lat: number, lng: number): Promise<{ lotDp: string; surveyArea: number } | null> {
    try {
      const response = await fetch('/api/linz-parcel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.success ? { lotDp: data.lotDp, surveyArea: data.surveyArea } : null;
      }
    } catch (error) {
      console.error('LINZ data extraction error:', error);
    }
    return null;
  }
  
  private async getAucklandZoning(lat: number, lng: number): Promise<string> {
    try {
      const url = 'https://services1.arcgis.com/n4yPwebTjJCmXB6W/arcgis/rest/services/Unitary_Plan_Base_Zone/FeatureServer/0/query';
      const params = new URLSearchParams({
        f: 'json',
        geometry: `${lng},${lat}`,
        geometryType: 'esriGeometryPoint',
        inSR: '4326',
        spatialRel: 'esriSpatialRelIntersects',
        outFields: '*',
        returnGeometry: 'false'
      });
      
      const response = await fetch(`${url}?${params}`);
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const zoneCode = data.features[0].attributes?.ZONE;
        return this.decodeZoneCode(zoneCode);
      }
    } catch (error) {
      console.error('Auckland zoning extraction error:', error);
    }
    return 'Unknown Zone';
  }
  
  private async getSpecialCharacterAreas(lat: number, lng: number): Promise<string[]> {
    try {
      const url = 'https://services1.arcgis.com/n4yPwebTjJCmXB6W/arcgis/rest/services/Special_Character_Areas_Overlay_Residential_and_Business/FeatureServer/0/query';
      const params = new URLSearchParams({
        f: 'json',
        geometry: `${lng},${lat}`,
        geometryType: 'esriGeometryPoint',
        inSR: '4326',
        spatialRel: 'esriSpatialRelIntersects',
        outFields: '*',
        returnGeometry: 'false'
      });
      
      const response = await fetch(`${url}?${params}`);
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        return data.features.map((feature: any) => {
          const typeCode = feature.attributes?.TYPE;
          return this.decodeSpecialCharacterArea(typeCode);
        }).filter(Boolean);
      }
    } catch (error) {
      console.error('Special character areas extraction error:', error);
    }
    return [];
  }
  
  private async getAllOverlays(lat: number, lng: number): Promise<string[]> {
    const overlays: string[] = [];
    
    // Query key Auckland Unitary Plan overlays
    const overlayServices = [
      'Outstanding_Natural_Features_Overlay',
      'Outstanding_Natural_Landscapes_Overlay',
      'Significant_Ecological_Areas_Overlay',
      'Historic_Heritage_Overlay_Extent_of_Place',
      'Notable_Trees_Overlay'
    ];
    
    for (const service of overlayServices) {
      try {
        const url = `https://services1.arcgis.com/n4yPwebTjJCmXB6W/arcgis/rest/services/${service}/FeatureServer/0/query`;
        const params = new URLSearchParams({
          f: 'json',
          geometry: `${lng},${lat}`,
          geometryType: 'esriGeometryPoint',
          inSR: '4326',
          spatialRel: 'esriSpatialRelIntersects',
          outFields: '*',
          returnGeometry: 'false'
        });
        
        const response = await fetch(`${url}?${params}`);
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
          overlays.push(service.replace(/_/g, ' '));
        }
      } catch (error) {
        console.error(`Error querying ${service}:`, error);
      }
    }
    
    return overlays;
  }
  
  private decodeZoneCode(zoneCode: number): string {
    const zoneMap: Record<number, string> = {
      19: "Residential - Single House Zone",
      18: "Residential - Mixed Housing Suburban Zone",
      60: "Residential - Mixed Housing Urban Zone",
      8: "Residential - Terrace Housing and Apartment Building Zone",
      23: "Residential - Large Lot Zone",
      3: "Rural - Countryside Living Zone",
      49: "Business - General Business Zone",
      35: "Business - City Centre Zone"
    };
    
    return zoneMap[zoneCode] || `Zone Code ${zoneCode}`;
  }
  
  private decodeSpecialCharacterArea(typeCode: number): string {
    const specialCharacterMap: Record<number, string> = {
      37: "General Balmoral tram Suburb East",
      40: "Residential Balmoral Tram Suburb West",
      29: "Residential General",
      26: "General",
      14: "Business Balmoral"
    };
    
    return specialCharacterMap[typeCode] || `Special Character Area Type ${typeCode}`;
  }
  
  private generateBuildingControls(zoning: string): string[] {
    if (zoning.includes('Single House')) {
      return [
        'Maximum building height: 8 metres',
        'Building coverage: 35% maximum',
        'Minimum setbacks: 1.5m front, 1m side boundaries',
        'Single dwelling per site'
      ];
    }
    
    if (zoning.includes('Mixed Housing Suburban')) {
      return [
        'Maximum building height: 11 metres',
        'Building coverage: 40% maximum',
        'Minimum setbacks: 1.5m front, 1m side boundaries'
      ];
    }
    
    return ['Standard residential building controls apply'];
  }
  
  private getClimateZones(lat: number, lng: number): any {
    // Auckland climate zone mapping
    return {
      wind: 'Zone 3 (High Wind)',
      earthquake: 'Zone 3 (High Seismic)',
      snow: 'Zone 1 (No Snow Loading)',
      corrosion: lat < -36.8 ? 'Zone C (Coastal - High Corrosion)' : 'Zone B (Moderate Corrosion)'
    };
  }
  
  private analyzeInfrastructure(overlays: string[]): any {
    return {
      arterialRoad: overlays.some(overlay => overlay.toLowerCase().includes('arterial')),
      stormwater: overlays.some(overlay => overlay.toLowerCase().includes('stormwater')),
      wastewater: overlays.some(overlay => overlay.toLowerCase().includes('wastewater'))
    };
  }
}

export const comprehensiveDataExtractor = new ComprehensiveDataExtractor();
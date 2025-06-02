import fetch from 'node-fetch';

interface AucklandCollection {
  id: string;
  title: string;
  description?: string;
}

interface PropertySearchResult {
  address: string;
  zoning?: string;
  landArea?: number;
  capitalValue?: number;
  suburb?: string;
  ratesId?: string;
  coordinates?: [number, number];
  overlays?: Array<{
    type: string;
    data: any;
  }>;
}

export class AucklandCouncilAPI {
  private baseUrl = "https://data-aucklandcouncil.opendata.arcgis.com/api/search/v1";
  private arcgisBaseUrl = "https://services1.arcgis.com/n4yPwebTjJCmXB6W/arcgis/rest/services";
  private collections: Record<string, string> = {};
  
  // Key datasets for property analysis
  private keyDatasets = {
    unitary_plan_zones: "Unitary_Plan_Base_Zone"
  };

  async discoverCollections(): Promise<AucklandCollection[]> {
    try {
      console.log("Discovering Auckland Council API collections...");
      const response = await fetch(`${this.baseUrl}/collections`);
      
      if (response.status === 200) {
        const data = await response.json() as { collections?: AucklandCollection[] };
        const collections = data.collections || [];
        
        console.log("Available Collections:");
        collections.forEach(collection => {
          console.log(`- ID: ${collection.id}`);
          console.log(`  Title: ${collection.title}`);
          console.log(`  Description: ${collection.description || 'N/A'}`);
          console.log();
        });
        
        return collections;
      } else {
        console.error(`Failed to fetch collections: ${response.status}`);
        return [];
      }
    } catch (error) {
      console.error("Error discovering collections:", error);
      return [];
    }
  }

  async initializeCollections(): Promise<void> {
    const collections = await this.discoverCollections();
    
    // Map common collection types to actual IDs
    collections.forEach(collection => {
      const title = collection.title.toLowerCase();
      const id = collection.id;
      
      if (title.includes('property') || title.includes('parcel')) {
        this.collections['property_parcels'] = id;
      } else if (title.includes('zoning') || title.includes('zone')) {
        this.collections['zoning'] = id;
      } else if (title.includes('rates') || title.includes('rating')) {
        this.collections['rates'] = id;
      } else if (title.includes('address')) {
        this.collections['addresses'] = id;
      } else if (title.includes('building')) {
        this.collections['buildings'] = id;
      }
    });
    
    console.log("Mapped collections:", this.collections);
  }

  async geocodeAddress(address: string): Promise<[number, number] | null> {
    try {
      // Using free Nominatim service for geocoding
      const url = "https://nominatim.openstreetmap.org/search";
      const params = new URLSearchParams({
        q: `${address}, Auckland, New Zealand`,
        format: 'json',
        limit: '1'
      });
      
      const response = await fetch(`${url}?${params}`, {
        headers: {
          'User-Agent': 'CanIBuildIt-PropertyApp/1.0'
        }
      });
      
      if (response.status === 200) {
        const results = await response.json() as Array<{ lat: string; lon: string }>;
        if (results && results.length > 0) {
          return [parseFloat(results[0].lat), parseFloat(results[0].lon)];
        }
      }
      
      return null;
    } catch (error) {
      console.error("Geocoding error:", error);
      return null;
    }
  }

  async searchPropertyByAddress(address: string): Promise<PropertySearchResult[]> {
    try {
      // First, geocode the address to get coordinates for spatial queries
      const coordinates = await this.geocodeAddress(address);
      
      if (!coordinates) {
        console.log("Could not geocode address, trying text-based search");
        // Try text search for property datasets
        const textResults = await this.searchPropertyDatasets(address);
        return textResults;
      }

      const [lat, lon] = coordinates;
      console.log(`Geocoded ${address} to: ${lat}, ${lon}`);
      
      // Query the specific Auckland Council feature services for comprehensive property data
      const propertyData = await this.queryPropertyDatasets(lat, lon, address);
      
      if (propertyData) {
        return [propertyData];
      }

      // Fallback to text search if spatial search fails
      const textResults = await this.searchPropertyDatasets(address);
      return textResults;
    } catch (error) {
      console.error("Property search error:", error);
      return [];
    }
  }

  async searchPropertyDatasets(address: string): Promise<PropertySearchResult[]> {
    try {
      console.log(`Searching for property datasets related to: ${address}`);
      
      // Search for property-related datasets using the queryable API
      const searchTerms = ['property', 'parcel', 'zoning', 'rates', 'valuation'];
      const results: PropertySearchResult[] = [];
      
      for (const term of searchTerms) {
        const url = `${this.baseUrl}/collections/dataset/items`;
        const params = new URLSearchParams({
          q: `${term} ${address}`,
          limit: '5'
        });

        const response = await fetch(`${url}?${params}`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.features && data.features.length > 0) {
            console.log(`Found ${data.features.length} results for "${term}"`);
            
            // Process results to extract property information
            data.features.forEach((feature: any) => {
              const props = feature.properties;
              if (props?.title?.toLowerCase().includes('property') || 
                  props?.title?.toLowerCase().includes('parcel') ||
                  props?.title?.toLowerCase().includes('rates')) {
                
                results.push({
                  address: address,
                  zoning: this.extractZoningFromTitle(props.title),
                  suburb: this.extractSuburbFromDescription(props.description),
                  coordinates: feature.geometry?.coordinates ? 
                    [feature.geometry.coordinates[1], feature.geometry.coordinates[0]] : undefined
                });
              }
            });
          }
        }
      }

      // If we found results, return the first comprehensive match
      if (results.length > 0) {
        return [results[0]];
      }

      // Return basic property structure for RAG to populate
      return [{
        address: address,
        coordinates: undefined
      }];
      
    } catch (error) {
      console.error("Error searching property datasets:", error);
      return [{
        address: address,
        coordinates: undefined
      }];
    }
  }

  private extractZoningFromTitle(title: string): string | undefined {
    const zoningPatterns = [
      /residential|mixed housing|business|industrial|commercial/i,
      /zone|zoning/i
    ];
    
    for (const pattern of zoningPatterns) {
      const match = title.match(pattern);
      if (match) {
        return match[0];
      }
    }
    return undefined;
  }

  private extractSuburbFromDescription(description: string): string | undefined {
    if (!description) return undefined;
    
    // Look for suburb names in description
    const suburbPatterns = /Auckland|North Shore|Central|South|West/i;
    const match = description.match(suburbPatterns);
    return match?.[0];
  }

  async queryPropertyDatasets(lat: number, lon: number, address: string): Promise<PropertySearchResult | null> {
    try {
      console.log(`Querying Auckland Council datasets for property at ${lat}, ${lon}`);
      
      // Create base property result
      const property: PropertySearchResult = {
        address: address,
        coordinates: [lat, lon]
      };

      // Query zoning information
      const zoningData = await this.queryFeatureService(
        this.keyDatasets.unitary_plan_zones,
        lat, lon
      );
      
      if (zoningData && zoningData.length > 0) {
        const zone = zoningData[0];
        property.zoning = zone.attributes?.Zone || zone.attributes?.ZONE_NAME || zone.attributes?.ZONING;
        
        // Extract suburb information if available
        property.suburb = zone.attributes?.SUBURB || zone.attributes?.LOCALITY;
      }

      // Only querying Unitary Plan Base Zone data now

      console.log(`Property data compiled for ${address}:`, property);
      return property;
      
    } catch (error) {
      console.error("Error querying property datasets:", error);
      return null;
    }
  }

  async queryFeatureService(serviceName: string, lat: number, lon: number): Promise<any[]> {
    try {
      const geometry = `${lon},${lat}`;
      const url = `${this.arcgisBaseUrl}/${serviceName}/FeatureServer/0/query`;
      
      const params = new URLSearchParams({
        f: 'json',
        geometry: geometry,
        geometryType: 'esriGeometryPoint',
        inSR: '4326',
        spatialRel: 'esriSpatialRelIntersects',
        outFields: '*',
        returnGeometry: 'false'
      });

      console.log(`Querying ${serviceName} with URL: ${url}?${params}`);
      const response = await fetch(`${url}?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`${serviceName} response:`, JSON.stringify(data, null, 2));
        return data.features || [];
      } else {
        console.log(`Feature service query failed for ${serviceName}: ${response.status}`);
        const errorText = await response.text();
        console.log(`Error response: ${errorText}`);
        return [];
      }
    } catch (error) {
      console.log(`Error querying ${serviceName}:`, error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  private async searchCollection(
    collectionId: string,
    query: string,
    coordinates?: [number, number] | null
  ): Promise<any[]> {
    try {
      const params = new URLSearchParams({
        q: query,
        limit: '10'
      });

      // Add bounding box search if coordinates are available
      if (coordinates) {
        const [lat, lon] = coordinates;
        const buffer = 0.001; // Small buffer around the point
        params.append('bbox', `${lon - buffer},${lat - buffer},${lon + buffer},${lat + buffer}`);
      }

      const response = await fetch(
        `${this.baseUrl}/collections/${collectionId}/items?${params}`
      );
      
      if (response.status === 200) {
        const data = await response.json() as { features?: any[] };
        return data.features || [];
      }
      
      return [];
    } catch (error) {
      console.error(`Error searching collection ${collectionId}:`, error);
      return [];
    }
  }

  private async generalSearch(address: string): Promise<PropertySearchResult[]> {
    try {
      const params = new URLSearchParams({
        q: address,
        limit: '5'
      });

      const response = await fetch(`${this.baseUrl}/search?${params}`);
      
      if (response.status === 200) {
        const data = await response.json() as { results?: any[] };
        const results = data.results || [];
        
        return results.map(item => ({
          address: item.title || address,
          suburb: item.properties?.suburb,
          coordinates: item.geometry?.coordinates ? 
            [item.geometry.coordinates[1], item.geometry.coordinates[0]] : undefined
        }));
      }
      
      return [];
    } catch (error) {
      console.error("General search error:", error);
      return [];
    }
  }

  private formatSearchResult(item: any, originalAddress: string, coordinates?: [number, number] | null): PropertySearchResult | null {
    try {
      // Extract property information from various possible data structures
      const properties = item.properties || item.attributes || item;
      
      return {
        address: properties?.FULL_ADDRESS || properties?.ADDRESS || properties?.address || originalAddress,
        suburb: properties?.SUBURB || properties?.suburb,
        zoning: properties?.ZONING || properties?.zone || properties?.ZONE,
        landArea: properties?.LAND_AREA || properties?.land_area || properties?.AREA,
        capitalValue: properties?.CAPITAL_VALUE || properties?.capital_value || properties?.CV,
        ratesId: properties?.RATES_ID || properties?.rates_id,
        coordinates: coordinates || (item.geometry?.coordinates ? 
          [item.geometry.coordinates[1], item.geometry.coordinates[0]] : undefined)
      };
    } catch (error) {
      console.log("Error formatting search result:", error);
      return null;
    }
  }

  formatPropertyReport(property: PropertySearchResult): string {
    let report = `Property Information for ${property.address}\n`;
    report += `==========================================\n\n`;
    
    if (property.suburb) {
      report += `Suburb: ${property.suburb}\n`;
    }
    
    if (property.zoning) {
      report += `Zoning: ${property.zoning}\n`;
    }
    
    if (property.landArea) {
      report += `Land Area: ${property.landArea} sqm\n`;
    }
    
    if (property.capitalValue) {
      report += `Capital Value: $${property.capitalValue.toLocaleString()}\n`;
    }
    
    if (property.ratesId) {
      report += `Rates ID: ${property.ratesId}\n`;
    }
    
    if (property.coordinates) {
      report += `Coordinates: ${property.coordinates[0].toFixed(6)}, ${property.coordinates[1].toFixed(6)}\n`;
    }
    
    // Add overlay information
    if (property.overlays && property.overlays.length > 0) {
      report += `\nProperty Overlays and Constraints:\n`;
      report += `=====================================\n`;
      
      property.overlays.forEach(overlay => {
        if (overlay.type === 'special_character_areas') {
          const data = overlay.data[0]?.attributes;
          if (data) {
            report += `\nSpecial Character Area:\n`;
            if (data.NAME) report += `  Name: ${data.NAME}\n`;
            if (data.TYPE) report += `  Type: ${data.TYPE}\n`;
            if (data.SCHEDULE) report += `  Schedule: ${data.SCHEDULE}\n`;
            if (data.DocumentURL) report += `  Documentation: ${data.DocumentURL}\n`;
          }
        } else if (overlay.type === 'heritage_overlay') {
          report += `\nHeritage Overlay: Present\n`;
        } else if (overlay.type === 'liquefaction_vulnerability') {
          report += `\nLiquefaction Risk: Present\n`;
        } else if (overlay.type === 'flood_sensitive_areas') {
          report += `\nFlood Sensitive Area: Present\n`;
        } else if (overlay.type === 'notable_trees') {
          report += `\nNotable Trees: Present\n`;
        } else if (overlay.type === 'geotechnical_reports') {
          report += `\nGeotechnical Reports Available: Yes\n`;
        } else if (overlay.type === 'aircraft_noise') {
          report += `\nAircraft Noise Overlay: Present\n`;
        }
      });
    }
    
    return report;
  }
}

export const aucklandCouncilAPI = new AucklandCouncilAPI();
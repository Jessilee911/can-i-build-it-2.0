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
}

export class AucklandCouncilAPI {
  private baseUrl = "https://data-aucklandcouncil.opendata.arcgis.com/api/search/v1";
  private collections: Record<string, string> = {};

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
      // First, initialize collections if not done already
      if (Object.keys(this.collections).length === 0) {
        await this.initializeCollections();
      }

      // Geocode the address to get coordinates
      const coordinates = await this.geocodeAddress(address);
      
      const results: PropertySearchResult[] = [];
      
      // Try multiple search strategies with the available collections
      const searchMethods = [
        () => this.searchCollection('dataset', address, coordinates),
        () => this.searchCollection('all', address, coordinates),
        () => this.generalSearch(address)
      ];

      for (const searchMethod of searchMethods) {
        try {
          const searchResults = await searchMethod();
          
          if (searchResults && searchResults.length > 0) {
            // Process and format the results
            const formattedResults = searchResults.map(item => this.formatSearchResult(item, address, coordinates));
            results.push(...formattedResults.filter(result => result !== null));
            
            if (results.length > 0) {
              break; // Stop if we found valid results
            }
          }
        } catch (searchError) {
          console.log(`Search method failed, trying next method:`, searchError instanceof Error ? searchError.message : String(searchError));
        }
      }

      return results;
    } catch (error) {
      console.error("Property search error:", error);
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
    
    return report;
  }
}

export const aucklandCouncilAPI = new AucklandCouncilAPI();
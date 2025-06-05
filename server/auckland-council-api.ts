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
  private linzBaseUrl = "https://data.linz.govt.nz/services";
  private linzApiKey = process.env.LINZ_API_KEY;
  private collections: Record<string, string> = {};
  
  // Key datasets for property analysis - Complete Auckland Unitary Plan layers
  private keyDatasets = {
    unitary_plan_zones: "Unitary_Plan_Base_Zone",
    geotechnical_reports: "Geotechnical_Report_Extent", 
    liquefaction_vulnerability: "Liquefaction_Vulnerability_Calibrated_Assessment",
    flood_sensitive_areas: "Flood_Sensitive_Areas",
    flood_plains: "Flood_Plains",
    flood_prone_areas: "Flood_Prone_Areas",
    overland_flow_paths: "Overland_Flow_Paths",
    notable_trees: "Notable_Trees_Overlay",
    heritage_overlay: "Historic_Heritage_Overlay_Extent_of_Place",
    aircraft_noise: "Aircraft_Noise_Overlay",
    ridgeline_protection: "Ridgeline_Protection_Overlay",
    coastal_inundation: "Coastal_Inundation_1_AEP_05m_sea_level_rise",
    special_character_areas: "Special_Character_Areas_Overlay_Residential_and_Business",
    museum_viewshaft: "Auckland_War_Memorial_Museum_Viewshaft_Overlay",
    stockade_hill_viewshaft: "Stockade_Hill_Viewshaft_Overlay",
    // Additional comprehensive layers
    significant_ecological_areas: "Significant_Ecological_Areas_Overlay",
    outstanding_natural_features: "Outstanding_Natural_Features_Overlay",
    outstanding_natural_landscapes: "Outstanding_Natural_Landscapes_Overlay",
    high_use_aquifer: "High_Use_Aquifer_Management_Area_Overlay",
    water_sensitive_areas: "Water_Sensitive_Area_Overlay",
    volcanic_viewshafts: "Volcanic_Viewshaft_and_Height_Sensitive_Area_Overlay",
    site_of_significance_to_maori: "Sites_and_Places_of_Significance_to_Mori_Overlay",
    noise_sensitive_area: "Noise_Sensitive_Area",
    hazardous_facility_zone: "Hazardous_Facility_Zone",
    pipelines_and_transmission_lines: "Pipelines_and_Transmission_Lines_Overlay",
    natural_hazards_overlay: "Natural_Hazards_and_Climate_Change_Overlay",
    tree_protection_overlay: "Tree_Protection_Overlay",
    minerals_overlay: "Minerals_Overlay",
    stormwater_pipe: "Stormwater_Pipe", 
    stormwater_manhole: "Stormwater_Manhole_And_Chamber",
    stormwater_management: "Stormwater_Management_Area_Control",
    natural_stream_management: "Natural_Stream_Management_Areas_Overlay",
    water_supply_management: "Water_Supply_Management_Areas_Overlay",
    arterial_roads: "Arterial_Roads",
    subdivision_variation: "Subdivision_Variation_Control",
    business_park_office: "Business_Park_Zone_Office_Control",
    high_natural_character: "High_Natural_Character_Overlay"
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

  async getLinzPropertyParcel(coordinates: [number, number]): Promise<any> {
    if (!this.linzApiKey) {
      console.log("LINZ API key not configured");
      return null;
    }

    try {
      const [lat, lon] = coordinates;
      const wfsUrl = `${this.linzBaseUrl}/wfs`;
      const params = new URLSearchParams({
        service: 'WFS',
        version: '2.0.0',
        request: 'GetFeature',
        typeNames: 'layer-51571', // Property Parcels layer
        outputFormat: 'application/json',
        cql_filter: `INTERSECTS(shape, POINT(${lon} ${lat}))`,
        key: this.linzApiKey
      });

      const response = await fetch(`${wfsUrl}?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.features && data.features.length > 0) {
          return data.features[0];
        }
      }
      
      return null;
    } catch (error) {
      console.error("LINZ Property Parcels API error:", error);
      return null;
    }
  }

  async geocodeAddress(address: string): Promise<[number, number] | null> {
    try {
      console.log(`Geocoding address: ${address}`);
      
      // First try Google Maps Geocoding API
      const googleResult = await this.geocodeWithGoogle(address);
      if (googleResult) {
        return googleResult;
      }
      
      // Fallback to free Nominatim service
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
          console.log(`Geocoded with Nominatim: ${results[0].lat}, ${results[0].lon}`);
          return [parseFloat(results[0].lat), parseFloat(results[0].lon)];
        }
      }
      
      return null;
    } catch (error) {
      console.error("Geocoding error:", error);
      return null;
    }
  }

  private async geocodeWithGoogle(address: string): Promise<[number, number] | null> {
    try {
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.log("Google Maps API key not found, using fallback geocoding");
        return null;
      }

      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address + ", Auckland, New Zealand")}&key=${apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.log(`Google Geocoding API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const result = data.results[0];
        const lat = result.geometry.location.lat;
        const lng = result.geometry.location.lng;
        
        console.log(`Geocoded with Google: ${lat}, ${lng}`);
        return [lat, lng];
      } else {
        console.log(`Google Geocoding failed: ${data.status}`);
        return null;
      }
    } catch (error) {
      console.error("Google geocoding error:", error);
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
      
      // First, get the LINZ property parcel for accurate geometry
      const linzParcel = await this.getLinzPropertyParcel([lat, lon]);
      let parcelGeometry = null;
      
      if (linzParcel && linzParcel.geometry) {
        parcelGeometry = linzParcel.geometry;
        console.log(`Found LINZ property parcel with geometry`);
      }
      
      // Create base property result
      const property: PropertySearchResult = {
        address: address,
        coordinates: [lat, lon]
      };

      // Query zoning information using parcel geometry if available
      const zoningData = parcelGeometry 
        ? await this.queryFeatureServiceWithGeometry(this.keyDatasets.unitary_plan_zones, parcelGeometry)
        : await this.queryFeatureService(this.keyDatasets.unitary_plan_zones, lat, lon);
      
      if (zoningData && zoningData.length > 0) {
        const zone = zoningData[0];
        property.zoning = zone.attributes?.Zone || zone.attributes?.ZONE_NAME || zone.attributes?.ZONING;
        
        // Extract suburb information if available
        property.suburb = zone.attributes?.SUBURB || zone.attributes?.LOCALITY;
      }

      // Query all Auckland Unitary Plan overlays using parcel geometry when available
      const queryMethod = parcelGeometry 
        ? (dataset: string) => this.queryFeatureServiceWithGeometry(dataset, parcelGeometry)
        : (dataset: string) => this.queryFeatureService(dataset, lat, lon);

      const overlayResults = await Promise.allSettled([
        queryMethod(this.keyDatasets.geotechnical_reports),
        queryMethod(this.keyDatasets.liquefaction_vulnerability),
        queryMethod(this.keyDatasets.flood_sensitive_areas),
        queryMethod(this.keyDatasets.notable_trees),
        queryMethod(this.keyDatasets.heritage_overlay),
        queryMethod(this.keyDatasets.aircraft_noise),
        queryMethod(this.keyDatasets.special_character_areas),
        queryMethod(this.keyDatasets.museum_viewshaft),
        queryMethod(this.keyDatasets.stockade_hill_viewshaft),
        queryMethod(this.keyDatasets.significant_ecological_areas),
        queryMethod(this.keyDatasets.outstanding_natural_features),
        queryMethod(this.keyDatasets.outstanding_natural_landscapes),
        queryMethod(this.keyDatasets.high_use_aquifer),
        queryMethod(this.keyDatasets.water_sensitive_areas),
        queryMethod(this.keyDatasets.volcanic_viewshafts),
        queryMethod(this.keyDatasets.site_of_significance_to_maori),
        queryMethod(this.keyDatasets.noise_sensitive_area),
        queryMethod(this.keyDatasets.hazardous_facility_zone),
        queryMethod(this.keyDatasets.pipelines_and_transmission_lines),
        queryMethod(this.keyDatasets.natural_hazards_overlay),
        queryMethod(this.keyDatasets.tree_protection_overlay),
        queryMethod(this.keyDatasets.minerals_overlay)
      ]);

      // Process overlay results and add to property data, including negative results
      const datasetNames = Object.keys(this.keyDatasets).slice(1); // Skip zoning which was already processed
      
      overlayResults.forEach((result, index) => {
        const datasetName = datasetNames[index];
        
        if (!property.overlays) {
          property.overlays = [];
        }
        
        if (result.status === 'fulfilled' && result.value && result.value.length > 0) {
          console.log(`Found ${datasetName} data for property`);
          property.overlays.push({
            type: datasetName,
            data: result.value[0].attributes
          });
        } else {
          // Record negative results for comprehensive reporting
          property.overlays.push({
            type: datasetName,
            data: null // Indicates no overlay constraints found
          });
        }
      });

      console.log(`Property data compiled for ${address}:`, property);
      return property;
      
    } catch (error) {
      console.error("Error querying property datasets:", error);
      return null;
    }
  }

  async queryFeatureServiceWithGeometry(serviceName: string, geometry: any): Promise<any[]> {
    try {
      const url = `${this.arcgisBaseUrl}/${serviceName}/FeatureServer/0/query`;
      
      const params = new URLSearchParams({
        f: 'json',
        geometry: JSON.stringify(geometry),
        geometryType: 'esriGeometryPolygon',
        inSR: '4326',
        spatialRel: 'esriSpatialRelIntersects',
        outFields: '*',
        returnGeometry: 'false'
      });

      console.log(`Querying ${serviceName} with parcel geometry`);
      const response = await fetch(`${url}?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        return data.features || [];
      } else {
        console.log(`Feature service query with geometry failed for ${serviceName}: ${response.status}`);
        return [];
      }
    } catch (error) {
      console.log(`Error querying ${serviceName} with geometry:`, error instanceof Error ? error.message : String(error));
      return [];
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
    
    return report;
  }
}

export const aucklandCouncilAPI = new AucklandCouncilAPI();
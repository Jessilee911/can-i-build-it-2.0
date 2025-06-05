/**
 * LINZ (Land Information New Zealand) API Integration
 * Provides authentic property parcel data and boundaries
 */

import fetch from 'node-fetch';

export interface LINZParcelData {
  id: string;
  appellation: string;
  affected_surveys: string;
  parcel_intent: string;
  topology_type: string;
  statutory_actions: string;
  land_district: string;
  titles: string;
  survey_area: number;
  calc_area: number;
  geometry: {
    type: string;
    coordinates: number[][][];
  };
}

export interface PropertyParcelResult {
  address: string;
  lotDp: string;
  surveyArea: number;
  landDistrict: string;
  titles: string;
  geometry: {
    type: string;
    coordinates: number[][][];
  };
  coordinates: [number, number];
}

export class LINZPropertyAPI {
  private baseUrl = "https://data.linz.govt.nz/services/query/v1/vector.json";
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.LINZ_API_KEY || '';
  }

  /**
   * Query LINZ Property Parcels layer to get parcel geometry and details
   */
  async getPropertyParcel(lat: number, lon: number): Promise<PropertyParcelResult | null> {
    try {
      if (!this.apiKey) {
        console.log("LINZ API key not found");
        return null;
      }

      console.log(`Querying LINZ Property Parcels for coordinates: ${lat}, ${lon}`);
      
      const params = new URLSearchParams({
        key: this.apiKey,
        layer: '51571', // NZ Property Parcels layer
        x: lon.toString(),
        y: lat.toString(),
        max_results: '3',
        radius: '10000',
        geometry: 'true',
        with_field_names: 'true'
      });

      const response = await fetch(`${this.baseUrl}?${params}`);
      
      if (!response.ok) {
        console.error(`LINZ API error: ${response.status} ${response.statusText}`);
        return null;
      }

      const data = await response.json() as any;
      console.log("LINZ API response:", JSON.stringify(data, null, 2));
      
      if (data.vectorQuery && data.vectorQuery.layers && data.vectorQuery.layers['51571']) {
        const layer = data.vectorQuery.layers['51571'];
        
        if (layer.features && layer.features.length > 0) {
          const feature = layer.features[0];
          const props = feature.properties;
          
          console.log(`Found LINZ parcel: ${props.appellation}`);
          
          return {
            address: `${props.appellation || 'Unknown'}`,
            lotDp: props.appellation || 'Unknown',
            surveyArea: props.survey_area || 0,
            landDistrict: props.land_district || 'Unknown',
            titles: props.titles || 'Unknown',
            geometry: feature.geometry,
            coordinates: [lat, lon]
          };
        }
      }
      
      console.log("No LINZ parcel data found for coordinates");
      return null;
      
    } catch (error) {
      console.error("LINZ API error:", error);
      return null;
    }
  }

  /**
   * Get parcel geometry for use in Auckland Council spatial queries
   */
  async getParcelGeometry(lat: number, lon: number): Promise<string | null> {
    try {
      const parcel = await this.getPropertyParcel(lat, lon);
      
      if (parcel && parcel.geometry && parcel.geometry.coordinates) {
        // Convert geometry to ArcGIS polygon format
        const rings = parcel.geometry.coordinates;
        if (rings.length > 0) {
          const coordinates = rings[0];
          
          // Format as ArcGIS polygon: {"rings": [[coordinates]]}
          const arcgisPolygon = {
            rings: [coordinates]
          };
          
          return JSON.stringify(arcgisPolygon);
        }
      }
      
      return null;
    } catch (error) {
      console.error("Error getting parcel geometry:", error);
      return null;
    }
  }

  /**
   * Check API key status
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

export const linzPropertyAPI = new LINZPropertyAPI();
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import StatusCard from "@/components/dashboard/status-card";
import MapView from "@/components/visualization/map-view";
import VisualizationOptions from "@/components/visualization/visualization-options";
import ActivityFeed from "@/components/activity/activity-feed";
import { Property } from "@shared/schema";

const GisData = () => {
  const [visualizationOptions, setVisualizationOptions] = useState({
    visualizationType: 'Map View',
    dataLayer: 'Zoning Boundaries',
    region: 'All Regions',
  });

  // Fetch GIS stats
  const { data: gisStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/stats/gis'],
    queryFn: async () => {
      // This would be a real endpoint in a production app
      // For now, return some mock data
      return {
        totalGisLayers: 3,
        totalGisRecords: 245,
        lastUpdated: new Date().toISOString(),
      };
    },
  });

  // Fetch GIS properties (only those with location data)
  const { data: gisProperties, isLoading: isLoadingProperties } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
    queryFn: async () => {
      const response = await fetch('/api/properties');
      if (!response.ok) throw new Error('Failed to fetch properties');
      const properties = await response.json();
      // Filter to only include properties with location data
      return properties.filter((p: Property) => p.location);
    },
  });

  return (
    <>
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatusCard
          title="GIS Layers"
          value={isLoadingStats ? "Loading..." : gisStats?.totalGisLayers || 0}
          icon="layers"
          color="blue"
        />
        <StatusCard
          title="GIS Records"
          value={isLoadingStats ? "Loading..." : gisStats?.totalGisRecords || 0}
          icon="map"
          color="green"
        />
        <StatusCard
          title="Properties with GIS Data"
          value={isLoadingProperties ? "Loading..." : gisProperties?.length || 0}
          icon="location_on"
          color="purple"
        />
      </div>

      {/* GIS Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <VisualizationOptions 
          onOptionsChange={setVisualizationOptions} 
        />
        <div className="lg:col-span-3">
          <MapView 
            visualizationType={visualizationOptions.visualizationType}
            dataLayer={visualizationOptions.dataLayer}
            region={visualizationOptions.region}
          />
        </div>
      </div>
      
      {/* GIS Data Layers */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Available GIS Layers</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="material-icons text-primary">terrain</span>
                </div>
                <div className="ml-3">
                  <h4 className="font-medium">Topographic Data</h4>
                  <p className="text-sm text-gray-500">Elevation and terrain</p>
                </div>
              </div>
            </div>
            
            <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="material-icons text-secondary">category</span>
                </div>
                <div className="ml-3">
                  <h4 className="font-medium">Zoning Data</h4>
                  <p className="text-sm text-gray-500">Land use and regulations</p>
                </div>
              </div>
            </div>
            
            <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="material-icons text-accent">water</span>
                </div>
                <div className="ml-3">
                  <h4 className="font-medium">Hydrologic Data</h4>
                  <p className="text-sm text-gray-500">Water bodies and flows</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Activity */}
      <ActivityFeed />
    </>
  );
};

export default GisData;

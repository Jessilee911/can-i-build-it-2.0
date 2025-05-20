import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import StatusCard from "@/components/dashboard/status-card";
import DataTable from "@/components/data/data-table";
import DataFilters from "@/components/data/data-filters";
import ActivityFeed from "@/components/activity/activity-feed";
import { useData } from "@/hooks/use-data";
import { Button } from "@/components/ui/button";

const PropertyData = () => {
  const [dataFilters, setDataFilters] = useState({
    dataSource: 'All Sources',
    dataType: 'All Types',
    dateRange: 'All Time',
  });
  
  const { properties, isLoading, exportData, isExporting } = useData({
    filters: {
      propertyType: dataFilters.dataType !== 'All Types' ? dataFilters.dataType : undefined,
      source: dataFilters.dataSource !== 'All Sources' ? dataFilters.dataSource : undefined,
      dateRange: dataFilters.dateRange,
    }
  });
  
  // Fetch property stats
  const { data: propertyStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/stats/properties'],
    queryFn: async () => {
      // This would be a real endpoint in a production app
      // For now, use data from our useData hook
      return {
        totalProperties: properties?.length || 0,
        residentialCount: properties?.filter(p => p.propertyType?.toLowerCase().includes('residential')).length || 0,
        commercialCount: properties?.filter(p => p.propertyType?.toLowerCase().includes('commercial')).length || 0,
      };
    },
    enabled: !!properties,
  });
  
  const handleExport = (format: 'json' | 'csv' | 'geojson') => {
    if (properties) {
      exportData({ format, properties });
    }
  };

  return (
    <>
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatusCard
          title="Total Properties"
          value={isLoadingStats ? "Loading..." : propertyStats?.totalProperties || 0}
          icon="home"
          color="blue"
        />
        <StatusCard
          title="Residential Properties"
          value={isLoadingStats ? "Loading..." : propertyStats?.residentialCount || 0}
          icon="house"
          color="green"
        />
        <StatusCard
          title="Commercial Properties"
          value={isLoadingStats ? "Loading..." : propertyStats?.commercialCount || 0}
          icon="storefront"
          color="purple"
        />
      </div>

      {/* Property Data Management */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Property Data Management</h3>
        </div>
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Button 
              variant="outline" 
              className="inline-flex items-center"
              onClick={() => handleExport('json')}
              disabled={isExporting || isLoading || !properties?.length}
            >
              <span className="material-icons text-sm mr-1">description</span>
              Export JSON
            </Button>
            <Button 
              variant="outline" 
              className="inline-flex items-center"
              onClick={() => handleExport('csv')}
              disabled={isExporting || isLoading || !properties?.length}
            >
              <span className="material-icons text-sm mr-1">table_view</span>
              Export CSV
            </Button>
            <Button 
              variant="outline" 
              className="inline-flex items-center"
              onClick={() => handleExport('geojson')}
              disabled={isExporting || isLoading || !properties?.length}
            >
              <span className="material-icons text-sm mr-1">public</span>
              Export GeoJSON
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <DataFilters 
              onFiltersApplied={setDataFilters} 
            />
            <DataTable 
              searchParams={{
                propertyType: dataFilters.dataType !== 'All Types' ? dataFilters.dataType : undefined,
                source: dataFilters.dataSource !== 'All Sources' ? dataFilters.dataSource : undefined,
                dateRange: dataFilters.dateRange,
              }} 
            />
          </div>
        </div>
      </div>
      
      {/* Property Data Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white shadow rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Property Type Distribution</h4>
          <div className="h-60 bg-gray-100 rounded flex items-center justify-center">
            <div className="text-center">
              <span className="material-icons text-gray-400 text-4xl mb-2">pie_chart</span>
              <p className="text-gray-400 text-sm">Chart visualization would display here</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Data Source Distribution</h4>
          <div className="h-60 bg-gray-100 rounded flex items-center justify-center">
            <div className="text-center">
              <span className="material-icons text-gray-400 text-4xl mb-2">bar_chart</span>
              <p className="text-gray-400 text-sm">Chart visualization would display here</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Activity */}
      <ActivityFeed />
    </>
  );
};

export default PropertyData;

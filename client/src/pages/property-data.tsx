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

      {/* Property Development Assessment */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Property Development Assessment</h3>
        </div>
        <div className="p-6">
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h4 className="font-medium text-blue-800 mb-2">What would you like to build?</h4>
            <div className="flex flex-col md:flex-row gap-4">
              <Button 
                variant="outline" 
                className="inline-flex items-center"
              >
                <span className="material-icons text-sm mr-1">home</span>
                New Home
              </Button>
              <Button 
                variant="outline" 
                className="inline-flex items-center"
              >
                <span className="material-icons text-sm mr-1">add_business</span>
                Extension
              </Button>
              <Button 
                variant="outline" 
                className="inline-flex items-center"
              >
                <span className="material-icons text-sm mr-1">call_split</span>
                Subdivision
              </Button>
              <Button 
                variant="outline" 
                className="inline-flex items-center"
              >
                <span className="material-icons text-sm mr-1">apartment</span>
                Commercial
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white p-4 border rounded-lg">
                <h4 className="font-medium text-gray-900 mb-4">Property Information</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Property Address
                    </label>
                    <input 
                      type="text" 
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter full property address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Council
                    </label>
                    <select className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                      <option>Auckland Council</option>
                      <option>Wellington City Council</option>
                      <option>Christchurch City Council</option>
                      <option>Hamilton City Council</option>
                    </select>
                  </div>
                  <Button className="w-full">
                    <span className="material-icons mr-2 text-sm">search</span>
                    Analyze Property
                  </Button>
                </div>
              </div>
            </div>
            <div className="lg:col-span-3">
              <div className="bg-white p-4 border rounded-lg">
                <h4 className="font-medium text-gray-900 mb-4">Development Assessment Results</h4>
                <div className="text-center py-12 text-gray-500">
                  <span className="material-icons text-4xl mb-2">search</span>
                  <p>Enter a property address to analyze development potential</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Development Guides */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white shadow rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Common Building Types</h4>
          <div className="space-y-3 my-4">
            <div className="flex items-center border-b pb-3">
              <div className="bg-blue-100 p-2 rounded-full mr-3">
                <span className="material-icons text-blue-600">home</span>
              </div>
              <div>
                <h5 className="font-medium">Single Family Home</h5>
                <p className="text-sm text-gray-500">Detached dwelling for one family</p>
              </div>
            </div>
            <div className="flex items-center border-b pb-3">
              <div className="bg-green-100 p-2 rounded-full mr-3">
                <span className="material-icons text-green-600">domain</span>
              </div>
              <div>
                <h5 className="font-medium">Minor Dwelling</h5>
                <p className="text-sm text-gray-500">Secondary smaller dwelling on same lot</p>
              </div>
            </div>
            <div className="flex items-center border-b pb-3">
              <div className="bg-purple-100 p-2 rounded-full mr-3">
                <span className="material-icons text-purple-600">apartment</span>
              </div>
              <div>
                <h5 className="font-medium">Multi-Unit Development</h5>
                <p className="text-sm text-gray-500">Multiple dwellings on a single property</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Building Consent Requirements</h4>
          <div className="space-y-3 my-4">
            <div className="flex items-center border-b pb-3">
              <div className="bg-yellow-100 p-2 rounded-full mr-3">
                <span className="material-icons text-yellow-600">description</span>
              </div>
              <div>
                <h5 className="font-medium">Resource Consent</h5>
                <p className="text-sm text-gray-500">Permission related to environmental effects</p>
              </div>
            </div>
            <div className="flex items-center border-b pb-3">
              <div className="bg-red-100 p-2 rounded-full mr-3">
                <span className="material-icons text-red-600">construction</span>
              </div>
              <div>
                <h5 className="font-medium">Building Consent</h5>
                <p className="text-sm text-gray-500">Permission to carry out building work</p>
              </div>
            </div>
            <div className="flex items-center border-b pb-3">
              <div className="bg-indigo-100 p-2 rounded-full mr-3">
                <span className="material-icons text-indigo-600">account_balance</span>
              </div>
              <div>
                <h5 className="font-medium">Code Compliance</h5>
                <p className="text-sm text-gray-500">Verification that work meets building code</p>
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

export default PropertyData;

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Property } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface DataTableProps {
  searchParams?: {
    propertyType?: string;
    source?: string;
    dateRange?: string;
  };
}

const DataTable: React.FC<DataTableProps> = ({ searchParams }) => {
  const { toast } = useToast();
  
  // Query to fetch properties
  const { data, isLoading, error, refetch } = useQuery<Property[]>({
    queryKey: ['/api/properties', searchParams],
    queryFn: async () => {
      let url = '/api/properties';
      
      if (searchParams) {
        url = '/api/properties/search?';
        if (searchParams.propertyType) url += `propertyType=${searchParams.propertyType}&`;
        if (searchParams.source) url += `source=${searchParams.source}&`;
      }
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch properties');
      return response.json();
    },
  });
  
  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Your data is being exported..."
    });
    
    // In a real app, this would trigger an API call to export the data
    setTimeout(() => {
      toast({
        title: "Export Complete",
        description: "Your data has been exported successfully"
      });
    }, 2000);
  };
  
  if (isLoading) {
    return <div className="text-center py-4">Loading property data...</div>;
  }
  
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg text-center">
        <p className="text-red-600">Error loading properties. Please try again.</p>
        <Button 
          variant="outline" 
          className="mt-2"
          onClick={() => refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="lg:col-span-3">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Data Collection Results</h3>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            className="inline-flex items-center"
            onClick={handleExport}
          >
            <span className="material-icons text-sm mr-1">file_download</span>
            Export
          </Button>
          <Button 
            variant="outline" 
            className="inline-flex items-center"
            onClick={() => refetch()}
          >
            <span className="material-icons text-sm mr-1">refresh</span>
            Refresh
          </Button>
        </div>
      </div>
      
      <div className="overflow-x-auto bg-white shadow rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data && data.length > 0 ? (
              data.map((property) => (
                <tr key={property.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{property.propertyId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{property.address}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{property.location || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{property.propertyType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{property.source}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(property.collectedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button variant="link" size="sm">View</Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                  No property data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4">
        <div className="flex-1 flex justify-between sm:hidden">
          <Button variant="outline" size="sm">Previous</Button>
          <Button variant="outline" size="sm" className="ml-3">Next</Button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">1</span> to <span className="font-medium">{data?.length || 0}</span> of{' '}
              <span className="font-medium">{data?.length || 0}</span> results
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <Button 
                variant="outline" 
                size="sm" 
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white"
              >
                <span className="material-icons text-sm">chevron_left</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white"
              >
                1
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white"
              >
                <span className="material-icons text-sm">chevron_right</span>
              </Button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataTable;

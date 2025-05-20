import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Property } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface UseDataOptions {
  limit?: number;
  offset?: number;
  filters?: {
    propertyType?: string;
    source?: string;
    dateRange?: string;
  };
}

interface ExportOptions {
  format: 'json' | 'csv' | 'geojson';
  properties: Property[];
}

export const useData = (options: UseDataOptions = {}) => {
  const [error, setError] = useState<Error | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Build the query string for filtering
  const buildQueryString = (): string => {
    const params = new URLSearchParams();
    
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());
    
    if (options.filters) {
      if (options.filters.propertyType && options.filters.propertyType !== 'All Types') {
        params.append('propertyType', options.filters.propertyType);
      }
      
      if (options.filters.source && options.filters.source !== 'All Sources') {
        params.append('source', options.filters.source);
      }
      
      // Handle date range filter
      if (options.filters.dateRange && options.filters.dateRange !== 'All Time') {
        const now = new Date();
        let startDate: Date;
        
        switch (options.filters.dateRange) {
          case 'Last 7 Days':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case 'Last 30 Days':
            startDate = new Date(now.setDate(now.getDate() - 30));
            break;
          case 'Last 90 Days':
            startDate = new Date(now.setDate(now.getDate() - 90));
            break;
          default:
            startDate = new Date(0); // Beginning of time
        }
        
        params.append('startDate', startDate.toISOString());
      }
    }
    
    return params.toString();
  };
  
  // Fetch properties data with filters
  const { data: properties, isLoading, refetch } = useQuery<Property[]>({
    queryKey: ['/api/properties', options],
    queryFn: async () => {
      const queryString = buildQueryString();
      const url = queryString ? `/api/properties/search?${queryString}` : '/api/properties';
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch properties');
      return response.json();
    },
  });
  
  // Export data mutation
  const { mutate: exportData, isPending: isExporting } = useMutation({
    mutationFn: async (exportOptions: ExportOptions) => {
      // In a real app, this would call a backend endpoint
      // For now, we'll simulate exporting by creating a downloadable file
      
      const { format, properties } = exportOptions;
      let content: string;
      let mimeType: string;
      let filename: string;
      
      switch (format) {
        case 'csv':
          // Convert properties to CSV
          const headers = ['propertyId', 'address', 'location', 'propertyType', 'source', 'collectedAt'];
          const rows = properties.map(p => 
            headers.map(header => p[header as keyof Property] || '').join(',')
          );
          content = [headers.join(','), ...rows].join('\n');
          mimeType = 'text/csv';
          filename = `property-data-${new Date().toISOString().slice(0, 10)}.csv`;
          break;
          
        case 'geojson':
          // Convert properties to GeoJSON
          const features = properties
            .filter(p => p.location)
            .map(p => {
              const [lat, lng] = (p.location || '').split(',').map(n => parseFloat(n.trim()));
              return {
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [lng, lat]
                },
                properties: {
                  id: p.propertyId,
                  address: p.address,
                  type: p.propertyType,
                  source: p.source
                }
              };
            });
            
          content = JSON.stringify({
            type: 'FeatureCollection',
            features
          }, null, 2);
          mimeType = 'application/geo+json';
          filename = `property-data-${new Date().toISOString().slice(0, 10)}.geojson`;
          break;
          
        case 'json':
        default:
          content = JSON.stringify(properties, null, 2);
          mimeType = 'application/json';
          filename = `property-data-${new Date().toISOString().slice(0, 10)}.json`;
      }
      
      // Create a downloadable link
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return { success: true, format, count: properties.length };
    },
    onSuccess: (data) => {
      toast({
        title: 'Export Complete',
        description: `${data.count} properties exported as ${data.format.toUpperCase()}`,
      });
    },
    onError: (error: Error) => {
      setError(error);
      toast({
        title: 'Export Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  return {
    properties,
    isLoading,
    error,
    refetch,
    exportData,
    isExporting
  };
};

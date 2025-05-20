import React, { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Property } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapViewProps {
  visualizationType: string;
  dataLayer: string;
  region: string;
}

const MapView: React.FC<MapViewProps> = ({ visualizationType, dataLayer, region }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  
  const { data: properties, isLoading, error } = useQuery<Property[]>({
    queryKey: ['/api/properties', visualizationType, dataLayer, region],
    queryFn: async () => {
      const response = await fetch('/api/properties');
      if (!response.ok) throw new Error('Failed to fetch properties');
      return response.json();
    },
  });
  
  // Initialize map when component mounts
  useEffect(() => {
    if (mapRef.current && !leafletMap.current) {
      // Create map
      leafletMap.current = L.map(mapRef.current).setView([37.7749, -122.4194], 12);
      
      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(leafletMap.current);
      
      // Make sure map is shown correctly by forcing resize
      setTimeout(() => {
        if (leafletMap.current) {
          leafletMap.current.invalidateSize();
        }
      }, 100);
    }
    
    // Cleanup on component unmount
    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);
  
  // Update map markers when properties data changes
  useEffect(() => {
    if (!leafletMap.current || !properties || properties.length === 0) return;
    
    // Clear existing markers
    leafletMap.current.eachLayer(layer => {
      if (layer instanceof L.Marker || layer instanceof L.Circle) {
        leafletMap.current?.removeLayer(layer);
      }
    });
    
    // Add markers for each property with location
    const markers: L.Marker[] = [];
    
    properties.forEach(property => {
      if (property.location) {
        try {
          const [lat, lng] = property.location.split(',').map(coord => parseFloat(coord.trim()));
          
          if (!isNaN(lat) && !isNaN(lng)) {
            // Determine marker color based on property type
            let fillColor = '#3B82F6'; // Default blue
            
            if (property.propertyType?.toLowerCase().includes('commercial')) {
              fillColor = '#10B981'; // Green
            } else if (property.propertyType?.toLowerCase().includes('mixed')) {
              fillColor = '#F59E0B'; // Yellow
            } else if (property.propertyType?.toLowerCase().includes('industrial')) {
              fillColor = '#8B5CF6'; // Purple
            }
            
            const marker = L.circleMarker([lat, lng], {
              radius: 8,
              fillColor,
              color: '#fff',
              weight: 1,
              opacity: 1,
              fillOpacity: 0.8
            }).addTo(leafletMap.current!);
            
            marker.bindPopup(`
              <strong>${property.propertyId}</strong><br>
              ${property.address || 'No address'}<br>
              Type: ${property.propertyType || 'Unknown'}<br>
              Source: ${property.source || 'Unknown'}
            `);
            
            markers.push(marker);
          }
        } catch (e) {
          console.warn('Invalid location format:', property.location);
        }
      }
    });
    
    // Fit bounds if we have markers
    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      leafletMap.current.fitBounds(group.getBounds(), { padding: [50, 50] });
    }
  }, [properties, visualizationType, dataLayer]);
  
  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Loading Map...</h3>
        </div>
        <div className="p-0 h-96 bg-gray-100 relative">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-red-600">Error Loading Map</h3>
        </div>
        <div className="p-6 bg-red-50 flex flex-col items-center justify-center h-96">
          <p className="text-red-600 mb-4">Failed to load property data for visualization.</p>
          <Button variant="outline">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Property Map Visualization</h3>
        <div className="flex space-x-2">
          <Button variant="outline" className="inline-flex items-center">
            <span className="material-icons text-sm mr-1">share</span>
            Share
          </Button>
          <Button variant="outline" className="inline-flex items-center">
            <span className="material-icons text-sm mr-1">file_download</span>
            Export
          </Button>
        </div>
      </div>
      
      <div className="p-0 h-96 bg-gray-100 relative">
        <div ref={mapRef} className="h-full w-full" />
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center">
            <div className="h-4 w-4 rounded-full bg-blue-500 mr-2"></div>
            <span className="text-sm text-gray-600">Residential</span>
          </div>
          <div className="flex items-center">
            <div className="h-4 w-4 rounded-full bg-green-500 mr-2"></div>
            <span className="text-sm text-gray-600">Commercial</span>
          </div>
          <div className="flex items-center">
            <div className="h-4 w-4 rounded-full bg-yellow-500 mr-2"></div>
            <span className="text-sm text-gray-600">Mixed Use</span>
          </div>
          <div className="flex items-center">
            <div className="h-4 w-4 rounded-full bg-purple-500 mr-2"></div>
            <span className="text-sm text-gray-600">Industrial</span>
          </div>
          <div className="flex items-center ml-auto">
            <span className="text-sm text-gray-600">
              Total Properties: <span className="font-medium">{properties?.length || 0}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;

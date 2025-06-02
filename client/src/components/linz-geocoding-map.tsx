import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, ExternalLink } from "lucide-react";

interface LinzGeocodingMapProps {
  address?: string;
  coordinates?: { latitude: number; longitude: number };
  zoning?: any;
  onLocationConfirm?: (confirmed: boolean) => void;
  // Modal interface
  isOpen?: boolean;
  onClose?: () => void;
  onLocationSelect?: (address: string, coordinates?: [number, number]) => void;
  initialAddress?: string;
  hideZoning?: boolean;
}

export function LinzGeocodingMap({ 
  address, 
  coordinates, 
  zoning, 
  onLocationConfirm 
}: LinzGeocodingMapProps) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [linzApiKey, setLinzApiKey] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if LINZ API key is available
    const checkLinzAccess = async () => {
      try {
        const response = await fetch('/api/check-linz-access');
        if (response.ok) {
          const data = await response.json();
          setLinzApiKey(data.hasAccess ? 'available' : null);
        }
      } catch (error) {
        console.log('LINZ access check failed');
      }
    };
    
    checkLinzAccess();
  }, []);

  const handleViewOnLinz = () => {
    if (coordinates) {
      // Open LINZ Data Service map viewer focused on the property coordinates
      const linzUrl = `https://data.linz.govt.nz/data/category/property-ownership-boundaries/?z=16&lat=${coordinates.latitude}&lng=${coordinates.longitude}`;
      window.open(linzUrl, '_blank');
    }
  };

  const handleViewOnGoogleMaps = () => {
    if (coordinates) {
      const googleUrl = `https://www.google.com/maps?q=${coordinates.latitude},${coordinates.longitude}&z=18`;
      window.open(googleUrl, '_blank');
    }
  };

  const handleViewOnAucklandGeoMaps = () => {
    if (coordinates) {
      // Auckland Council GeoMaps viewer
      const aucklandUrl = `https://geomapspublic.aucklandcouncil.govt.nz/viewer/index.html?viewer=public&extent=${coordinates.longitude-0.001},${coordinates.latitude-0.001},${coordinates.longitude+0.001},${coordinates.latitude+0.001}`;
      window.open(aucklandUrl, '_blank');
    }
  };

  return (
    <div className="space-y-4" style={{ userSelect: 'text' }}>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4" style={{ userSelect: 'text' }}>
        <div className="flex items-start space-x-3">
          <MapPin className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
          <div className="flex-1" style={{ userSelect: 'text' }}>
            <h3 className="font-semibold text-blue-900 mb-2" style={{ userSelect: 'text' }}>Property Location Confirmation</h3>
            <div className="space-y-2 text-sm" style={{ userSelect: 'text' }}>
              <p style={{ userSelect: 'text' }}><strong>Address:</strong> <span style={{ userSelect: 'text' }}>{address}</span></p>
              {coordinates && (
                <p style={{ userSelect: 'text' }}><strong>Coordinates:</strong> <span className="font-mono" style={{ userSelect: 'text' }}>{coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}</span></p>
              )}
              {zoning && zoning.zoneName && (
                <div className="bg-green-50 border border-green-200 p-2 rounded text-xs" style={{ userSelect: 'text' }}>
                  <p style={{ userSelect: 'text' }}><strong>Auckland Unitary Plan Zone:</strong></p>
                  <p className="font-medium text-green-800" style={{ userSelect: 'text' }}>{zoning.zoneName}</p>
                  <p className="text-green-700 mt-1 text-xs" style={{ userSelect: 'text' }}>Source: Auckland Council Official API</p>
                </div>
              )}
              {!zoning?.zoneName && (
                <p className="text-amber-700 bg-amber-50 p-2 rounded text-xs" style={{ userSelect: 'text' }}>
                  <strong>Note:</strong> Zoning information will be retrieved from Auckland Council's official database.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Map Placeholder with Official NZ Data Sources */}
      <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <div className="space-y-4">
          <div className="text-gray-600">
            <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-500" />
            <p className="font-medium">Verify Location on Official Maps</p>
            <p className="text-sm">Use New Zealand's authoritative mapping services to confirm this is the correct property</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={handleViewOnGoogleMaps}
              className="flex items-center justify-center space-x-2 px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors cursor-pointer"
              disabled={!coordinates}
              style={{ pointerEvents: 'auto' }}
            >
              <ExternalLink className="h-4 w-4" />
              <span>Google Maps</span>
            </button>
            
            <button
              onClick={handleViewOnAucklandGeoMaps}
              className="flex items-center justify-center space-x-2 px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors cursor-pointer"
              disabled={!coordinates}
              style={{ pointerEvents: 'auto' }}
            >
              <ExternalLink className="h-4 w-4" />
              <span>Auckland GeoMaps</span>
            </button>
            
            <button
              onClick={handleViewOnLinz}
              className="flex items-center justify-center space-x-2 px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors cursor-pointer"
              disabled={!coordinates}
              style={{ pointerEvents: 'auto' }}
            >
              <ExternalLink className="h-4 w-4" />
              <span>LINZ Data Service</span>
            </button>
          </div>
          
          {coordinates && (
            <div className="mt-4 p-3 bg-white rounded border text-xs text-gray-600 select-text" style={{ userSelect: 'text' }}>
              <p className="select-text" style={{ userSelect: 'text' }}>Click any map service above to verify the property location at coordinates:</p>
              <p className="font-mono mt-1 select-text" style={{ userSelect: 'text' }}>{coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Location Confirmation Actions */}
      <div className="flex space-x-3 mt-4" style={{ position: 'relative', zIndex: 10000 }}>
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Confirm button clicked');
            onLocationConfirm(true);
          }}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium transition-colors cursor-pointer"
          disabled={!coordinates}
          type="button"
          style={{ pointerEvents: 'auto', zIndex: 10001 }}
        >
          Confirm This Location
        </button>
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Try different address button clicked');
            onLocationConfirm(false);
          }}
          className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-md font-medium transition-colors cursor-pointer"
          type="button"
          style={{ pointerEvents: 'auto', zIndex: 10001 }}
        >
          Try Different Address
        </button>
      </div>
      
      {!coordinates && (
        <p className="text-sm text-red-600 text-center">
          Unable to geocode this address. Please check the address format and try again.
        </p>
      )}
    </div>
  );
}
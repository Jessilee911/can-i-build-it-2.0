import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, ExternalLink } from "lucide-react";

interface LinzGeocodingMapProps {
  address: string;
  coordinates?: { latitude: number; longitude: number };
  zoning?: any;
  onLocationConfirm: (confirmed: boolean) => void;
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
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <MapPin className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-2">Property Location Confirmation</h3>
            <div className="space-y-2 text-sm">
              <p><strong>Address:</strong> {address}</p>
              {coordinates && (
                <p><strong>Coordinates:</strong> {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}</p>
              )}
              {zoning && zoning.zoneName && (
                <div className="bg-green-50 border border-green-200 p-2 rounded text-xs">
                  <p><strong>Auckland Unitary Plan Zone:</strong></p>
                  <p className="font-medium text-green-800">{zoning.zoneName}</p>
                  <p className="text-green-700 mt-1 text-xs">Source: Auckland Council Official API</p>
                </div>
              )}
              {!zoning?.zoneName && (
                <p className="text-amber-700 bg-amber-50 p-2 rounded text-xs">
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
            <Button
              onClick={handleViewOnGoogleMaps}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
              disabled={!coordinates}
            >
              <ExternalLink className="h-4 w-4" />
              <span>Google Maps</span>
            </Button>
            
            <Button
              onClick={handleViewOnAucklandGeoMaps}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
              disabled={!coordinates}
            >
              <ExternalLink className="h-4 w-4" />
              <span>Auckland GeoMaps</span>
            </Button>
            
            <Button
              onClick={handleViewOnLinz}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
              disabled={!coordinates}
            >
              <ExternalLink className="h-4 w-4" />
              <span>LINZ Data Service</span>
            </Button>
          </div>
          
          {coordinates && (
            <div className="mt-4 p-3 bg-white rounded border text-xs text-gray-600">
              <p>Click any map service above to verify the property location at coordinates:</p>
              <p className="font-mono mt-1">{coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Location Confirmation Actions */}
      <div className="flex space-x-3">
        <Button 
          onClick={() => onLocationConfirm(true)}
          className="flex-1"
          disabled={!coordinates}
        >
          Confirm This Location
        </Button>
        <Button 
          onClick={() => onLocationConfirm(false)}
          variant="outline"
          className="flex-1"
        >
          Try Different Address
        </Button>
      </div>
      
      {!coordinates && (
        <p className="text-sm text-red-600 text-center">
          Unable to geocode this address. Please check the address format and try again.
        </p>
      )}
    </div>
  );
}
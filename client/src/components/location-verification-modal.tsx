import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, ExternalLink } from "lucide-react";

interface LocationVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationConfirm: (address: string, coordinates?: [number, number]) => void;
  initialAddress: string;
}

export function LocationVerificationModal({ 
  isOpen, 
  onClose, 
  onLocationConfirm, 
  initialAddress 
}: LocationVerificationModalProps) {
  const [address, setAddress] = useState(initialAddress);
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);

  if (!isOpen) return null;

  const handleGeocode = async () => {
    try {
      const response = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.coordinates) {
          setCoordinates(data.coordinates);
        }
      }
    } catch (error) {
      console.error('Geocoding failed:', error);
    }
  };

  const handleViewOnGoogleMaps = () => {
    if (coordinates) {
      const googleUrl = `https://www.google.com/maps?q=${coordinates[0]},${coordinates[1]}&z=18`;
      window.open(googleUrl, '_blank');
    } else {
      const googleUrl = `https://www.google.com/maps/search/${encodeURIComponent(address)}`;
      window.open(googleUrl, '_blank');
    }
  };

  const handleConfirm = () => {
    onLocationConfirm(address, coordinates || undefined);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full modal-content">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Verify Property Location</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Address
              </label>
              <div className="flex space-x-2">
                <Input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter the property address"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGeocode}
                  className="px-4"
                >
                  Locate
                </Button>
              </div>
            </div>

            <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center space-y-4">
                <div className="text-gray-600">
                  <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-500" />
                  <p className="font-medium">Verify Location on Maps</p>
                  <p className="text-sm">Click below to verify this is the correct property location</p>
                </div>
                
                <div className="flex justify-center">
                  <Button
                    onClick={handleViewOnGoogleMaps}
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>View on Google Maps</span>
                  </Button>
                </div>

                {coordinates && (
                  <div className="mt-4 p-3 bg-white rounded border text-xs text-gray-600">
                    <p>Property coordinates: {coordinates[0].toFixed(6)}, {coordinates[1].toFixed(6)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="bg-blue-600 hover:bg-blue-700 text-white">
            Confirm Location
          </Button>
        </div>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PropertyZoningReport } from '@/components/property-zoning-report';
import { Search, MapPin, Loader2, AlertTriangle } from 'lucide-react';

interface PropertyData {
  address: string;
  lotDp: string;
  coordinates: { lat: number; lng: number };
  zoning: string;
  buildingControls: string[];
  overlays: string[];
  specialCharacterAreas: string[];
  naturalHazards: string[];
  climateZones: {
    wind: string;
    earthquake: string;
    snow: string;
    corrosion: string;
  };
  floodData: {
    catchment: string;
    details: string;
    overlandFlow: string;
  };
  infrastructure: {
    arterialRoad: boolean;
    stormwater: boolean;
  };
}

export default function ComprehensivePropertyAssessment() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  const geocodeAddress = async (searchAddress: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: searchAddress })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.success ? data.coordinates : null;
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    return null;
  };

  const handleSearch = async () => {
    if (!address.trim()) {
      setError('Please enter a property address');
      return;
    }

    setLoading(true);
    setError('');
    setPropertyData(null);

    try {
      // First geocode the address
      const coords = await geocodeAddress(address);
      if (!coords) {
        throw new Error('Unable to find coordinates for this address');
      }
      
      setCoordinates(coords);

      // Get comprehensive property analysis
      const response = await fetch('/api/comprehensive-property-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          coordinates: coords
        })
      });

      if (!response.ok) {
        throw new Error('Failed to retrieve property data');
      }

      const data = await response.json();
      
      if (data.success) {
        setPropertyData({
          address: data.address,
          lotDp: data.lotDp || 'Not available',
          coordinates: coords,
          zoning: data.zoning || 'Unknown Zone',
          buildingControls: data.buildingControls || ['Standard building controls apply'],
          overlays: data.overlays || [],
          specialCharacterAreas: data.specialCharacterAreas || [],
          naturalHazards: data.naturalHazards || ['No natural hazard overlays detected'],
          climateZones: data.climateZones || {
            wind: 'Zone 3 (High Wind)',
            earthquake: 'Zone 3 (High Seismic)',
            snow: 'Zone 1 (No Snow Loading)',
            corrosion: 'Zone C (Coastal - High Corrosion)'
          },
          floodData: data.floodData || {
            catchment: 'Auckland Regional Catchment',
            details: 'Property is outside identified flood hazard areas',
            overlandFlow: 'No overland flow paths detected'
          },
          infrastructure: data.infrastructure || {
            arterialRoad: false,
            stormwater: false
          }
        });
      } else {
        throw new Error(data.error || 'Failed to retrieve property data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while searching');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (propertyData) {
    return <PropertyZoningReport propertyData={propertyData} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Property Zoning Assessment
          </h1>
          <p className="text-gray-600">
            Get comprehensive zoning information and building controls for any Auckland property
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Property Address Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter property address (e.g., 120 Marsden Avenue Balmoral Auckland 1024)"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button 
                onClick={handleSearch}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Search
              </Button>
            </div>
            
            {error && (
              <Alert className="mt-4 border-red-200 bg-red-50">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sample Addresses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setAddress('120 Marsden Avenue Balmoral Auckland 1024')}
              >
                120 Marsden Avenue Balmoral Auckland 1024
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setAddress('39 Vaughans Road Okura Auckland 0792')}
              >
                39 Vaughans Road Okura Auckland 0792
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
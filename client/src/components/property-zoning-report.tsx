import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, CheckCircle2 } from 'lucide-react';

interface PropertyZoningReportProps {
  propertyData: {
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
  };
}

export function PropertyZoningReport({ propertyData }: PropertyZoningReportProps) {
  const formatCoordinates = (lat: number, lng: number) => {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  };

  const formatDate = () => {
    return new Date().toLocaleDateString('en-NZ', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) + ' am';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-800">Property Zoning Report</h1>
        </div>
        <Button className="bg-green-600 hover:bg-green-700 text-white">
          <Download className="w-4 h-4 mr-2" />
          Download Report
        </Button>
      </div>

      {/* Property Details */}
      <Card className="mb-4 bg-white border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-700">Property Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div><strong>Address:</strong> {propertyData.address}</div>
          <div><strong>Lot and DP:</strong> {propertyData.lotDp}</div>
          <div><strong>Coordinates:</strong> {formatCoordinates(propertyData.coordinates.lat, propertyData.coordinates.lng)}</div>
          <div><strong>Report Generated:</strong> {formatDate()}</div>
        </CardContent>
      </Card>

      {/* District/Planning Zone */}
      <Card className="mb-4 bg-green-50 border-green-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-700">District/Planning Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-800">{propertyData.zoning}</div>
        </CardContent>
      </Card>

      {/* Building Controls */}
      <Card className="mb-4 bg-white border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-700">Building Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1">
            {propertyData.buildingControls.map((control, index) => (
              <li key={index} className="text-gray-700">• {control}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Overlays */}
      <Card className="mb-4 bg-white border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-700">Overlays</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1">
            {propertyData.overlays.length > 0 ? (
              propertyData.overlays.map((overlay, index) => (
                <li key={index} className="text-gray-700">• {overlay}</li>
              ))
            ) : (
              <li className="text-gray-700">• No overlays detected</li>
            )}
          </ul>
        </CardContent>
      </Card>

      {/* Special Character Zones */}
      <Card className="mb-4 bg-orange-50 border-orange-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-700">Special Character Zones</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1">
            {propertyData.specialCharacterAreas.length > 0 ? (
              propertyData.specialCharacterAreas.map((area, index) => (
                <li key={index} className="text-gray-700">• {area}</li>
              ))
            ) : (
              <li className="text-gray-700">• No special character areas detected</li>
            )}
          </ul>
        </CardContent>
      </Card>

      {/* Natural Hazards */}
      <Card className="mb-4 bg-white border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-700">Natural Hazards</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1">
            {propertyData.naturalHazards.map((hazard, index) => (
              <li key={index} className="text-gray-700">• {hazard}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Wind Zone */}
      <Card className="mb-4 bg-white border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-700">Wind Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-800">{propertyData.climateZones.wind}</div>
        </CardContent>
      </Card>

      {/* Earthquake Zone */}
      <Card className="mb-4 bg-white border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-700">Earthquake Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-800">{propertyData.climateZones.earthquake}</div>
        </CardContent>
      </Card>

      {/* Snow Zone */}
      <Card className="mb-4 bg-white border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-700">Snow Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-800">{propertyData.climateZones.snow}</div>
        </CardContent>
      </Card>

      {/* Corrosion Zone */}
      <Card className="mb-4 bg-white border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-700">Corrosion Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-800">{propertyData.climateZones.corrosion}</div>
        </CardContent>
      </Card>

      {/* Flood Hazards & Hydrology */}
      <Card className="mb-4 bg-white border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-700">Flood Hazards & Hydrology</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div><strong>Catchment:</strong> {propertyData.floodData.catchment}</div>
          <div><strong>Details:</strong> {propertyData.floodData.details}</div>
          <div><strong>Overland Flow Paths:</strong> {propertyData.floodData.overlandFlow}</div>
        </CardContent>
      </Card>

      {/* Main Arterial Road */}
      <Card className="mb-4 bg-green-50 border-green-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Main Arterial Road
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-800">{propertyData.infrastructure.arterialRoad ? 'Yes' : 'No'}</div>
        </CardContent>
      </Card>

      {/* Stormwater Pipe */}
      <Card className="mb-6 bg-green-50 border-green-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Stormwater Pipe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-800">{propertyData.infrastructure.stormwater ? 'Detected' : 'Not detected'}</div>
        </CardContent>
      </Card>
    </div>
  );
}
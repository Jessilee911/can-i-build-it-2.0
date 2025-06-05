import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, FileText, Download, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

interface PropertyReportData {
  address: string;
  lotDp: string;
  zone: string;
  coordinates: { lat: number; lng: number };
  overlays: string[];
  controls: string[];
  floodHazards: {
    catchment: string;
    floodProne: boolean;
    details: string;
  };
  overlandFlow: string;
  naturalHazards: string[];
  specialCharacter: string[];
  windZone: string;
  earthquakeZone: string;
  snowZone: string;
  corrosionZone: string;
  arterialRoad: boolean;
  stormwater: boolean;
  wastewater: boolean;
  timestamp: string;
}

const EnhancedPropertyAssessment = () => {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<PropertyReportData | null>(null);
  const [error, setError] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load Google Maps Places API
    const script = document.createElement('script');
    script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyB7LgZX94IaNouwXd_r9chzZKtYpny5YU0&loading=async&libraries=places&callback=initMap';
    script.async = true;
    
    window.initMap = () => {
      if (inputRef.current && window.google) {
        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: 'nz' },
          types: ['address']
        });

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current.getPlace();
          if (place.geometry && place.geometry.location) {
            setAddress(place.formatted_address || place.name);
            setCoordinates({
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            });
          }
        });
      }
    };

    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const handleAddressSearch = async () => {
    if (!address.trim() || !coordinates) {
      setError('Please select a valid address from the dropdown');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Step 1: Get LINZ parcel data using coordinates
      const linzResponse = await fetch('/api/linz-parcel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          lat: coordinates.lat, 
          lng: coordinates.lng,
          address: address
        })
      });

      if (!linzResponse.ok) {
        throw new Error('Failed to retrieve property parcel data');
      }

      const linzData = await linzResponse.json();

      // Step 2: Query all Auckland Unitary Plan layers
      const assessmentResponse = await fetch('/api/comprehensive-property-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: address,
          coordinates: coordinates,
          parcelGeometry: linzData.geometry,
          projectDescription: 'Comprehensive property assessment'
        })
      });

      if (!assessmentResponse.ok) {
        throw new Error('Failed to generate comprehensive property report');
      }

      const assessmentData = await assessmentResponse.json();
      
      // Format comprehensive report
      const comprehensiveReport: PropertyReportData = {
        address: address,
        lotDp: linzData.lotDp || 'Not available',
        zone: assessmentData.zoning || 'Unknown Zone',
        coordinates: coordinates,
        overlays: assessmentData.overlays || [],
        controls: assessmentData.buildingControls || [],
        floodHazards: {
          catchment: assessmentData.floodData?.catchment || 'Unknown Catchment',
          floodProne: assessmentData.floodData?.floodProne || false,
          details: assessmentData.floodData?.details || 'No flood data available'
        },
        overlandFlow: assessmentData.overlandFlow || 'No overland flow paths detected',
        naturalHazards: assessmentData.naturalHazards || [],
        specialCharacter: assessmentData.specialCharacterAreas || [],
        windZone: assessmentData.climateZones?.wind || 'Zone 3 (High Wind)',
        earthquakeZone: assessmentData.climateZones?.earthquake || 'Zone 3 (High Seismic)',
        snowZone: assessmentData.climateZones?.snow || 'Zone 1 (No Snow Loading)',
        corrosionZone: assessmentData.climateZones?.corrosion || 'Zone C (Coastal - High Corrosion)',
        arterialRoad: assessmentData.infrastructure?.arterialRoad || false,
        stormwater: assessmentData.infrastructure?.stormwater || false,
        wastewater: assessmentData.infrastructure?.wastewater || false,
        timestamp: new Date().toLocaleString('en-NZ')
      };

      setReport(comprehensiveReport);
    } catch (err) {
      setError('Failed to generate comprehensive property report. Please try again.');
      console.error('Property assessment error:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!report || !reportRef.current) return;
    
    const reportContent = reportRef.current.innerText;
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Comprehensive_Property_Report_${report.address.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <MapPin className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">NZ Property Comprehensive Assessment</h1>
          </div>
          
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <input
                ref={inputRef}
                type="text"
                placeholder="Start typing your property address..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Select your address from the dropdown for accurate coordinates
              </p>
            </div>
            <button
              onClick={handleAddressSearch}
              disabled={loading || !coordinates}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              {loading ? 'Analyzing...' : 'Generate Report'}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-700">{error}</span>
            </div>
          )}
        </div>

        {report && (
          <div className="bg-white rounded-lg shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-green-600" />
                <h2 className="text-2xl font-bold text-gray-800">Comprehensive Property Report</h2>
              </div>
              <button
                onClick={downloadReport}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Download className="w-4 h-4" />
                Download Report
              </button>
            </div>

            <div ref={reportRef} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2">Property Details</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>Address:</strong> {report.address}</div>
                      <div><strong>Lot and DP:</strong> {report.lotDp}</div>
                      <div><strong>Coordinates:</strong> {report.coordinates.lat}, {report.coordinates.lng}</div>
                      <div><strong>Report Generated:</strong> {report.timestamp}</div>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2">District/Planning Zone</h3>
                    <div className="text-sm">{report.zone}</div>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2">Building Controls</h3>
                    <ul className="text-sm space-y-1">
                      {report.controls.length > 0 ? report.controls.map((control, idx) => (
                        <li key={idx}>• {control}</li>
                      )) : <li>• No specific building controls detected</li>}
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2">Planning Overlays</h3>
                    <ul className="text-sm space-y-1">
                      {report.overlays.length > 0 ? report.overlays.map((overlay, idx) => (
                        <li key={idx}>• {overlay}</li>
                      )) : <li>• No planning overlays detected</li>}
                    </ul>
                  </div>

                  <div className="p-4 bg-orange-50 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2">Special Character Areas</h3>
                    <ul className="text-sm space-y-1">
                      {report.specialCharacter.length > 0 ? report.specialCharacter.map((zone, idx) => (
                        <li key={idx}>• {zone}</li>
                      )) : <li>• No special character area overlays</li>}
                    </ul>
                  </div>

                  <div className="p-4 bg-red-50 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2">Natural Hazards</h3>
                    <ul className="text-sm space-y-1">
                      {report.naturalHazards.length > 0 ? report.naturalHazards.map((hazard, idx) => (
                        <li key={idx}>• {hazard}</li>
                      )) : <li>• No natural hazard overlays detected</li>}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-1">Wind Zone</h4>
                  <div className="text-sm">{report.windZone}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-1">Earthquake Zone</h4>
                  <div className="text-sm">{report.earthquakeZone}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-1">Snow Zone</h4>
                  <div className="text-sm">{report.snowZone}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-1">Corrosion Zone</h4>
                  <div className="text-sm">{report.corrosionZone}</div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-3">Flood Hazards & Hydrology</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Catchment:</strong> {report.floodHazards.catchment}
                  </div>
                  <div>
                    <strong>Details:</strong> {report.floodHazards.details}
                  </div>
                </div>
                <div className="mt-2 text-sm">
                  <strong>Overland Flow Paths:</strong> {report.overlandFlow}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {report.arterialRoad ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
                    <span className="font-semibold">Main Arterial Road</span>
                  </div>
                  <div className="text-sm mt-1">{report.arterialRoad ? 'Yes' : 'No'}</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {report.stormwater ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
                    <span className="font-semibold">Stormwater Infrastructure</span>
                  </div>
                  <div className="text-sm mt-1">{report.stormwater ? 'Detected' : 'Not Detected'}</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {report.wastewater ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
                    <span className="font-semibold">Wastewater Infrastructure</span>
                  </div>
                  <div className="text-sm mt-1">{report.wastewater ? 'Detected' : 'Not Detected'}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedPropertyAssessment;
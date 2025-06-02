import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, MapPin, Layers, Info, X } from 'lucide-react';
import { useLocation } from 'wouter';

interface ZoningData {
  zoneName: string;
  zoneCode: string;
  overlays: Array<{
    name: string;
    type: string;
    restrictions: string[];
  }>;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  accuracy: number;
}

export default function ARZoningViewer() {
  const [isARActive, setIsARActive] = useState(false);
  const [zoningData, setZoningData] = useState<ZoningData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<GeolocationPosition | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [, navigate] = useLocation();

  // Get user's current location
  const getCurrentLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  };

  // Start AR camera
  const startARCamera = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user location first
      const position = await getCurrentLocation();
      setUserLocation(position);

      // Start camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsARActive(true);
      }

      // Get zoning data for current location
      await fetchZoningData(position.coords.latitude, position.coords.longitude);

    } catch (err) {
      console.error('AR Camera error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start AR camera');
    } finally {
      setLoading(false);
    }
  };

  // Stop AR camera
  const stopARCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsARActive(false);
    setZoningData(null);
  };

  // Fetch zoning data from Auckland Council API
  const fetchZoningData = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch('/api/ar-zoning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ latitude, longitude }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch zoning data');
      }

      const data = await response.json();
      setZoningData(data);
    } catch (err) {
      console.error('Zoning data fetch error:', err);
      setError('Failed to load zoning information');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopARCamera();
    };
  }, []);

  // Draw AR overlays on canvas
  useEffect(() => {
    if (!isARActive || !videoRef.current || !canvasRef.current || !zoningData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawOverlays = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Set canvas size to match video
      if (videoRef.current) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
      }

      // Draw zoning overlay
      ctx.fillStyle = 'rgba(59, 130, 246, 0.3)'; // Blue overlay
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw zone information
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(20, 20, 300, 120);

      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px Arial';
      ctx.fillText(zoningData.zoneName, 30, 45);

      ctx.font = '14px Arial';
      ctx.fillText(`Zone Code: ${zoningData.zoneCode}`, 30, 65);
      ctx.fillText(`Accuracy: ${zoningData.accuracy.toFixed(0)}m`, 30, 85);

      if (zoningData.overlays.length > 0) {
        ctx.fillText(`Overlays: ${zoningData.overlays.length}`, 30, 105);
      }

      // Draw overlay indicators
      if (zoningData.overlays.length > 0) {
        zoningData.overlays.forEach((overlay, index) => {
          const y = 160 + (index * 40);
          ctx.fillStyle = 'rgba(239, 68, 68, 0.8)'; // Red for overlays
          ctx.fillRect(20, y, 280, 30);
          
          ctx.fillStyle = 'white';
          ctx.font = 'bold 12px Arial';
          ctx.fillText(overlay.name, 25, y + 20);
        });
      }

      requestAnimationFrame(drawOverlays);
    };

    drawOverlays();
  }, [isARActive, zoningData]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            className="mb-4"
          >
            ← Back to Home
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            AR Zoning Overlay Viewer
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Visualize Auckland Council zoning and overlay data in real-time through your camera
          </p>
        </div>

        {!isARActive ? (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Start AR Viewer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Point your camera at any location in Auckland to see zoning information and planning overlays in augmented reality.
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-blue-500" />
                  Location access required
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Camera className="h-4 w-4 text-green-500" />
                  Camera access required
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Layers className="h-4 w-4 text-purple-500" />
                  Real-time zoning data
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                </div>
              )}

              <Button
                onClick={startARCamera}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Starting AR...' : 'Start AR Viewer'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="relative max-w-4xl mx-auto">
            {/* AR Video Feed */}
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-auto"
              />
              
              {/* AR Overlay Canvas */}
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
              />

              {/* Control Buttons */}
              <div className="absolute top-4 right-4 space-y-2">
                <Button
                  onClick={stopARCamera}
                  size="sm"
                  variant="destructive"
                  className="shadow-lg"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Location Indicator */}
              {userLocation && (
                <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded-md text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {userLocation.coords.latitude.toFixed(6)}, {userLocation.coords.longitude.toFixed(6)}
                  </div>
                  <div className="text-xs opacity-75">
                    Accuracy: ±{userLocation.coords.accuracy?.toFixed(0)}m
                  </div>
                </div>
              )}
            </div>

            {/* Zoning Information Panel */}
            {zoningData && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Current Location Zoning
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{zoningData.zoneName}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Zone Code: {zoningData.zoneCode}
                    </p>
                  </div>

                  {zoningData.overlays.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Planning Overlays</h4>
                      <div className="space-y-2">
                        {zoningData.overlays.map((overlay, index) => (
                          <div key={index} className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="destructive" className="text-xs">
                                {overlay.type}
                              </Badge>
                              <span className="font-medium text-sm">{overlay.name}</span>
                            </div>
                            {overlay.restrictions.length > 0 && (
                              <ul className="text-xs text-gray-600 dark:text-gray-300 list-disc list-inside">
                                {overlay.restrictions.map((restriction, i) => (
                                  <li key={i}>{restriction}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                    <Info className="h-4 w-4" />
                    Data sourced from Auckland Council Unitary Plan
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
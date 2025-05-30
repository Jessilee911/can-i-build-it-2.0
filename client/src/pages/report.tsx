import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, ArrowLeft, Clock, CheckCircle, AlertCircle, MapPin, ExternalLink } from "lucide-react";
import { Link } from "wouter";

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();

  const { data: reportData, isLoading, error } = useQuery({
    queryKey: [`/api/premium-report/${id}`],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Clock className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
              <h2 className="text-xl font-semibold mb-2">Loading Report</h2>
              <p className="text-gray-600 dark:text-gray-400">Please wait while we retrieve your property analysis...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !reportData?.success) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/">
            <Button variant="outline" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                Report Not Available
              </CardTitle>
              <CardDescription>
                {reportData?.message || "The requested report could not be found or is not yet ready."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                If you recently submitted a premium assessment request, please allow up to 24 hours for report generation.
              </p>
              <Link href="/">
                <Button>Return to Home</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { report, propertyAddress, status } = reportData;

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'processing':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'completed':
        return 'Report Completed';
      case 'processing':
        return 'Report In Progress';
      default:
        return 'Report Pending';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/">
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Property Analysis Report
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              {getStatusIcon()}
              {getStatusText()} • {propertyAddress}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Property Location Confirmation */}
        {reportData?.propertyData && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                Property Location Confirmation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="space-y-2 text-sm">
                  <p><strong>Address:</strong> {reportData.propertyData.address}</p>
                  {reportData.propertyData.coordinates && (
                    <p><strong>Coordinates:</strong> {reportData.propertyData.coordinates.latitude.toFixed(6)}, {reportData.propertyData.coordinates.longitude.toFixed(6)}</p>
                  )}
                  {reportData.propertyData.zoning && (
                    <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-3 rounded mt-3">
                      <p><strong>Auckland Unitary Plan Zone:</strong></p>
                      <p className="font-medium text-green-800 dark:text-green-200">{reportData.propertyData.zoning}</p>
                      <p className="text-green-700 dark:text-green-300 mt-1 text-xs">Source: Auckland Council Official API</p>
                    </div>
                  )}
                </div>

                {/* Official Map Links */}
                <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
                  <p className="text-sm font-medium mb-3">Verify Location on Official Maps:</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Button
                      onClick={() => {
                        if (reportData.propertyData.coordinates) {
                          const { latitude, longitude } = reportData.propertyData.coordinates;
                          window.open(`https://www.google.com/maps?q=${latitude},${longitude}&z=18`, '_blank');
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2"
                      disabled={!reportData.propertyData.coordinates}
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Google Maps</span>
                    </Button>
                    
                    <Button
                      onClick={() => {
                        if (reportData.propertyData.coordinates) {
                          const { latitude, longitude } = reportData.propertyData.coordinates;
                          window.open(`https://geomapspublic.aucklandcouncil.govt.nz/viewer/index.html?viewer=public&extent=${longitude-0.001},${latitude-0.001},${longitude+0.001},${latitude+0.001}`, '_blank');
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2"
                      disabled={!reportData.propertyData.coordinates}
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Auckland GeoMaps</span>
                    </Button>
                    
                    <Button
                      onClick={() => {
                        if (reportData.propertyData.coordinates) {
                          const { latitude, longitude } = reportData.propertyData.coordinates;
                          window.open(`https://data.linz.govt.nz/data/category/property-ownership-boundaries/?z=16&lat=${latitude}&lng=${longitude}`, '_blank');
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2"
                      disabled={!reportData.propertyData.coordinates}
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>LINZ Data Service</span>
                    </Button>
                  </div>
                  
                  {reportData.propertyData.coordinates && (
                    <div className="mt-3 p-2 bg-white dark:bg-gray-800 rounded border text-xs text-gray-600 dark:text-gray-400">
                      <p>Click any map service above to verify the property location at coordinates:</p>
                      <p className="font-mono mt-1">{reportData.propertyData.coordinates.latitude.toFixed(6)}, {reportData.propertyData.coordinates.longitude.toFixed(6)}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {report && (
          <Card>
            <CardHeader>
              <CardTitle>Comprehensive Analysis Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 mb-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const blob = new Blob([report], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `property-analysis-${propertyAddress.replace(/[^a-zA-Z0-9]/g, '-')}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: `Property Analysis Report - ${propertyAddress}`,
                        text: report,
                      });
                    } else {
                      navigator.clipboard.writeText(report);
                    }
                  }}
                >
                  Share Report
                </Button>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-[70vh] overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm font-mono text-gray-800 dark:text-gray-200 leading-relaxed">
                  {report}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        {!report && status === 'processing' && (
          <Card>
            <CardContent>
              <div className="text-center py-8">
                <Clock className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
                <h3 className="text-lg font-semibold mb-2">Report Generation in Progress</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Our team is currently analyzing your property data and preparing your comprehensive report.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  This process typically takes 2-4 hours. You'll be notified once your report is ready.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
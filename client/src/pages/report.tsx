import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, ArrowLeft, Clock, CheckCircle, AlertCircle, MapPin } from "lucide-react";
import { Link } from "wouter";
import { LinzGeocodingMap } from "@/components/linz-geocoding-map";
import { useToast } from "@/hooks/use-toast";

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const [showLocationVerification, setShowLocationVerification] = useState(false);
  const [locationData, setLocationData] = useState<any>(null);
  const { toast } = useToast();

  const { data: reportData, isLoading, error } = useQuery({
    queryKey: [`/api/premium-report/${id}`],
    enabled: !!id,
  });

  const handleVerifyLocation = async () => {
    if (!reportData?.report?.propertyAddress) {
      toast({
        title: "Address Not Found",
        description: "No property address available for verification.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/geocode-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: reportData.report.propertyAddress }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setLocationData(data.location);
          setShowLocationVerification(true);
        }
      }
    } catch (error) {
      toast({
        title: "Location Verification Failed",
        description: "Unable to verify the property location. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLocationConfirm = (confirmed: boolean) => {
    if (confirmed) {
      setShowLocationVerification(false);
      toast({
        title: "Location Verified",
        description: "Property location has been confirmed with official Auckland Council data.",
      });
    } else {
      setShowLocationVerification(false);
      setLocationData(null);
    }
  };

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
          
          {report && (
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
                <Button 
                  variant="outline"
                  onClick={handleVerifyLocation}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Confirm Location
                </Button>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-[70vh] overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm font-mono text-gray-800 dark:text-gray-200 leading-relaxed">
                  {report}
                </pre>
              </div>
            </CardContent>
          )}
          
          {!report && status === 'processing' && (
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
          )}
        </Card>
      </div>
    </div>
  );
}
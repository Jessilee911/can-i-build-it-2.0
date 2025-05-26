import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { CheckCircle, Download, FileText, MapPin, AlertTriangle } from "lucide-react";

export default function ReportSuccess() {
  const [, setLocation] = useLocation();
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get report data from session storage (passed from report generation)
    const storedReport = sessionStorage.getItem('generatedReport');
    if (storedReport) {
      setReportData(JSON.parse(storedReport));
      setLoading(false);
      // Clear from session storage
      sessionStorage.removeItem('generatedReport');
    } else {
      setLoading(false);
    }
  }, []);

  const handleDownloadPDF = async () => {
    if (reportData?.reportId) {
      window.open(`/api/report/${reportData.reportId}/download`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading your report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Success header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 mb-6">
          <div className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Report Generated Successfully!</h1>
            <p className="text-gray-600 mb-6">
              Your personalized property assessment is ready for review.
            </p>
            
            {reportData && (
              <Button 
                onClick={handleDownloadPDF}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3"
              >
                <Download className="w-5 h-5 mr-2" />
                Download PDF Report
              </Button>
            )}
          </div>
        </div>

        {/* Report Content */}
        {reportData && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
            <div className="p-8">
              
              {/* Property Information */}
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <MapPin className="w-6 h-6 text-blue-600 mr-2" />
                  <h2 className="text-2xl font-bold text-gray-900">Property Information</h2>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Address</h3>
                      <p className="text-gray-700">{reportData.reportData?.propertyAddress}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Wind Zone</h3>
                      <p className="text-gray-700">{reportData.reportData?.propertyData?.windZone}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Earthquake Zone</h3>
                      <p className="text-gray-700">{reportData.reportData?.propertyData?.earthquakeZone}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Property Zone</h3>
                      <p className="text-gray-700">{reportData.reportData?.propertyData?.propertyZone}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Project Details */}
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <FileText className="w-6 h-6 text-blue-600 mr-2" />
                  <h2 className="text-2xl font-bold text-gray-900">Project Details</h2>
                </div>
                
                <div className="bg-blue-50 p-6 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-blue-900 mb-2">Description</h3>
                      <p className="text-blue-800">{reportData.reportData?.projectDescription}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900 mb-2">Budget Range</h3>
                      <p className="text-blue-800">{reportData.reportData?.budgetRange}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900 mb-2">Timeframe</h3>
                      <p className="text-blue-800">{reportData.reportData?.timeframe}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900 mb-2">Plan Type</h3>
                      <p className="text-blue-800">{reportData.reportData?.planId}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Analysis */}
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-amber-600 mr-2" />
                  <h2 className="text-2xl font-bold text-gray-900">AI Analysis & Recommendations</h2>
                </div>
                
                <div className="bg-amber-50 p-6 rounded-lg">
                  <div className="mb-4">
                    <h3 className="font-semibold text-amber-900 mb-2">Building Consent Analysis</h3>
                    <p className="text-amber-800">{reportData.reportData?.analysis?.buildingConsent}</p>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="font-semibold text-amber-900 mb-2">Zone Compliance</h3>
                    <p className="text-amber-800">{reportData.reportData?.analysis?.zoneCompliance}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-amber-900 mb-2">Recommendations</h3>
                    <ul className="text-amber-800 space-y-1">
                      {reportData.reportData?.analysis?.recommendations?.map((rec: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <div className="w-2 h-2 bg-amber-600 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Project Guidance */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Detailed Project Guidance</h2>
                <div className="bg-green-50 p-6 rounded-lg">
                  <p className="text-green-800 whitespace-pre-wrap">{reportData.reportData?.projectGuidance}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={handleDownloadPDF}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download PDF Report
                </Button>
                
                <Button
                  onClick={() => setLocation('/')}
                  variant="outline"
                >
                  New Assessment
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* If no report data */}
        {!reportData && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 text-center">
            <div className="p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">No Report Data Found</h2>
              <p className="text-gray-600 mb-6">
                It looks like your report data wasn't found. Please try generating a new report.
              </p>
              <Button
                onClick={() => setLocation('/')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Start New Assessment
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
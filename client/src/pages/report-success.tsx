import { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { CheckCircle, Mail, Clock, FileText } from "lucide-react";

export default function ReportSuccess() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Confetti or celebration animation could be added here
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl w-full max-w-lg border border-white/20 text-center">
        
        {/* Success header */}
        <div className="p-8">
          <div className="mb-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Report Generation Started!</h1>
            <p className="text-gray-600">
              Thank you for your payment. Your personalized property report is now being generated.
            </p>
          </div>

          {/* What happens next */}
          <div className="bg-blue-50 p-6 rounded-lg mb-6 text-left">
            <h2 className="text-lg font-semibold text-blue-900 mb-4">What happens next:</h2>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">Processing Time</p>
                  <p className="text-sm text-blue-700">Your report will be ready within 24-48 hours</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">AI Analysis</p>
                  <p className="text-sm text-blue-700">Our AI agent is gathering property data and zoning information</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">Email Notification</p>
                  <p className="text-sm text-blue-700">You'll receive your detailed report via email</p>
                </div>
              </div>
            </div>
          </div>

          {/* What's included */}
          <div className="bg-gray-50 p-6 rounded-lg mb-6 text-left">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your report will include:</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Property address verification</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>District planning zone</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Wind zone classification</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Earthquake zone data</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Satellite imagery</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Property boundaries</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Building consent guidance</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>AI-generated recommendations</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <Button
              onClick={() => setLocation('/')}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Return to Assessment Tool
            </Button>
            
            <p className="text-sm text-gray-500">
              Need help? Contact our support team for assistance with your report.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
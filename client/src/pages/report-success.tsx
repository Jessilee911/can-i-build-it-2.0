import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Home, MessageCircle, FileText, Clock } from "lucide-react";

export default function ReportSuccess() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl text-center">
        <CardHeader>
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
            Report Request Submitted!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Thank you for submitting your premium property report request. Our team will begin processing your comprehensive analysis immediately.
          </p>

          <div className="grid md:grid-cols-2 gap-4 text-left">
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  Processing Time
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-200">
                  Your report will be completed within 24-48 hours
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <FileText className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900 dark:text-green-100">
                  Report Content
                </h3>
                <p className="text-sm text-green-700 dark:text-green-200">
                  Comprehensive zoning, consent, and development analysis
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg">
            <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
              What happens next?
            </h3>
            <ul className="text-sm text-amber-700 dark:text-amber-200 space-y-1 text-left">
              <li>• Our property experts will analyze your specific site</li>
              <li>• We'll research current zoning rules and consent requirements</li>
              <li>• You'll receive a detailed PDF report via email</li>
              <li>• Follow-up consultation available if needed</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Link href="/">
              <Button variant="outline" className="w-full sm:w-auto">
                <Home className="w-4 h-4 mr-2" />
                Return Home
              </Button>
            </Link>
            <Link href="/premium-chat">
              <Button className="w-full sm:w-auto">
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat with Experts
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Home, Download, MessageCircle } from "lucide-react";

export default function PaymentSuccess() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl text-center">
        <CardHeader>
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
            Payment Successful!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Your payment has been processed successfully. You now have access to premium features and services.
          </p>

          <div className="bg-blue-50 dark:bg-blue-950 p-6 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
              What you get with your purchase:
            </h3>
            <ul className="text-sm text-blue-700 dark:text-blue-200 space-y-2 text-left max-w-md mx-auto">
              <li>• Comprehensive property development reports</li>
              <li>• Expert consultation and guidance</li>
              <li>• Priority support and faster response times</li>
              <li>• Access to premium chat features</li>
              <li>• Detailed zoning and consent analysis</li>
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
                Start Premium Chat
              </Button>
            </Link>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            A confirmation email has been sent to your registered email address with your receipt and access details.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
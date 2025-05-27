import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircleIcon } from "lucide-react";

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Extract URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const plan = urlParams.get('plan');
    const paymentIntent = urlParams.get('payment_intent');
    
    // Store the plan information for the chat
    if (plan) {
      sessionStorage.setItem('selectedPlan', plan);
      sessionStorage.setItem('paymentCompleted', 'true');
    }

    // Auto-redirect to chat after a brief delay
    const timer = setTimeout(() => {
      setLocation('/chat');
    }, 2000);

    return () => clearTimeout(timer);
  }, [setLocation]);

  const handleContinueToChat = () => {
    setLocation('/chat');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      <Card className="w-full max-w-md text-center bg-white/80 backdrop-blur-md border-white/20 shadow-xl">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircleIcon className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl text-gray-800">
            Payment Successful!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Thank you for your purchase. You now have access to our premium building consent advisor.
          </p>
          <p className="text-sm text-gray-500">
            Redirecting to your AI chat assistant...
          </p>
          <Button 
            onClick={handleContinueToChat}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Continue to Chat Assistant
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
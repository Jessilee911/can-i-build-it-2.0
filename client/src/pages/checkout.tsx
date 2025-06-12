import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePublicKey = 'pk_test_51RQvpCRkbQxb8ZT81y427XFSZqx33n9z3zcL4rjnzBzUSdVXWQuU88mK1Dxq6c2H1ZDEzwmIu3okToiNtQOsJ5XJ00ye8lSjaC';
const stripePromise = loadStripe(stripePublicKey);

const CheckoutForm = ({ planId, planName, amount }: { planId: string, planName: string, amount: number }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/report-questions?plan=${planId}`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 w-full max-w-md border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Secure Payment</h1>
          <p className="text-gray-600 mb-4">Complete your payment to generate your personalized property report</p>
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-blue-900">{planName}</h3>
            <p className="text-2xl font-bold text-blue-600">${amount}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <PaymentElement />
          
          {/* Debug info */}
          {(!stripe || !elements) && (
            <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
              Loading payment form... {!stripe && "Stripe not ready"} {!elements && "Elements not ready"}
            </div>
          )}
          
          <button 
            type="submit"
            disabled={!stripe || !elements || isProcessing}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Processing...
              </span>
            ) : (
              `Generate Your Personalised Report - $${amount}`
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            🔒 Secured by Stripe • Your payment information is encrypted and secure
          </p>
        </div>
      </div>
    </div>
  );
};

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();
  
  // Get plan details from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const planId = urlParams.get('plan') || 'detailed';
  const planName = urlParams.get('name') || 'Detailed Analysis';
  const amount = parseInt(urlParams.get('amount') || '99');

  useEffect(() => {
    // Create PaymentIntent as soon as the page loads
    apiRequest("POST", "/api/create-payment-intent", { 
      planId,
      amount: amount * 100 // Convert to cents
    })
      .then((res) => res.json())
      .then((data) => {
        setClientSecret(data.clientSecret);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Payment intent creation failed:', error);
        setLoading(false);
      });
  }, [planId, amount]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            <span className="text-gray-600">Setting up secure payment...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Setup Failed</h2>
          <p className="text-gray-600 mb-4">We couldn't set up the payment. Please try again.</p>
          <button 
            onClick={() => setLocation('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm planId={planId} planName={planName} amount={amount} />
    </Elements>
  );
}
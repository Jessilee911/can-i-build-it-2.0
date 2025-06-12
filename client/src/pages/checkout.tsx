import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Shield, ArrowLeft, Check } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  features: string[];
  description: string;
}

function CheckoutForm({ selectedPlan }: { selectedPlan: Plan }) {
  const stripe = useStripe();
  const elements = useElements();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const createPaymentIntent = useMutation({
    mutationFn: async (data: { planId: string; amount: number }) => {
      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create payment intent");
      return response.json();
    },
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      toast({
        title: "Payment System Loading",
        description: "Please wait for the payment system to load completely.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment intent
      const { clientSecret } = await createPaymentIntent.mutateAsync({
        planId: selectedPlan.id,
        amount: selectedPlan.price * 100, // Convert to cents
      });

      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message || "An error occurred while processing your payment.",
          variant: "destructive",
        });
      } else if (paymentIntent.status === "succeeded") {
        toast({
          title: "Payment Successful",
          description: "Your payment has been processed successfully.",
        });
        setLocation("/payment-success");
      }
    } catch (error) {
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#424770",
                "::placeholder": {
                  color: "#aab7c4",
                },
              },
            },
          }}
        />
      </div>

      <Button
        type="submit"
        disabled={!stripe || isProcessing || createPaymentIntent.isPending}
        className="w-full"
        size="lg"
      >
        {isProcessing || createPaymentIntent.isPending
          ? "Processing..."
          : `Pay ${selectedPlan.currency.toUpperCase()} $${selectedPlan.price}`}
      </Button>

      <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Shield className="w-4 h-4" />
        Secured by Stripe
      </div>
    </form>
  );
}

export default function Checkout() {
  const [selectedPlanId, setSelectedPlanId] = useState<string>("premium_report");

  const { data: pricing, isLoading } = useQuery({
    queryKey: ["/api/pricing"],
    queryFn: async () => {
      const response = await fetch("/api/pricing");
      if (!response.ok) throw new Error("Failed to fetch pricing");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading pricing options...</p>
        </div>
      </div>
    );
  }

  const allPlans = [...(pricing?.onetime || []), ...(pricing?.subscription || [])];
  const selectedPlan = allPlans.find(plan => plan.id === selectedPlanId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Complete Your Purchase
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Secure payment powered by Stripe
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Plan Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select a Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {allPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedPlanId === plan.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedPlanId(plan.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{plan.name}</h3>
                        {selectedPlanId === plan.id && (
                          <Badge variant="default">Selected</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                        {plan.description}
                      </p>
                      <ul className="text-sm space-y-1">
                        {plan.features.map((feature: string, index: number) => (
                          <li key={index} className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {plan.currency.toUpperCase()} ${plan.price}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedPlan ? (
                <div className="space-y-6">
                  {/* Order Summary */}
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Order Summary</h4>
                    <div className="flex justify-between items-center">
                      <span>{selectedPlan.name}</span>
                      <span className="font-semibold">
                        {selectedPlan.currency.toUpperCase()} ${selectedPlan.price}
                      </span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between items-center font-semibold">
                      <span>Total</span>
                      <span>
                        {selectedPlan.currency.toUpperCase()} ${selectedPlan.price}
                      </span>
                    </div>
                  </div>

                  {/* Stripe Elements */}
                  <Elements stripe={stripePromise}>
                    <CheckoutForm selectedPlan={selectedPlan} />
                  </Elements>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  Please select a plan to continue with payment.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Back Button */}
        <div className="flex justify-center mt-8">
          <Link href="/">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
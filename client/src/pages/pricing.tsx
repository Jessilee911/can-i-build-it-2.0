import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckIcon, CreditCardIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function PricingPage() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = React.useState<'onetime' | 'subscription'>('subscription');

  interface PricingPlan {
    id: string;
    name: string;
    price: number;
    description: string;
    features: string[];
    highlight?: boolean;
    isSubscription?: boolean;
    badge?: string;
  }

  const ONE_TIME_PLANS: PricingPlan[] = [
    {
      id: "basic",
      name: "Basic",
      price: 1,
      description: "Get started with basic property insights",
      features: [
        "AI Property Advisor Chat",
        "General building guidance",
        "Basic zoning information",
        "Building code basics",
        "Unlimited conversations"
      ],
    },
    {
      id: "standard",
      name: "Standard",
      price: 1,
      description: "Detailed property analysis for one-time projects",
      features: [
        "Everything in Basic",
        "Advanced AI Property Analysis",
        "Detailed building consent guidance",
        "Wind & earthquake zone data",
        "Cost estimation support"
      ],
      highlight: true,
    },
    {
      id: "premium",
      name: "Premium",
      price: 1,
      description: "Advanced analysis with professional insights",
      features: [
        "Everything in Standard",
        "Expert AI Property Consultant",
        "Heritage & environmental analysis",
        "Complex development strategies", 
        "Timeline & budget planning",
        "Priority support"
      ],
    },
    {
      id: "expert",
      name: "Expert Review",
      price: 1,
      description: "Premium package with human expert review",
      features: [
        "Everything in Premium", 
        "Licensed Designer Chat Review",
        "Personalized recommendations",
        "Custom project planning",
        "90-day data access",
      ],
      badge: "Best Value",
    },
  ];

  const SUBSCRIPTION_PLANS: PricingPlan[] = [
    {
      id: "pro",
      name: "Pro",
      price: 0,
      description: "Unlimited access for regular users",
      features: [
        "Everything in Premium one-time",
        "Unlimited property checks",
        "Priority support",
        "GIS data export",
        "Monthly updates",
      ],
      isSubscription: true,
    },
    {
      id: "unlimited",
      name: "Unlimited",
      price: 0,
      description: "Complete access for professionals",
      features: [
        "Everything in Pro",
        "API access for integration",
        "Team collaboration",
        "Priority support",
        "Advanced data filtering",
        "Custom reports",
      ],
      isSubscription: true,
      highlight: true,
      badge: "Most Popular",
    },
  ];

  const plans = activeTab === 'subscription' ? SUBSCRIPTION_PLANS : ONE_TIME_PLANS;

  const handleCheckout = async (planId: string, isSubscription: boolean) => {
    if (!isAuthenticated) {
      // Redirect to login
      window.location.href = "/api/login";
      return;
    }

    setIsLoading({ ...isLoading, [planId]: true });
    try {
      const response = await apiRequest("POST", "/api/checkout", {
        planId,
        isSubscription
      });
      
      const data = await response.json();
      
      if (data.free) {
        toast({
          title: "Free plan activated",
          description: "You now have access to the basic features.",
        });
        setTimeout(() => {
          window.location.href = "/chat";
        }, 1000);
        return;
      }
      
      if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        toast({
          title: "Error",
          description: "Failed to create checkout session.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading({ ...isLoading, [planId]: false });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Simple, Transparent Pricing</h1>
        <p className="text-lg text-muted-foreground">
          Choose the plan that's right for you and your property development needs
        </p>
      </div>

      <div className="flex justify-center mb-8">
        <div className="inline-flex items-center bg-muted p-1 rounded-lg">
          <button
            className={`px-4 py-2 rounded-md ${
              activeTab === 'onetime' ? 'bg-white shadow-sm' : 'text-muted-foreground'
            }`}
            onClick={() => setActiveTab('onetime')}
          >
            One-time Payment
          </button>
          <button
            className={`px-4 py-2 rounded-md ${
              activeTab === 'subscription' ? 'bg-white shadow-sm' : 'text-muted-foreground'
            }`}
            onClick={() => setActiveTab('subscription')}
          >
            Subscription
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`flex flex-col ${
              plan.highlight ? 'border-primary shadow-lg' : 'border-border'
            }`}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>{plan.name}</CardTitle>
                {plan.badge && (
                  <Badge variant="secondary" className="ml-2">
                    {plan.badge}
                  </Badge>
                )}
              </div>
              <CardDescription className="text-sm">{plan.description}</CardDescription>
              <div className="mt-2">
                <span className="text-3xl font-bold">${plan.price}</span>
                {plan.isSubscription && <span className="text-muted-foreground ml-1">/month</span>}
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => handleCheckout(plan.id, !!plan.isSubscription)} 
                disabled={isLoading[plan.id]}
                variant={plan.highlight ? "default" : "outline"}
                className="w-full"
              >
                {isLoading[plan.id] ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCardIcon className="mr-2 h-4 w-4" />
                    {plan.price === 0 ? "Get Started" : "Purchase"}
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What happens after I purchase?</CardTitle>
            </CardHeader>
            <CardContent>
              <p>After purchasing, you'll have immediate access to all features included in your chosen plan. For paid plans, you'll receive detailed property assessments and reports that help you understand the development potential of your property.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Can I cancel my subscription?</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Yes, you can cancel your subscription at any time from your account settings. You'll continue to have access until the end of your billing period.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What if I need help with my project?</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Our Expert Review plan includes personalized assistance from a licensed designer who can provide specific guidance for your project. For other plans, our comprehensive reports provide guidance on next steps and recommended consultants.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LockIcon } from "lucide-react";
import { Link } from "wouter";

interface AccessRestrictionProps {
  requiredPlan: 'standard' | 'premium' | 'expert' | 'pro' | 'unlimited';
  featureName: string;
  children: React.ReactNode;
}

// Plan hierarchy for feature access
const PLAN_HIERARCHY = {
  'basic': 0,
  'standard': 1,
  'premium': 2,
  'expert': 3,
  'pro': 2, // Pro subscription is equivalent to premium features
  'unlimited': 3 // Unlimited subscription is equivalent to expert features
};

export function AccessRestriction({ requiredPlan, featureName, children }: AccessRestrictionProps) {
  const { user, isAuthenticated } = useAuth();

  // Check if user has access to the feature based on their subscription
  const hasAccess = React.useMemo(() => {
    if (!isAuthenticated || !user?.subscriptionTier) {
      return false;
    }

    const userPlanLevel = PLAN_HIERARCHY[user.subscriptionTier as keyof typeof PLAN_HIERARCHY] || 0;
    const requiredPlanLevel = PLAN_HIERARCHY[requiredPlan];

    return userPlanLevel >= requiredPlanLevel;
  }, [isAuthenticated, user, requiredPlan]);

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <Card className="relative">
      <CardContent className="p-6">
        <div className="absolute inset-0 backdrop-blur-sm bg-background/80 flex flex-col items-center justify-center z-10 p-4">
          <LockIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2 text-center">Premium Feature</h3>
          <p className="text-muted-foreground text-center mb-4">
            The <strong>{featureName}</strong> is available with {requiredPlan === 'standard' ? 'Standard' : 
            requiredPlan === 'premium' ? 'Premium' : 
            requiredPlan === 'expert' ? 'Expert Review' : 
            requiredPlan === 'pro' ? 'Pro Subscription' : 'Unlimited Subscription'} plan or higher.
          </p>
          <Link href="/pricing">
            <Button>Upgrade now</Button>
          </Link>
        </div>
        
        {/* Blurred content with dimmed opacity */}
        <div className="opacity-20 pointer-events-none blur-sm">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

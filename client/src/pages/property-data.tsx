import { useState, useEffect } from "react";
import { PropertyAssessment } from "@/components/assessment/property-assessment";
import { AnimatedSuggestions } from "@/components/animated-suggestions";
import { Button } from "@/components/ui/button";
import { FileTextIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PropertyData = () => {
  const [showPricing, setShowPricing] = useState(false);
  const [pricingType, setPricingType] = useState<"onetime" | "subscription">("onetime");
  const [showPropertyDetails, setShowPropertyDetails] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const { toast } = useToast();
  const [propertyDetails, setPropertyDetails] = useState({
    address: "",
    projectDescription: "",
    budget: "100,000 - 250,000",
    timeframe: "3-6 months"
  });
  
  const pricingPlans = [
    {
      title: "Basic Report",
      price: "Free",
      description: "Basic zoning and consent information",
      features: [
        "Basic zoning information",
        "Building consent yes/no",
        "General development guidelines"
      ]
    },
    {
      title: "Detailed Analysis",
      price: "$0.99",
      description: "Complete property assessment",
      features: [
        "Everything in Basic",
        "Detailed zone analysis",
        "Building consent requirements",
        "Resource consent guidance"
      ]
    },
    {
      title: "Comprehensive",
      price: "$1.00",
      description: "Full assessment with AI sketching",
      features: [
        "Everything in Detailed",
        "Upload existing plans",
        "AI sketch concept generation",
        "Site constraints analysis"
      ],
      highlight: true
    },
    {
      title: "Expert Review",
      price: "$1.01",
      description: "Human expert verification",
      features: [
        "Everything in Comprehensive",
        "Licensed designer review",
        "Professional insights",
        "Email consultation"
      ]
    }
  ];
  
  const subscriptionPlans = [
    {
      title: "Pro Subscription",
      price: "$99/mo",
      description: "Annual billing (save 15%)",
      features: [
        "Unlimited property assessments",
        "All Comprehensive features",
        "Save and compare properties"
      ]
    },
    {
      title: "Unlimited",
      price: "$195/mo",
      description: "Ultimate access",
      features: [
        "Unlimited AI consultations",
        "Priority support",
        "Advanced property tools",
        "Expert monthly check-in"
      ],
      highlight: true
    }
  ];
  
  const activePlans = pricingType === "onetime" ? pricingPlans : subscriptionPlans;
  
  // Listen for pricing toggle events
  useEffect(() => {
    const handleTogglePricing = () => {
      setShowPricing(prev => !prev);
    };
    
    window.addEventListener('togglePricing', handleTogglePricing);
    return () => window.removeEventListener('togglePricing', handleTogglePricing);
  }, []);
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Main search component */}
      <PropertyAssessment showPricing={showPricing} />
      {/* Simple Property Details Modal */}
      {showPropertyDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4 p-6">
            <h2 className="text-xl font-bold mb-4">Create your {selectedPlan}</h2>
            <p className="text-sm text-gray-600 mb-4">
              Please provide the details below to help us generate an accurate property report.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Property Address</label>
                <input 
                  type="text"
                  className="w-full p-2 border rounded-md"
                  placeholder="e.g. 123 Main Street, Auckland"
                  value={propertyDetails.address}
                  onChange={(e) => setPropertyDetails({...propertyDetails, address: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Project Description</label>
                <textarea 
                  className="w-full p-2 border rounded-md min-h-[100px]"
                  placeholder="Describe what you want to build or develop on this property..."
                  value={propertyDetails.projectDescription}
                  onChange={(e) => setPropertyDetails({...propertyDetails, projectDescription: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Budget Range</label>
                <select 
                  className="w-full p-2 border rounded-md"
                  value={propertyDetails.budget}
                  onChange={(e) => setPropertyDetails({...propertyDetails, budget: e.target.value})}
                >
                  <option value="Under 100,000">Under $100,000</option>
                  <option value="100,000 - 250,000">$100,000 - $250,000</option>
                  <option value="250,000 - 500,000">$250,000 - $500,000</option>
                  <option value="500,000 - 1,000,000">$500,000 - $1,000,000</option>
                  <option value="Over 1,000,000">Over $1,000,000</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Expected Timeframe</label>
                <select 
                  className="w-full p-2 border rounded-md"
                  value={propertyDetails.timeframe}
                  onChange={(e) => setPropertyDetails({...propertyDetails, timeframe: e.target.value})}
                >
                  <option value="0-3 months">Within 3 months</option>
                  <option value="3-6 months">3-6 months</option>
                  <option value="6-12 months">6-12 months</option>
                  <option value="1-2 years">1-2 years</option>
                  <option value="Just planning">Just planning for now</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button 
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                onClick={() => setShowPropertyDetails(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                onClick={async () => {
                  try {
                    setShowPropertyDetails(false);
                    
                    // Import payment helper dynamically to avoid issues
                    const { processReportRequest } = await import("@/lib/payment");
                    
                    // Process the report request with payment if needed
                    const result = await processReportRequest(propertyDetails, selectedPlan);
                    
                    // For free plans or after successful payment
                    if (result.success && !(result as any).redirected) {
                      toast({
                        title: "Report request submitted",
                        description: `We're generating your ${selectedPlan}. You'll receive a notification when it's ready.`,
                      });
                    }
                  } catch (error) {
                    console.error("Error processing report request:", error);
                    toast({
                      title: "Error",
                      description: "There was a problem processing your request. Please try again.",
                      variant: "destructive",
                    });
                  }
                }}
              >
                Generate Report
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Always visible blue disclaimer at bottom */}
      <div className="mt-6 text-center">
        <p className="text-sm text-blue-600">
          This tool is connected to a database of New Zealand building regulations and property zoning requirements
        </p>
      </div>
    </div>
  );
};

export default PropertyData;

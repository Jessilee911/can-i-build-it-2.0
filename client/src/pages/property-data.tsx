import { useState } from "react";
import { PropertyAssessment } from "@/components/assessment/property-assessment";
import { Button } from "@/components/ui/button";
import { FileTextIcon } from "lucide-react";

const PropertyData = () => {
  const [showPricing, setShowPricing] = useState(false);
  const [pricingType, setPricingType] = useState<"onetime" | "subscription">("onetime");
  
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
      price: "$99",
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
      price: "$149",
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
      price: "$299",
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
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="p-6">
          <div className="mb-6 text-center">
            <p className="text-gray-600 mb-4">
              Ask me anything about building, renovating, or developing property in New Zealand
            </p>
          </div>
          
          {/* Main search component */}
          <PropertyAssessment />
          
          {/* Suggestion content moved below search bar */}
          <div className="mt-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-medium text-gray-900 mb-2">Try asking about:</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• "Can I build a minor dwelling in Auckland?"</li>
                  <li>• "I want to renovate my kitchen, do I need consent?"</li>
                  <li>• "What consultants do I need to subdivide my property?"</li>
                  <li>• "How long does it take to get building consent?"</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-medium text-gray-900 mb-2">Quick Building Tips:</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Most structural changes require consent</li>
                  <li>• Resource consent is separate from building consent</li>
                  <li>• NZ Building Code sets national standards for construction</li>
                  <li>• Engaging professionals early saves time and money</li>
                </ul>
              </div>
            </div>
            
            {/* Personalized report button */}
            <div className="flex justify-center mt-6 mb-2">
              <Button 
                size="lg"
                className="gap-2"
                onClick={() => setShowPricing(true)}
              >
                <FileTextIcon className="h-5 w-5" />
                Create a Personalized Property Report
              </Button>
            </div>
          </div>
          
          <div className="mt-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between">
              <div className="mb-4 sm:mb-0">
                <h3 className="text-lg font-semibold text-gray-900">Unlock advanced features</h3>
                <p className="text-sm text-gray-600">Get detailed reports, AI sketch concepts, and expert reviews</p>
              </div>
              <Button 
                onClick={() => setShowPricing(!showPricing)}
                className="whitespace-nowrap"
              >
                {showPricing ? "Hide Pricing Plans" : "View Pricing Plans"}
              </Button>
            </div>
          </div>
          
          {showPricing && (
            <div className="mt-6 border-t pt-6">
              <h2 className="text-xl font-bold mb-6 text-center">Choose Your Plan</h2>
              
              <div className="mb-6">
                <div className="flex justify-center space-x-2 mb-6">
                  <Button 
                    variant={pricingType === "onetime" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setPricingType("onetime")}
                  >
                    One-Time Purchase
                  </Button>
                  <Button 
                    variant={pricingType === "subscription" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setPricingType("subscription")}
                  >
                    Subscription
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {activePlans.map((plan, index) => (
                    <div 
                      key={index} 
                      className={`bg-white p-4 rounded-lg border ${plan.highlight ? 'border-blue-500 shadow-lg' : 'border-gray-200'} flex flex-col h-full`}
                    >
                      <div className="mb-4">
                        <h3 className="font-bold text-lg">{plan.title}</h3>
                        <div className="text-2xl font-bold my-2">{plan.price}</div>
                        <p className="text-sm text-gray-600">{plan.description}</p>
                      </div>
                      <div className="flex-grow">
                        <ul className="space-y-2">
                          {plan.features.map((feature, i) => (
                            <li key={i} className="flex text-sm">
                              <span className="text-green-500 mr-2">✓</span>
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="mt-4">
                        <Button 
                          variant={plan.highlight ? "default" : "outline"} 
                          className="w-full"
                          onClick={() => alert(`Selected plan: ${plan.title}`)}
                        >
                          {plan.price === "Free" ? "Start Free" : `Buy Now`}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {!showPricing && (
        <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 text-center">
          This tool is connected to a database of New Zealand building regulations and property zoning requirements
        </div>
      )}
    </div>
  );
};

export default PropertyData;

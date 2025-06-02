import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import nzMapImage from "@assets/NZ.png";
import AnimatedSuggestions from "@/components/animated-suggestions";
import { FormattedText } from "@/components/ui/formatted-text";
import { PremiumUpgradeModal } from "@/components/premium-upgrade-modal";
import { PropertyIntakeForm, PropertyIntakeData } from "@/components/property-intake-form";

interface PropertyAssessmentProps {
  showPricing?: boolean;
}

export function PropertyAssessment({ showPricing = false }: PropertyAssessmentProps) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<{type: 'query' | 'response', content: string, showReportCTA?: boolean}[]>([]);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [currentAddress, setCurrentAddress] = useState("");
  const [showIntakeForm, setShowIntakeForm] = useState(false);
  const [, setLocation] = useLocation();

  const handleIntakeComplete = (data: PropertyIntakeData) => {
    // Store the intake data and navigate to Agent 2 with the data
    sessionStorage.setItem('propertyIntakeData', JSON.stringify(data));
    setShowIntakeForm(false);
    setLocation('/property-chat');
  };

  const handleIntakeCancel = () => {
    setShowIntakeForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (query.trim()) {
      setIsLoading(true);
      setCurrentAddress(query);
      
      // Add the user query to conversations
      setConversations(prev => [...prev, { type: 'query', content: query }]);
      
      try {
        // Call the backend API for property assessment using real NZ data
        const response = await fetch('/api/assess-property', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query, agentType: 'can-i-build-it' }),
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Use the RAG-enhanced response that includes actual NZ building knowledge
          let responseText = data.message;
          
          // Check if this is a property-specific question that would benefit from a personalized report
          const isPropertySpecific = query.toLowerCase().includes('address') || 
                                    query.toLowerCase().includes('property') ||
                                    query.toLowerCase().includes('my house') ||
                                    query.toLowerCase().includes('specific') ||
                                    query.toLowerCase().includes('exact') ||
                                    /\d+\s+\w+\s+(street|road|avenue|drive|place)/i.test(query);
          
          // Strategic guidance toward personalized reports for property-specific questions
          if (isPropertySpecific) {
            responseText += "\n\n**For detailed property-specific analysis including official zoning data, consent requirements, and site constraints, consider getting a Premium Property Analysis report.**";
          }
          
          setConversations(prev => [
            ...prev, 
            { 
              type: 'response', 
              content: responseText,
              showReportCTA: isPropertySpecific 
            }
          ]);
        } else {
          throw new Error('Assessment failed');
        }
      } catch (error) {
        setConversations(prev => [
          ...prev, 
          { 
            type: 'response', 
            content: 'I apologize, but I encountered an issue while processing your request. Please try again or contact support for assistance.'
          }
        ]);
      } finally {
        setQuery("");
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src={nzMapImage} 
          alt="New Zealand Map" 
          className="w-full h-full object-cover opacity-10"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-white to-green-100 opacity-80"></div>
      </div>
      
      <div className="max-w-3xl mx-auto relative z-10 w-full px-4">
        {/* Conversation History */}
        <div className="space-y-4 mb-4">
          {conversations.length === 0 && (
            <div 
              className="text-center py-6 backdrop-blur-sm rounded-lg shadow-lg drop-shadow-sm"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}
            >
              <h1 className="font-bold text-gray-900 mb-4 text-[25px]" style={{fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif'}}>Can I Build It?</h1>
              <p className="text-gray-600 max-w-md mx-auto text-[12px]">
                Advanced building analysis and development guidance for New Zealand properties. Get detailed consent requirements, construction feasibility, and professional recommendations.
              </p>
            </div>
          )}
          
          {conversations.map((item, index) => (
            <div 
              key={index} 
              className={`flex ${item.type === 'query' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] rounded-lg p-4 shadow-lg drop-shadow-sm backdrop-blur-sm border ${
                  item.type === 'query' 
                    ? 'text-blue-900 border-blue-200' 
                    : 'text-gray-900 border-gray-200'
                }`}
                style={{
                  backgroundColor: item.type === 'query' 
                    ? 'rgba(239, 246, 255, 0.5)' 
                    : 'rgba(255, 255, 255, 0.5)'
                }}
              >
                <FormattedText>{item.content}</FormattedText>
                {item.showReportCTA && item.type === 'response' && (
                  <div className="mt-4 pt-3 border-t border-gray-300">
                    <Button 
                      size="sm" 
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => setShowPremiumModal(true)}
                    >
                      Get Premium Analysis
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div 
                className="backdrop-blur-sm border border-gray-200 rounded-lg p-4 max-w-[80%] shadow-lg drop-shadow-sm"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}
              >
                <div className="flex space-x-2 items-center">
                  <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Input Form */}
        <div 
          className="backdrop-blur-sm p-4 rounded-lg shadow-lg drop-shadow-sm border border-gray-200"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}
        >
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <input 
              type="text"
              className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ask about building regulations, zoning, or consent requirements..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              {isLoading ? 
                <span className="animate-spin">⟳</span> : 
                <span>Send</span>
              }
            </Button>
          </form>
        </div>
        
        {/* Show suggestion boxes and unlock features only when no conversations */}
        {conversations.length === 0 && (
          <>
            <AnimatedSuggestions />
            
            <div className="mt-2 bg-white bg-opacity-80 backdrop-blur-sm p-4 rounded-lg border border-gray-200 shadow-lg drop-shadow-sm">
              <div className="flex flex-col sm:flex-row items-center justify-between">
                <div className="mb-4 sm:mb-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">Premium Property Analysis</h3>
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                      Available Now
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Get comprehensive property reports with official Auckland Council data, detailed zoning analysis, and expert recommendations for your specific project.</p>
                </div>
                <Button 
                  onClick={() => setShowIntakeForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                >
                  Get Premium Analysis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Pricing Plans - Show when showPricing is true */}
            {showPricing && (
              <div className="mt-4 bg-white bg-opacity-90 backdrop-blur-sm p-6 rounded-lg border border-gray-200 shadow-lg">
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">Choose Your Plan</h3>
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                      Coming Soon
                    </span>
                  </div>
                  <p className="text-gray-600">Get detailed property reports and expert guidance</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Comprehensive Plan */}
                  <div className="bg-white p-4 rounded-lg border-2 border-blue-500 shadow-lg relative">
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-500 text-white px-3 py-1 text-xs font-medium rounded-full">
                        Most Popular
                      </span>
                    </div>
                    <h4 className="font-bold text-lg mb-2">Comprehensive</h4>
                    <div className="text-2xl font-bold mb-2 text-blue-600">$29</div>
                    <p className="text-sm text-gray-600 mb-4">Full assessment with AI insights</p>
                    <ul className="space-y-2 mb-4">
                      <li className="text-sm flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        Chat with our premium AI agent about specific project details. Tailored advice for your potential project
                      </li>
                      <li className="text-sm flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        Detailed zone analysis for your property
                      </li>
                      <li className="text-sm flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        Custom building consent requirements
                      </li>
                      <li className="text-sm flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        Upload your plans
                      </li>
                      <li className="text-sm flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        Site constraints analysis
                      </li>
                    </ul>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      Get Comprehensive Report
                    </Button>
                  </div>
                  
                  {/* Expert Plan */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="font-bold text-lg mb-2">Expert Review</h4>
                    <div className="text-2xl font-bold mb-2 text-blue-600">$199</div>
                    <p className="text-sm text-gray-600 mb-4">Human expert verification</p>
                    <ul className="space-y-2 mb-4">
                      <li className="text-sm flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        Everything in Comprehensive
                      </li>
                      <li className="text-sm flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        Direct access to a licensed professional
                      </li>
                      <li className="text-sm flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        Licensed designer review within 48 hours
                      </li>
                      <li className="text-sm flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        Professional insights
                      </li>
                      <li className="text-sm flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        Email consultation
                      </li>
                    </ul>
                    <Button variant="outline" className="w-full">
                      Get Expert Review
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        
        {/* AI Disclaimer */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500 bg-white bg-opacity-60 backdrop-blur-sm px-3 py-2 rounded-full inline-block">
            🤖 This site is powered by AI. Responses are for informational purposes only and should not replace professional advice.
          </p>
        </div>

      </div>
      {/* Premium Upgrade Modal */}
      <PremiumUpgradeModal 
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        initialAddress={currentAddress}
      />

      {/* Property Intake Form */}
      {showIntakeForm && (
        <PropertyIntakeForm
          onComplete={handleIntakeComplete}
          onCancel={handleIntakeCancel}
        />
      )}
    </div>
  );
}
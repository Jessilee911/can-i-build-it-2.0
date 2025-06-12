import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AnimatedSuggestions } from '@/components/animated-suggestions';
import { PremiumUpgradeModal } from '@/components/premium-upgrade-modal';
import nzMapImage from '@assets/NZ.png';

interface PropertyAssessmentProps {
  showPricing?: boolean;
}

export function PropertyAssessment({ showPricing = false }: PropertyAssessmentProps) {
  const [query, setQuery] = useState('');
  const [conversations, setConversations] = useState<Array<{ question: string; answer: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [currentAddress, setCurrentAddress] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const currentQuery = query.trim();
    setQuery('');
    setIsLoading(true);

    try {
      // Check for premium features
      const premiumKeywords = ['report', 'comprehensive', 'detailed analysis', 'professional', 'expert'];
      if (premiumKeywords.some(keyword => currentQuery.toLowerCase().includes(keyword))) {
        setCurrentAddress(currentQuery);
        setShowPremiumModal(true);
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: currentQuery }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      setConversations(prev => [...prev, {
        question: currentQuery,
        answer: data.response || 'Sorry, I could not process your request at this time.'
      }]);

    } catch (error) {
      console.error('Error:', error);
      setConversations(prev => [...prev, {
        question: currentQuery,
        answer: 'Sorry, I encountered an error. Please try again later.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative">
      {/* Main Content Area with 90% transparent overlay */}
      <div className="flex-1 flex items-center justify-center relative" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
        <div className="max-w-3xl mx-auto w-full px-4 relative z-10">
          {/* Conversation History */}
          <div className="space-y-4 mb-4">
            {/* Welcome message that stays visible */}
            <div 
              className="text-center py-6 backdrop-blur-sm rounded-lg shadow-lg drop-shadow-sm"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}
            >
              <h1 className="font-bold text-gray-900 mb-4 text-[25px]" style={{fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif'}}>Can I Build It?</h1>
              <p className="text-gray-600 max-w-md mx-auto text-[12px] mb-6">
                Ask me about building, renovating, or developing property in New Zealand and I'll provide accurate information from official government sources.
              </p>
              
              {/* Input Form integrated into welcome message */}
              <div className="max-w-2xl mx-auto">
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
            </div>
            
            {conversations.map((item, index) => (
              <div 
                key={index} 
                className="space-y-3"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
              >
                {/* User Question */}
                <div className="flex justify-end">
                  <div 
                    className="max-w-[80%] p-3 rounded-lg backdrop-blur-sm"
                    style={{ backgroundColor: 'rgba(59, 130, 246, 0.8)' }}
                  >
                    <p className="text-white text-sm">{item.question}</p>
                  </div>
                </div>
                
                {/* AI Response */}
                <div className="flex justify-start">
                  <div 
                    className="max-w-[80%] p-3 rounded-lg backdrop-blur-sm border border-gray-200"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                  >
                    <div 
                      className="text-gray-800 text-sm whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ __html: item.answer }}
                    />
                  </div>
                </div>
              </div>
            ))}
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
                      <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                        Coming Soon
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">Get comprehensive property reports with official Auckland Council data, detailed zoning analysis, and expert recommendations for your specific project.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button 
                      onClick={() => setShowPlans(!showPlans)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                    >
                      {showPlans ? "Hide Plans" : "Show Plans"}
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Pricing Plans - Show when showPlans is true */}
              {showPlans && (
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
                      <div className="text-2xl font-bold mb-2 text-blue-600">$69</div>
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
      </div>

      {/* Side Map Tab */}
      <div className="w-80 h-screen relative">
        {/* Map Container */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${nzMapImage})`,
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
          }}
        />
        
        {/* 90% Transparent Overlay Content */}
        <div className="absolute inset-0 bg-white bg-opacity-10 backdrop-blur-sm">
          <div className="p-4 h-full flex flex-col" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 bg-white bg-opacity-70 backdrop-blur-sm p-2 rounded">
              New Zealand Map
            </h3>
            
            {/* Map Legend with transparent background */}
            <div className="bg-white bg-opacity-70 backdrop-blur-sm p-3 rounded mb-4">
              <h4 className="font-medium text-sm text-gray-800 mb-2">Property Zones</h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-gray-700">Residential</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span className="text-gray-700">Commercial</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded"></div>
                  <span className="text-gray-700">Industrial</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span className="text-gray-700">Mixed Use</span>
                </div>
              </div>
            </div>

            {/* Quick Stats with transparent background */}
            <div className="bg-white bg-opacity-70 backdrop-blur-sm p-3 rounded">
              <h4 className="font-medium text-sm text-gray-800 mb-2">Quick Stats</h4>
              <div className="space-y-1 text-xs text-gray-700">
                <div>Active Consents: 12,547</div>
                <div>Avg. Processing: 42 days</div>
                <div>Success Rate: 94%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Upgrade Modal */}
      <PremiumUpgradeModal 
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        initialAddress={currentAddress}
      />
    </div>
  );
}
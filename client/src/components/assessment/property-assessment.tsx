import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import nzMapImage from "@assets/NZ.png";
import AnimatedSuggestions from "@/components/animated-suggestions";
import { FormattedText } from "@/components/ui/formatted-text";


interface PropertyAssessmentProps {
  showPricing?: boolean;
}

export function PropertyAssessment({ showPricing = false }: PropertyAssessmentProps) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<{type: 'query' | 'response', content: string, showReportCTA?: boolean}[]>([]);
  const [currentAddress, setCurrentAddress] = useState("");
  const [showPlans, setShowPlans] = useState(showPricing);

  // Function to restart the chat
  const restartChat = () => {
    setConversations([]);
    setQuery("");
    setCurrentAddress("");
    setShowPlans(showPricing);
  };

  // Make restartChat available globally for sidebar
  if (typeof window !== 'undefined') {
    (window as any).restartChat = restartChat;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim() || query.length < 5) return;

    setIsLoading(true);

    try {
      // Add user query to conversation history
      setConversations(prev => [...prev, {type: 'query', content: query}]);

      // Extract potential address from query for premium modal
      const addressMatch = query.match(/\d+\s+[\w\s]+(street|road|avenue|drive|place|crescent|lane|way|terrace)/i);
      if (addressMatch) {
        setCurrentAddress(addressMatch[0]);
      }

      // Call the chat API for comprehensive responses
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
          plan: 'basic',
          conversationHistory: conversations.map(conv => ({
            id: Date.now().toString(),
            type: conv.type === 'query' ? 'user' : 'agent',
            content: conv.content,
            timestamp: new Date()
          }))
        }),
      });

      const data = await response.json();

      // Extract the response content
      let responseText = data.response || data.message || data.content || data.answer;

      // Check if this is a property-specific question that would benefit from a personalized report
      const isPropertySpecific = query.toLowerCase().includes('address') || 
                                query.toLowerCase().includes('property') ||
                                query.toLowerCase().includes('my house') ||
                                query.toLowerCase().includes('specific') ||
                                query.toLowerCase().includes('exact') ||
                                /\d+\s+\w+\s+(street|road|avenue|drive|place)/i.test(query);

      // Remove query analysis display for cleaner responses

      // Strategic guidance toward personalized reports for property-specific questions
      const shouldShowReportCTA = isPropertySpecific || data.queryAnalysis?.type === 'new_build' || data.queryAnalysis?.type === 'subdivision' || data.needsOfficialData;

      if (isPropertySpecific || data.queryAnalysis?.type === 'new_build' || data.queryAnalysis?.type === 'subdivision') {
        responseText += `\n\nUnlock special features\n\n🏡 Get a Personalized Property Report\nFor accurate, property-specific information including zoning details, consent requirements, and development potential for your exact address, I recommend getting a personalized property report. This will provide:

• Exact zoning rules for your property
• Building consent requirements specific to your site
• Resource consent implications
• Professional consultant recommendations
• Detailed development timeline and costs

Would you like to create a personalized property report for your specific project?`;
      } else if (data.needsOfficialData) {
        responseText += `\n\n💡 **For property-specific details and current regulations, a personalized property report would provide precise information tailored to your exact address and project requirements.**`;
      }

      // Add response to conversation history with CTA flag from server or local logic
      const showCTA = data.showReportCTA || shouldShowReportCTA || data.needsOfficialData;
      setConversations(prev => [...prev, {type: 'response', content: responseText, showReportCTA: showCTA}]);

      // Reset form
      setQuery("");

    } catch (error) {
      console.error("Error performing assessment:", error);
      const errorText = "I encountered an issue connecting to the New Zealand building data sources. To provide accurate property assessments, I need access to official government APIs like LINZ Data Service and Auckland Council GeoMaps. Please ensure these data connections are properly configured.";
      setConversations(prev => [...prev, {type: 'response', content: errorText}]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      {/* NZ Map Watermark Background */}
      <div 
        className="fixed inset-0 z-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `url(${nzMapImage})`,
          backgroundSize: '60%',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          animation: 'float 20s ease-in-out infinite',
        }}
      />
      <div className="max-w-3xl mx-auto relative z-10 w-full px-4">
        {/* Conversation History */}
        <div className="space-y-4 mb-4">
          {/* Welcome message that stays visible with input form */}
          <div 
            className="text-center py-6 backdrop-blur-sm rounded-lg shadow-lg drop-shadow-sm bg-[#ffffff61]"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}
          >
            <h1 className="font-bold text-gray-900 mb-4 text-[25px]" style={{fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif'}}>Can I Build It?</h1>

            {/* Input Form integrated into header */}
            <form onSubmit={handleSubmit} className="mt-4">
              <div className="flex items-end space-x-3 justify-center">
                <textarea 
                  className="w-[80%] p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[60px] max-h-[250px]"
                  placeholder="Ask about building regulations, zoning, or consent requirements..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  rows={2}
                  style={{
                    height: 'auto',
                    minHeight: '60px'
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 250) + 'px';
                  }}
                />
                <Button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  {isLoading ? 
                    <span className="animate-spin">⟳</span> : 
                    <ArrowRight className="h-4 w-4" />
                  }
                </Button>
              </div>
              <p className="text-xs text-gray-500" style={{ fontSize: '8px' }}>Shift+Enter for new line</p>
            </form>
          </div>

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
                <FormattedText content={item.content} />

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
                    <div className="text-2xl font-bold mb-2 text-blue-600">$79</div>
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
  );
}
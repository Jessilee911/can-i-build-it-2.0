import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, MapPin, FileText, Lightbulb } from "lucide-react";
import nzMapImage from "@assets/NZ.png";
import { FormattedText } from "@/components/ui/formatted-text";
import { PremiumUpgradeModal } from "@/components/premium-upgrade-modal";
import { LinzGeocodingMap } from "@/components/linz-geocoding-map";

export default function PropertyChat() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<{type: 'query' | 'response', content: string, showReportCTA?: boolean}[]>([]);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [currentAddress, setCurrentAddress] = useState("");
  const [locationData, setLocationData] = useState<any>(null);
  const [showLocationConfirm, setShowLocationConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim() || query.length < 5) return;
    
    setIsLoading(true);
    
    try {
      // Add user query to conversation history
      setConversations(prev => [...prev, {type: 'query', content: query}]);
      
      // Extract potential address from query for location confirmation
      const addressMatch = query.match(/\d+\s+[\w\s]+(street|road|avenue|drive|place|crescent|lane|way|terrace|heights)/i);
      if (addressMatch) {
        setCurrentAddress(addressMatch[0]);
        
        // Try to geocode the address for location confirmation
        try {
          const locationResponse = await fetch('/api/geocode-location', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ address: addressMatch[0] }),
          });
          
          if (locationResponse.ok) {
            const locationResult = await locationResponse.json();
            if (locationResult.success) {
              setLocationData(locationResult.location);
              setShowLocationConfirm(true);
              setIsLoading(false);
              return;
            }
          }
        } catch (error) {
          console.log('Location lookup failed, proceeding with standard assessment');
        }
      }
      
      // Call the backend API for enhanced property assessment
      const response = await fetch('/api/assess-property', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, agentType: 'can-i-build-it' }),
      });
      
      const data = await response.json();
      
      // Use the enhanced response with building-focused analysis
      let responseText = data.message;
      
      // Check if this is a property-specific question that would benefit from a personalized report
      const isPropertySpecific = query.toLowerCase().includes('address') || 
                                query.toLowerCase().includes('property') ||
                                query.toLowerCase().includes('my house') ||
                                query.toLowerCase().includes('specific') ||
                                query.toLowerCase().includes('exact') ||
                                /\d+\s+\w+\s+(street|road|avenue|drive|place)/i.test(query);
      
      // Enhanced building-focused guidance
      const shouldShowReportCTA = isPropertySpecific || data.queryAnalysis?.type === 'building_consent' || data.queryAnalysis?.type === 'development' || data.needsOfficialData;
      
      if (isPropertySpecific || data.queryAnalysis?.type === 'building_consent' || data.queryAnalysis?.type === 'development') {
        responseText += `\n\n🏗️ Enhanced Building Analysis Available\n\nFor your specific building project, I can provide comprehensive analysis including:
        
• Detailed building consent requirements and process
• Site-specific zoning constraints and opportunities  
• Construction feasibility assessment
• Professional contractor recommendations
• Timeline and cost estimates
• Resource consent implications

Would you like a detailed building feasibility report for your project?`;
      } else if (data.needsOfficialData) {
        responseText += `\n\n💡 **For precise building requirements and current regulations specific to your property, a detailed building analysis would provide accurate, up-to-date information tailored to your exact project.**`;
      }
      
      // Add response to conversation history
      const showCTA = data.showReportCTA || shouldShowReportCTA || data.needsOfficialData;
      setConversations(prev => [...prev, {type: 'response', content: responseText, showReportCTA: showCTA}]);
      
      // Reset form
      setQuery("");
      
    } catch (error) {
      console.error("Error performing enhanced assessment:", error);
      const errorText = "I encountered an issue accessing the building consent and zoning databases. To provide accurate building assessments, I need access to official government building data sources. Please ensure these data connections are properly configured.";
      setConversations(prev => [...prev, {type: 'response', content: errorText}]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationConfirm = async () => {
    setShowLocationConfirm(false);
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/assess-property', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query,
          locationData,
          agentType: 'can-i-build-it'
        }),
      });
      
      const data = await response.json();
      let responseText = data.message;
      
      // Add location-confirmed response with building focus
      setConversations(prev => [...prev, {
        type: 'response', 
        content: `Location confirmed: ${locationData.address}\nCoordinates: ${locationData.coordinates.latitude}, ${locationData.coordinates.longitude}\nZoning: Zone ${locationData.zoning?.ZONE || 'Information available'}\n\n${responseText}`,
        showReportCTA: true
      }]);
      
      setQuery("");
    } catch (error) {
      console.error("Error with location-confirmed assessment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationReject = () => {
    setShowLocationConfirm(false);
    setLocationData(null);
    
    // Proceed with standard assessment without location data
    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  const buildingSuggestions = [
    "Can I build a deck without consent?",
    "What are the setback rules for my zone?",
    "Do I need an architect for my extension?",
    "How much does building consent cost?",
    "Can I build a granny flat on my section?",
    "What building work is exempt from consent?"
  ];

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      {/* LINZ Geocoding Map Modal */}
      {showLocationConfirm && locationData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Verify Property Location</h3>
            <LinzGeocodingMap
              address={locationData.address}
              coordinates={locationData.coordinates}
              zoning={locationData.zoning}
              onLocationConfirm={(confirmed) => {
                if (confirmed) {
                  handleLocationConfirm();
                } else {
                  handleLocationReject();
                }
              }}
            />
          </div>
        </div>
      )}

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
          {conversations.length === 0 && (
            <div 
              className="text-center py-6 backdrop-blur-sm rounded-lg shadow-lg drop-shadow-sm"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}
            >
              <div className="flex items-center justify-center mb-4">
                <MapPin className="h-8 w-8 text-green-600 mr-3" />
                <h1 className="font-bold text-gray-900 text-[25px]" style={{fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif'}}>Property Research Agent 2</h1>
              </div>
              <p className="text-gray-600 max-w-md mx-auto text-[12px]">
                Comprehensive property research and analysis for New Zealand properties. Get detailed zoning information, market data, and development potential assessments.
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
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => setShowPremiumModal(true)}
                    >
                      Get Building Analysis
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
              className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Ask about building consent, construction requirements, or development feasibility..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button type="submit" disabled={isLoading} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
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
            {/* Building-focused suggestions */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {buildingSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setQuery(suggestion)}
                  className="text-left p-3 bg-white bg-opacity-80 backdrop-blur-sm rounded-lg border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-200 hover:bg-opacity-90"
                >
                  <div className="flex items-start space-x-2">
                    <Lightbulb className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{suggestion}</span>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="mt-4 bg-white bg-opacity-80 backdrop-blur-sm p-4 rounded-lg border border-gray-200 shadow-lg drop-shadow-sm">
              <div className="flex flex-col sm:flex-row items-center justify-between">
                <div className="mb-4 sm:mb-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Enhanced Building Analysis</h3>
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                      Available Now
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Get comprehensive building feasibility reports with detailed consent requirements, construction analysis, and professional contractor recommendations.</p>
                </div>
                <Button 
                  onClick={() => setShowPremiumModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
                >
                  Get Building Analysis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Premium Upgrade Modal */}
      <PremiumUpgradeModal 
        isOpen={showPremiumModal} 
        onClose={() => setShowPremiumModal(false)}
      />
    </div>
  );
}
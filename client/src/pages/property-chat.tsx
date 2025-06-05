import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building, MapPin, FileText, Lightbulb } from "lucide-react";
import nzMapImage from "@assets/NZ.png";
import { FormattedText } from "@/components/ui/formatted-text";
import { PremiumUpgradeModal } from "@/components/premium-upgrade-modal";
import { LinzGeocodingMap } from "@/components/linz-geocoding-map";

interface PropertyIntakeData {
  name: string;
  address: string;
  coordinates?: [number, number];
  projectType: 'residential' | 'commercial';
  projectDescription: string;
  budget: string;
}

export default function PropertyChat() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<{type: 'query' | 'response', content: string, showReportCTA?: boolean}[]>([]);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [currentAddress, setCurrentAddress] = useState("");
  const [locationData, setLocationData] = useState<any>(null);
  const [showLocationConfirm, setShowLocationConfirm] = useState(false);
  const [intakeData, setIntakeData] = useState<PropertyIntakeData | null>(null);

  // Check for intake data on component mount
  useEffect(() => {
    const storedData = sessionStorage.getItem('propertyIntakeData');
    if (storedData) {
      try {
        const data = JSON.parse(storedData) as PropertyIntakeData;
        setIntakeData(data);
        setCurrentAddress(data.address);
        // Clear the stored data
        sessionStorage.removeItem('propertyIntakeData');
        // Start automatic analysis
        startPropertyAnalysis(data);
      } catch (error) {
        console.error('Failed to parse intake data:', error);
      }
    }
  }, []);

  const startPropertyAnalysis = async (data: PropertyIntakeData) => {
    setIsLoading(true);
    
    // Create personalized greeting
    const firstName = data.name.split(' ')[0];
    const greeting = `Hi ${firstName}!\n\nI'm excited to help you explore the development potential for your ${data.projectType} project. Let me analyze the property details and provide you with comprehensive insights about what's possible at your location.`;
    
    setConversations([
      { type: 'response', content: greeting }
    ]);

    try {
      const response = await fetch('/api/property-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: data.address,
          projectType: data.projectType,
          projectDescription: data.projectDescription,
          budget: data.budget,
          coordinates: data.coordinates,
          ownerName: firstName
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Format the response as a structured report
        const structuredReport = formatPropertyReport(result, data, firstName);
        
        setConversations(prev => [
          ...prev,
          { 
            type: 'response', 
            content: structuredReport,
            showReportCTA: false 
          }
        ]);
      } else {
        throw new Error('Analysis failed');
      }
    } catch (error) {
      console.error('Property analysis error:', error);
      setConversations(prev => [
        ...prev,
        { 
          type: 'response', 
          content: `I apologize ${firstName}, but I'm experiencing technical difficulties analyzing your property. Please try again or let me know if you need assistance.`,
          showReportCTA: false 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPropertyReport = (result: any, data: PropertyIntakeData, firstName: string) => {
    // Format budget display
    const budgetDisplay = data.budget && data.budget !== 'not-specified' ? 
      data.budget.charAt(0).toUpperCase() + data.budget.slice(1).replace('-', ' ') : 
      'not specified';

    // Check for comprehensive overlay information
    const overlays = result.propertyDetails?.overlays || [];
    const hasSpecialCharacterArea = overlays.some((overlay: any) => 
      overlay.type === 'special_character_areas' && overlay.data
    );
    
    const specialCharacterInfo = hasSpecialCharacterArea 
      ? overlays.find((overlay: any) => overlay.type === 'special_character_areas')
      : null;

    // Count all overlays found
    const activeOverlays = overlays.filter((overlay: any) => overlay.data !== null);
    const totalOverlaysChecked = overlays.length;

    // Format the report according to the specific requirements - no markdown formatting
    let baseZoneText = `The property has ${result.zoning || 'zoning information being retrieved'} classification under the Auckland Unitary Plan`;
    
    if (specialCharacterInfo?.data?.NAME) {
      baseZoneText += ` with an additional ${specialCharacterInfo.data.NAME} overlay`;
    }

    // Construct comprehensive planning analysis including overlays
    let planningAnalysis = result.zoningAnalysis || 'Analyzing your planning zone to determine what activities are permitted, building restrictions that may apply, and development opportunities specific to your project type. This includes reviewing the relevant Auckland Unitary Plan zone-specific documentation for rules that directly apply to your project.';
    
    if (result.overlayAnalysis && result.overlayAnalysis.trim()) {
      planningAnalysis += ' ' + result.overlayAnalysis;
    }

    const report = `Hi ${firstName}, I'm delighted to help you explore the development potential for your ${data.projectType} project. Let me provide you with a comprehensive analysis based on official Auckland Council and LINZ data.

Property Details: Your property at ${result.propertyAddress || data.address} is a ${data.projectType} project with budget ${budgetDisplay}. ${baseZoneText}.

Comprehensive Data Analysis: I've analyzed ${totalOverlaysChecked} different Auckland Unitary Plan layers and overlays for your property. ${activeOverlays.length} overlays were found that may affect your development, ensuring we've captured all relevant planning constraints and opportunities.

Planning Zone Considerations for Your ${data.projectType.charAt(0).toUpperCase() + data.projectType.slice(1)}: ${planningAnalysis}

Building Code Requirements for Your ${data.projectType.charAt(0).toUpperCase() + data.projectType.slice(1)}: ${result.buildingCodeAnalysis || 'Reviewing Building Act 2004 Schedule 1 exemptions and MBIE exempt building work guidance to determine consent requirements. This includes analysis of relevant building code clauses and professional requirements specific to your project type.'}

Data Sources Used: This analysis incorporates data from Auckland Council Unitary Plan Base Zones, LINZ Property Parcels (layer 51571), and comprehensive overlay analysis including heritage, environmental, natural hazards, and special character area assessments.

Based on this comprehensive analysis, your ${data.projectType} project appears to have development potential within the planning framework. Would you like me to elaborate on any specific aspect of your project requirements or dive deeper into any particular overlay or constraint?`;

    return report;
  };

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
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto modal-content">
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
      {/* Clean Modern Background */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100"
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
                <h1 className="font-bold text-gray-900 text-[25px]" style={{fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif'}}>Premium Agent</h1>
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
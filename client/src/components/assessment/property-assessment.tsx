import { useState } from "react";
import { Button } from "@/components/ui/button";

// Define the property assessment result structure
interface AssessmentResult {
  requiresConsent: boolean;
  zoningAllows: boolean;
  zoneName: string;
  restrictions: string[];
  consultantsNeeded: string[];
  estimatedTimeframe: string;
  notes: string;
}

export function PropertyAssessment() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<{type: 'query' | 'response', content: string}[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim() || query.length < 5) return;
    
    setIsLoading(true);
    
    try {
      // Add user query to conversation history
      setConversations(prev => [...prev, {type: 'query', content: query}]);
      
      // In a real application, this would be an API call
      // Since we don't have the actual backend integration yet, we'll simulate a response
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Process the natural language query
      let buildingType = "unknown";
      let projectType = "unknown";
      
      const lowerQuery = query.toLowerCase();
      
      if (lowerQuery.includes("house") || lowerQuery.includes("home") || lowerQuery.includes("dwelling")) {
        buildingType = "single-dwelling";
      } else if (lowerQuery.includes("minor") || lowerQuery.includes("granny flat") || lowerQuery.includes("secondary")) {
        buildingType = "minor-dwelling";
      } else if (lowerQuery.includes("apartment") || lowerQuery.includes("units") || lowerQuery.includes("multi")) {
        buildingType = "multi-unit";
      } else if (lowerQuery.includes("commercial") || lowerQuery.includes("office") || lowerQuery.includes("retail")) {
        buildingType = "commercial";
      }
      
      if (lowerQuery.includes("build") || lowerQuery.includes("new") || lowerQuery.includes("construct")) {
        projectType = "new-build";
      } else if (lowerQuery.includes("renovate") || lowerQuery.includes("remodel") || lowerQuery.includes("extend")) {
        projectType = "renovation";
      } else if (lowerQuery.includes("subdivide") || lowerQuery.includes("split") || lowerQuery.includes("divide")) {
        projectType = "subdivision";
      } else if (lowerQuery.includes("change use") || lowerQuery.includes("convert")) {
        projectType = "change-of-use";
      }
      
      // Sample result based on analyzed query
      let result: AssessmentResult;
      
      if (buildingType === "single-dwelling" && projectType === "new-build") {
        result = {
          requiresConsent: true,
          zoningAllows: true,
          zoneName: "Residential - Single House Zone",
          restrictions: ["Height in relation to boundary", "Maximum site coverage 35%"],
          consultantsNeeded: ["Architect", "Structural Engineer", "Surveyor"],
          estimatedTimeframe: "8-12 weeks for consent processing",
          notes: "Your project appears to be a standard residential new build which is generally permitted in this zone, subject to standard development controls."
        };
      } else if (buildingType === "minor-dwelling" && projectType === "new-build") {
        result = {
          requiresConsent: true,
          zoningAllows: true,
          zoneName: "Residential - Single House Zone",
          restrictions: ["Maximum floor area 65m²", "Must share driveway with primary dwelling"],
          consultantsNeeded: ["Architect", "Planning Consultant"],
          estimatedTimeframe: "10-14 weeks for consent processing",
          notes: "Minor dwellings are generally permitted but have specific size and location requirements."
        };
      } else if (projectType === "renovation") {
        result = {
          requiresConsent: buildingType === "multi-unit",
          zoningAllows: true,
          zoneName: "Residential - Mixed Housing Urban Zone",
          restrictions: ["Internal building work may not require consent", "External changes likely need consent"],
          consultantsNeeded: ["Builder", "Building Consent Specialist"],
          estimatedTimeframe: "4-6 weeks for consent processing",
          notes: "Many internal renovations don't require consent, but structural changes will."
        };
      } else if (projectType === "subdivision") {
        result = {
          requiresConsent: true,
          zoningAllows: buildingType !== "multi-unit",
          zoneName: "Residential - Mixed Housing Suburban Zone",
          restrictions: ["Minimum lot size 400m²", "Requires resource and subdivision consent"],
          consultantsNeeded: ["Surveyor", "Planning Consultant", "Civil Engineer"],
          estimatedTimeframe: "16-20 weeks for consent processing",
          notes: "Subdivision is a complex process requiring multiple consents and likely professional assistance."
        };
      } else {
        result = {
          requiresConsent: true,
          zoningAllows: false,
          zoneName: "Commercial - Business Zone",
          restrictions: ["Residential development requires special permission", "Height restrictions apply"],
          consultantsNeeded: ["Resource Consent Planner", "Architect", "Lawyer"],
          estimatedTimeframe: "12-20 weeks for consent processing",
          notes: "Based on your description, your project may face zoning challenges. We recommend professional consultation."
        };
      }
      
      // Generate response text
      const responseText = `Based on your query, I've analyzed your project and found the following:

Zone: ${result.zoneName}

${result.zoningAllows ? "✅ Your project appears to be permitted in this zone." : "⚠️ Your project may face zoning challenges."}

${result.requiresConsent ? "You will need building consent for this project." : "This type of work may not require building consent, depending on specific details."}

Key restrictions to consider:
${result.restrictions.map(r => `• ${r}`).join('\n')}

Consultants you'll likely need:
${result.consultantsNeeded.map(c => `• ${c}`).join('\n')}

Estimated timeframe: ${result.estimatedTimeframe}

Additional notes: ${result.notes}

Would you like more specific information about any aspect of this assessment?`;
      
      // Add response to conversation history
      setConversations(prev => [...prev, {type: 'response', content: responseText}]);
      
      // Reset form
      setQuery("");
      
    } catch (error) {
      console.error("Error performing assessment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="max-w-3xl mx-auto">
        {/* Conversation History */}
        <div className="space-y-4 mb-6">
          {conversations.length === 0 && (
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-gray-700 mb-2">Welcome to Can I Build It?</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Describe your building project and I'll help you understand what consents you need and what's possible on your property.
              </p>
            </div>
          )}
          
          {conversations.map((item, index) => (
            <div 
              key={index} 
              className={`flex ${item.type === 'query' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] rounded-lg p-4 ${
                  item.type === 'query' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <div className="whitespace-pre-line">{item.content}</div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-4 max-w-[80%]">
                <div className="flex space-x-2 items-center">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Input Form */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <input 
              type="text"
              className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe your project (e.g., 'I want to build a new house in Auckland')" 
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
    </div>
  );
}

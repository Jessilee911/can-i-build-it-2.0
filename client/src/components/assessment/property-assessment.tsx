import { useState } from "react";
import { Button } from "@/components/ui/button";

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
      
      // Call the backend API for property assessment using real NZ data
      const response = await fetch('/api/assess-property', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      
      const data = await response.json();
      
      // Use the RAG-enhanced response that includes actual NZ building knowledge
      let responseText = data.message;
      
      // Add query analysis information if available
      if (data.queryAnalysis) {
        const analysis = data.queryAnalysis;
        if (analysis.type !== 'general') {
          responseText += `\n\n📋 Query Analysis: I've identified this as a ${analysis.type.replace('_', ' ')} inquiry`;
          if (analysis.buildingType) {
            responseText += ` regarding ${analysis.buildingType.replace('_', ' ')}`;
          }
          responseText += `.`;
        }
      }
      
      // Note about enhanced accuracy with official data
      if (data.needsOfficialData) {
        responseText += `\n\n💡 For property-specific details and current regulations, connecting to official government databases would provide even more precise information.`;
      }
      
      // Add response to conversation history
      setConversations(prev => [...prev, {type: 'response', content: responseText}]);
      
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
    <div className="space-y-6">
      <div className="max-w-3xl mx-auto">
        {/* Conversation History */}
        <div className="space-y-4 mb-6">
          {conversations.length === 0 && (
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-gray-700 mb-2">Welcome to Can I Build It?</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Ask me about building, renovating, or developing property in New Zealand and I'll provide accurate information from official government sources.
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
    </div>
  );
}
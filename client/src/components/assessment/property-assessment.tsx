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
      
      // Check if we need API setup for real data sources
      if (data.requiresApiSetup) {
        // For first question about API setup, show the setup message
        // For subsequent questions, provide helpful guidance based on what we can determine
        const isFirstApiRequest = conversations.filter(c => c.content.includes('data sources')).length === 0;
        
        let responseText;
        if (isFirstApiRequest) {
          responseText = `I'm ready to connect to authentic New Zealand building and zoning data sources to give you accurate, real-time information about your property development project.

To provide you with genuine assessments based on current regulations, I need access to:

${data.suggestedDataSources.map((source: string) => `• ${source}`).join('\n')}

These official data sources will allow me to:
• Check actual zoning rules for specific addresses
• Verify current building consent requirements
• Access real property boundary and ownership data
• Review up-to-date regional planning rules

Would you like to set up access to these data sources so I can provide authentic property assessments rather than general guidance?`;
        } else {
          // For follow-up questions, provide helpful general guidance while noting data source limitations
          responseText = `I understand you have another question about building regulations in New Zealand. While I'm working to connect to the official data sources for precise information, I can offer some general guidance:

For your specific query: "${query}"

This type of question typically requires checking official sources like council zoning maps and current building consent requirements. To give you the most accurate and up-to-date information, I'd need access to the government databases I mentioned earlier.

Would you like to continue with more questions, or shall we work on connecting to the official data sources for precise answers?`;
        }
        
        // Add response to conversation history
        setConversations(prev => [...prev, {type: 'response', content: responseText}]);
        
        // Reset form input but keep conversation flowing
        setQuery("");
        return;
      }
      
      // If we have real data, process it normally
      const responseText = data.message || "I've received your query and I'm working on connecting to the official New Zealand building and planning databases to provide you with accurate, up-to-date information.";
      
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
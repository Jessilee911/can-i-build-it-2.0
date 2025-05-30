import OpenAI from "openai";
import { searchKnowledgeBase, generateRAGResponse } from "./rag";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class GeneralAgent {
  /**
   * Agent 1: General planning advice assistant
   * Provides broad guidance on New Zealand building codes, planning, and development
   */
  async generateGeneralResponse(
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string }> = []
  ): Promise<string> {
    try {
      // Search knowledge base for relevant information
      const relevantKnowledge = searchKnowledgeBase(userMessage);
      
      // Create system prompt for general planning agent
      const systemPrompt = this.createGeneralSystemPrompt(relevantKnowledge);
      
      // Build conversation
      const messages = [
        { role: "system", content: systemPrompt },
        ...conversationHistory.slice(-6), // Keep last 6 messages for context
        { role: "user", content: userMessage }
      ];

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: messages as any,
        temperature: 0.7,
        max_tokens: 1000,
      });

      return response.choices[0].message.content || "I apologize, but I couldn't generate a response. Please try again.";
    } catch (error) {
      console.error("Error generating general response:", error);
      return "I'm experiencing technical difficulties. Please try again in a moment.";
    }
  }

  /**
   * Create system prompt for general planning agent
   */
  private createGeneralSystemPrompt(knowledgeBase: any[]): string {
    let knowledgeContext = "";
    
    if (knowledgeBase.length > 0) {
      knowledgeContext = "\n\nRELEVANT KNOWLEDGE BASE:\n";
      knowledgeBase.slice(0, 5).forEach((item, index) => {
        knowledgeContext += `${index + 1}. ${item.source}: ${item.content.substring(0, 300)}...\n`;
      });
    }

    return `You are Agent 1, a general planning and building development assistant for New Zealand. You provide comprehensive guidance on building codes, planning regulations, consent processes, and development principles across New Zealand.

YOUR EXPERTISE:
• New Zealand Building Code requirements and interpretations
• Resource Management Act and planning processes
• Building consent and resource consent procedures
• General zoning principles and development rules
• Construction standards and building practices
• Professional guidance for architects, builders, and developers

RESPONSE GUIDELINES:
• Provide clear, authoritative guidance based on New Zealand regulations
• Explain building code requirements in practical terms
• Outline consent processes and typical requirements
• Suggest when professional consultation is needed
• Reference relevant building code sections when applicable
• Give general principles rather than property-specific advice
• Be educational and help users understand the regulatory framework

FOR PROPERTY-SPECIFIC ADVICE:
When users ask about specific properties, suggest they use Agent 2 (property-specific assistant) which can access official property data and provide tailored recommendations.

IMPORTANT:
• Focus on general principles and regulations
• Always recommend professional consultation for complex projects
• Explain "why" behind requirements, not just "what"
• Help users understand the broader planning and building framework
• Reference official sources like MBIE, council websites, and building codes${knowledgeContext}

Remember: You provide general planning wisdom and regulatory guidance. For specific property analysis, users should consult Agent 2 with their property address.`;
  }

  /**
   * Analyze user query to suggest appropriate agent
   */
  static analyzeQuery(message: string): {
    suggestedAgent: 'agent_1' | 'agent_2';
    reason: string;
    containsAddress: boolean;
  } {
    const addressPatterns = [
      /\d+\s+[\w\s]+(?:street|road|avenue|drive|lane|crescent|place|way|terrace|grove)/i,
      /\d+\/\d+\s+[\w\s]+/i, // Unit numbers
      /lot\s+\d+/i,
      /\d+\s+[\w\s]+,\s*[\w\s]+/i // Address with suburb
    ];

    const containsAddress = addressPatterns.some(pattern => pattern.test(message));
    
    const propertySpecificKeywords = [
      'my property', 'this property', 'our site', 'this address',
      'can I build', 'zoning for', 'my land', 'this lot'
    ];
    
    const hasPropertyContext = propertySpecificKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );

    if (containsAddress || hasPropertyContext) {
      return {
        suggestedAgent: 'agent_2',
        reason: 'This query appears to be about a specific property and would benefit from property-specific data and analysis.',
        containsAddress
      };
    }

    return {
      suggestedAgent: 'agent_1',
      reason: 'This query is about general planning principles and building regulations.',
      containsAddress: false
    };
  }
}

export const generalAgent = new GeneralAgent();
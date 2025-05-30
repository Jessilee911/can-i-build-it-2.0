import OpenAI from "openai";
import { aucklandCouncilAPI } from "./auckland-council-api";
import { searchKnowledgeBase, generateRAGResponse } from "./rag";
import { getZoneInfo } from "./auckland-zone-lookup";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface PropertyAgentContext {
  propertyAddress: string;
  propertyData?: any;
  zoning?: string;
  coordinates?: [number, number];
  verificationStatus?: string;
  userName?: string;
  projectDescription?: string;
}

export class PropertyAgent {
  /**
   * Agent 2: Property-specific AI assistant
   * Provides contextual advice based on specific property data
   */
  async generatePropertyResponse(
    userMessage: string,
    context: PropertyAgentContext,
    conversationHistory: Array<{ role: string; content: string }> = []
  ): Promise<string> {
    try {
      // Prepare property context for AI
      const propertyContext = await this.buildPropertyContext(context);
      
      // Create system prompt for property-specific agent
      const systemPrompt = this.createPropertySystemPrompt(propertyContext);
      
      // Build conversation with context
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
      console.error("Error generating property response:", error);
      return "I'm experiencing technical difficulties. Please try again in a moment.";
    }
  }

  /**
   * Initialize property context for Agent 2
   */
  async initializePropertyContext(propertyAddress: string): Promise<PropertyAgentContext> {
    try {
      // Search for property data using Auckland Council API
      const propertyResults = await aucklandCouncilAPI.searchPropertyByAddress(propertyAddress);
      
      if (propertyResults.length === 0) {
        return {
          propertyAddress,
          verificationStatus: "not_found"
        };
      }

      const propertyData = propertyResults[0];
      
      return {
        propertyAddress,
        propertyData,
        zoning: propertyData.zoning,
        coordinates: propertyData.coordinates,
        verificationStatus: "verified"
      };
    } catch (error) {
      console.error("Error initializing property context:", error);
      return {
        propertyAddress,
        verificationStatus: "error"
      };
    }
  }

  /**
   * Build comprehensive property context for AI
   */
  private async buildPropertyContext(context: PropertyAgentContext): Promise<string> {
    let propertyInfo = `Client Name: ${context.userName || 'Client'}\n`;
    propertyInfo += `Property Address: ${context.propertyAddress}\n`;
    if (context.projectDescription) {
      propertyInfo += `Project Description: ${context.projectDescription}\n\n`;
    } else {
      propertyInfo += '\n';
    }

    if (context.verificationStatus === "not_found") {
      propertyInfo += "⚠️ Property Status: Could not locate this property in Auckland Council records.\n";
      propertyInfo += "Note: Property-specific advice may be limited without official data.\n\n";
      return propertyInfo;
    }

    if (context.verificationStatus === "error") {
      propertyInfo += "⚠️ Property Status: Unable to retrieve property data due to technical issues.\n\n";
      return propertyInfo;
    }

    if (context.propertyData) {
      propertyInfo += "✅ Property Status: Verified in Auckland Council records\n\n";
      
      // Add property details
      if (context.propertyData.suburb) {
        propertyInfo += `Suburb: ${context.propertyData.suburb}\n`;
      }
      
      if (context.zoning) {
        propertyInfo += `Official Zoning: ${context.zoning}\n`;
        
        // Add zone interpretation if available
        const zoneMatch = context.zoning.match(/Zone (\d+)/);
        if (zoneMatch) {
          const zoneCode = parseInt(zoneMatch[1]);
          const zoneInfo = getZoneInfo(zoneCode);
          if (zoneInfo) {
            propertyInfo += `Zone Description: ${zoneInfo.description}\n`;
            propertyInfo += `Zone Category: ${zoneInfo.category}\n`;
            propertyInfo += `Key Building Rules:\n${zoneInfo.buildingRules.map(rule => `• ${rule}`).join('\n')}\n`;
          }
        }
      }
      
      if (context.propertyData.landArea) {
        propertyInfo += `Land Area: ${context.propertyData.landArea}m²\n`;
      }
      
      if (context.propertyData.capitalValue) {
        propertyInfo += `Capital Value: $${context.propertyData.capitalValue.toLocaleString()}\n`;
      }
      
      if (context.coordinates) {
        propertyInfo += `Coordinates: ${context.coordinates[1]}, ${context.coordinates[0]}\n`;
      }
      
      propertyInfo += "\n";
    }

    return propertyInfo;
  }

  /**
   * Create system prompt for property-specific agent
   */
  private createPropertySystemPrompt(propertyContext: string): string {
    return `You are Agent 2, a specialized property development assistant for New Zealand. You provide specific, actionable advice based on verified property data and official Auckland Council information.

PROPERTY CONTEXT:
${propertyContext}

YOUR ROLE:
• Provide property-specific building and development advice
• Reference official Auckland Council zoning data and regulations
• Give actionable guidance based on the verified property information
• Explain consent requirements specific to this property's zoning
• Suggest next steps tailored to this property's constraints and opportunities

RESPONSE GUIDELINES:
• Always reference the specific property address and verified data
• Provide concrete, actionable advice rather than general information
• Explain how zoning rules apply specifically to this property
• Mention relevant building consent and resource consent requirements
• Include specific building standards (height, coverage, setbacks) when applicable
• Suggest appropriate professionals if specialized advice is needed
• Be conversational but authoritative, using verified data to support recommendations

IMPORTANT:
• Only provide advice based on the verified property data provided
• If property data is unavailable, clearly state limitations
• Always recommend professional consultation for complex projects
• Reference official Auckland Council sources when possible
• Focus on practical, implementable advice for this specific property

Remember: You are specifically helping with this property at ${propertyContext.includes('Property Address:') ? propertyContext.split('\n')[0].replace('Property Address: ', '') : 'the specified address'}. All advice should be tailored to its unique characteristics and official zoning designation.`;
  }

  /**
   * Validate if a property address is suitable for Agent 2
   */
  static validatePropertyAddress(address: string): { isValid: boolean; message?: string } {
    if (!address || address.trim().length < 10) {
      return {
        isValid: false,
        message: "Please provide a complete property address for property-specific advice."
      };
    }

    // Check for Auckland context (Agent 2 currently focuses on Auckland)
    const aucklandKeywords = ['auckland', 'torbay', 'devonport', 'newmarket', 'remuera', 'ponsonby', 'parnell'];
    const hasAucklandContext = aucklandKeywords.some(keyword => 
      address.toLowerCase().includes(keyword)
    );

    if (!hasAucklandContext) {
      return {
        isValid: true,
        message: "Note: Property-specific data is most comprehensive for Auckland properties."
      };
    }

    return { isValid: true };
  }
}

export const propertyAgent = new PropertyAgent();
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

      const rawResponse = response.choices[0].message.content || "I apologize, but I couldn't generate a response. Please try again.";
      
      // Clean up markdown formatting
      const cleanResponse = rawResponse
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove **bold** formatting
        .replace(/\*(.*?)\*/g, '$1')     // Remove *italic* formatting
        .replace(/_{2,}(.*?)_{2,}/g, '$1'); // Remove __underline__ formatting
      
      return cleanResponse;
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
      
      // Note: Overlay data (special character areas, heritage, liquefaction, etc.) has been simplified
      // Only Unitary Plan Base Zone data is now included for focused zoning guidance
      
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
• ALWAYS start by acknowledging the specific zone information from Auckland Council data
• Quote the exact zone name and number (e.g., "Zone 19 - Residential Single House Zone")
• Reference specific building rules from the zone data (height limits, coverage percentages, setbacks)
• Quote specific building coverage percentages and height limits from the zone rules
• Explain how the project fits within the specific zoning parameters
• Use the actual property data rather than generic advice
• Be conversational but cite the official Auckland Council information
• Use clean formatting without markdown asterisks or bold text markers
• Use numbered lists (1. 2. 3.) and bullet points (•) for organization
• Keep text readable and professional without special formatting characters

CRITICAL REQUIREMENTS:
• MUST reference the exact zone number and name from the Auckland Council data above
• MUST quote specific building rules (height, coverage, setbacks) from the zone information
• MUST cite the specific Auckland Council zoning information rather than giving generic advice
• Focus on practical, implementable advice using the verified zoning data
• Always recommend professional consultation for complex projects

EXAMPLE START: "Based on the Auckland Council records, your property at [address] is zoned as [exact zone name and number]. This zone allows [specific rules from zone data]..."

Remember: You are specifically helping with this property. Use the exact Auckland Council data provided above, not general planning advice.`;
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
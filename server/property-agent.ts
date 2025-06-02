import OpenAI from "openai";
import { aucklandCouncilAPI } from "./auckland-council-api";
import { searchKnowledgeBase, generateRAGResponse } from "./rag";
import { getZoneInfo } from "./auckland-zone-lookup";
import { pdfPlanningProcessor } from "./pdf-planning-processor";

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
    let propertyInfo = `COMPREHENSIVE PROPERTY ANALYSIS REPORT\n`;
    propertyInfo += `==========================================\n\n`;
    
    // Property Address
    propertyInfo += `Property Address: ${context.propertyAddress}\n`;
    
    // Lot and DP Number
    const lotDp = this.extractLotDP(context.propertyData);
    propertyInfo += `Lot and DP number: ${lotDp || 'Not available in current data'}\n`;
    
    // District/Planning Zone
    const zoneInfo = this.formatZoneInfo(context.zoning, context.propertyData);
    propertyInfo += `District/Planning Zone: ${zoneInfo}\n`;
    
    // Overlays
    const overlays = this.formatOverlays(context.propertyData?.overlays);
    propertyInfo += `Overlays: ${overlays}\n`;
    
    // Controls
    const controls = this.extractControls(context.propertyData);
    propertyInfo += `Controls: ${controls}\n`;
    
    // Flood hazards
    const floodInfo = this.extractFloodInfo(context.propertyData);
    propertyInfo += `Flood hazards (catchment and hydrology)/information: ${floodInfo}\n`;
    
    // Overland flow paths
    const overlandFlow = this.extractOverlandFlow(context.propertyData);
    propertyInfo += `Overland flow paths: ${overlandFlow}\n`;
    
    // Natural hazards
    const naturalHazards = this.extractNaturalHazards(context.propertyData);
    propertyInfo += `Natural hazards: ${naturalHazards}\n`;
    
    // Special character zones, overlays
    const specialCharacter = this.extractSpecialCharacter(context.propertyData);
    propertyInfo += `Special character zones, overlays: ${specialCharacter}\n`;
    
    // Wind Zone
    const windZone = this.getWindZone(context.coordinates);
    propertyInfo += `Wind Zone: ${windZone}\n`;
    
    // Earthquake Zone
    const earthquakeZone = this.getEarthquakeZone(context.coordinates);
    propertyInfo += `Earthquake Zone: ${earthquakeZone}\n`;
    
    // Snow Zone
    const snowZone = this.getSnowZone(context.coordinates);
    propertyInfo += `Snow Zone: ${snowZone}\n`;
    
    // Corrosion Zones
    const corrosionZone = this.getCorrosionZone(context.coordinates);
    propertyInfo += `Corrosion Zones: ${corrosionZone}\n\n`;

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

      // Fetch detailed planning rules from Auckland Council documents
      if (context.zoning) {
        try {
          const extractedZoneCode = pdfPlanningProcessor.extractZoneCode(context.zoning);
          if (extractedZoneCode) {
            console.log(`Fetching detailed planning rules for zone ${extractedZoneCode}...`);
            const detailedRules = await pdfPlanningProcessor.getZoneBuildingRules(extractedZoneCode);
            if (detailedRules) {
              propertyInfo += `DETAILED PLANNING RULES FOR ZONE ${extractedZoneCode}\n`;
              propertyInfo += `================================================\n`;
              propertyInfo += `${detailedRules}\n\n`;
            }
            
            // Get consent requirements
            if (context.projectDescription?.toLowerCase().includes('garage') || 
                context.projectDescription?.toLowerCase().includes('building')) {
              const consentInfo = await pdfPlanningProcessor.getZoneConsentRequirements(extractedZoneCode, "building");
              if (consentInfo) {
                propertyInfo += `CONSENT REQUIREMENTS FROM OFFICIAL DOCUMENTS\n`;
                propertyInfo += `============================================\n`;
                propertyInfo += `${consentInfo}\n\n`;
              }
            }
          }
        } catch (error) {
          console.error("Error fetching detailed planning rules:", error);
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

  private extractLotDP(propertyData: any): string | null {
    if (!propertyData?.overlays) return null;
    
    // Look for lot and DP information in property data
    for (const overlay of propertyData.overlays) {
      if (overlay.data?.LOT || overlay.data?.DP || overlay.data?.LEGAL_DESCRIPTION) {
        const lot = overlay.data.LOT || '';
        const dp = overlay.data.DP || '';
        const legal = overlay.data.LEGAL_DESCRIPTION || '';
        
        if (lot && dp) return `Lot ${lot} DP ${dp}`;
        if (legal) return legal;
      }
    }
    return null;
  }

  private formatOverlays(overlays: any[]): string {
    if (!overlays || overlays.length === 0) return 'None identified';
    
    const overlayTypes = overlays.map(o => {
      switch (o.type) {
        case 'special_character_areas': return 'Special Character Areas';
        case 'heritage_overlay': return 'Historic Heritage';
        case 'notable_trees': return 'Notable Trees';
        case 'aircraft_noise': return 'Aircraft Noise';
        case 'ridgeline_protection': return 'Ridgeline Protection';
        case 'coastal_inundation': return 'Coastal Inundation';
        case 'liquefaction_vulnerability': return 'Liquefaction Vulnerability';
        case 'geotechnical_reports': return 'Geotechnical Study Area';
        default: return o.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
    });
    
    return overlayTypes.join(', ');
  }

  private extractControls(propertyData: any): string {
    const controls = [];
    
    if (propertyData?.overlays) {
      for (const overlay of propertyData.overlays) {
        if (overlay.type === 'heritage_overlay') controls.push('Heritage controls');
        if (overlay.type === 'special_character_areas') controls.push('Special character controls');
        if (overlay.type === 'notable_trees') controls.push('Tree protection controls');
        if (overlay.type === 'aircraft_noise') controls.push('Aircraft noise controls');
      }
    }
    
    return controls.length > 0 ? controls.join(', ') : 'Standard planning controls apply';
  }

  private extractFloodInfo(propertyData: any): string {
    if (!propertyData?.overlays) return 'No flood hazard information available in current dataset';
    
    const floodOverlay = propertyData.overlays.find((o: any) => 
      o.type.includes('flood') || o.type.includes('inundation')
    );
    
    if (floodOverlay) {
      return `Flood sensitive area identified - detailed assessment required`;
    }
    
    return 'No flood hazards identified in available data';
  }

  private extractOverlandFlow(propertyData: any): string {
    return 'Overland flow path information not available in current dataset - site-specific assessment recommended';
  }

  private extractNaturalHazards(propertyData: any): string {
    const hazards = [];
    
    if (propertyData?.overlays) {
      for (const overlay of propertyData.overlays) {
        if (overlay.type === 'liquefaction_vulnerability') {
          const data = overlay.data;
          const vulnerability = data?.Vulnerability || data?.VulnerabilityDescription || data?.attributes?.Vulnerability || data?.attributes?.VulnerabilityDescription;
          const level = data?.LiquefactionAssessmentLevel || data?.attributes?.LiquefactionAssessmentLevel;
          
          if (vulnerability) {
            let hazardText = `Liquefaction vulnerability: ${vulnerability}`;
            if (level) hazardText += ` (Assessment Level ${level})`;
            hazards.push(hazardText);
          }
        }
        if (overlay.type === 'geotechnical_reports') {
          const data = overlay.data;
          const reportId = data?.GeotechExtentID || data?.attributes?.GeotechExtentID;
          let hazardText = 'Geotechnical study area';
          if (reportId) hazardText += ` (Report ID: ${reportId})`;
          hazards.push(hazardText);
        }
      }
    }
    
    return hazards.length > 0 ? hazards.join(', ') : 'No specific natural hazards identified in available data';
  }

  private extractSpecialCharacter(propertyData: any): string {
    if (!propertyData?.overlays) return 'None';
    
    const specialCharacterOverlay = propertyData.overlays.find((o: any) => 
      o.type === 'special_character_areas'
    );
    
    if (specialCharacterOverlay) {
      const data = specialCharacterOverlay.data;
      const type = data?.TYPE || data?.attributes?.TYPE;
      const name = data?.NAME || data?.attributes?.NAME;
      const schedule = data?.SCHEDULE || data?.attributes?.SCHEDULE;
      
      let result = 'Special Character Areas Overlay Residential and Business';
      if (type) result += ` - Type ${type}`;
      if (name) result += ` - ${name}`;
      if (schedule) result += ` - Schedule ${schedule}`;
      
      return result;
    }
    
    return 'None';
  }

  private getWindZone(coordinates?: [number, number]): string {
    // Auckland is generally in Wind Zone 3 (NZS 3604)
    if (coordinates && coordinates[0] > -37.5 && coordinates[0] < -36.0) {
      return 'Wind Zone 3 (NZS 3604)';
    }
    return 'Wind Zone 3 (typical for Auckland region)';
  }

  private getEarthquakeZone(coordinates?: [number, number]): string {
    // Auckland is in a low seismic risk area
    if (coordinates && coordinates[0] > -37.5 && coordinates[0] < -36.0) {
      return 'Low seismic risk zone (NZS 1170.5)';
    }
    return 'Low seismic risk zone (typical for Auckland region)';
  }

  private getSnowZone(coordinates?: [number, number]): string {
    // Auckland typically has no snow loading requirements
    if (coordinates && coordinates[0] > -37.5 && coordinates[0] < -36.0) {
      return 'No snow loading (NZS 1170.3)';
    }
    return 'No snow loading (typical for Auckland region)';
  }

  private getCorrosionZone(coordinates?: [number, number]): string {
    // Auckland coastal areas are typically Zone C (corrosive)
    if (coordinates) {
      return 'Zone C - Corrosive environment (coastal Auckland)';
    }
    return 'Zone C - Corrosive environment (typical for Auckland coastal areas)';
  }

  private formatZoneInfo(zoning: string | undefined, propertyData: any): string {
    if (!zoning) return 'Zone information not available';
    
    // If we have H3 zone, provide full Unitary Plan Base Zone information
    if (zoning === 'H3') {
      return `${zoning} - Residential - Single House Zone (Auckland Unitary Plan Base Zone)`;
    }
    
    // Map other common zones
    const zoneDescriptions: { [key: string]: string } = {
      'H1': 'H1 - Residential - Large Lot Zone (Auckland Unitary Plan Base Zone)',
      'H2': 'H2 - Residential - Rural and Coastal Settlement Zone (Auckland Unitary Plan Base Zone)',
      'H4': 'H4 - Residential - Mixed Housing Suburban Zone (Auckland Unitary Plan Base Zone)',
      'H5': 'H5 - Residential - Mixed Housing Urban Zone (Auckland Unitary Plan Base Zone)',
      'H6': 'H6 - Residential - Terrace Housing and Apartment Building Zone (Auckland Unitary Plan Base Zone)',
    };
    
    return zoneDescriptions[zoning] || `${zoning} (Auckland Unitary Plan Base Zone)`;
  }

  /**
   * Create system prompt for property-specific agent
   */
  private createPropertySystemPrompt(propertyContext: string): string {
    return `You are Agent 2, a specialized property development assistant for New Zealand. You provide specific, actionable advice based on verified property data and official Auckland Council information.

PROPERTY CONTEXT:
${propertyContext}

RESPONSE STRUCTURE - ALWAYS FOLLOW THIS FORMAT:

1. COMPREHENSIVE PROPERTY REPORT:
First, present the property analysis information using the standardized format from the property context above:
- Property Address
- Lot and DP number
- District/Planning Zone
- Overlays
- Controls
- Flood hazards information
- Overland flow paths
- Natural hazards
- Special character zones, overlays
- Wind Zone
- Earthquake Zone
- Snow Zone
- Corrosion Zones

2. CONSENT AND BUILDING CODE REQUIREMENTS:
After presenting the property report, provide specific guidance on:

BUILDING CONSENT REQUIREMENTS:
• What building consent is required for the proposed project
• Specific building code clauses that apply (B1 Structure, B2 Durability, E1 Surface Water, E2 External Moisture, etc.)
• Structural requirements considering natural hazards identified
• Foundation requirements (especially if liquefaction or geotechnical considerations apply)
• Any special requirements due to wind, earthquake, snow, or corrosion zones

RESOURCE CONSENT REQUIREMENTS:
• Whether resource consent is needed based on zone rules and overlays
• Activity status (Permitted/Controlled/Restricted Discretionary/Non-complying)
• Specific planning standards that must be met (height, setbacks, coverage)
• Assessment criteria if discretionary consent required
• Special considerations for overlays (heritage, special character, etc.)

COMPLIANCE PATHWAY:
• Step-by-step process for obtaining necessary consents
• Professional consultants required (architect, structural engineer, geotechnical engineer, planner)
• Timeline and cost considerations
• Council submission requirements and processes

YOUR ROLE:
• Provide property-specific building and development advice
• Reference official Auckland Council zoning data and planning documents
• Give actionable guidance based on verified property information
• Explain exact consent requirements for this specific property

CRITICAL REQUIREMENTS:
• MUST present the comprehensive property report first using the exact format above
• MUST reference specific zone rules from Auckland Council planning documents
• MUST address all overlays and their implications for the project
• MUST provide specific building code and consent requirements
• MUST give practical implementation guidance with exact compliance steps
• Use the actual property data rather than generic advice
• Be professional and cite official Auckland Council information

Remember: You are specifically helping with this property. Use the exact Auckland Council data provided above to give authoritative, property-specific guidance.`;
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
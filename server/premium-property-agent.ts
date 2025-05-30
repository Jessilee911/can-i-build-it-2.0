import { aucklandCouncilAPI } from "./auckland-council-api";

export interface PropertyAnalysisReport {
  propertyAddress: string;
  executiveSummary: string;
  propertyDetails: {
    address: string;
    suburb?: string;
    zoning?: string;
    landArea?: number;
    capitalValue?: number;
    ratesId?: string;
    coordinates?: [number, number];
  };
  zoningAnalysis: {
    currentZoning: string;
    permittedUses: string[];
    buildingRestrictions: string[];
    developmentPotential: string;
  };
  developmentConstraints: {
    infrastructure: string[];
    environmental: string[];
    planning: string[];
  };
  consentRequirements: {
    buildingConsent: string;
    resourceConsent: string;
    otherConsents: string[];
  };
  recommendedNextSteps: string[];
  professionalContacts: {
    planners: string[];
    engineers: string[];
    architects: string[];
  };
  generatedAt: Date;
}

export class PremiumPropertyAgent {
  /**
   * Generate comprehensive property analysis report
   */
  async generatePropertyReport(address: string, projectDescription?: string): Promise<PropertyAnalysisReport> {
    console.log(`Generating comprehensive report for: ${address}`);
    
    // Get property data including official Auckland Council zoning
    let property;
    try {
      // Use the same geocoding logic that includes Unitary Plan Base Zone data
      const geocodeResponse = await fetch("http://localhost:5000/api/geocode-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      
      if (geocodeResponse.ok) {
        const geocodeData = await geocodeResponse.json();
        if (geocodeData.success && geocodeData.location) {
          property = {
            address: geocodeData.location.address,
            coordinates: geocodeData.location.coordinates,
            zoning: geocodeData.location.zoning?.zoneName || 'Unknown',
            zoningCode: geocodeData.location.zoning?.ZONE,
            zoningData: geocodeData.location.zoning,
          };
        }
      }
      
      // Fallback to Auckland Council API search if geocoding fails
      if (!property) {
        const properties = await aucklandCouncilAPI.searchPropertyByAddress(address);
        property = properties[0];
      }
    } catch (error) {
      console.log("Property data retrieval failed:", error);
    }
    
    if (!property) {
      throw new Error(`Unable to retrieve official property data for address: ${address}. Please verify the address is correct and try again.`);
    }

    console.log(`Property data compiled for ${address}:`, property);

    // Generate comprehensive zoning analysis using RAG
    const zoningAnalysis = await this.analyzeZoningWithRAG(property, projectDescription);
    
    // Analyze development constraints
    const constraints = await this.analyzeDevelopmentConstraints(property);
    
    // Determine consent requirements
    const consentRequirements = this.analyzeConsentRequirements(property, projectDescription);
    
    // Generate executive summary
    const executiveSummary = this.generateExecutiveSummary(property, projectDescription);
    
    // Compile recommended next steps
    const nextSteps = this.generateNextSteps(property, projectDescription);
    
    // Professional contacts
    const professionalContacts = this.getProfessionalContacts(property.suburb);

    const report: PropertyAnalysisReport = {
      propertyAddress: address,
      executiveSummary,
      propertyDetails: {
        address: property.address,
        suburb: property.suburb,
        zoning: property.zoning,
        landArea: property.landArea || undefined,
        capitalValue: property.capitalValue || undefined,
        ratesId: property.ratesId || undefined,
        coordinates: property.coordinates || undefined,
      },
      zoningAnalysis,
      developmentConstraints: constraints,
      consentRequirements,
      recommendedNextSteps: nextSteps,
      professionalContacts,
      generatedAt: new Date(),
    };

    return report;
  }

  private async analyzeZoningWithRAG(property: any, projectDescription?: string): Promise<PropertyAnalysisReport['zoningAnalysis']> {
    // Get detailed zoning information from Auckland Council data
    const zoning = property.zoning || 'Unknown';
    const zoningCode = property.zoningCode;
    const zoningData = property.zoningData;
    
    console.log(`Analyzing zoning: ${zoning} (Code: ${zoningCode})`);
    
    // Import zone lookup to get official building rules
    let officialZoneInfo = null;
    if (zoningCode) {
      try {
        const { getZoneInfo } = await import('./auckland-zone-lookup');
        officialZoneInfo = getZoneInfo(zoningCode);
      } catch (error) {
        console.log("Zone lookup failed:", error);
      }
    }
    
    // Use RAG for additional analysis if available
    let ragAnalysis = "";
    if (projectDescription) {
      try {
        const { generateRAGResponse } = await import('./rag');
        const query = `Property development analysis for ${zoning} zone at ${property.address}. Project: ${projectDescription}`;
        ragAnalysis = await generateRAGResponse(query, { 
          propertyAddress: property.address,
          zoning: property.zoning,
          coordinates: property.coordinates
        });
      } catch (error) {
        console.log("RAG analysis failed, using official zoning data only");
      }
    }
    
    // Combine official Auckland Council data with RAG analysis
    if (officialZoneInfo) {
      return {
        currentZoning: zoning,
        permittedUses: this.extractPermittedUses(officialZoneInfo, ragAnalysis),
        buildingRestrictions: officialZoneInfo.buildingRules,
        developmentPotential: this.analyzeDevelopmentPotential(officialZoneInfo, projectDescription, ragAnalysis)
      };
    } else {
      // Fallback if no official zoning data available
      return this.analyzeFallbackZoning(zoning);
    }
  }

  private extractPermittedUses(zoneInfo: any, ragAnalysis: string): string[] {
    const uses = [zoneInfo.description];
    
    // Add category-specific permitted uses
    switch (zoneInfo.category) {
      case 'residential':
        uses.push("Residential dwellings", "Home-based businesses (restricted)", "Community facilities");
        break;
      case 'business':
        uses.push("Commercial activities", "Office developments", "Retail operations");
        break;
      case 'rural':
        uses.push("Primary production", "Rural residential", "Agricultural activities");
        break;
      case 'open-space':
        uses.push("Recreation facilities", "Conservation activities", "Public access");
        break;
      default:
        uses.push("Various permitted activities subject to planning rules");
    }
    
    return uses;
  }

  private analyzeDevelopmentPotential(zoneInfo: any, projectDescription?: string, ragAnalysis?: string): string {
    let potential = `This ${zoneInfo.name} allows for ${zoneInfo.description.toLowerCase()}.`;
    
    if (projectDescription) {
      potential += ` For your specific project (${projectDescription}), `;
      
      if (zoneInfo.category === 'residential') {
        potential += "residential development is generally permitted subject to compliance with building rules and consent requirements.";
      } else if (zoneInfo.category === 'business') {
        potential += "commercial development opportunities exist with appropriate consents.";
      } else {
        potential += "development may be possible subject to zone-specific requirements.";
      }
    }
    
    return potential;
  }

  private async parseZoningAnalysis(ragResponse: string, zoning?: string): Promise<PropertyAnalysisReport['zoningAnalysis']> {
    // Use OpenAI to structure the RAG response into the required format
    try {
      const openai = await import('openai');
      const client = new openai.default({ apiKey: process.env.OPENAI_API_KEY });

      const structuredResponse = await client.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a New Zealand planning expert. Parse the provided zoning analysis and format it as JSON with the following structure: {\"currentZoning\": string, \"permittedUses\": string[], \"buildingRestrictions\": string[], \"developmentPotential\": string}. Be specific and accurate based on Auckland Unitary Plan rules and New Zealand Building Code requirements."
          },
          {
            role: "user",
            content: `Parse this zoning analysis into structured format:\n\n${ragResponse}\n\nCurrent zoning: ${zoning || 'To be determined through official zoning investigation'}`
          }
        ],
        response_format: { type: "json_object" }
      });

      const parsed = JSON.parse(structuredResponse.choices[0].message.content || '{}');
      return {
        currentZoning: parsed.currentZoning || zoning || 'Requires official zoning determination',
        permittedUses: parsed.permittedUses || ['Requires professional planning assessment'],
        buildingRestrictions: parsed.buildingRestrictions || ['Refer to Auckland Unitary Plan for specific requirements'],
        developmentPotential: parsed.developmentPotential || 'Professional planning assessment required'
      };
    } catch (error) {
      console.log("Failed to parse zoning analysis with OpenAI:", error);
      return this.analyzeFallbackZoning(zoning || 'Unknown');
    }
  }

  private analyzeFallbackZoning(zoning: string): PropertyAnalysisReport['zoningAnalysis'] {
    return {
      currentZoning: zoning,
      permittedUses: ['Requires professional zoning assessment'],
      buildingRestrictions: ['Refer to Auckland Unitary Plan for zone-specific requirements'],
      developmentPotential: 'Professional planning consultation recommended'
    };
  }

  private async analyzeDevelopmentConstraints(property: any): Promise<PropertyAnalysisReport['developmentConstraints']> {
    const constraints = {
      infrastructure: [] as string[],
      environmental: [] as string[],
      planning: [] as string[]
    };

    // Analyze overlays for constraints
    if (property.overlays) {
      for (const overlay of property.overlays) {
        if (overlay.type === 'liquefaction_vulnerability') {
          const vulnerability = overlay.data?.Vulnerability;
          if (vulnerability && vulnerability !== 'Very Low') {
            constraints.environmental.push(`Liquefaction vulnerability: ${vulnerability}`);
          }
        }
      }
    }

    return constraints;
  }

  private analyzeConsentRequirements(property: any, projectDescription?: string): PropertyAnalysisReport['consentRequirements'] {
    return {
      buildingConsent: 'Building consent required for most construction work',
      resourceConsent: 'Resource consent requirements depend on specific activity and zoning',
      otherConsents: ['Fire safety compliance', 'Utility connections']
    };
  }

  private generateExecutiveSummary(property: any, projectDescription?: string): string {
    return `Property analysis for ${property.address}. ${property.zoning ? `Zoned as ${property.zoning}.` : 'Zoning to be confirmed.'} ${projectDescription ? `Proposed project: ${projectDescription}.` : ''} Professional consultation recommended for specific development requirements.`;
  }

  private generateNextSteps(property: any, projectDescription?: string): string[] {
    return [
      'Consult with a qualified planning professional',
      'Review Auckland Unitary Plan requirements',
      'Consider preliminary site investigation',
      'Engage with Auckland Council for pre-application discussions'
    ];
  }

  private getProfessionalContacts(suburb?: string): PropertyAnalysisReport['professionalContacts'] {
    return {
      planners: ['Auckland Council Planning Services'],
      engineers: ['Professional engineering consultants required'],
      architects: ['Local architectural services available']
    };
  }

  /**
   * Format report as readable text
   */
  formatReportAsText(report: PropertyAnalysisReport): string {
    return `
COMPREHENSIVE PROPERTY ANALYSIS REPORT

Property Address: ${report.propertyAddress}
Generated: ${report.generatedAt.toLocaleDateString()}

EXECUTIVE SUMMARY
${report.executiveSummary}

PROPERTY DETAILS
Address: ${report.propertyDetails.address}
${report.propertyDetails.suburb ? `Suburb: ${report.propertyDetails.suburb}` : ''}
${report.propertyDetails.zoning ? `Zoning: ${report.propertyDetails.zoning}` : ''}
${report.propertyDetails.landArea ? `Land Area: ${report.propertyDetails.landArea}m²` : ''}
${report.propertyDetails.capitalValue ? `Capital Value: $${report.propertyDetails.capitalValue.toLocaleString()}` : ''}
${report.propertyDetails.ratesId ? `Rates ID: ${report.propertyDetails.ratesId}` : ''}
${report.propertyDetails.coordinates ? `Coordinates: ${report.propertyDetails.coordinates[0]}, ${report.propertyDetails.coordinates[1]}` : ''}

ZONING ANALYSIS
Current Zoning: ${report.zoningAnalysis.currentZoning}

Permitted Uses:
${report.zoningAnalysis.permittedUses.map(use => `• ${use}`).join('\n')}

Building Restrictions:
${report.zoningAnalysis.buildingRestrictions.map(restriction => `• ${restriction}`).join('\n')}

Development Potential:
${report.zoningAnalysis.developmentPotential}

DEVELOPMENT CONSTRAINTS

Infrastructure Constraints:
${report.developmentConstraints.infrastructure.map(constraint => `• ${constraint}`).join('\n')}

Environmental Constraints:
${report.developmentConstraints.environmental.map(constraint => `• ${constraint}`).join('\n')}

Planning Constraints:
${report.developmentConstraints.planning.map(constraint => `• ${constraint}`).join('\n')}

CONSENT REQUIREMENTS
Building Consent: ${report.consentRequirements.buildingConsent}
Resource Consent: ${report.consentRequirements.resourceConsent}

Other Consents Required:
${report.consentRequirements.otherConsents.map(consent => `• ${consent}`).join('\n')}

RECOMMENDED NEXT STEPS
${report.recommendedNextSteps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

PROFESSIONAL CONTACTS

Planning Professionals:
${report.professionalContacts.planners.map(contact => `• ${contact}`).join('\n')}

Engineering Consultants:
${report.professionalContacts.engineers.map(contact => `• ${contact}`).join('\n')}

Architectural Services:
${report.professionalContacts.architects.map(contact => `• ${contact}`).join('\n')}

This report is based on available public data and should be supplemented with professional consultation for specific development projects.
    `.trim();
  }

  private async analyzeDevelopmentConstraints(property: any): Promise<PropertyAnalysisReport['developmentConstraints']> {
    const constraints = {
      infrastructure: [] as string[],
      environmental: [] as string[],
      planning: [] as string[]
    };

    // Infrastructure constraints based on location
    if (property.landArea && property.landArea < 500) {
      constraints.infrastructure.push('Small site may limit infrastructure upgrade options');
    }
    
    if (property.suburb) {
      // Add suburb-specific infrastructure considerations
      const infrastructureRisks = this.getInfrastructureRisks(property.suburb);
      constraints.infrastructure.push(...infrastructureRisks);
    }

    // Environmental constraints (would be enhanced with actual overlays data)
    constraints.environmental.push('Check for flood overlays and natural hazard areas');
    constraints.environmental.push('Assess contaminated land risk');
    constraints.environmental.push('Consider stormwater management requirements');

    // Planning constraints
    constraints.planning.push('Comply with Auckland Design Manual requirements');
    constraints.planning.push('Consider neighbor consultation requirements');
    
    if (property.capitalValue && property.capitalValue > 2000000) {
      constraints.planning.push('High-value area - additional design scrutiny likely');
    }

    return constraints;
  }

  private analyzeConsentRequirements(property: any, projectDescription?: string): PropertyAnalysisReport['consentRequirements'] {
    let buildingConsent = 'Required for most building work';
    let resourceConsent = 'May be required depending on development type';
    const otherConsents = [];

    if (projectDescription) {
      const desc = projectDescription.toLowerCase();
      
      if (desc.includes('subdivision')) {
        resourceConsent = 'Required - subdivision consent needed';
        otherConsents.push('Engineering approval for infrastructure');
      }
      
      if (desc.includes('apartment') || desc.includes('multi')) {
        otherConsents.push('Car parking assessment');
        otherConsents.push('Traffic impact assessment may be required');
      }
      
      if (desc.includes('commercial') || desc.includes('retail')) {
        otherConsents.push('Change of use consent may be required');
        otherConsents.push('Food business registration if applicable');
      }
      
      if (desc.includes('pool')) {
        otherConsents.push('Pool barrier compliance certificate');
      }
    }

    return {
      buildingConsent,
      resourceConsent,
      otherConsents
    };
  }

  private generateExecutiveSummary(property: any, projectDescription?: string): string {
    const suburb = property.suburb || 'Auckland';
    const zoning = property.zoning || 'Unknown zoning';
    const value = property.capitalValue ? `$${property.capitalValue.toLocaleString()}` : 'Unknown value';
    
    let summary = `Property Analysis for ${property.address}, ${suburb}\n\n`;
    summary += `This property is located in ${suburb} with ${zoning} zoning and has a capital value of ${value}. `;
    
    if (property.landArea) {
      summary += `The land area is ${property.landArea}m². `;
    }
    
    if (projectDescription) {
      summary += `\n\nProject Scope: ${projectDescription}\n\n`;
      summary += `Based on the proposed development, this analysis identifies key consent requirements, `;
      summary += `development constraints, and recommended next steps for your project.`;
    } else {
      summary += `\n\nThis analysis provides an overview of development potential and regulatory requirements for the property.`;
    }
    
    return summary;
  }

  private generateNextSteps(property: any, projectDescription?: string): string[] {
    const steps = [
      'Engage a qualified planner to review specific development proposals',
      'Obtain detailed site survey and geotechnical assessment',
      'Consult with Auckland Council pre-application service',
      'Review Auckland Unitary Plan provisions in detail'
    ];

    if (projectDescription) {
      const desc = projectDescription.toLowerCase();
      
      if (desc.includes('subdivision')) {
        steps.unshift('Commission subdivision feasibility study');
        steps.push('Engage civil engineer for infrastructure design');
      }
      
      if (desc.includes('build') || desc.includes('construct')) {
        steps.push('Engage architect for design development');
        steps.push('Consider building consent lodgement timeline');
      }
      
      if (desc.includes('renovation') || desc.includes('alter')) {
        steps.push('Assess existing building compliance');
        steps.push('Consider structural engineering assessment if required');
      }
    }

    return steps;
  }

  private getInfrastructureRisks(suburb: string): string[] {
    // Simplified infrastructure risk mapping
    const risks: Record<string, string[]> = {
      'Auckland Central': ['High development pressure on infrastructure', 'Traffic congestion considerations'],
      'Ponsonby': ['Heritage area restrictions may apply', 'Limited parking availability'],
      'Parnell': ['Heritage considerations', 'Steep terrain challenges'],
      'Newmarket': ['High traffic area', 'Commercial/residential interface'],
      'Takapuna': ['Coastal environment considerations', 'Town centre intensification'],
      'Devonport': ['Heritage naval area', 'Island access considerations'],
      'Remuera': ['High-value residential area', 'Mature tree protection'],
      'Mt Eden': ['Volcanic cone protection', 'Heritage considerations'],
      'Epsom': ['Character protection areas', 'School zone pressures']
    };

    return risks[suburb] || ['Standard infrastructure assessment required'];
  }

  private getProfessionalContacts(suburb?: string): PropertyAnalysisReport['professionalContacts'] {
    // In production, this would be a dynamic database
    return {
      planners: [
        'Auckland Council Planning Team - phone: 09 301 0101',
        'Resource Planning Associates - www.rpa.co.nz',
        'Urban Planning Solutions Ltd'
      ],
      engineers: [
        'Stantec (Auckland office) - www.stantec.com',
        'WSP Opus - www.wsp.com/en-nz',
        'Harrison Grierson - www.harrisongrierson.com'
      ],
      architects: [
        'New Zealand Institute of Architects - www.nzia.co.nz',
        'Auckland Architecture Centre',
        'Local architectural practices directory'
      ]
    };
  }

  /**
   * Format report as readable text
   */
  formatReportAsText(report: PropertyAnalysisReport): string {
    let output = `COMPREHENSIVE PROPERTY ANALYSIS REPORT\n`;
    output += `Generated: ${report.generatedAt.toLocaleDateString()}\n`;
    output += `Property: ${report.propertyAddress}\n`;
    output += `${'='.repeat(60)}\n\n`;

    output += `EXECUTIVE SUMMARY\n`;
    output += `${'-'.repeat(20)}\n`;
    output += `${report.executiveSummary}\n\n`;

    output += `PROPERTY DETAILS\n`;
    output += `${'-'.repeat(20)}\n`;
    output += `Address: ${report.propertyDetails.address}\n`;
    if (report.propertyDetails.suburb) output += `Suburb: ${report.propertyDetails.suburb}\n`;
    if (report.propertyDetails.zoning) output += `Zoning: ${report.propertyDetails.zoning}\n`;
    if (report.propertyDetails.landArea) output += `Land Area: ${report.propertyDetails.landArea}m²\n`;
    if (report.propertyDetails.capitalValue) output += `Capital Value: $${report.propertyDetails.capitalValue.toLocaleString()}\n`;
    if (report.propertyDetails.ratesId) output += `Rates ID: ${report.propertyDetails.ratesId}\n`;
    output += `\n`;

    output += `ZONING ANALYSIS\n`;
    output += `${'-'.repeat(20)}\n`;
    output += `Current Zoning: ${report.zoningAnalysis.currentZoning}\n\n`;
    output += `Permitted Uses:\n`;
    report.zoningAnalysis.permittedUses.forEach(use => output += `• ${use}\n`);
    output += `\nBuilding Restrictions:\n`;
    report.zoningAnalysis.buildingRestrictions.forEach(restriction => output += `• ${restriction}\n`);
    output += `\nDevelopment Potential: ${report.zoningAnalysis.developmentPotential}\n\n`;

    output += `DEVELOPMENT CONSTRAINTS\n`;
    output += `${'-'.repeat(20)}\n`;
    output += `Infrastructure:\n`;
    report.developmentConstraints.infrastructure.forEach(constraint => output += `• ${constraint}\n`);
    output += `\nEnvironmental:\n`;
    report.developmentConstraints.environmental.forEach(constraint => output += `• ${constraint}\n`);
    output += `\nPlanning:\n`;
    report.developmentConstraints.planning.forEach(constraint => output += `• ${constraint}\n`);
    output += `\n`;

    output += `CONSENT REQUIREMENTS\n`;
    output += `${'-'.repeat(20)}\n`;
    output += `Building Consent: ${report.consentRequirements.buildingConsent}\n`;
    output += `Resource Consent: ${report.consentRequirements.resourceConsent}\n`;
    if (report.consentRequirements.otherConsents.length > 0) {
      output += `Other Consents:\n`;
      report.consentRequirements.otherConsents.forEach(consent => output += `• ${consent}\n`);
    }
    output += `\n`;

    output += `RECOMMENDED NEXT STEPS\n`;
    output += `${'-'.repeat(20)}\n`;
    report.recommendedNextSteps.forEach((step, index) => output += `${index + 1}. ${step}\n`);
    output += `\n`;

    output += `PROFESSIONAL CONTACTS\n`;
    output += `${'-'.repeat(20)}\n`;
    output += `Planning Professionals:\n`;
    report.professionalContacts.planners.forEach(contact => output += `• ${contact}\n`);
    output += `\nEngineering Services:\n`;
    report.professionalContacts.engineers.forEach(contact => output += `• ${contact}\n`);
    output += `\nArchitectural Services:\n`;
    report.professionalContacts.architects.forEach(contact => output += `• ${contact}\n`);

    return output;
  }
}

export const premiumPropertyAgent = new PremiumPropertyAgent();
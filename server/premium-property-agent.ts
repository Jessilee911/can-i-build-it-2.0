import { aucklandCouncilAPI } from './auckland-council-api';
import * as rag from './rag';

export interface PropertyAnalysisReport {
  propertyAddress: string;
  executiveSummary: string;
  locationVerification: {
    verifiedAddress: string;
    coordinates: [number, number];
    accuracyLevel: string;
    officialZoning: string;
    zoningDescription: string;
    dataSource: string;
    verificationDate: Date;
  };
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

    // Generate comprehensive zoning analysis using official data
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
      locationVerification: {
        verifiedAddress: property.address,
        coordinates: property.coordinates || [0, 0],
        accuracyLevel: property.coordinates ? "High - Official Auckland Council Data" : "Address level",
        officialZoning: property.zoning || 'Not determined',
        zoningDescription: property.zoningData?.ZONE_NAME || property.zoning || 'Zoning information not available',
        dataSource: "Auckland Council Unitary Plan Base Zone & LINZ Property Data",
        verificationDate: new Date(),
      },
      propertyDetails: {
        address: property.address,
        suburb: property.suburb || undefined,
        zoning: property.zoning || undefined,
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
    
    // Combine official Auckland Council data with analysis
    if (officialZoneInfo) {
      return {
        currentZoning: zoning,
        permittedUses: this.extractPermittedUses(officialZoneInfo),
        buildingRestrictions: officialZoneInfo.buildingRules,
        developmentPotential: this.analyzeDevelopmentPotential(officialZoneInfo, projectDescription)
      };
    } else {
      // Fallback if no official zoning data available
      return this.analyzeFallbackZoning(zoning);
    }
  }

  private extractPermittedUses(zoneInfo: any): string[] {
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

  private analyzeDevelopmentPotential(zoneInfo: any, projectDescription?: string): string {
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

LOCATION VERIFICATION
Verified Address: ${report.locationVerification.verifiedAddress}
Coordinates: ${report.locationVerification.coordinates[1]}, ${report.locationVerification.coordinates[0]}
Accuracy Level: ${report.locationVerification.accuracyLevel}
Official Zoning: ${report.locationVerification.officialZoning}
Zoning Description: ${report.locationVerification.zoningDescription}
Data Source: ${report.locationVerification.dataSource}
Verification Date: ${report.locationVerification.verificationDate.toLocaleDateString()}

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
}

export const premiumPropertyAgent = new PremiumPropertyAgent();
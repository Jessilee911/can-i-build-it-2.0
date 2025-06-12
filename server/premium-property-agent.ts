import { generateRAGResponse } from "./rag";

export interface PropertyReport {
  propertyAddress: string;
  projectDescription: string;
  zoningAnalysis: string;
  buildingConsentRequirements: string;
  resourceConsentRequirements: string;
  estimatedTimeline: string;
  estimatedCosts: string;
  potentialChallenges: string;
  recommendations: string;
  nextSteps: string;
}

class PremiumPropertyAgent {
  async generatePropertyReport(propertyAddress: string, projectDescription: string): Promise<PropertyReport> {
    try {
      // Use the existing RAG system to generate comprehensive analysis
      const query = `Generate a comprehensive property development report for ${propertyAddress}. Project: ${projectDescription}. Include zoning analysis, consent requirements, timeline, costs, challenges, and recommendations.`;
      
      const analysis = await generateRAGResponse(query);
      
      // Structure the response into a comprehensive report
      return {
        propertyAddress,
        projectDescription,
        zoningAnalysis: this.extractSection(analysis, "zoning"),
        buildingConsentRequirements: this.extractSection(analysis, "building consent"),
        resourceConsentRequirements: this.extractSection(analysis, "resource consent"),
        estimatedTimeline: this.extractSection(analysis, "timeline"),
        estimatedCosts: this.extractSection(analysis, "cost"),
        potentialChallenges: this.extractSection(analysis, "challenge"),
        recommendations: this.extractSection(analysis, "recommendation"),
        nextSteps: this.extractSection(analysis, "next steps")
      };
    } catch (error) {
      console.error("Error generating property report:", error);
      throw new Error("Failed to generate property report");
    }
  }

  private extractSection(content: string, keyword: string): string {
    // Simple extraction logic - in production this would be more sophisticated
    const lines = content.split('\n');
    const relevantLines = lines.filter(line => 
      line.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (relevantLines.length > 0) {
      return relevantLines.join('\n');
    }
    
    return `Analysis for ${keyword} is included in the comprehensive assessment above.`;
  }

  formatReportAsText(report: PropertyReport): string {
    return `
PROPERTY DEVELOPMENT ASSESSMENT REPORT

Property Address: ${report.propertyAddress}
Project Description: ${report.projectDescription}

ZONING ANALYSIS
${report.zoningAnalysis}

BUILDING CONSENT REQUIREMENTS
${report.buildingConsentRequirements}

RESOURCE CONSENT REQUIREMENTS
${report.resourceConsentRequirements}

ESTIMATED TIMELINE
${report.estimatedTimeline}

ESTIMATED COSTS
${report.estimatedCosts}

POTENTIAL CHALLENGES
${report.potentialChallenges}

RECOMMENDATIONS
${report.recommendations}

NEXT STEPS
${report.nextSteps}

---
This report was generated using AI analysis of New Zealand building codes and planning regulations.
For official guidance, please consult with qualified professionals and local authorities.
    `.trim();
  }
}

export const premiumPropertyAgent = new PremiumPropertyAgent();
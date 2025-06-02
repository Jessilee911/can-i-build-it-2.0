// Auckland Unitary Plan PDF Processor
// Fetches and analyzes official Auckland Council planning documents

import fetch from 'node-fetch';
import pdfParse from 'pdf-parse';
import { getZoneInfo, getProjectSearchTerms, ZonePDFMapping } from './auckland-zone-pdf-mapping';

interface PDFContent {
  text: string;
  numPages: number;
  metadata?: any;
}

interface ExtractedPlanningRules {
  heightLimits: string[];
  siteCoverage: string[];
  setbacks: string[];
  permittedActivities: string[];
  buildingRules: string[];
  projectSpecificRules: string[];
}

export class AucklandPDFProcessor {
  private pdfCache: Map<string, { content: PDFContent; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Get planning analysis for a specific zone and project type
   */
  async getZonePlanningAnalysis(zoneName: string, projectType: string): Promise<string> {
    try {
      const zoneInfo = getZoneInfo(zoneName);
      if (!zoneInfo) {
        return this.getFallbackAnalysis(zoneName, projectType);
      }

      const pdfContent = await this.fetchPDF(zoneInfo.pdf_url);
      if (!pdfContent) {
        return this.getFallbackAnalysis(zoneName, projectType);
      }

      const extractedRules = await this.extractProjectRelevantRules(pdfContent.text, projectType);
      return this.formatPlanningAnalysis(zoneInfo, extractedRules, projectType);

    } catch (error) {
      console.error('PDF processing error:', error);
      return this.getFallbackAnalysis(zoneName, projectType);
    }
  }

  /**
   * Fetch and cache PDF content
   */
  private async fetchPDF(pdfUrl: string): Promise<PDFContent | null> {
    // Check cache first
    const cached = this.pdfCache.get(pdfUrl);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.content;
    }

    try {
      console.log(`Fetching Auckland Unitary Plan document: ${pdfUrl}`);
      const response = await fetch(pdfUrl, {
        headers: {
          'User-Agent': 'Property Analysis System - Auckland Council Planning Research'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const buffer = await response.buffer();
      const pdfContent = await pdfParse.default(buffer);

      const content: PDFContent = {
        text: pdfContent.text,
        numPages: pdfContent.numpages,
        metadata: pdfContent.metadata
      };

      // Cache the content
      this.pdfCache.set(pdfUrl, { content, timestamp: Date.now() });
      console.log(`Successfully processed PDF: ${pdfContent.numpages} pages`);

      return content;
    } catch (error) {
      console.error(`Failed to fetch PDF ${pdfUrl}:`, error);
      return null;
    }
  }

  /**
   * Extract project-relevant planning rules from PDF text
   */
  private async extractProjectRelevantRules(pdfText: string, projectType: string): Promise<ExtractedPlanningRules> {
    const searchTerms = getProjectSearchTerms(projectType);
    const sections = this.splitIntoSections(pdfText);
    
    const rules: ExtractedPlanningRules = {
      heightLimits: [],
      siteCoverage: [],
      setbacks: [],
      permittedActivities: [],
      buildingRules: [],
      projectSpecificRules: []
    };

    // Extract height limits
    rules.heightLimits = this.extractRulesContaining(sections, ['height', 'metres', 'm above']);
    
    // Extract site coverage rules
    rules.siteCoverage = this.extractRulesContaining(sections, ['site coverage', 'building coverage', 'impervious']);
    
    // Extract setback requirements
    rules.setbacks = this.extractRulesContaining(sections, ['setback', 'yard', 'boundary', 'metres from']);
    
    // Extract permitted activities
    rules.permittedActivities = this.extractRulesContaining(sections, ['permitted', 'activities', 'allowed']);
    
    // Extract project-specific rules
    rules.projectSpecificRules = this.extractRulesContaining(sections, searchTerms);

    return rules;
  }

  /**
   * Split PDF text into manageable sections
   */
  private splitIntoSections(text: string): string[] {
    // Split by common section markers in Auckland Unitary Plan
    const sectionMarkers = [
      /H\d+\.\d+/g, // Section numbers like H19.1
      /\d+\.\d+\.\d+/g, // Subsection numbers
      /Activities/gi,
      /Development standards/gi,
      /Building coverage/gi,
      /Height/gi,
      /Setbacks/gi
    ];

    let sections = [text];
    
    for (const marker of sectionMarkers) {
      const newSections: string[] = [];
      for (const section of sections) {
        const splits = section.split(marker);
        newSections.push(...splits.filter(s => s.trim().length > 100));
      }
      if (newSections.length > sections.length) {
        sections = newSections;
      }
    }

    return sections.slice(0, 50); // Limit to prevent excessive processing
  }

  /**
   * Extract rules containing specific terms
   */
  private extractRulesContaining(sections: string[], searchTerms: string[]): string[] {
    const rules: string[] = [];
    
    for (const section of sections) {
      const lowerSection = section.toLowerCase();
      
      for (const term of searchTerms) {
        if (lowerSection.includes(term.toLowerCase())) {
          // Extract sentences containing the term
          const sentences = section.split(/[.!?]+/);
          for (const sentence of sentences) {
            if (sentence.toLowerCase().includes(term.toLowerCase()) && sentence.trim().length > 20) {
              rules.push(sentence.trim());
            }
          }
        }
      }
    }

    // Remove duplicates and limit results
    return [...new Set(rules)].slice(0, 10);
  }

  /**
   * Format the planning analysis using extracted rules
   */
  private formatPlanningAnalysis(zoneInfo: ZonePDFMapping, rules: ExtractedPlanningRules, projectType: string): string {
    let analysis = `According to the Auckland Unitary Plan ${zoneInfo.zone_code} ${zoneInfo.zone_category} zone document, `;

    // Add project-specific guidance
    if (rules.projectSpecificRules.length > 0) {
      const relevantRule = rules.projectSpecificRules[0];
      analysis += `${relevantRule}. `;
    }

    // Add height restrictions if found
    if (rules.heightLimits.length > 0) {
      const heightRule = rules.heightLimits.find(rule => rule.includes('metre') || rule.includes('m ')) || rules.heightLimits[0];
      analysis += `Height restrictions specify ${heightRule.toLowerCase()}. `;
    }

    // Add site coverage if found
    if (rules.siteCoverage.length > 0) {
      const coverageRule = rules.siteCoverage[0];
      analysis += `Site coverage requirements indicate ${coverageRule.toLowerCase()}. `;
    }

    // Add setback requirements if found
    if (rules.setbacks.length > 0) {
      const setbackRule = rules.setbacks[0];
      analysis += `Setback requirements state ${setbackRule.toLowerCase()}. `;
    }

    // Add activity permissions
    if (rules.permittedActivities.length > 0) {
      const activityRule = rules.permittedActivities[0];
      analysis += `Permitted activities include ${activityRule.toLowerCase()}. `;
    }

    // Default ending if no specific rules found
    if (analysis === `According to the Auckland Unitary Plan ${zoneInfo.zone_code} ${zoneInfo.zone_category} zone document, `) {
      analysis += `your ${projectType} project must comply with the zone's development standards including building height, site coverage, and setback requirements. Professional consultation is recommended to ensure compliance with all applicable planning provisions.`;
    }

    return analysis;
  }

  /**
   * Provide fallback analysis when PDF processing fails
   */
  private getFallbackAnalysis(zoneName: string, projectType: string): string {
    const cleanZoneName = zoneName.replace(/\s*\(Zone\s*\d+\)$/i, '').trim();
    
    if (cleanZoneName.includes('Rural')) {
      return `Your property is in a ${cleanZoneName} which typically allows rural residential activities and ${projectType} projects subject to larger site requirements and rural character considerations. Height limits are generally 8-10 metres with building coverage restrictions of 10-15% and substantial setback requirements from boundaries. Professional planning advice is recommended for your specific ${projectType} project.`;
    }
    
    if (cleanZoneName.includes('Residential')) {
      return `Your property is in a ${cleanZoneName} which permits residential activities including ${projectType} projects. Standard residential development rules apply including height limits, site coverage restrictions, and boundary setback requirements. Your ${projectType} project should comply with zone-specific development standards detailed in the Auckland Unitary Plan.`;
    }
    
    return `Your property is in a ${cleanZoneName}. Planning provisions for your ${projectType} project are subject to the zone's specific development standards including height, coverage, and setback requirements. Detailed planning guidance is available in the Auckland Unitary Plan documents for this zone.`;
  }

  /**
   * Clear the PDF cache
   */
  clearCache(): void {
    this.pdfCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; oldestEntry: number | null } {
    const now = Date.now();
    let oldestEntry: number | null = null;
    
    for (const [_, cached] of this.pdfCache) {
      if (oldestEntry === null || cached.timestamp < oldestEntry) {
        oldestEntry = cached.timestamp;
      }
    }
    
    return {
      size: this.pdfCache.size,
      oldestEntry: oldestEntry ? now - oldestEntry : null
    };
  }
}

export const aucklandPDFProcessor = new AucklandPDFProcessor();
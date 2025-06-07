/**
 * Auckland Council Overlay PDF Processor
 * Processes overlay PDF documents to extract relevant planning rules
 */

import pdfParse from './pdf-parse-wrapper';
import fetch from 'node-fetch';
import { getOverlayInfo, getOverlaySearchTerms, OverlayPDFMapping } from './auckland-overlay-pdf-mapping';

interface PDFContent {
  text: string;
  numPages: number;
  metadata?: any;
}

interface ExtractedOverlayRules {
  heightLimits: string[];
  setbacks: string[];
  buildingRules: string[];
  consentRequirements: string[];
  designRequirements: string[];
  overlaySpecificRules: string[];
}

export class AucklandOverlayPDFProcessor {
  private pdfCache: Map<string, { content: PDFContent; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Get comprehensive overlay analysis for all detected overlays
   */
  async getOverlayAnalysis(overlays: Array<{type: string, data: any}>, projectType: string): Promise<string> {
    if (!overlays || overlays.length === 0) {
      return '';
    }

    console.log(`Processing ${overlays.length} overlays for ${projectType} project`);
    
    const overlayAnalyses: string[] = [];
    
    for (const overlay of overlays) {
      try {
        const analysis = await this.processOverlay(overlay, projectType);
        if (analysis) {
          overlayAnalyses.push(analysis);
        }
      } catch (error) {
        console.error(`Error processing overlay ${overlay.type}:`, error);
      }
    }
    
    if (overlayAnalyses.length === 0) {
      return '';
    }
    
    // Combine all overlay analyses and identify most stringent rules
    return this.combineOverlayAnalyses(overlayAnalyses, overlays);
  }

  /**
   * Process individual overlay
   */
  private async processOverlay(overlay: {type: string, data: any}, projectType: string): Promise<string | null> {
    const overlayInfo = getOverlayInfo(overlay.type);
    
    if (!overlayInfo) {
      console.log(`No PDF mapping found for overlay type: ${overlay.type}`);
      return null;
    }

    console.log(`Processing ${overlayInfo.overlay_name} (${overlayInfo.overlay_code})`);
    
    // Fetch and parse PDF content
    const pdfContent = await this.fetchPDF(overlayInfo.pdf_url);
    
    if (!pdfContent) {
      console.log(`Failed to fetch PDF for ${overlayInfo.overlay_name}`);
      return this.getFallbackOverlayAnalysis(overlayInfo, overlay.data, projectType);
    }

    // Extract relevant rules from PDF
    const extractedRules = await this.extractOverlayRules(pdfContent.text, projectType, overlay.type);
    
    // Format the analysis
    return this.formatOverlayAnalysis(overlayInfo, extractedRules, overlay.data, projectType);
  }

  /**
   * Fetch and cache PDF content
   */
  private async fetchPDF(pdfUrl: string): Promise<PDFContent | null> {
    try {
      // Check cache first
      const cached = this.pdfCache.get(pdfUrl);
      if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
        console.log('Using cached PDF content');
        return cached.content;
      }

      console.log(`Fetching PDF: ${pdfUrl}`);
      const response = await fetch(pdfUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const buffer = await response.buffer();
      const pdfData = await pdfParse(buffer);
      
      const content: PDFContent = {
        text: pdfData.text,
        numPages: pdfData.numpages,
        metadata: pdfData.metadata
      };

      // Cache the content
      this.pdfCache.set(pdfUrl, {
        content,
        timestamp: Date.now()
      });

      console.log(`Successfully parsed PDF: ${content.numPages} pages, ${content.text.length} characters`);
      return content;
      
    } catch (error) {
      console.error(`PDF fetch error for ${pdfUrl}:`, error);
      return null;
    }
  }

  /**
   * Extract overlay-specific rules from PDF text
   */
  private async extractOverlayRules(pdfText: string, projectType: string, overlayType: string): Promise<ExtractedOverlayRules> {
    const searchTerms = getOverlaySearchTerms(projectType, overlayType);
    const sections = this.splitIntoSections(pdfText);
    
    const rules: ExtractedOverlayRules = {
      heightLimits: [],
      setbacks: [],
      buildingRules: [],
      consentRequirements: [],
      designRequirements: [],
      overlaySpecificRules: []
    };

    // Extract height limits
    rules.heightLimits = this.extractRulesContaining(sections, [
      'height', 'storey', 'level', 'maximum height', 'building height'
    ]);

    // Extract setbacks
    rules.setbacks = this.extractRulesContaining(sections, [
      'setback', 'yard', 'boundary', 'distance from', 'metres from'
    ]);

    // Extract general building rules
    rules.buildingRules = this.extractRulesContaining(sections, [
      'building', 'structure', 'construction', 'alteration', 'addition'
    ]);

    // Extract consent requirements
    rules.consentRequirements = this.extractRulesContaining(sections, [
      'consent', 'permitted', 'restricted', 'discretionary', 'assessment'
    ]);

    // Extract design requirements
    rules.designRequirements = this.extractRulesContaining(sections, [
      'design', 'appearance', 'materials', 'character', 'heritage', 'facade'
    ]);

    // Extract overlay-specific rules using dynamic search terms
    rules.overlaySpecificRules = this.extractRulesContaining(sections, searchTerms);

    return rules;
  }

  /**
   * Split PDF text into manageable sections
   */
  private splitIntoSections(text: string): string[] {
    const sections = text.split(/\n\s*\n|\r\n\s*\r\n/);
    return sections.filter(section => section.trim().length > 50);
  }

  /**
   * Extract rules containing specific terms
   */
  private extractRulesContaining(sections: string[], searchTerms: string[]): string[] {
    const relevantSections: string[] = [];
    
    for (const section of sections) {
      const lowerSection = section.toLowerCase();
      
      for (const term of searchTerms) {
        if (lowerSection.includes(term.toLowerCase())) {
          if (!relevantSections.some(existing => existing === section)) {
            relevantSections.push(section.trim());
          }
          break;
        }
      }
    }
    
    return relevantSections.slice(0, 10); // Limit to most relevant sections
  }

  /**
   * Format the overlay analysis using extracted rules
   */
  private formatOverlayAnalysis(overlayInfo: OverlayPDFMapping, rules: ExtractedOverlayRules, overlayData: any, projectType: string): string {
    const overlayName = overlayData.NAME || overlayData.SCA_NAME || overlayData.HERITAGE_NAME || overlayInfo.overlay_name;
    
    let analysis = `Your property is subject to the ${overlayName} under ${overlayInfo.overlay_code} of the Auckland Unitary Plan. `;

    // Add most relevant rules based on project type
    if (rules.heightLimits.length > 0) {
      analysis += `Height restrictions may apply under this overlay. `;
    }

    if (rules.consentRequirements.length > 0) {
      analysis += `Special consent requirements apply for development within this overlay area. `;
    }

    if (rules.designRequirements.length > 0) {
      analysis += `Specific design requirements must be met to maintain the character values of this area. `;
    }

    if (overlayInfo.overlay_code === 'D18') {
      analysis += `This Special Character Area overlay requires that new development respects the existing neighbourhood character and streetscape values. `;
    } else if (overlayInfo.overlay_code === 'D17') {
      analysis += `This Historic Heritage overlay places specific restrictions on alterations to protect heritage values. `;
    } else if (overlayInfo.overlay_code === 'D19' || overlayInfo.overlay_code === 'D20A') {
      analysis += `This viewshaft overlay restricts building heights to protect important public views. `;
    }

    return analysis;
  }

  /**
   * Combine multiple overlay analyses and identify most stringent rules
   */
  private combineOverlayAnalyses(analyses: string[], overlays: Array<{type: string, data: any}>): string {
    let combined = 'Your property is subject to multiple planning overlays that impose additional requirements beyond the base zoning. ';
    
    // Add each overlay analysis
    analyses.forEach(analysis => {
      combined += analysis + ' ';
    });
    
    // Add note about most stringent rules
    combined += 'Where multiple overlays apply, the most restrictive requirements from any overlay will take precedence. Council assessment will consider compliance with all applicable overlay provisions.';
    
    return combined;
  }

  /**
   * Provide fallback analysis when PDF processing fails
   */
  private getFallbackOverlayAnalysis(overlayInfo: OverlayPDFMapping, overlayData: any, projectType: string): string {
    const overlayName = overlayData.NAME || overlayData.SCA_NAME || overlayData.HERITAGE_NAME || overlayInfo.overlay_name;
    
    return `Your property is subject to the ${overlayName} under ${overlayInfo.overlay_code} of the Auckland Unitary Plan. This overlay imposes additional planning requirements that must be considered alongside the base zoning rules. Professional planning advice is recommended to determine specific compliance requirements.`;
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
    let oldestEntry: number | null = null;
    
    const values = Array.from(this.pdfCache.values());
    for (const cached of values) {
      if (oldestEntry === null || cached.timestamp < oldestEntry) {
        oldestEntry = cached.timestamp;
      }
    }
    
    return {
      size: this.pdfCache.size,
      oldestEntry
    };
  }
}

export const aucklandOverlayPDFProcessor = new AucklandOverlayPDFProcessor();
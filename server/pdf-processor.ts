import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { storage } from './storage';
import type { 
  InsertBuildingCodeSection, 
  InsertPlanningRule, 
  InsertConsentRequirement,
  InsertDocumentSource 
} from '../shared/schema';
// PDF parse will be imported dynamically
let pdfParse: any = null;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Initialize PDF parser
async function initializePDFParser() {
  if (!pdfParse) {
    try {
      const pdfParseModule = await import('pdf-parse');
      pdfParse = pdfParseModule.default || pdfParseModule;
    } catch (error) {
      console.warn('Failed to initialize PDF parser:', error);
    }
  }
  return pdfParse;
}

interface ExtractedContent {
  buildingCodeSections: InsertBuildingCodeSection[];
  planningRules: InsertPlanningRule[];
  consentRequirements: InsertConsentRequirement[];
}

interface BuildingCodeClause {
  clauseNumber: string;
  title: string;
  content: string;
  pageNumber: number;
  documentSource: string;
  clauseLevel: number;
  parentClause?: string;
  subsections: string[];
  relatedClauses: string[];
  tables: string[];
  figures: string[];
  metadata: Record<string, any>;
}

export class PDFProcessor {

  private clausePatterns = {
    // Main clauses like D1, E2, B1, etc.
    mainClause: /^([A-Z]\d+)\s+(.+?)(?:\n|$)/gm,
    // Sub-clauses like D1.1, E2.3, etc.
    subClause: /^([A-Z]\d+\.\d+)\s+(.+?)(?:\n|$)/gm,
    // Sub-sub-clauses like D1.3.3, E2.1.4, etc.
    subSubClause: /^([A-Z]\d+\.\d+\.\d+)\s+(.+?)(?:\n|$)/gm,
    // Performance criteria like D1/AS1, E2/AS2
    performanceClause: /^([A-Z]\d+\/AS\d+)\s+(.+?)(?:\n|$)/gm,
    // Verification methods like D1/VM1
    verificationClause: /^([A-Z]\d+\/VM\d+)\s+(.+?)(?:\n|$)/gm
  };

  private contentPatterns = {
    table: /Table\s+[A-Z]?\d+(?:\.\d+)*(?:[a-z])?/gi,
    figure: /Figure\s+[A-Z]?\d+(?:\.\d+)*(?:[a-z])?/gi,
    crossReference: /([A-Z]\d+(?:\.\d+)*(?:\.\d+)*)/g
  };

  /**
   * Extract structured clauses from PDF text using advanced pattern recognition
   */
  private extractBuildingCodeClauses(text: string): BuildingCodeClause[] {
    const clauses: BuildingCodeClause[] = [];
    const allMatches: Array<{
      clauseNumber: string;
      title: string;
      startPos: number;
      patternType: string;
    }> = [];

    // Find all clause matches
    Object.entries(this.clausePatterns).forEach(([patternName, pattern]) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        allMatches.push({
          clauseNumber: match[1],
          title: match[2].trim(),
          startPos: match.index,
          patternType: patternName
        });
      }
    });

    // Sort by position in document
    allMatches.sort((a, b) => a.startPos - b.startPos);

    // Extract content for each clause
    allMatches.forEach((match, index) => {
      const startPos = match.startPos;
      const endPos = index + 1 < allMatches.length ? allMatches[index + 1].startPos : text.length;
      const content = text.slice(startPos, endPos).trim();

      const clause: BuildingCodeClause = {
        clauseNumber: match.clauseNumber,
        title: match.title,
        content: this.cleanClauseContent(content),
        pageNumber: this.estimatePageNumber(startPos, text),
        documentSource: '',
        clauseLevel: this.determineClauseLevel(match.clauseNumber),
        parentClause: this.findParentClause(match.clauseNumber),
        subsections: this.extractSubsections(content),
        relatedClauses: this.findRelatedClauses(content),
        tables: this.extractTableReferences(content),
        figures: this.extractFigureReferences(content),
        metadata: this.extractClauseMetadata(content)
      };

      clauses.push(clause);
    });

    return clauses;
  }

  private cleanClauseContent(content: string): string {
    // Remove excessive whitespace
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    content = content.replace(/[ \t]+/g, ' ');

    // Fix common OCR issues
    content = content.replace(/'/g, "'");
    content = content.replace(/'/g, "'");
    content = content.replace(/"/g, '"');
    content = content.replace(/"/g, '"');

    return content.trim();
  }

  private determineClauseLevel(clauseNumber: string): number {
    if (/^[A-Z]\d+$/.test(clauseNumber)) return 1;
    if (/^[A-Z]\d+\.\d+$/.test(clauseNumber)) return 2;
    if (/^[A-Z]\d+\.\d+\.\d+$/.test(clauseNumber)) return 3;
    if (/^[A-Z]\d+\/[A-Z]+\d+$/.test(clauseNumber)) return 2;
    return 0;
  }

  private findParentClause(clauseNumber: string): string | undefined {
    if (/^[A-Z]\d+\.\d+\.\d+$/.test(clauseNumber)) {
      return clauseNumber.split('.').slice(0, -1).join('.');
    }
    if (/^[A-Z]\d+\.\d+$/.test(clauseNumber)) {
      return clauseNumber.split('.')[0];
    }
    return undefined;
  }

  private extractSubsections(content: string): string[] {
    const subsections: string[] = [];
    const letterMatches = content.match(/\(([a-z])\)/g) || [];
    const romanMatches = content.match(/\(([ivx]+)\)/g) || [];

    subsections.push(...letterMatches.map(m => m.slice(1, -1)));
    subsections.push(...romanMatches.map(m => m.slice(1, -1)));

    return [...new Set(subsections)];
  }

  private findRelatedClauses(content: string): string[] {
    const matches = content.match(this.contentPatterns.crossReference) || [];
    return [...new Set(matches.filter(ref => /^[A-Z]\d+(?:\.\d+)*$/.test(ref)))];
  }

  private extractTableReferences(content: string): string[] {
    return content.match(this.contentPatterns.table) || [];
  }

  private extractFigureReferences(content: string[]): string[] {
    return content.match(this.contentPatterns.figure) || [];
  }

  private extractClauseMetadata(content: string): Record<string, any> {
    return {
      wordCount: content.split(/\s+/).length,
      hasTables: this.contentPatterns.table.test(content),
      hasFigures: this.contentPatterns.figure.test(content),
      hasCrossReferences: this.contentPatterns.crossReference.test(content),
      contentType: this.determineContentType(content)
    };
  }

  private determineContentType(content: string): string {
    const lower = content.toLowerCase();
    if (lower.includes('performance') && lower.includes('shall')) return 'performance_requirement';
    if (lower.includes('acceptable solution')) return 'acceptable_solution';
    if (lower.includes('verification method')) return 'verification_method';
    if (lower.includes('definition') || lower.includes('means')) return 'definition';
    return 'general_content';
  }

  private determineCategoryFromCode(clauseNumber: string): string {
    const code = clauseNumber.split('.')[0].toUpperCase();
    
    const categoryMap: Record<string, string> = {
      'A': 'general',
      'B': 'structure_and_durability',
      'C': 'protection_from_fire',
      'D': 'access',
      'E': 'moisture',
      'F': 'safety_hazards',
      'G': 'services_and_facilities',
      'H': 'energy_efficiency'
    };
    
    return categoryMap[code[0]] || 'general';
  }

  private estimatePageNumber(position: number, text: string): number {
    const textBeforePosition = text.slice(0, position);
    const estimatedPage = Math.floor(textBeforePosition.length / 2000) + 1;
    return estimatedPage;
  }

  /**
   * Create optimized chunks for RAG system with precise clause extraction
   */
  private createRAGChunks(clauses: BuildingCodeClause[], documentTitle: string): Array<Record<string, any>> {
    const chunks: Array<Record<string, any>> = [];

    clauses.forEach(clause => {
      // Main clause chunk
      const mainChunk = {
        id: `${documentTitle}_${clause.clauseNumber}`,
        clauseNumber: clause.clauseNumber,
        title: clause.title,
        content: clause.content,
        pageNumber: clause.pageNumber,
        documentSource: documentTitle,
        chunkType: 'main_clause',
        metadata: {
          clauseLevel: clause.clauseLevel,
          parentClause: clause.parentClause,
          relatedClauses: clause.relatedClauses,
          tables: clause.tables,
          figures: clause.figures,
          ...clause.metadata
        }
      };
      chunks.push(mainChunk);

      // Create sub-chunks for long content
      if (clause.content.length > 2000) {
        const paragraphs = clause.content.split('\n\n');
        paragraphs.forEach((paragraph, index) => {
          if (paragraph.trim().length > 100) {
            const subChunk = {
              id: `${documentTitle}_${clause.clauseNumber}_p${index + 1}`,
              clauseNumber: clause.clauseNumber,
              title: `${clause.title} (Part ${index + 1})`,
              content: paragraph.trim(),
              pageNumber: clause.pageNumber,
              documentSource: documentTitle,
              chunkType: 'paragraph',
              metadata: {
                parentClauseId: `${documentTitle}_${clause.clauseNumber}`,
                paragraphIndex: index + 1,
                ...clause.metadata
              }
            };
            chunks.push(subChunk);
          }
        });
      }
    });

    return chunks;
  }

  /**
   * Process a PDF document and extract structured building/planning information
   */
  async processPDF(filePath: string, documentInfo: {
    title: string;
    authority: string;
    documentType: 'building_code' | 'planning_rules' | 'guidance';
    region?: string;
    version?: string;
  }): Promise<number> {

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is required for PDF processing');
    }

    try {
      // Create document source record
      const documentSource = await storage.createDocumentSource({
        filename: path.basename(filePath),
        title: documentInfo.title,
        documentType: documentInfo.documentType,
        authority: documentInfo.authority,
        region: documentInfo.region,
        version: documentInfo.version,
        filePath: filePath,
        processingStatus: 'processing'
      });

      // Read and process PDF content using OpenAI
      const pdfBuffer = fs.readFileSync(filePath);
      const base64Pdf = pdfBuffer.toString('base64');

      // First try advanced clause extraction for building codes
      let sectionsCount = 0;

      if (documentInfo.documentType === 'building_code') {
        // Use advanced clause extraction
        const pdfText = await this.extractTextFromPDF(pdfBuffer);
        const clauses = this.extractBuildingCodeClauses(pdfText);

        // Convert clauses to building code sections
        for (const clause of clauses) {
          await storage.createBuildingCodeSection({
            code: clause.clauseNumber.split('.')[0], // e.g., "D1" from "D1.3.3"
            title: clause.title,
            section: clause.clauseNumber,
            content: clause.content,
            category: this.determineCategoryFromCode(clause.clauseNumber),
            subcategory: clause.title,
            applicableTo: ['residential', 'commercial'],
            requirements: [clause.content],
            acceptableSolutions: [],
            verificationMethods: [],
            sourceDocument: documentInfo.title,
            documentVersion: documentInfo.version,
            isActive: true
          });
          sectionsCount++;
        }

        // Create RAG chunks for enhanced search
        const ragChunks = this.createRAGChunks(clauses, documentInfo.title);
        console.log(`Created ${ragChunks.length} RAG chunks for ${documentInfo.title}`);

      } else {
        // Fallback to AI extraction for other document types
        const extractedContent = await this.extractContentWithAI(base64Pdf, documentInfo);

        // Process building code sections
        for (const section of extractedContent.buildingCodeSections) {
          await storage.createBuildingCodeSection({
            ...section,
            sourceDocument: documentInfo.title
          });
          sectionsCount++;
        }
      }

      // Process planning rules
      for (const rule of extractedContent.planningRules) {
        await storage.createPlanningRule({
          ...rule,
          sourceDocument: documentInfo.title
        });
        sectionsCount++;
      }

      // Process consent requirements
      for (const requirement of extractedContent.consentRequirements) {
        await storage.createConsentRequirement({
          ...requirement,
          sourceReference: documentInfo.title
        });
        sectionsCount++;
      }

      // Update document processing status
      await storage.updateDocumentSource(documentSource.id, {
        processingStatus: 'completed',
        extractedSections: sectionsCount
      });

      return sectionsCount;

    } catch (error: any) {
      console.error('PDF processing error:', error);
      throw new Error(`Failed to process PDF: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Extract structured content from PDF using OpenAI
   */
  private async extractContentWithAI(base64Pdf: string, documentInfo: any): Promise<ExtractedContent> {

    const systemPrompt = `You are an expert at extracting structured information from New Zealand building and planning documents. Extract relevant content and organize it into the appropriate categories.

For Building Code documents, extract:
- Code references (B1, E2, G12, etc.)
- Section numbers and titles
- Requirements and standards
- Acceptable solutions
- Verification methods

For Planning documents, extract:
- Zone information
- Rule numbers and titles
- Activity statuses (Permitted, Restricted Discretionary, etc.)
- Standards (height limits, setbacks, site coverage)
- Assessment criteria
- Exemptions

For Guidance documents, extract:
- Activity types and descriptions
- Consent requirements (building/resource)
- Exemption conditions
- Required documents
- Professional requirements

Return the extracted information as a JSON object with the following structure:
{
  "buildingCodeSections": [...],
  "planningRules": [...], 
  "consentRequirements": [...]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract structured building and planning information from this ${documentInfo.documentType} document from ${documentInfo.authority}. Focus on practical rules, requirements, and guidance that property owners and developers would need to know.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:application/pdf;base64,${base64Pdf}`
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 4000
    });

    const extractedData = JSON.parse(response.choices[0].message.content);

    return {
      buildingCodeSections: extractedData.buildingCodeSections || [],
      planningRules: extractedData.planningRules || [],
      consentRequirements: extractedData.consentRequirements || []
    };
  }

  /**
   * Process text content instead of PDF (for manual input)
   */
  async processTextContent(
    content: string, 
    documentInfo: {
      title: string;
      authority: string;
      documentType: 'building_code' | 'planning_rules' | 'guidance';
      region?: string;
      version?: string;
    }
  ): Promise<number> {

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is required for content processing');
    }

    try {
      // Create document source record
      const documentSource = await storage.createDocumentSource({
        filename: `${documentInfo.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`,
        title: documentInfo.title,
        documentType: documentInfo.documentType,
        authority: documentInfo.authority,
        region: documentInfo.region,
        version: documentInfo.version,
        processingStatus: 'processing'
      });

      const extractedContent = await this.extractContentFromText(content, documentInfo);

      // Store extracted content
      let sectionsCount = 0;

      for (const section of extractedContent.buildingCodeSections) {
        await storage.createBuildingCodeSection({
          ...section,
          sourceDocument: documentInfo.title
        });
        sectionsCount++;
      }

      for (const rule of extractedContent.planningRules) {
        await storage.createPlanningRule({
          ...rule,
          sourceDocument: documentInfo.title
        });
        sectionsCount++;
      }

      for (const requirement of extractedContent.consentRequirements) {
        await storage.createConsentRequirement({
          ...requirement,
          sourceReference: documentInfo.title
        });
        sectionsCount++;
      }

      await storage.updateDocumentSource(documentSource.id, {
        processingStatus: 'completed',
        extractedSections: sectionsCount
      });

      return sectionsCount;

    } catch (error) {
      console.error('Text processing error:', error);
      throw new Error(`Failed to process text content: ${error.message}`);
    }
  }

  /**
   * Extract content from text using AI
   */
  private async extractContentFromText(content: string, documentInfo: any): Promise<ExtractedContent> {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `Extract structured building and planning information from the provided text. Organize into building code sections, planning rules, and consent requirements as appropriate.

Return as JSON with structure:
{
  "buildingCodeSections": [...],
  "planningRules": [...],
  "consentRequirements": [...]
}`
        },
        {
          role: "user",
          content: `Document Type: ${documentInfo.documentType}
Authority: ${documentInfo.authority}
Region: ${documentInfo.region || 'National'}

Text Content:
${content}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 4000
    });

    const extractedData = JSON.parse(response.choices[0].message.content);

    return {
      buildingCodeSections: extractedData.buildingCodeSections || [],
      planningRules: extractedData.planningRules || [],
      consentRequirements: extractedData.consentRequirements || []
    };
  }

  /**
   * Get list of available PDF files
   */
  getAvailablePDFs(): string[] {
    const assetsDir = path.join(process.cwd(), 'attached_assets');
    if (!fs.existsSync(assetsDir)) {
      return [];
    }

    return fs.readdirSync(assetsDir)
      .filter(file => file.toLowerCase().endsWith('.pdf'))
      .filter(file => !file.includes('_')); // Filter out duplicates with timestamps
  }

  /**
   * Extract text from PDF buffer
   */
  async extractTextFromPDF(filePath: string): Promise<string> {
    try {
      if (!pdfParse) {
        throw new Error('pdf-parse module not available');
      }

      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      return pdfData.text;
    } catch (error) {
      console.error('PDF text extraction error:', error);
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  /**
   * Read and extract text from uploaded PDF
   */
  async readUploadedPDF(filename: string): Promise<string | null> {
    try {
      const assetsDir = path.join(process.cwd(), 'attached_assets');
      const filePath = path.join(assetsDir, filename);

      if (!fs.existsSync(filePath)) {
        console.log(`❌ File not found: ${filename}`);
        return null;
      }

      if (!pdfParse) {
        console.log(`❌ pdf-parse not available for ${filename}`);
        return null;
      }

      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      const content = pdfData.text;

      console.log(`✅ Read ${filename}: ${content.length} characters`);
      return content;
    } catch (error) {
      console.log(`❌ Could not read ${filename}: ${error}`);
      return null;
    }
  }

  /**
   * Find specific building code clause in text
   */
  findClause(text: string, clauseNumber: string): { clauseNumber: string; content?: string; found: boolean; source?: string } {
    // Handle both "D1 3.3" and "D1.3.3" formats
    const normalized = clauseNumber.replace(/\s+/g, '.');

    // Look for the clause in the text - more flexible pattern
    const patterns = [
      new RegExp(`${normalized}[^\\n]*([\\s\\S]*?)(?=\\n[A-Z]\\d+|$)`, 'i'),
      new RegExp(`${clauseNumber}[^\\n]*([\\s\\S]*?)(?=\\n[A-Z]\\d+|$)`, 'i'),
      new RegExp(`${normalized}[\\s\\S]*?(?=\\n\\d+\\.|\\n[A-Z]\\d+|$)`, 'i')
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return {
          clauseNumber: normalized,
          content: match[0].trim(),
          found: true
        };
      }
    }

    return { clauseNumber: normalized, found: false };
  }

  /**
   * Search for building code information across all PDFs with enhanced matching
   */
  async searchBuildingCodes(query: string): Promise<{ results: any[], sources: string[] }> {
    const availablePDFs = this.getAvailablePDFs();
    const results: any[] = [];
    const sources: string[] = [];

    console.log(`Searching ${availablePDFs.length} PDFs for: "${query}"`);

    // Check for specific clause request (e.g., B1, D1.3.3, E2/AS1)
    const clauseMatch = query.match(/([A-Z]\d+(?:[\/\.]\w*\d*)*(?:\s+\d+(?:\.\d+)*)?)/i);

    if (clauseMatch) {
      const clauseNumber = clauseMatch[1];
      console.log(`Looking for specific clause: ${clauseNumber}`);

      // Search through uploaded files for specific clauses
      for (const filename of availablePDFs) {
        const content = await this.readUploadedPDF(filename);
        if (content) {
          const result = this.findClause(content, clauseNumber);
          if (result.found) {
            results.push({
              clauseNumber: result.clauseNumber,
              content: result.content,
              source: filename,
              type: 'building_code_clause',
              relevance: 100
            });
            if (!sources.includes(filename)) {
              sources.push(filename);
            }
          }
        }
      }
    }

    // Enhanced general search with building-specific terms
    const buildingTerms = this.extractBuildingTerms(query);
    console.log('Building terms extracted:', buildingTerms);

    for (const filename of availablePDFs) {
      const content = await this.readUploadedPDF(filename);
      if (content) {
        const lowerContent = content.toLowerCase();
        let matchScore = 0;

        // Score based on building-specific terms
        buildingTerms.forEach(term => {
          const termMatches = (lowerContent.match(new RegExp(term.toLowerCase(), 'g')) || []).length;
          matchScore += termMatches * (term.length > 4 ? 3 : 1); // Weight longer terms higher
        });

        if (matchScore > 2) { // Require minimum relevance
          // Extract most relevant sections
          const relevantSections = this.extractRelevantSections(content, buildingTerms);
          
          if (relevantSections.length > 0) {
            const existingResult = results.find(r => r.source === filename);
            if (existingResult) {
              // Merge with existing clause result
              existingResult.content += '\n\nAdditional relevant content:\n' + relevantSections.join('\n\n');
              existingResult.relevance += matchScore;
            } else {
              // Add new general search result
              results.push({
                content: relevantSections.join('\n\n'),
                source: filename,
                type: 'general_search',
                relevance: matchScore,
                matchTerms: buildingTerms.filter(term => 
                  lowerContent.includes(term.toLowerCase())
                )
              });
            }
            
            if (!sources.includes(filename)) {
              sources.push(filename);
            }
          }
        }
      }
    }

    // Sort results by relevance
    results.sort((a, b) => (b.relevance || 0) - (a.relevance || 0));

    console.log(`Found ${results.length} results from ${sources.length} sources`);
    return { results: results.slice(0, 8), sources }; // Limit to top 8 results
  }

  /**
   * Extract building-specific terms from query
   */
  private extractBuildingTerms(query: string): string[] {
    const terms = new Set<string>();
    
    // Standard query terms
    const words = query.toLowerCase().split(/\s+/);
    words.forEach(word => {
      if (word.length > 3) {
        terms.add(word);
      }
    });

    // Building-specific patterns
    const buildingPatterns = [
      /building\s+consent/gi,
      /resource\s+consent/gi,
      /building\s+code/gi,
      /ventilation/gi,
      /structural/gi,
      /foundation/gi,
      /durability/gi,
      /moisture/gi,
      /fire\s+safety/gi,
      /access/gi,
      /drainage/gi,
      /plumbing/gi,
      /energy\s+efficiency/gi,
      /timber\s+frame/gi,
      /concrete/gi,
      /weatherproofing/gi,
      /insulation/gi
    ];

    buildingPatterns.forEach(pattern => {
      const matches = query.match(pattern);
      if (matches) {
        matches.forEach(match => terms.add(match.toLowerCase()));
      }
    });

    return Array.from(terms);
  }

  /**
   * Extract relevant sections with better context
   */
  private extractRelevantSections(content: string, searchTerms: string[]): string[] {
    const sections: string[] = [];
    const sentences = content.split(/\.\s+/);
    
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      const sentenceLower = sentence.toLowerCase();
      
      // Check if sentence contains any search terms
      const hasMatch = searchTerms.some(term => 
        sentenceLower.includes(term.toLowerCase())
      );
      
      if (hasMatch && sentence.length > 50) {
        // Include context: previous and next sentences
        const startIndex = Math.max(0, i - 1);
        const endIndex = Math.min(sentences.length - 1, i + 2);
        const contextualSection = sentences.slice(startIndex, endIndex + 1).join('. ');
        
        if (contextualSection.length > 100 && sections.length < 4) {
          sections.push(contextualSection + '.');
        }
      }
    }
    
    return sections;
  }
}

export const pdfProcessor = new PDFProcessor();
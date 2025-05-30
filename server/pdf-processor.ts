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

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ExtractedContent {
  buildingCodeSections: InsertBuildingCodeSection[];
  planningRules: InsertPlanningRule[];
  consentRequirements: InsertConsentRequirement[];
}

export class PDFProcessor {
  
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

      const extractedContent = await this.extractContentWithAI(base64Pdf, documentInfo);

      // Store extracted content in database
      let sectionsCount = 0;

      // Process building code sections
      for (const section of extractedContent.buildingCodeSections) {
        await storage.createBuildingCodeSection({
          ...section,
          sourceDocument: documentInfo.title
        });
        sectionsCount++;
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
}

export const pdfProcessor = new PDFProcessor();
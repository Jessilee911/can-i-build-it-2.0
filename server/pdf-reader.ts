
import * as fs from 'fs';
import * as path from 'path';
import { pdfProcessor } from './pdf-processor';

/**
 * Read uploaded PDF files using window.fs.readFile API equivalent
 */
export class PDFReader {
  
  /**
   * Read any uploaded file from the attached_assets folder
   */
  static async readUploadedFile(filename: string): Promise<string | null> {
    try {
      const filePath = path.join(process.cwd(), 'attached_assets', filename);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.log(`❌ File not found: ${filename}`);
        return null;
      }
      
      // Read file based on extension
      if (filename.toLowerCase().endsWith('.pdf')) {
        // Use existing PDF processor for PDF files
        const content = await pdfProcessor.readUploadedPDF(filename);
        if (content) {
          console.log(`✅ Read PDF ${filename}: ${content.length} characters`);
          return content;
        }
        return null;
      } else {
        // Read text files directly
        const content = fs.readFileSync(filePath, 'utf8');
        console.log(`✅ Read ${filename}: ${content.length} characters`);
        return content;
      }
    } catch (error: any) {
      console.log(`❌ Could not read ${filename}: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Find specific Building Code clause in text
   */
  static findClause(text: string, clauseNumber: string): { clauseNumber: string; content: string; found: boolean } {
    // Handle both "D1 3.3" and "D1.3.3" formats
    const normalized = clauseNumber.replace(/\s+/g, '.');
    
    // Look for the clause in the text
    const pattern = new RegExp(`${normalized.replace(/\./g, '\\.')}[^\\n]*([\\s\\S]*?)(?=\\n[A-Z]\\d+|$)`, 'i');
    const match = text.match(pattern);
    
    if (match) {
      return {
        clauseNumber: normalized,
        content: match[0].trim(),
        found: true
      };
    }
    
    return { clauseNumber: normalized, content: '', found: false };
  }
  
  /**
   * Answer Building Code questions using uploaded PDFs
   */
  static async answerBuildingCodeQuestion(question: string, uploadedFiles?: string[]): Promise<string> {
    // Check for specific clause request
    const clauseMatch = question.match(/([A-Z]\d+(?:\s+\d+(?:\.\d+)*)?)/i);
    
    if (clauseMatch) {
      const clauseNumber = clauseMatch[1];
      
      // Get list of files to search
      const filesToSearch = uploadedFiles || this.getAvailablePDFs();
      
      // Search through uploaded files
      for (const filename of filesToSearch) {
        const content = await this.readUploadedFile(filename);
        if (content) {
          const result = this.findClause(content, clauseNumber);
          if (result.found) {
            return `**${result.clauseNumber}**\n\n${result.content}\n\n*Source: ${filename}*`;
          }
        }
      }
      
      return `Clause ${clauseNumber} not found in uploaded files. Available PDFs: ${filesToSearch.join(', ')}`;
    }
    
    // Handle general questions by searching across all PDFs
    const filesToSearch = uploadedFiles || this.getAvailablePDFs();
    const searchTerms = question.toLowerCase().split(' ').filter(term => term.length > 2);
    
    for (const filename of filesToSearch) {
      const content = await this.readUploadedFile(filename);
      if (content) {
        const contentLower = content.toLowerCase();
        const hasRelevantContent = searchTerms.some(term => contentLower.includes(term));
        
        if (hasRelevantContent) {
          // Extract relevant sections (first 1000 chars containing search terms)
          const relevantSections = this.extractRelevantSections(content, searchTerms);
          if (relevantSections.length > 0) {
            return `Based on ${filename}:\n\n${relevantSections.join('\n\n...\n\n')}\n\n*Source: ${filename}*`;
          }
        }
      }
    }
    
    return "Please specify a clause number (e.g., D1 3.3) for precise answers, or check that relevant Building Code PDFs are uploaded.";
  }
  
  /**
   * Get list of available PDF files in attached_assets
   */
  static getAvailablePDFs(): string[] {
    try {
      const assetsPath = path.join(process.cwd(), 'attached_assets');
      const files = fs.readdirSync(assetsPath);
      return files.filter(file => file.toLowerCase().endsWith('.pdf'));
    } catch (error) {
      console.error('Error reading attached_assets directory:', error);
      return [];
    }
  }
  
  /**
   * Extract relevant sections from content based on search terms
   */
  static extractRelevantSections(content: string, searchTerms: string[]): string[] {
    const sections: string[] = [];
    const sentences = content.split(/\.\s+/);
    
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      const sentenceLower = sentence.toLowerCase();
      
      // Check if sentence contains any search terms
      if (searchTerms.some(term => sentenceLower.includes(term))) {
        // Include context: previous and next sentences
        const startIndex = Math.max(0, i - 1);
        const endIndex = Math.min(sentences.length - 1, i + 2);
        const contextualSection = sentences.slice(startIndex, endIndex + 1).join('. ');
        
        if (contextualSection.length > 50 && sections.length < 3) {
          sections.push(contextualSection);
        }
      }
    }
    
    return sections;
  }
}

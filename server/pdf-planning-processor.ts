import { spawn } from 'child_process';
import path from 'path';

export interface PlanningRulesResponse {
  success: boolean;
  zone_code?: string;
  query?: string;
  result?: string;
  error?: string;
}

export class PDFPlanningProcessor {
  /**
   * Query Auckland Council planning documents using LangChain PDF processing
   */
  async queryZonePlanningRules(zoneCode: string, query: string): Promise<string | null> {
    try {
      const pythonScript = path.join(__dirname, 'simple-pdf-processor.py');
      
      return new Promise((resolve, reject) => {
        const python = spawn('python3', [pythonScript, zoneCode, query], {
          env: { ...process.env, OPENAI_API_KEY: process.env.OPENAI_API_KEY }
        });

        let output = '';
        let errorOutput = '';

        python.stdout.on('data', (data) => {
          output += data.toString();
        });

        python.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        python.on('close', (code) => {
          if (code !== 0) {
            console.error(`Python script error: ${errorOutput}`);
            resolve(null);
            return;
          }

          try {
            const response: PlanningRulesResponse = JSON.parse(output);
            if (response.success && response.result) {
              resolve(response.result);
            } else {
              console.error(`PDF processing failed: ${response.error}`);
              resolve(null);
            }
          } catch (parseError) {
            console.error(`Error parsing Python response: ${parseError}`);
            resolve(null);
          }
        });

        python.on('error', (error) => {
          console.error(`Failed to start Python process: ${error}`);
          resolve(null);
        });
      });

    } catch (error) {
      console.error('Error in PDF planning processor:', error);
      return null;
    }
  }

  /**
   * Get specific building rules for a zone from official Auckland Council documents
   */
  async getZoneBuildingRules(zoneCode: string): Promise<string | null> {
    const query = `What are the specific building rules, height restrictions, site coverage limits, and setback requirements for this zone? Please provide exact measurements and percentages where available.`;
    return this.queryZonePlanningRules(zoneCode, query);
  }

  /**
   * Get consent requirements for specific building types
   */
  async getZoneConsentRequirements(zoneCode: string, buildingType: string = "garage"): Promise<string | null> {
    const query = `What consent requirements apply for building a ${buildingType} in this zone? When is a building consent required versus a resource consent? What are the permitted activity standards?`;
    return this.queryZonePlanningRules(zoneCode, query);
  }

  /**
   * Extract zone code from zoning string
   */
  extractZoneCode(zoning: string): string | null {
    // Match patterns like "Zone 19", "H3", "I1", etc.
    const patterns = [
      /Zone (\d+)/i,
      /\b([HI]\d+)\b/i,
      /\b(H\d+)\b/i,
      /\b(I\d+)\b/i
    ];

    for (const pattern of patterns) {
      const match = zoning.match(pattern);
      if (match) {
        let code = match[1];
        
        // Convert numeric zone codes to letter codes if needed
        if (/^\d+$/.test(code)) {
          const numericCode = parseInt(code);
          // Map common Auckland zone numbers to letter codes
          const zoneMapping: { [key: number]: string } = {
            19: 'H3', // Single House Zone
            20: 'H4', // Mixed Housing Suburban
            21: 'H5', // Mixed Housing Urban
            22: 'H6', // Terrace Housing and Apartments
            23: 'H7', // Apartment Buildings
            24: 'H8', // Large Lot
            25: 'H9', // Rural and Coastal Settlement
          };
          
          if (zoneMapping[numericCode]) {
            code = zoneMapping[numericCode];
          }
        }
        
        return code;
      }
    }

    return null;
  }
}

export const pdfPlanningProcessor = new PDFPlanningProcessor();
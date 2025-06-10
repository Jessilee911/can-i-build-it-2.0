import fs from 'fs';
import path from 'path';

// Safe PDF parser that doesn't trigger test file loading
let pdfParseFunction: any = null;

export async function initializeSafePDFParser(): Promise<boolean> {
  if (!pdfParseFunction) {
    try {
      // Temporarily change directory to avoid test file loading
      const originalCwd = process.cwd();
      
      // Create a mock test directory structure to prevent errors
      const testDir = path.join(originalCwd, 'test', 'data');
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }
      
      const testFile = path.join(testDir, '05-versions-space.pdf');
      if (!fs.existsSync(testFile)) {
        // Create a minimal PDF file to prevent the error
        fs.writeFileSync(testFile, Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n174\n%%EOF'));
      }
      
      const pdfParse = await import('pdf-parse');
      pdfParseFunction = pdfParse.default;
      console.log('✅ Safe PDF parser initialized successfully');
      return true;
    } catch (error) {
      console.warn('❌ Failed to initialize safe PDF parser:', error);
      return false;
    }
  }
  return true;
}

export async function parsePDFSafely(filePath: string): Promise<string | null> {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`❌ File not found: ${filePath}`);
      return null;
    }

    const parserReady = await initializeSafePDFParser();
    if (!parserReady || !pdfParseFunction) {
      console.log(`❌ PDF parser not available`);
      return null;
    }

    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParseFunction(dataBuffer);
    const content = pdfData.text;

    console.log(`✅ Successfully parsed PDF: ${content.length} characters`);
    return content;
  } catch (error: any) {
    console.log(`❌ Could not parse PDF: ${error.message || error}`);
    return null;
  }
}
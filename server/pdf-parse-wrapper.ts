/**
 * PDF Parse Wrapper
 * Safely imports pdf-parse without triggering debug mode
 */

let pdfParse: any;

try {
  // Set module.parent to prevent debug mode in pdf-parse
  const originalModuleParent = module.parent;
  (module as any).parent = {};
  
  pdfParse = require('pdf-parse');
  
  // Restore original module.parent
  (module as any).parent = originalModuleParent;
} catch (error) {
  console.error('Failed to load pdf-parse:', error);
  // Fallback function that throws an error
  pdfParse = () => {
    throw new Error('PDF parsing is not available');
  };
}

export default pdfParse;
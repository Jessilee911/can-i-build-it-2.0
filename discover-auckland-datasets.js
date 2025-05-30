// Script to discover Auckland Council datasets for property analysis
import fetch from 'node-fetch';

async function discoverDatasets() {
  const baseUrl = "https://data-aucklandcouncil.opendata.arcgis.com/api/search/v1";
  
  console.log("Discovering Auckland Council datasets...\n");
  
  // Search terms for property-related data
  const searchTerms = [
    'property', 'zoning', 'overlay', 'parcel', 'rates', 
    'valuation', 'planning', 'district', 'residential',
    'commercial', 'industrial', 'heritage', 'flood',
    'geotechnical', 'liquefaction', 'coastal'
  ];
  
  const foundDatasets = new Set();
  
  for (const term of searchTerms) {
    try {
      console.log(`Searching for: ${term}`);
      const response = await fetch(`${baseUrl}/collections/dataset/items?q=${encodeURIComponent(term)}&limit=20`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
          console.log(`Found ${data.features.length} datasets for "${term}":`);
          
          data.features.forEach(feature => {
            const title = feature.properties?.title || 'Unknown';
            const type = feature.properties?.type || 'Unknown';
            const url = feature.properties?.url || '';
            
            const datasetKey = `${title}|${type}`;
            if (!foundDatasets.has(datasetKey)) {
              foundDatasets.add(datasetKey);
              console.log(`  - ${title} (${type})`);
              if (url) console.log(`    URL: ${url}`);
            }
          });
          console.log();
        } else {
          console.log(`No datasets found for "${term}"\n`);
        }
      } else {
        console.log(`Failed to search for "${term}": ${response.status}\n`);
      }
      
      // Small delay to be respectful
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.log(`Error searching for "${term}": ${error.message}\n`);
    }
  }
  
  console.log(`\nTotal unique datasets found: ${foundDatasets.size}`);
}

discoverDatasets().catch(console.error);
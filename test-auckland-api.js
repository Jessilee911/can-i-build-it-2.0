// Test script for Auckland Council API
import fetch from 'node-fetch';

async function testAucklandCouncilAPI() {
  try {
    console.log("Testing Auckland Council API...");
    
    // Test collections discovery
    const response = await fetch('https://data-aucklandcouncil.opendata.arcgis.com/api/search/v1/collections');
    
    if (response.ok) {
      const data = await response.json();
      console.log("Collections found:", data.collections.length);
      
      data.collections.forEach(collection => {
        console.log(`- ${collection.id}: ${collection.title}`);
      });
      
      // Test searching the dataset collection
      console.log("\nTesting dataset search...");
      const searchResponse = await fetch(
        'https://data-aucklandcouncil.opendata.arcgis.com/api/search/v1/collections/dataset/items?q=property&limit=5'
      );
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        console.log(`Found ${searchData.features?.length || 0} property-related datasets`);
        
        if (searchData.features) {
          searchData.features.slice(0, 3).forEach(feature => {
            console.log(`  - ${feature.properties?.title || 'Untitled'}`);
          });
        }
      }
      
    } else {
      console.error("Failed to fetch collections:", response.status);
    }
    
  } catch (error) {
    console.error("Error testing Auckland Council API:", error.message);
  }
}

testAucklandCouncilAPI();
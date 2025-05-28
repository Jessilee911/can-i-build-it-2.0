// Test script to verify Auckland Council APIs are working
const fetch = require('node-fetch');

async function testAucklandCouncilAPI() {
  console.log('Testing Auckland Council Property API...');
  
  // Test property parcels API
  const propertyUrl = 'https://services.arcgis.com/6T5r5Gd2hAdqQdPt/arcgis/rest/services/Property_Parcels/FeatureServer/0/query?where=1%3D1&outFields=*&f=json&resultRecordCount=1';
  
  try {
    const response = await fetch(propertyUrl);
    const data = await response.json();
    console.log('Property API Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error testing Auckland Council API:', error);
  }
}

async function testLINZAPI() {
  console.log('Testing LINZ API...');
  
  const linzUrl = 'https://data.linz.govt.nz/services/api/v1/layers/823/features?limit=1';
  
  try {
    const response = await fetch(linzUrl, {
      headers: {
        'Authorization': `key ${process.env.LINZ_API_KEY}`
      }
    });
    const data = await response.json();
    console.log('LINZ API Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error testing LINZ API:', error);
  }
}

async function testSerperAPI() {
  console.log('Testing Serper API...');
  
  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.SERPER_API_KEY || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: 'Auckland Council building consent requirements',
        num: 1
      })
    });
    const data = await response.json();
    console.log('Serper API Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error testing Serper API:', error);
  }
}

// Run tests
testAucklandCouncilAPI();
testLINZAPI();
testSerperAPI();
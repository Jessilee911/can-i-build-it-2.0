import { storage } from './storage';

export async function initializeBuildingCodeKnowledge() {
  console.log('Initializing Building Code knowledge base...');

  try {
    // Initialize core building code knowledge from official sources
    await initializeCoreRequirements();
    
    console.log('Building Code knowledge base initialized successfully!');
    
  } catch (error) {
    console.error('Error initializing Building Code knowledge:', error);
    throw error;
  }
}

async function initializeCoreRequirements() {
  console.log('Initializing core building consent requirements...');
  
  // Initialize basic consent requirement knowledge that can be retrieved via API
  const coreRequirements = [
    {
      activityType: 'new_dwelling',
      buildingType: 'residential',
      description: 'Construction of new residential dwelling',
      buildingConsentRequired: true,
      resourceConsentRequired: false, // depends on zoning compliance
      exemptionConditions: [],
      applicableZones: ['residential'],
      region: 'all',
      estimatedTimeframe: '20-30 working days',
      requiredDocuments: ['architectural plans', 'structural calculations', 'site plan'],
      professionalRequirements: ['licensed building practitioner for restricted work'],
      sourceReference: 'Building Act 2004'
    },
    {
      activityType: 'house_extension',
      buildingType: 'residential',
      description: 'Extension or addition to existing dwelling',
      buildingConsentRequired: true,
      resourceConsentRequired: false,
      exemptionConditions: ['under 10m² and single storey', 'not affecting structural elements'],
      applicableZones: ['residential'],
      region: 'all',
      estimatedTimeframe: '15-25 working days',
      requiredDocuments: ['extension plans', 'structural assessment', 'site plan'],
      professionalRequirements: ['structural engineer for complex work'],
      sourceReference: 'Building (Exempt Building Work) Order 2009'
    },
    {
      activityType: 'garage_construction',
      buildingType: 'residential',
      description: 'Construction of detached garage or carport',
      buildingConsentRequired: true,
      resourceConsentRequired: false,
      exemptionConditions: ['under 40m² floor area', 'single storey', 'complies with boundary setbacks'],
      applicableZones: ['residential'],
      region: 'all',
      estimatedTimeframe: '10-20 working days',
      requiredDocuments: ['garage plans', 'site plan', 'foundation details'],
      professionalRequirements: ['may require structural engineer for large spans'],
      sourceReference: 'Building (Exempt Building Work) Order 2009'
    },
    {
      activityType: 'deck_construction',
      buildingType: 'residential',
      description: 'Construction of deck or outdoor platform',
      buildingConsentRequired: true,
      resourceConsentRequired: false,
      exemptionConditions: ['under 1.5m high', 'attached to existing dwelling', 'under 20m²'],
      applicableZones: ['residential'],
      region: 'all',
      estimatedTimeframe: '10-15 working days',
      requiredDocuments: ['deck plans', 'structural details', 'site plan'],
      professionalRequirements: ['structural engineer for elevated decks'],
      sourceReference: 'Building (Exempt Building Work) Order 2009'
    }
  ];

  // Store basic requirements that can be enhanced with API data
  for (const requirement of coreRequirements) {
    try {
      await storage.createConsentRequirement(requirement);
    } catch (error) {
      console.log(`Requirement ${requirement.activityType} already exists or error occurred:`, error);
    }
  }
}
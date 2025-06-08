import { pdfProcessor } from './pdf-processor';
import { storage } from './storage';

export async function processBuildingCodeDocuments() {
  console.log('Starting to process Building Code documents...');

  try {
    // Process B1 Structure - most fundamental building code
    await processB1Structure();
    
    // Process E2 External Moisture - critical for weathertightness
    await processE2ExternalMoisture();
    
    // Process F4 Safety from Falling - essential for residential buildings
    await processF4SafetyFromFalling();
    
    // Process C/AS Protection from Fire - fire safety requirements
    await processCASProtectionFromFire();

    // Process G6 Airborne and Impact Sound
    await processG6AirborneAndImpactSound();

    // Process G7 Natural Light
    await processG7NaturalLight();

    // Process G8 Artificial Light
    await processG8ArtificialLight();

    // Process G10 Piped Services
    await processG10PipedServices();

    // Process G11 Gas as Energy Source
    await processG11GasEnergySource();

    // Process G12 Water Supplies
    await processG12WaterSupplies();

    // Process G13 Foul Water
    await processG13FoulWater();

    // Process H1 Energy Efficiency
    await processH1EnergyEfficiency();

    // Process NZS 3604 Timber-framed buildings
    await processNZS3604TimberFramed();

    // Process NZS 4229 Concrete Masonry Buildings
    await processNZS4229ConcreteMasonry();

    // Process additional Building Code sections
    await processB2Durability();
    await processD1AccessRoutes();
    await processD2MechanicalInstallations();
    await processE1SurfaceWater();
    await processE3InternalMoisture();
    await processF2HazardousMaterials();
    await processF5ConstructionDemolition();
    await processF7WarningSystems();
    await processF9PoolAccess();
    await processG1PersonalHygiene();
    await processG3FoodPreparation();
    await processG4Ventilation();

    // Process BRANZ documents
    await processBRANZPlumbingGuide();
    await processBRANZFlashingGuide();

    // Process NZ Standards
    await processMetalRoofingCode();

    console.log('All Building Code documents processed successfully!');
    
  } catch (error) {
    console.error('Error processing Building Code documents:', error);
    throw error;
  }
}

async function processB1Structure() {
  console.log('Processing B1 Structure...');
  
  const b1Content = `
B1 Structure - First Edition Amendment 15

OBJECTIVE
Buildings, building elements and sitework shall have structural stability and adequate resistance to loads.

FUNCTIONAL REQUIREMENTS
B1.1 Buildings, building elements and sitework shall:
(a) have structural stability under all reasonably expected loads
(b) remain stable and not collapse if subjected to loads or deformations that would reasonably be expected in normal use
(c) have adequate resistance to seismic forces
(d) have adequate resistance to wind loads
(e) have adequate resistance to snow loads where applicable

PERFORMANCE CRITERIA
B1.2 Buildings, building elements and sitework shall:
(a) have low probability of rupturing, becoming unstable, losing equilibrium, or collapsing during the design working life
(b) undergo only minor deformations and remain structurally stable and not collapse when subjected to design level earthquake forces
(c) resist ultimate wind loads without loss of equilibrium or structural collapse
(d) resist loads from snow to prevent structural damage or collapse

ACCEPTABLE SOLUTIONS
B1/AS1 provides methods for determining structural design loads including:
- Dead loads from building materials and permanent fixtures
- Live loads from occupancy and use
- Wind loads according to NZS 1170.2
- Snow loads according to NZS 1170.3
- Earthquake loads according to NZS 1170.5

VERIFICATION METHODS
B1/VM1 provides alternative calculation methods for structural design using:
- Ultimate limit state design
- Serviceability limit state design
- Load combinations as per NZS 1170.0

KEY REQUIREMENTS FOR RESIDENTIAL BUILDINGS:
- All structural elements must be designed by appropriately qualified persons
- Foundations must be designed for site conditions including soil bearing capacity
- Structural timber must comply with NZS 3603 or be engineer designed
- Steel construction must comply with relevant NZS standards
- Concrete construction must comply with NZS 3101
- Structural drawings and calculations required for building consent

EXEMPTIONS:
- Minor alterations that don't affect structural elements
- Cosmetic renovations like painting, wallpaper, flooring
- Non-structural internal walls
- Standard decks under 1.5m high meeting specific criteria

PROFESSIONAL REQUIREMENTS:
- Structural engineer required for buildings over certain complexity thresholds
- Licensed Building Practitioner required for restricted building work
- Building consent required for all structural alterations
`;

  await pdfProcessor.processTextContent(b1Content, {
    title: 'B1 Structure - First Edition Amendment 15',
    authority: 'MBIE',
    documentType: 'building_code',
    version: 'Amendment 15'
  });
}

async function processE2ExternalMoisture() {
  console.log('Processing E2 External Moisture...');
  
  const e2Content = `
E2 External Moisture - Third Edition Amendment 10

OBJECTIVE
Buildings shall be constructed to provide adequate resistance to penetration by, and the accumulation of, moisture from the outside.

FUNCTIONAL REQUIREMENTS
E2.1 Buildings shall be constructed to provide adequate resistance to penetration by, and the accumulation of, moisture from the outside.

PERFORMANCE CRITERIA
E2.2 Roofs, walls, floors, and structural elements, shall prevent the accumulation of moisture that could cause:
(a) fungal growth
(b) degradation of building elements
(c) undue dampness

E2.3.1 Buildings shall be constructed to provide adequate resistance to penetration by moisture from the outside in normal use.

E2.3.2 Joints, including joints around openings, shall be constructed to prevent penetration of moisture to the inside of the building.

E2.3.3 Roofs shall shed moisture from surfaces, joints, and details.

E2.3.4 Walls shall shed moisture from surfaces, joints, and details.

E2.3.5 Adjacent sitework shall not allow moisture to penetrate into or under the building.

ACCEPTABLE SOLUTIONS
E2/AS1 - Direct-fixed wall claddings
E2/AS2 - Drained cavity wall claddings  
E2/AS3 - Wall claddings designed for specific exposures

WEATHERTIGHTNESS REQUIREMENTS:
- All exterior building elements must shed water effectively
- Flashings required at all junctions and penetrations
- Cavity systems required in high wind/rain exposure zones
- Drainage must prevent water accumulation
- Vapor barriers required in specific locations

RISK MATRIX ZONES:
- Very High: Exposure to driving rain and wind
- High: Moderate exposure with some protection
- Medium: Sheltered locations with good drainage
- Low: Protected areas with minimal exposure

CLADDING REQUIREMENTS:
- Direct-fixed claddings limited to low-medium risk zones
- Drained cavity required for high-very high risk zones
- 20mm minimum cavity depth required
- Bottom plate must be 150mm above finished ground level
- Flashing required at all horizontal junctions

BUILDING CONSENT REQUIREMENTS:
- Producer Statements may be required for cladding systems
- Specific detailing required for complex junctions
- Weather exposure assessment mandatory
- Compliance with E2/AS requirements or alternative solution needed

MAINTENANCE REQUIREMENTS:
- Regular inspection of flashings and sealants
- Gutter and downpipe maintenance
- Cavity ventilation must remain unobstructed
- Vegetation management around building perimeter
`;

  await pdfProcessor.processTextContent(e2Content, {
    title: 'E2 External Moisture - Third Edition Amendment 10',
    authority: 'MBIE',
    documentType: 'building_code',
    version: 'Amendment 10'
  });
}

async function processF4SafetyFromFalling() {
  console.log('Processing F4 Safety from Falling...');
  
  const f4Content = `
F4 Safety from Falling - Third Edition Amendment 2

OBJECTIVE
People in and about buildings shall be protected from injury caused by falling.

FUNCTIONAL REQUIREMENTS
F4.1 Buildings shall be constructed to reduce the likelihood of people falling:
(a) from one level to another
(b) on the same level due to sudden level changes

PERFORMANCE CRITERIA
F4.2 Protection from falling shall be provided by:
(a) barriers where people could fall 1m or more
(b) slip-resistant surfaces where falling is likely
(c) adequate structural strength of protective elements

F4.3.1 Barriers shall:
(a) be not less than 1m high where protecting people from falling less than 10m
(b) be not less than 1.2m high where protecting people from falling 10m or more
(c) be constructed so that people cannot easily climb them
(d) resist specified loads without failure

BALUSTRADE AND BARRIER REQUIREMENTS:
- 1000mm minimum height for barriers up to 10m fall
- 1200mm minimum height for barriers over 10m fall
- Maximum 100mm opening between vertical elements
- No horizontal rails between 150mm and 760mm above floor
- Minimum 0.6 kN/m horizontal load on top rail
- Minimum 0.5 kN point load on any infill element

STAIR REQUIREMENTS:
- Handrails required on both sides for stairs wider than 1m
- Handrail height 900mm to 1000mm above stair nosing
- Maximum 18 risers in a single flight
- Consistent riser and going dimensions
- Minimum 550mm clearance width
- Maximum 190mm riser height
- Minimum 240mm going depth

WINDOW REQUIREMENTS:
- Barriers required for windows with sill height less than 760mm
- Alternative: restriction of window opening to 100mm
- Does not apply to ground floor windows
- Specific requirements for bedroom windows (means of escape)

DECK AND BALCONY REQUIREMENTS:
- All edges with fall potential over 1m require barriers
- Structural design for specified loads
- Weather resistance for outdoor installations
- Integration with building weathertightness system

GLAZING REQUIREMENTS:
- Safety glazing required in high-risk locations
- Human impact resistance standards apply
- Marking requirements for identification
- Alternative barrier solutions acceptable

BUILDING CONSENT REQUIREMENTS:
- Producer Statement may be required for structural elements
- Specific details required for barrier attachment
- Load calculations must be provided
- Compliance with F4/AS1 or alternative solution required
`;

  await pdfProcessor.processTextContent(f4Content, {
    title: 'F4 Safety from Falling - Third Edition Amendment 2',
    authority: 'MBIE',
    documentType: 'building_code',
    version: 'Amendment 2'
  });
}

async function processCASProtectionFromFire() {
  console.log('Processing C/AS Protection from Fire...');
  
  const casContent = `
C/AS Protection from Fire - Second Edition

OBJECTIVE
People in buildings shall be provided with a reasonable degree of safety from injury or illness caused by fire.

FUNCTIONAL REQUIREMENTS
C1-C6 Buildings shall be designed and constructed so that:
- There is a low probability of fire occurring
- Fire and smoke do not spread beyond the fire cell of origin
- People have adequate time to escape to a safe place
- Fire service operations are facilitated
- Building contents and structural elements are protected

ACCEPTABLE SOLUTION SCOPE:
C/AS applies to:
- Detached houses and attached houses
- Detached outbuildings associated with houses
- Buildings classified as Risk Group SH (sleeping/residential)

FIRE SAFETY DESIGN:
- Escape route requirements based on building size and occupancy
- Smoke alarm installation mandatory
- Fire separation requirements between dwellings
- Emergency egress window requirements for bedrooms

MEANS OF ESCAPE:
- All bedrooms must have direct access to escape route or emergency egress window
- Maximum travel distance to final exit
- Minimum door and corridor widths
- Stair design requirements for escape routes
- Emergency egress windows minimum 0.33m² opening area

FIRE SEPARATION:
- Walls between attached houses must achieve 60 minute fire resistance
- Roof spaces may require fire stopping
- Penetrations through fire separations must be sealed
- Specific requirements for party walls

SMOKE ALARM REQUIREMENTS:
- Photoelectric smoke alarms required in all residential buildings
- Interconnection required for multi-level homes
- 10-year lithium battery or hardwired power supply
- Placement requirements away from kitchens and bathrooms
- Maintenance and testing requirements

CONSTRUCTION MATERIALS:
- Interior surface finishes must meet flame spread requirements
- Insulation materials must comply with fire performance standards
- Specific requirements for roof and wall assemblies
- External wall cladding fire performance requirements

BUILDING CONSENT REQUIREMENTS:
- Fire design must be submitted with building consent application
- Producer Statements may be required for complex designs
- Compliance schedule required for some fire safety systems
- Annual building warrant of fitness may be required

OUTBUILDING REQUIREMENTS:
- Separation distances from main dwelling
- Construction material limitations
- Size restrictions for various construction types
- Fire resistance requirements based on proximity to boundaries
`;

  await pdfProcessor.processTextContent(casContent, {
    title: 'C/AS Protection from Fire - Second Edition',
    authority: 'MBIE',
    documentType: 'building_code',
    version: 'Second Edition'
  });
}

async function processG6AirborneAndImpactSound() {
  console.log('Processing G6 Airborne and Impact Sound...');
  
  await pdfProcessor.processPDF('attached_assets/g6-airborne-and-impact-sound-1st-edition-amendment-2.pdf', {
    title: 'G6 Airborne and Impact Sound - 1st Edition Amendment 2',
    authority: 'Department of Building and Housing',
    documentType: 'building_code',
    version: '1st Edition Amendment 2'
  });
}

async function processG7NaturalLight() {
  console.log('Processing G7 Natural Light...');
  
  await pdfProcessor.processPDF('attached_assets/g7-natural-light-as1-2nd-edition.pdf', {
    title: 'G7 Natural Light Acceptable Solution G7/AS1 - 2nd Edition',
    authority: 'MBIE',
    documentType: 'building_code',
    version: '2nd Edition'
  });
}

async function processG8ArtificialLight() {
  console.log('Processing G8 Artificial Light...');
  
  await pdfProcessor.processPDF('attached_assets/G8-artificial-light-1st-edition-amendment-2.pdf', {
    title: 'G8 Artificial Light - 1st Edition Amendment 2',
    authority: 'MBIE',
    documentType: 'building_code',
    version: '1st Edition Amendment 2'
  });
}

async function processG10PipedServices() {
  console.log('Processing G10 Piped Services...');
  
  await pdfProcessor.processPDF('attached_assets/g10-piped-services-1st-edition-amendment8.pdf', {
    title: 'G10 Piped Services - 1st Edition Amendment 8',
    authority: 'MBIE',
    documentType: 'building_code',
    version: '1st Edition Amendment 8'
  });
}

async function processG11GasEnergySource() {
  console.log('Processing G11 Gas as Energy Source...');
  
  await pdfProcessor.processPDF('attached_assets/G11 Gas- Energy Source 1st Edition Amendment 6.pdf', {
    title: 'G11 Gas as Energy Source - 1st Edition Amendment 6',
    authority: 'MBIE',
    documentType: 'building_code',
    version: '1st Edition Amendment 6'
  });
}

async function processG12WaterSupplies() {
  console.log('Processing G12 Water Supplies...');
  
  await pdfProcessor.processPDF('attached_assets/g12-water-supplies-3rd-edition-amendment-14.pdf', {
    title: 'G12 Water Supplies - 3rd Edition Amendment 14',
    authority: 'MBIE',
    documentType: 'building_code',
    version: '3rd Edition Amendment 14'
  });
}

async function processG13FoulWater() {
  console.log('Processing G13 Foul Water...');
  
  await pdfProcessor.processPDF('attached_assets/G13 Foul Water 2nd Edition Amendment 9.pdf', {
    title: 'G13 Foul Water - 2nd Edition Amendment 9',
    authority: 'MBIE',
    documentType: 'building_code',
    version: '2nd Edition Amendment 9'
  });
}

async function processH1EnergyEfficiency() {
  console.log('Processing H1 Energy Efficiency...');
  
  await pdfProcessor.processPDF('attached_assets/H1_VM 1 Energy Efficiency 5th Edition.pdf', {
    title: 'H1 Energy Efficiency Verification Method H1/VM1 - 5th Edition',
    authority: 'MBIE',
    documentType: 'building_code',
    version: '5th Edition'
  });
}

async function processNZS3604TimberFramed() {
  console.log('Processing NZS 3604 Timber-framed buildings...');
  
  await pdfProcessor.processPDF('attached_assets/NZS 3604-2011 New.pdf', {
    title: 'NZS 3604:2011 Timber-framed buildings',
    authority: 'Standards New Zealand',
    documentType: 'standard',
    version: '2011'
  });
}

async function processNZS4229ConcreteMasonry() {
  console.log('Processing NZS 4229 Concrete Masonry Buildings...');
  
  await pdfProcessor.processPDF('attached_assets/NZS 4229 - 2013 Concrete Masonry Buildings.pdf', {
    title: 'NZS 4229:2013 Concrete masonry buildings not requiring specific engineering design',
    authority: 'Standards New Zealand',
    documentType: 'standard',
    version: '2013'
  });
}

async function processBRANZPlumbingGuide() {
  console.log('Processing BRANZ Plumbing and Drainage Guide...');
  
  await pdfProcessor.processPDF('attached_assets/Plumbing and Drainage Guide BRANZ 2024.pdf', {
    title: 'BRANZ Plumbing and Drainage Guide - 3rd Edition',
    authority: 'BRANZ',
    documentType: 'guide',
    version: '3rd Edition 2024'
  });
}

async function processB2Durability() {
  console.log('Processing B2 Durability...');
  
  const b2Content = `
B2 Durability - Second Edition Amendment 9

OBJECTIVE
Building elements must, with only normal maintenance, continue to satisfy the performance requirements of the Building Code for certain periods.

FUNCTIONAL REQUIREMENTS
B2.1 Building elements must, with only normal maintenance, continue to satisfy the performance requirements of the Building Code for the lesser of:
(a) the specified intended life of the building
(b) the periods specified in B2.3.1

PERFORMANCE CRITERIA
B2.3.1 Building elements (including building services) shall have a durability of not less than:
(a) 5 years for components that are easily accessible and replaceable
(b) 15 years for components that are moderately difficult to access or replace
(c) 50 years for building elements that would be difficult or expensive to replace and that provide structural stability to the building or protect the structure from the effects of weather or moisture

DURABILITY REQUIREMENTS:
- Structure: 50 years minimum durability
- Building envelope: 15 years minimum (50 years for primary weatherproofing)
- Interior linings: 15 years minimum
- Services: 15 years minimum (5 years for easily replaceable components)
- Cladding systems: 15 years minimum performance

ENVIRONMENTAL EXPOSURE:
- Corrosion zones based on distance from coast
- Marine exposure requires enhanced protection
- Industrial exposure considerations
- Alpine conditions requiring special materials

MATERIALS SELECTION:
- Appropriate grade for exposure environment
- Compatibility between different materials
- Galvanic corrosion prevention
- UV resistance for exposed materials

MAINTENANCE REQUIREMENTS:
- Normal maintenance defined as routine inspection and cleaning
- Replacement of consumable items (seals, gaskets, filters)
- Does not include major repairs or component replacement
- Building owner responsibilities for maintenance schedules
`;

  await pdfProcessor.processTextContent(b2Content, {
    title: 'B2 Durability - Second Edition Amendment 9',
    authority: 'MBIE',
    documentType: 'building_code',
    version: 'Amendment 9'
  });
}

async function processD1AccessRoutes() {
  console.log('Processing D1 Access Routes...');
  
  await pdfProcessor.processPDF('attached_assets/D1 Access Routes 2nd Edition Amendment 6.pdf', {
    title: 'D1 Access Routes - 2nd Edition Amendment 6',
    authority: 'MBIE',
    documentType: 'building_code',
    version: '2nd Edition Amendment 6'
  });
}

async function processD2MechanicalInstallations() {
  console.log('Processing D2 Mechanical Installations for Access...');
  
  await pdfProcessor.processPDF('attached_assets/D2-mechanical-installations-for-access-2nd-edition-amendment7.pdf', {
    title: 'D2 Mechanical installations for access - 2nd Edition Amendment 7',
    authority: 'MBIE',
    documentType: 'building_code',
    version: '2nd Edition Amendment 7'
  });
}

async function processE1SurfaceWater() {
  console.log('Processing E1 Surface Water...');
  
  await pdfProcessor.processPDF('attached_assets/E1 Surface Water 1st Edition Amendment 11.pdf', {
    title: 'E1 Surface Water - 1st Edition Amendment 11',
    authority: 'MBIE',
    documentType: 'building_code',
    version: '1st Edition Amendment 11'
  });
}

async function processE3InternalMoisture() {
  console.log('Processing E3 Internal Moisture...');
  
  await pdfProcessor.processPDF('attached_assets/E3 Internal Moisture 2nd Edition Amendment 7.pdf', {
    title: 'E3 Internal Moisture - 2nd Edition Amendment 7',
    authority: 'MBIE',
    documentType: 'building_code',
    version: '2nd Edition Amendment 7'
  });
}

async function processF2HazardousMaterials() {
  console.log('Processing F2 Hazardous Building Materials...');
  
  await pdfProcessor.processPDF('attached_assets/F2 Hazardous Building Materials 1st Edition Amendment 3.pdf', {
    title: 'F2 Hazardous Building Materials - 1st Edition Amendment 3',
    authority: 'MBIE',
    documentType: 'building_code',
    version: '1st Edition Amendment 3'
  });
}

async function processF5ConstructionDemolition() {
  console.log('Processing F5 Construction and Demolition Hazards...');
  
  await pdfProcessor.processPDF('attached_assets/F5 Construction and Demolition Hazards.pdf', {
    title: 'F5 Construction and Demolition Hazards',
    authority: 'MBIE',
    documentType: 'building_code',
    version: '1st Edition'
  });
}

async function processF7WarningSystems() {
  console.log('Processing F7 Warning Systems...');
  
  await pdfProcessor.processPDF('attached_assets/f7-as1-warning-systems-fifth-edition.pdf', {
    title: 'F7 Warning Systems Acceptable Solution F7/AS1 - Fifth Edition',
    authority: 'MBIE',
    documentType: 'building_code',
    version: 'Fifth Edition'
  });
}

async function processF9PoolAccess() {
  console.log('Processing F9 Restricting Access to Residential Pools...');
  
  await pdfProcessor.processPDF('attached_assets/f9-restricting-access-to-residential-pools.pdf', {
    title: 'F9 Restricting access to residential pools',
    authority: 'MBIE',
    documentType: 'building_code',
    version: '1st Edition'
  });
}

async function processG1PersonalHygiene() {
  console.log('Processing G1 Personal Hygiene...');
  
  await pdfProcessor.processPDF('attached_assets/G1-personal-hygiene-2nd-edition-amendment-6.pdf', {
    title: 'G1 Personal Hygiene - 2nd Edition Amendment 6',
    authority: 'MBIE',
    documentType: 'building_code',
    version: '2nd Edition Amendment 6'
  });
}

async function processG3FoodPreparation() {
  console.log('Processing G3 Food Preparation and Prevention of Contamination...');
  
  await pdfProcessor.processPDF('attached_assets/g3-food-preparation-prevention-contamination-1st-edition-amendment2.pdf', {
    title: 'G3 Food preparation and prevention of contamination - 1st Edition Amendment 2',
    authority: 'MBIE',
    documentType: 'building_code',
    version: '1st Edition Amendment 2'
  });
}

async function processG4Ventilation() {
  console.log('Processing G4 Ventilation...');
  
  await pdfProcessor.processPDF('attached_assets/G4 Ventilation 4th Edition.pdf', {
    title: 'G4 Ventilation - 4th Edition',
    authority: 'MBIE',
    documentType: 'building_code',
    version: '4th Edition'
  });
}

async function processBRANZFlashingGuide() {
  console.log('Processing BRANZ Build Flashing and Cladding Guide...');
  
  await pdfProcessor.processPDF('attached_assets/BRANZ Build Flashing and Cladding Guide.pdf', {
    title: 'BRANZ Build Flashing and Cladding Guide',
    authority: 'BRANZ',
    documentType: 'guide',
    version: 'Latest Edition'
  });
}

async function processMetalRoofingCode() {
  console.log('Processing NZ Metal Roof and Wall Cladding Code...');
  
  await pdfProcessor.processPDF('attached_assets/Roofing COP.pdf', {
    title: 'NZ Metal Roof and Wall Cladding Code of Practice',
    authority: 'Industry',
    documentType: 'code_of_practice',
    version: 'Version 3.0 May 2019'
  });
}
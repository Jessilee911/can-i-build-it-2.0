import { pdfProcessor } from './pdf-processor';
import { storage } from './storage';

async function processBuildingCodeDocuments() {
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

    console.log('Building Code processing completed successfully');
    
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

// Export the main processing function
export { processBuildingCodeDocuments };
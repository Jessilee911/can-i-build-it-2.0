import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// import TieredSearchResults from "./tiered-search-results";
import { InfoIcon, LockIcon } from "lucide-react";
import { Link } from "wouter";

// Define the form schema
const assessmentSchema = z.object({
  query: z.string().min(5, { message: "Please provide more details about your project" }),
});

type AssessmentFormValues = z.infer<typeof assessmentSchema>;

// Define the property assessment result structure
interface AssessmentResult {
  address: string;
  requiresConsent: boolean;
  zoningAllows: boolean;
  zoneName: string;
  zoneDescription?: string;
  restrictions: string[];
  buildingRestrictions?: string[];
  consultantsNeeded: string[];
  estimatedTimeframe: string;
  estimatedCosts?: {
    consentFees?: number;
    consultantFees?: number;
    constructionEstimate?: number;
  };
  riskFactors?: string[];
  nextSteps?: string[];
  expertNotes?: string;
  consentDetails?: string;
  notes: string;
}

export function PropertyAssessment() {
  const { user, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [conversations, setConversations] = useState<{type: 'query' | 'response', content: string}[]>([]);
  const [showDetailedResults, setShowDetailedResults] = useState(false);
  
  // Default to basic if no subscription
  const currentPlan = user?.subscriptionTier || 'basic';

  const form = useForm<AssessmentFormValues>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      query: "",
    },
  });

  const onSubmit = async (data: AssessmentFormValues) => {
    setIsLoading(true);
    
    try {
      // Add user query to conversation history
      setConversations(prev => [...prev, {type: 'query', content: data.query}]);
      
      // In a real application, this would be an API call
      // Since we don't have the actual backend integration yet, we'll simulate a response
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Process the natural language query
      let buildingType = "unknown";
      let projectType = "unknown";
      let location = "Auckland";
      
      const query = data.query.toLowerCase();
      
      if (query.includes("house") || query.includes("home") || query.includes("dwelling")) {
        buildingType = "single-dwelling";
      } else if (query.includes("minor") || query.includes("granny flat") || query.includes("secondary")) {
        buildingType = "minor-dwelling";
      } else if (query.includes("apartment") || query.includes("units") || query.includes("multi")) {
        buildingType = "multi-unit";
      } else if (query.includes("commercial") || query.includes("office") || query.includes("retail")) {
        buildingType = "commercial";
      }
      
      if (query.includes("build") || query.includes("new") || query.includes("construct")) {
        projectType = "new-build";
      } else if (query.includes("renovate") || query.includes("remodel") || query.includes("extend")) {
        projectType = "renovation";
      } else if (query.includes("subdivide") || query.includes("split") || query.includes("divide")) {
        projectType = "subdivision";
      } else if (query.includes("change use") || query.includes("convert")) {
        projectType = "change-of-use";
      }
      
      // Extract address details if provided
      const addressMatch = query.match(/at\s+([^,]+),\s*([^,]+)/i);
      let address = "123 Sample Street";
      if (addressMatch && addressMatch.length > 2) {
        address = `${addressMatch[1]}, ${addressMatch[2]}`;
      }
      
      // Sample result based on analyzed query
      let result: AssessmentResult;
      
      if (buildingType === "single-dwelling" && projectType === "new-build") {
        result = {
          address: address,
          requiresConsent: true,
          zoningAllows: true,
          zoneName: "Residential - Single House Zone",
          zoneDescription: "This zone provides for traditional suburban residential development with one house per section. Buildings are usually one or two storeys high.",
          restrictions: ["Height in relation to boundary", "Maximum site coverage 35%"],
          buildingRestrictions: [
            "Height limit: 8m (+ 1m for roof)",
            "Maximum site coverage: 35%",
            "Height in relation to boundary: 2.5m + 45° recession plane",
            "Front yard: 3m minimum setback",
            "Side yards: 1m minimum setback",
            "Rear yard: 1m minimum setback"
          ],
          consultantsNeeded: ["Architect", "Structural Engineer", "Surveyor"],
          estimatedTimeframe: "8-12 weeks for consent processing",
          estimatedCosts: {
            consentFees: 3500,
            consultantFees: 18000,
            constructionEstimate: 450000
          },
          riskFactors: [
            "Site access difficulties during construction",
            "Potential for soil contamination investigation",
            "Neighborhood character considerations"
          ],
          nextSteps: [
            "Engage an architect to prepare concept plans",
            "Commission a site survey",
            "Check for any utility easements or restrictions",
            "Arrange pre-application meeting with council"
          ],
          expertNotes: "This appears to be a straightforward residential project in a well-defined zone. The site has good potential for a contemporary family home, though I would recommend checking local character overlays as some parts of this zone have additional design requirements.",
          consentDetails: "Your project will require building consent and potentially resource consent if you exceed any of the development controls like height or site coverage.",
          notes: "Your project appears to be a standard residential new build which is generally permitted in this zone, subject to standard development controls."
        };
      } else if (buildingType === "minor-dwelling" && projectType === "new-build") {
        result = {
          address: address,
          requiresConsent: true,
          zoningAllows: true,
          zoneName: "Residential - Single House Zone",
          zoneDescription: "This zone provides for traditional suburban residential development with one house per section, but allows for minor dwellings under certain conditions.",
          restrictions: ["Maximum floor area 65m²", "Must share driveway with primary dwelling"],
          buildingRestrictions: [
            "Maximum floor area: 65m²",
            "Height limit: 6m (lower than main dwelling)",
            "Must share driveway with main dwelling",
            "Cannot be subdivided into separate title",
            "One additional parking space required"
          ],
          consultantsNeeded: ["Architect", "Planning Consultant"],
          estimatedTimeframe: "10-14 weeks for consent processing",
          estimatedCosts: {
            consentFees: 2800,
            consultantFees: 12000,
            constructionEstimate: 180000
          },
          riskFactors: [
            "Site placement restrictions",
            "Potential drainage/stormwater issues",
            "Neighbor opposition possibility"
          ],
          nextSteps: [
            "Check property title for any restrictions",
            "Consult with council planner about minor dwelling rules",
            "Develop a site plan showing relationship to main dwelling",
            "Consider parking and access requirements"
          ],
          expertNotes: "Minor dwellings can be an excellent way to add housing capacity or accommodate family members, but there are specific size and placement requirements. Your site appears to have sufficient space, but I'd recommend careful planning for privacy between the two dwellings.",
          consentDetails: "You'll need building consent and likely resource consent for a minor dwelling. The process involves demonstrating compliance with specific minor dwelling provisions in the zone.",
          notes: "Minor dwellings are generally permitted but have specific size and location requirements."
        };
      } else if (projectType === "renovation") {
        result = {
          address: address,
          requiresConsent: buildingType === "multi-unit",
          zoningAllows: true,
          zoneName: "Residential - Mixed Housing Urban Zone",
          zoneDescription: "This zone enables intensification while retaining a suburban character. It allows for detached and attached housing with increased height and density compared to lower intensity zones.",
          restrictions: ["Internal building work may not require consent", "External changes likely need consent"],
          buildingRestrictions: [
            "Height limit: 10m (+ 1m for roof)",
            "Height in relation to boundary restrictions apply to external changes",
            "Front yard: 2.5m minimum setback for additions",
            "No minimum density controls for renovations"
          ],
          consultantsNeeded: ["Builder", "Building Consent Specialist"],
          estimatedTimeframe: "4-6 weeks for consent processing",
          estimatedCosts: {
            consentFees: 1500,
            consultantFees: 5000,
            constructionEstimate: 120000
          },
          riskFactors: [
            "Potential undocumented issues in existing structure",
            "Age of building may require additional upgrades",
            "Compliance with modern building code for modified areas"
          ],
          nextSteps: [
            "Obtain existing house plans if available",
            "Consult with a builder about scope and feasibility",
            "Determine if structural changes are included",
            "Check if property has heritage or character protections"
          ],
          expertNotes: "Renovations often have fewer regulatory hurdles than new builds, but the age and condition of the existing structure are critical factors. I recommend a thorough inspection of the existing building to identify any issues that might need addressing as part of the renovation.",
          consentDetails: "Many internal renovations don't require consent unless they involve structural changes, plumbing, or electrical work. However, any external changes are likely to need consent.",
          notes: "Many internal renovations don't require consent, but structural changes will."
        };
      } else if (projectType === "subdivision") {
        result = {
          address: address,
          requiresConsent: true,
          zoningAllows: buildingType !== "multi-unit",
          zoneName: "Residential - Mixed Housing Suburban Zone",
          zoneDescription: "This zone enables intensification while maintaining a spacious character. Limited subdivision is possible where minimum lot sizes can be achieved.",
          restrictions: ["Minimum lot size 400m²", "Requires resource and subdivision consent"],
          buildingRestrictions: [
            "Minimum net site area: 400m² per lot",
            "Minimum frontage width: 12.5m",
            "Minimum lot depth: 20m",
            "Each lot must have legal and physical access to a road"
          ],
          consultantsNeeded: ["Surveyor", "Planning Consultant", "Civil Engineer"],
          estimatedTimeframe: "16-20 weeks for consent processing",
          estimatedCosts: {
            consentFees: 7500,
            consultantFees: 25000,
            constructionEstimate: 120000
          },
          riskFactors: [
            "Infrastructure capacity issues",
            "Stormwater management requirements",
            "Geotechnical constraints",
            "Neighbors may oppose subdivision"
          ],
          nextSteps: [
            "Commission a detailed site survey",
            "Check infrastructure capacity with council",
            "Engage a planning consultant for feasibility assessment",
            "Develop a preliminary subdivision layout"
          ],
          expertNotes: "Subdivision in this zone is possible but requires careful planning. Your property appears to have sufficient area, but the shape and topography will be key factors in determining how many lots are achievable. I'd recommend investigating infrastructure capacity early, as this is often a limiting factor.",
          consentDetails: "Subdivision requires resource consent and subdivision consent. The process is complex and typically involves engineering approvals, infrastructure contributions, and potentially new service connections.",
          notes: "Subdivision is a complex process requiring multiple consents and likely professional assistance."
        };
      } else {
        result = {
          address: address,
          requiresConsent: true,
          zoningAllows: false,
          zoneName: "Commercial - Business Zone",
          zoneDescription: "This zone provides for commercial activities with some residential allowed on upper floors. Ground floor residential is usually not permitted.",
          restrictions: ["Residential development requires special permission", "Height restrictions apply"],
          buildingRestrictions: [
            "Ground floor must be commercial use",
            "Residential use only permitted above ground floor",
            "Height limit: 16m",
            "No minimum setbacks except where adjoining residential zones"
          ],
          consultantsNeeded: ["Resource Consent Planner", "Architect", "Lawyer"],
          estimatedTimeframe: "12-20 weeks for consent processing",
          estimatedCosts: {
            consentFees: 8500,
            consultantFees: 35000,
            constructionEstimate: 650000
          },
          riskFactors: [
            "High likelihood of consent being declined",
            "Substantial cost for planning reports",
            "Potential notification and public submissions",
            "May require Environment Court appeal"
          ],
          nextSteps: [
            "Arrange pre-application meeting with council",
            "Discuss alternatives with a planning consultant",
            "Consider different locations more suitable for this use",
            "If proceeding, prepare strong planning justification"
          ],
          expertNotes: "This project faces significant zoning challenges. Converting commercial space to residential in this zone typically requires a compelling planning argument. I would strongly recommend exploring alternative sites or a mixed-use approach that maintains commercial on the ground floor.",
          consentDetails: "Your project will require resource consent as a non-complying activity, which has a high threshold for approval. You would need to demonstrate that effects are minor or that the proposal is not contrary to planning objectives.",
          notes: "Based on your description, your project may face zoning challenges. We recommend professional consultation."
        };
      }
      
      setAssessmentResult(result);
      setShowDetailedResults(true);
      
      // Generate basic response text (available to all users)
      const basicResponseText = `Based on your query, I've analyzed your project at ${result.address} and found the following:

Zone: ${result.zoneName}

${result.zoningAllows ? "✅ Your project appears to be permitted in this zone." : "⚠️ Your project may face zoning challenges."}

${result.requiresConsent ? "You will need building consent for this project." : "This type of work may not require building consent, depending on specific details."}

Key restrictions to consider:
${result.restrictions.map(r => `• ${r}`).join('\n')}

For more detailed information about consultants, costs, timeframes, and expert analysis, check out our premium plans.`;
      
      // Add response to conversation history
      setConversations(prev => [...prev, {type: 'response', content: basicResponseText}]);
      
      // Reset form
      form.reset();
      
    } catch (error) {
      console.error("Error performing assessment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="max-w-3xl mx-auto">
        {/* Plans Information */}
        {!isAuthenticated && (
          <Card className="mb-4 border-blue-200 bg-blue-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center">
                <InfoIcon className="h-4 w-4 mr-2" />
                Available Plan Features
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                <div className="p-2">
                  <Badge variant="outline">Basic (Free)</Badge>
                  <ul className="mt-1 space-y-1">
                    <li>• Zoning information</li>
                    <li>• Basic consent requirements</li>
                    <li>• General restrictions</li>
                  </ul>
                </div>
                <div className="p-2">
                  <Badge>Standard ($99)</Badge>
                  <ul className="mt-1 space-y-1">
                    <li>• Detailed zoning analysis</li>
                    <li>• Building restrictions</li>
                    <li>• Consent details</li>
                  </ul>
                </div>
                <div className="p-2">
                  <Badge variant="secondary">Premium+ ($149+)</Badge>
                  <ul className="mt-1 space-y-1">
                    <li>• Consultant recommendations</li>
                    <li>• Cost estimates</li>
                    <li>• Expert analysis</li>
                  </ul>
                </div>
              </div>
              <div className="mt-2 text-center">
                <Link href="/pricing">
                  <Button size="sm" variant="link">View pricing plans</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Conversation History */}
        <div className="space-y-4 mb-6">
          {conversations.length === 0 && (
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-gray-700 mb-2">Welcome to Can I Build It?</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Describe your building project and I'll help you understand what consents you need and what's possible on your property.
              </p>
            </div>
          )}
          
          {conversations.map((item, index) => (
            <div 
              key={index} 
              className={`flex ${item.type === 'query' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] rounded-lg p-4 ${
                  item.type === 'query' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <div className="whitespace-pre-line">{item.content}</div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-4 max-w-[80%]">
                <div className="flex space-x-2 items-center">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Detailed Results (Tiered based on subscription) */}
        {showDetailedResults && assessmentResult && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">Detailed Assessment</h3>
            
            {/* Basic Features - Available to all users */}
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Property Information
                  <Badge variant="outline">Basic</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div>
                    <h3 className="font-medium">Address</h3>
                    <p>{assessmentResult.address}</p>
                  </div>
                  {assessmentResult.zoneName && (
                    <div>
                      <h3 className="font-medium">Zoning</h3>
                      <p>{assessmentResult.zoneName}</p>
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium">Building Consent Required</h3>
                    <p>{assessmentResult.requiresConsent ? "Yes" : "No"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Premium Features - Locked based on subscription status */}
            <Card className="mb-4 relative overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Detailed Analysis
                  <Badge>Premium</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Content is blurred/locked unless subscribed */}
                <div className={isAuthenticated && user?.subscriptionTier && 
                  ['premium', 'expert', 'pro', 'unlimited'].includes(user.subscriptionTier) 
                  ? "" : "blur-sm opacity-50 pointer-events-none"}>
                  <div className="grid gap-4">
                    {assessmentResult.buildingRestrictions && (
                      <div>
                        <h3 className="font-medium">Building Restrictions</h3>
                        <ul className="list-disc pl-5 space-y-1">
                          {assessmentResult.buildingRestrictions.map((restriction, i) => (
                            <li key={i}>{restriction}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {assessmentResult.consultantsNeeded && (
                      <div>
                        <h3 className="font-medium">Recommended Consultants</h3>
                        <div className="flex flex-wrap gap-2">
                          {assessmentResult.consultantsNeeded.map((consultant, i) => (
                            <Badge key={i} variant="outline">{consultant}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {assessmentResult.estimatedCosts && (
                      <div>
                        <h3 className="font-medium">Cost Estimates</h3>
                        <div className="grid grid-cols-3 gap-3 mt-2">
                          <div className="p-3 bg-muted rounded-md text-center">
                            <div className="text-2xl font-bold">
                              ${assessmentResult.estimatedCosts.consentFees?.toLocaleString() || '-'}
                            </div>
                            <div className="text-sm text-muted-foreground">Consent Fees</div>
                          </div>
                          <div className="p-3 bg-muted rounded-md text-center">
                            <div className="text-2xl font-bold">
                              ${assessmentResult.estimatedCosts.consultantFees?.toLocaleString() || '-'}
                            </div>
                            <div className="text-sm text-muted-foreground">Consultant Fees</div>
                          </div>
                          <div className="p-3 bg-muted rounded-md text-center">
                            <div className="text-2xl font-bold">
                              ${assessmentResult.estimatedCosts.constructionEstimate?.toLocaleString() || '-'}
                            </div>
                            <div className="text-sm text-muted-foreground">Construction</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Lock overlay shown for non-subscribers */}
                {(!isAuthenticated || !user?.subscriptionTier || 
                  !['premium', 'expert', 'pro', 'unlimited'].includes(user.subscriptionTier)) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-[2px]">
                    <LockIcon className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Premium Feature</h3>
                    <p className="text-muted-foreground text-center max-w-md mb-4">
                      Detailed analysis including building restrictions, consultant recommendations, 
                      and cost estimates are available in our Premium plan.
                    </p>
                    <Link href="/pricing">
                      <Button>Upgrade to Premium</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Expert Features - Locked for non-expert subscribers */}
            <Card className="relative overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Expert Assessment
                  <Badge variant="destructive">Expert</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Content is blurred/locked unless subscribed to Expert plan */}
                <div className={isAuthenticated && user?.subscriptionTier && 
                  ['expert', 'unlimited'].includes(user.subscriptionTier) 
                  ? "" : "blur-sm opacity-50 pointer-events-none"}>
                  <div className="grid gap-4">
                    {assessmentResult.riskFactors && (
                      <div>
                        <h3 className="font-medium">Risk Assessment</h3>
                        <ul className="list-disc pl-5 space-y-1">
                          {assessmentResult.riskFactors.map((risk, i) => (
                            <li key={i}>{risk}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {assessmentResult.nextSteps && (
                      <div>
                        <h3 className="font-medium">Recommended Next Steps</h3>
                        <ol className="list-decimal pl-5 space-y-1">
                          {assessmentResult.nextSteps.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                    {assessmentResult.expertNotes && (
                      <div>
                        <h3 className="font-medium">Designer's Notes</h3>
                        <div className="bg-muted p-3 rounded-md mt-1 italic">
                          "{assessmentResult.expertNotes}"
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Lock overlay shown for non-expert subscribers */}
                {(!isAuthenticated || !user?.subscriptionTier || 
                  !['expert', 'unlimited'].includes(user.subscriptionTier)) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-[2px]">
                    <LockIcon className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Expert Feature</h3>
                    <p className="text-muted-foreground text-center max-w-md mb-4">
                      Advanced insights including risk assessment, recommended steps, and 
                      personalized designer notes are available with our Expert Review plan.
                    </p>
                    <Link href="/pricing">
                      <Button>Upgrade to Expert</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Input Form */}
        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col space-y-2">
                <FormField
                  control={form.control}
                  name="query"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="flex space-x-2">
                          <Input 
                            className="flex-1"
                            placeholder="Describe your project (e.g., 'I want to build a new house at 123 Main Street, Auckland')" 
                            {...field}
                          />
                          <Button type="submit" disabled={isLoading}>
                            {isLoading ? 
                              <span className="animate-spin">⟳</span> : 
                              <span>Send</span>
                            }
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

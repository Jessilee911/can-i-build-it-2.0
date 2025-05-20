import React from "react";
import { AccessRestriction } from "./access-restriction";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";

// Define the property data structure
interface PropertyAssessmentResult {
  address: string;
  zoneName?: string;
  zoneDescription?: string;
  buildingRestrictions?: string[];
  consentRequired?: boolean;
  consentDetails?: string;
  consultantsNeeded?: string[];
  estimatedTimeframe?: string;
  estimatedCosts?: {
    consentFees?: number;
    consultantFees?: number;
    constructionEstimate?: number;
  };
  riskFactors?: string[];
  nextSteps?: string[];
  expertNotes?: string;
}

interface TieredSearchResultsProps {
  searchResults: PropertyAssessmentResult;
}

export default function TieredSearchResults({ searchResults }: TieredSearchResultsProps) {
  const { user } = useAuth();
  // Default to basic if no subscription
  const currentPlan = user?.subscriptionTier || 'basic';

  return (
    <div className="space-y-6">
      {/* Basic Info - Available to all users */}
      <Card>
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
              <p>{searchResults.address}</p>
            </div>
            {searchResults.zoneName && (
              <div>
                <h3 className="font-medium">Zoning</h3>
                <p>{searchResults.zoneName}</p>
              </div>
            )}
            {searchResults.consentRequired !== undefined && (
              <div>
                <h3 className="font-medium">Building Consent Required</h3>
                <p>{searchResults.consentRequired ? "Yes" : "No"}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Standard Plan Features */}
      <AccessRestriction requiredPlan="standard" featureName="Detailed Zoning Analysis">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Zoning Analysis
              <Badge>Standard</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {searchResults.zoneDescription && (
                <div>
                  <h3 className="font-medium">Zone Description</h3>
                  <p>{searchResults.zoneDescription}</p>
                </div>
              )}
              {searchResults.buildingRestrictions && searchResults.buildingRestrictions.length > 0 && (
                <div>
                  <h3 className="font-medium">Building Restrictions</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {searchResults.buildingRestrictions.map((restriction, index) => (
                      <li key={index}>{restriction}</li>
                    ))}
                  </ul>
                </div>
              )}
              {searchResults.consentDetails && (
                <div>
                  <h3 className="font-medium">Consent Details</h3>
                  <p>{searchResults.consentDetails}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </AccessRestriction>

      {/* Premium Plan Features */}
      <AccessRestriction requiredPlan="premium" featureName="Comprehensive Feasibility Study">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Feasibility Assessment
              <Badge variant="secondary">Premium</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="consultants">
              <TabsList className="mb-4">
                <TabsTrigger value="consultants">Required Consultants</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="costs">Cost Estimates</TabsTrigger>
              </TabsList>
              
              <TabsContent value="consultants">
                {searchResults.consultantsNeeded && searchResults.consultantsNeeded.length > 0 ? (
                  <div>
                    <h3 className="font-medium mb-2">Recommended Professionals</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {searchResults.consultantsNeeded.map((consultant, index) => (
                        <li key={index}>{consultant}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p>No specialized consultants are required for this project.</p>
                )}
              </TabsContent>
              
              <TabsContent value="timeline">
                <div>
                  <h3 className="font-medium mb-2">Estimated Timeframe</h3>
                  <p>{searchResults.estimatedTimeframe || "Timeline information not available"}</p>
                </div>
              </TabsContent>
              
              <TabsContent value="costs">
                {searchResults.estimatedCosts ? (
                  <div className="space-y-2">
                    <h3 className="font-medium mb-2">Estimated Costs</h3>
                    {searchResults.estimatedCosts.consentFees !== undefined && (
                      <div className="flex justify-between">
                        <span>Consent Fees:</span>
                        <span>${searchResults.estimatedCosts.consentFees.toLocaleString()}</span>
                      </div>
                    )}
                    {searchResults.estimatedCosts.consultantFees !== undefined && (
                      <div className="flex justify-between">
                        <span>Consultant Fees:</span>
                        <span>${searchResults.estimatedCosts.consultantFees.toLocaleString()}</span>
                      </div>
                    )}
                    {searchResults.estimatedCosts.constructionEstimate !== undefined && (
                      <div className="flex justify-between font-medium">
                        <span>Construction Estimate:</span>
                        <span>${searchResults.estimatedCosts.constructionEstimate.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p>Cost estimates not available for this property.</p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </AccessRestriction>

      {/* Expert Review Features */}
      <AccessRestriction requiredPlan="expert" featureName="Expert Analysis & Recommendations">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Expert Analysis
              <Badge variant="destructive">Expert Review</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {searchResults.riskFactors && searchResults.riskFactors.length > 0 && (
                <div>
                  <h3 className="font-medium">Risk Assessment</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {searchResults.riskFactors.map((risk, index) => (
                      <li key={index}>{risk}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {searchResults.nextSteps && searchResults.nextSteps.length > 0 && (
                <div>
                  <h3 className="font-medium">Recommended Next Steps</h3>
                  <ol className="list-decimal pl-5 space-y-1">
                    {searchResults.nextSteps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}
              
              {searchResults.expertNotes && (
                <div>
                  <h3 className="font-medium">Designer's Notes</h3>
                  <div className="bg-muted p-3 rounded-md mt-1 italic">
                    "{searchResults.expertNotes}"
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </AccessRestriction>
    </div>
  );
}

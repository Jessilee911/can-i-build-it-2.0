import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Define the form schema
const assessmentSchema = z.object({
  address: z.string().min(5, { message: "Address must be at least 5 characters" }),
  buildingType: z.string().min(1, { message: "Please select a building type" }),
  projectType: z.string().min(1, { message: "Please select a project type" }),
});

type AssessmentFormValues = z.infer<typeof assessmentSchema>;

// Define the property assessment result structure
interface AssessmentResult {
  requiresConsent: boolean;
  zoningAllows: boolean;
  zoneName: string;
  restrictions: string[];
  consultantsNeeded: string[];
  estimatedTimeframe: string;
  notes: string;
}

export function PropertyAssessment() {
  const [isLoading, setIsLoading] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);

  const form = useForm<AssessmentFormValues>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      address: "",
      buildingType: "",
      projectType: "",
    },
  });

  const onSubmit = async (data: AssessmentFormValues) => {
    setIsLoading(true);
    
    try {
      // In a real application, this would be an API call
      // Since we don't have the actual backend integration yet, we'll simulate a response
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Sample result based on inputs
      let result: AssessmentResult;
      
      if (data.buildingType === "single-dwelling" && data.projectType === "new-build") {
        result = {
          requiresConsent: true,
          zoningAllows: true,
          zoneName: "Residential - Single House Zone",
          restrictions: ["Height in relation to boundary", "Maximum site coverage 35%"],
          consultantsNeeded: ["Architect", "Structural Engineer", "Surveyor"],
          estimatedTimeframe: "8-12 weeks for consent processing",
          notes: "Your project appears to be a standard residential new build which is generally permitted in this zone, subject to standard development controls."
        };
      } else if (data.buildingType === "minor-dwelling" && data.projectType === "new-build") {
        result = {
          requiresConsent: true,
          zoningAllows: true,
          zoneName: "Residential - Single House Zone",
          restrictions: ["Maximum floor area 65m²", "Must share driveway with primary dwelling"],
          consultantsNeeded: ["Architect", "Planning Consultant"],
          estimatedTimeframe: "10-14 weeks for consent processing",
          notes: "Minor dwellings are generally permitted but have specific size and location requirements."
        };
      } else if (data.projectType === "renovation") {
        result = {
          requiresConsent: data.buildingType === "multi-unit",
          zoningAllows: true,
          zoneName: "Residential - Mixed Housing Urban Zone",
          restrictions: ["Internal building work may not require consent", "External changes likely need consent"],
          consultantsNeeded: ["Builder", "Building Consent Specialist"],
          estimatedTimeframe: "4-6 weeks for consent processing",
          notes: "Many internal renovations don't require consent, but structural changes will."
        };
      } else if (data.projectType === "subdivision") {
        result = {
          requiresConsent: true,
          zoningAllows: data.buildingType !== "multi-unit",
          zoneName: "Residential - Mixed Housing Suburban Zone",
          restrictions: ["Minimum lot size 400m²", "Requires resource and subdivision consent"],
          consultantsNeeded: ["Surveyor", "Planning Consultant", "Civil Engineer"],
          estimatedTimeframe: "16-20 weeks for consent processing",
          notes: "Subdivision is a complex process requiring multiple consents and likely professional assistance."
        };
      } else {
        result = {
          requiresConsent: true,
          zoningAllows: false,
          zoneName: "Commercial - Business Zone",
          restrictions: ["Residential development requires special permission", "Height restrictions apply"],
          consultantsNeeded: ["Resource Consent Planner", "Architect", "Lawyer"],
          estimatedTimeframe: "12-20 weeks for consent processing",
          notes: "Your proposed development may face zoning challenges. We recommend professional consultation."
        };
      }
      
      setAssessmentResult(result);
    } catch (error) {
      console.error("Error performing assessment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Address</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="123 Main Street, Auckland" 
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="buildingType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Building Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="single-dwelling">Single Dwelling</SelectItem>
                        <SelectItem value="minor-dwelling">Minor Dwelling</SelectItem>
                        <SelectItem value="multi-unit">Multi-Unit Development</SelectItem>
                        <SelectItem value="commercial">Commercial Building</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="projectType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="new-build">New Build</SelectItem>
                        <SelectItem value="renovation">Renovation</SelectItem>
                        <SelectItem value="subdivision">Subdivision</SelectItem>
                        <SelectItem value="change-of-use">Change of Use</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Assessing..." : "Assess Property"}
          </Button>
        </form>
      </Form>
      
      {assessmentResult && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Assessment Result
              <Badge variant={assessmentResult.zoningAllows ? "success" : "destructive"}>
                {assessmentResult.zoningAllows ? "Permitted" : "Restricted"}
              </Badge>
            </CardTitle>
            <CardDescription>
              Zone: {assessmentResult.zoneName}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Building Consent</h4>
              <p>{assessmentResult.requiresConsent 
                ? "Your project requires building consent" 
                : "Your project may not require building consent"}</p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Restrictions</h4>
              <ul className="list-disc pl-5 space-y-1">
                {assessmentResult.restrictions.map((restriction, i) => (
                  <li key={i}>{restriction}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Consultants Needed</h4>
              <div className="flex flex-wrap gap-2">
                {assessmentResult.consultantsNeeded.map((consultant, i) => (
                  <Badge key={i} variant="outline">{consultant}</Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Estimated Timeframe</h4>
              <p>{assessmentResult.estimatedTimeframe}</p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Notes</h4>
              <p className="text-sm text-gray-600">{assessmentResult.notes}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

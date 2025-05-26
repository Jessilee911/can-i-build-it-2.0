import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";

// Define the form schema
const reportFormSchema = z.object({
  address: z.string().min(5, { message: "Please provide a valid address" }),
  projectDescription: z.string().min(10, { message: "Please describe your project in more detail" }),
  projectType: z.string().min(1, { message: "Please select a project type" }),
  propertyType: z.string().min(1, { message: "Please select a property type" }),
  budget: z.number().min(0, { message: "Budget must be a positive number" }),
  timeframe: z.string().min(1, { message: "Please select a timeframe" }),
});

type ReportFormValues = z.infer<typeof reportFormSchema>;

interface PropertyReportFormProps {
  isOpen: boolean;
  onClose: () => void;
  planType: string;
  onSubmit: (data: ReportFormValues) => void;
}

export function PropertyReportForm({ isOpen, onClose, planType, onSubmit }: PropertyReportFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      address: "",
      projectDescription: "",
      projectType: "",
      propertyType: "",
      budget: 100000,
      timeframe: "",
    },
  });

  const handleSubmit = async (data: ReportFormValues) => {
    setIsLoading(true);
    try {
      // Submit the form data
      await onSubmit(data);
    } catch (error) {
      console.error("Error submitting report form:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Your Personalised Property Report</DialogTitle>
          <DialogDescription>
            Please provide the following details to help us generate a comprehensive {planType} for your property.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 pt-4">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Address</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 123 Main Street, Auckland" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter the full address of the property you're inquiring about
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="projectDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe what you want to build or develop on this property..." 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    The more details you provide, the more accurate your report will be
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <SelectValue placeholder="Select project type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="new-build">New Build</SelectItem>
                        <SelectItem value="renovation">Renovation</SelectItem>
                        <SelectItem value="extension">Extension</SelectItem>
                        <SelectItem value="subdivision">Subdivision</SelectItem>
                        <SelectItem value="minor-dwelling">Minor Dwelling</SelectItem>
                        <SelectItem value="commercial">Commercial Development</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="propertyType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select property type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="residential">Residential</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="industrial">Industrial</SelectItem>
                        <SelectItem value="rural">Rural</SelectItem>
                        <SelectItem value="mixed-use">Mixed Use</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="budget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Budget (NZD)</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <Slider
                        defaultValue={[field.value]}
                        max={1000000}
                        step={10000}
                        onValueChange={(value) => field.onChange(value[0])}
                      />
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Budget: ${field.value.toLocaleString()}</span>
                        <Input
                          type="number"
                          className="w-24 text-right"
                          value={field.value}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="timeframe"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expected Timeframe</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timeframe" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0-3months">Within 3 months</SelectItem>
                      <SelectItem value="3-6months">3-6 months</SelectItem>
                      <SelectItem value="6-12months">6-12 months</SelectItem>
                      <SelectItem value="12-24months">1-2 years</SelectItem>
                      <SelectItem value="planning">Just planning for now</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Generating Report..." : "Generate Report"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

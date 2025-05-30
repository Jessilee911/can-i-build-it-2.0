import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Star, Shield, FileText, Zap } from "lucide-react";

const premiumRequestSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  propertyAddress: z.string().min(10, "Please enter a complete property address"),
  projectDescription: z.string().min(20, "Please provide more details about your project"),
  phone: z.string().optional(),
});

type PremiumRequestData = z.infer<typeof premiumRequestSchema>;

interface PremiumUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAddress?: string;
}

export function PremiumUpgradeModal({ isOpen, onClose, initialAddress }: PremiumUpgradeModalProps) {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<PremiumRequestData>({
    resolver: zodResolver(premiumRequestSchema),
    defaultValues: {
      fullName: "",
      email: "",
      propertyAddress: initialAddress || "",
      projectDescription: "",
      phone: "",
    },
  });

  const premiumRequestMutation = useMutation({
    mutationFn: async (data: PremiumRequestData) => {
      const response = await apiRequest("/api/premium-assessment-request", "POST", data);
      return response.json();
    },
    onSuccess: (data) => {
      setIsSubmitted(true);
      toast({
        title: "Request Submitted Successfully!",
        description: "Our premium property expert will contact you within 24 hours with your comprehensive analysis.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Please try again or contact support",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PremiumRequestData) => {
    premiumRequestMutation.mutate(data);
  };

  const handleClose = () => {
    setIsSubmitted(false);
    form.reset();
    onClose();
  };

  if (isSubmitted) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-6">
            <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
              <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <DialogTitle className="text-xl font-semibold mb-2">
              Request Submitted Successfully!
            </DialogTitle>
            <DialogDescription className="text-base mb-6">
              Our premium property expert will contact you within 24 hours with your comprehensive analysis including:
            </DialogDescription>
            <div className="text-left space-y-2 mb-6">
              <div className="flex items-center text-sm">
                <FileText className="h-4 w-4 mr-2 text-blue-500" />
                Official property reports and zoning analysis
              </div>
              <div className="flex items-center text-sm">
                <Shield className="h-4 w-4 mr-2 text-green-500" />
                Detailed consent requirement assessment
              </div>
              <div className="flex items-center text-sm">
                <Zap className="h-4 w-4 mr-2 text-yellow-500" />
                Project-specific recommendations
              </div>
            </div>
            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Premium Property Analysis
          </DialogTitle>
          <DialogDescription>
            Get comprehensive property analysis from our expert team. We'll provide detailed reports with official data, zoning information, and personalized recommendations for your project.
          </DialogDescription>
        </DialogHeader>

        <div className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 p-4 mb-6">
          <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
            What You'll Receive:
          </h4>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Official Auckland Council property data</li>
            <li>• Detailed zoning and planning overlay analysis</li>
            <li>• Building consent requirement assessment</li>
            <li>• Infrastructure capacity and constraints report</li>
            <li>• Expert recommendations for your specific project</li>
            <li>• Direct consultation with qualified professionals</li>
          </ul>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="your.email@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="021 123 4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="propertyAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Address *</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Example Street, Auckland" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="projectDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Description *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your project: renovation, new build, subdivision, etc. Include any specific questions or concerns."
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={premiumRequestMutation.isPending}
                className="flex-1"
              >
                {premiumRequestMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Request Premium Analysis"
                )}
              </Button>
            </div>
          </form>
        </Form>

        <div className="text-xs text-gray-500 dark:text-gray-400 mt-4">
          Our team will review your request and contact you within 24 hours with your comprehensive property analysis.
        </div>
      </DialogContent>
    </Dialog>
  );
}
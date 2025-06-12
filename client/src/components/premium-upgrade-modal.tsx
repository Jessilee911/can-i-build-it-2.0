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
  const [generatedReport, setGeneratedReport] = useState<string | null>(null);

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
      if (data.report) {
        setGeneratedReport(data.report);
        toast({
          title: "Report Generated Successfully!",
          description: "Your comprehensive property analysis is ready for review.",
        });
      } else {
        toast({
          title: "Request Submitted Successfully!",
          description: "Your detailed report will be provided within 24 hours.",
        });
      }
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
    setGeneratedReport(null);
    form.reset();
    onClose();
  };

  if (isSubmitted) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {generatedReport ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  Comprehensive Property Analysis Report
                </DialogTitle>
                <DialogDescription>
                  Your detailed property analysis using official Auckland Council data
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 rounded-lg p-4 my-4">
                <pre className="whitespace-pre-wrap text-sm font-mono text-gray-800 dark:text-gray-200 leading-relaxed">
                  {generatedReport}
                </pre>
              </div>
              
              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const blob = new Blob([generatedReport], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'property-analysis-report.txt';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex-1"
                >
                  Download Report
                </Button>
                <Button onClick={handleClose} className="flex-1">
                  Close
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
                <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <DialogTitle className="text-xl font-semibold mb-2">
                Request Submitted Successfully!
              </DialogTitle>
              <DialogDescription className="text-base mb-6">
                Your detailed report will be provided within 24 hours including:
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
          )}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      
    </Dialog>
  );
}
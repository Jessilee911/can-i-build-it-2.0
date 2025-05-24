import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";

interface QuestionData {
  propertyAddress: string;
  projectDescription: string;
  budgetRange: string;
  timeframe: string;
}

const steps = [
  {
    id: 'address',
    title: 'Property Address',
    description: 'Enter the full address of the property you want to assess',
  },
  {
    id: 'project',
    title: 'Project Description',
    description: 'Describe what you want to build, renovate, or develop',
  },
  {
    id: 'budget',
    title: 'Budget Range',
    description: 'Select your expected budget for this project',
  },
  {
    id: 'timeframe',
    title: 'Expected Timeframe',
    description: 'When do you plan to start and complete this project?',
  }
];

const budgetOptions = [
  'Under $50,000',
  '$50,000 - $100,000',
  '$100,000 - $250,000',
  '$250,000 - $500,000',
  '$500,000 - $1,000,000',
  'Over $1,000,000'
];

const timeframeOptions = [
  'Within 3 months',
  '3-6 months',
  '6-12 months',
  '1-2 years',
  'More than 2 years',
  'Just exploring options'
];

export default function ReportQuestions() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questionData, setQuestionData] = useState<QuestionData>({
    propertyAddress: '',
    projectDescription: '',
    budgetRange: '',
    timeframe: ''
  });
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Get plan from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const planId = urlParams.get('plan') || 'detailed';

  const updateQuestionData = (field: keyof QuestionData, value: string) => {
    setQuestionData(prev => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return questionData.propertyAddress.trim().length > 0;
      case 1: return questionData.projectDescription.trim().length > 0;
      case 2: return questionData.budgetRange.length > 0;
      case 3: return questionData.timeframe.length > 0;
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await apiRequest("POST", "/api/generate-report", {
        planId,
        ...questionData
      });

      if (response.ok) {
        toast({
          title: "Report Generation Started",
          description: "Your personalized property report is being generated. You'll receive an email notification when it's ready.",
        });
        setLocation('/report-success');
      } else {
        throw new Error('Failed to generate report');
      }
    } catch (error) {
      console.error('Report generation failed:', error);
      toast({
        title: "Error",
        description: "Failed to generate your report. Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <Input
              placeholder="e.g., 123 Queen Street, Auckland 1010"
              value={questionData.propertyAddress}
              onChange={(e) => updateQuestionData('propertyAddress', e.target.value)}
              className="text-lg p-4"
              autoFocus
            />
            <p className="text-sm text-gray-500">
              Please provide the complete address including street number, street name, suburb, and postcode
            </p>
          </div>
        );
      
      case 1:
        return (
          <div className="space-y-4">
            <Textarea
              placeholder="e.g., I want to build a two-story extension with 3 bedrooms and 2 bathrooms. The extension will be at the rear of the existing house..."
              value={questionData.projectDescription}
              onChange={(e) => updateQuestionData('projectDescription', e.target.value)}
              className="text-lg p-4 min-h-32"
              autoFocus
            />
            <p className="text-sm text-gray-500">
              Include details about the type of work, size, materials, and any specific requirements
            </p>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-4">
            <Select value={questionData.budgetRange} onValueChange={(value) => updateQuestionData('budgetRange', value)}>
              <SelectTrigger className="text-lg p-4">
                <SelectValue placeholder="Select your budget range" />
              </SelectTrigger>
              <SelectContent>
                {budgetOptions.map(option => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">
              This helps us provide cost estimates and suitable consultant recommendations
            </p>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-4">
            <Select value={questionData.timeframe} onValueChange={(value) => updateQuestionData('timeframe', value)}>
              <SelectTrigger className="text-lg p-4">
                <SelectValue placeholder="Select your expected timeframe" />
              </SelectTrigger>
              <SelectContent>
                {timeframeOptions.map(option => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">
              This helps us prioritize urgent projects and provide realistic timelines
            </p>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl w-full max-w-2xl border border-white/20">
        
        {/* Progress bar */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Property Assessment Questions</h1>
            <span className="text-sm text-gray-500">{currentStep + 1} of {steps.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step content */}
        <div className="p-8">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {steps[currentStep].title}
            </h2>
            <p className="text-gray-600">
              {steps[currentStep].description}
            </p>
          </div>

          {renderStepContent()}
        </div>

        {/* Navigation buttons */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="opacity-80"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            {currentStep === steps.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Generating Report...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Generate My Report
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>

        {/* Trust indicators */}
        <div className="px-6 pb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800 text-center">
              🔒 Your information is encrypted and secure • We respect your privacy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { PropertyAssessment } from "@/components/assessment/property-assessment";
import { AnimatedSuggestions } from "@/components/animated-suggestions";
import { Button } from "@/components/ui/button";
import { FileTextIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function PropertyData() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 relative overflow-hidden">
      {/* Animated NZ Map Background */}
      <div 
        className="absolute inset-0 opacity-5 animate-pulse"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M20 20h60v60H20z' fill='%23000'/%3E%3C/svg%3E")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Can I Build It? NZ Property Assessment
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Get expert AI-powered guidance on New Zealand building regulations, consent requirements, and development potential for your property.
            </p>
          </div>
          
          <PropertyAssessment showPricing={false} />
          
          <div className="mt-12">
            <AnimatedSuggestions />
          </div>
          
          <div className="mt-8 text-center">
            <Button
              onClick={() => setLocation('/pricing')}
              variant="outline"
              className="mx-2"
            >
              <FileTextIcon className="w-4 h-4 mr-2" />
              View Pricing Plans
            </Button>
          </div>
          
          {/* Always visible blue disclaimer at bottom */}
          <div className="mt-6 text-center">
            <p className="text-sm text-blue-600">
              This tool is connected to a database of New Zealand building regulations and property zoning requirements
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
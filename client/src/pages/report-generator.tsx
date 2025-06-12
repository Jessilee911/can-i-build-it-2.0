import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircleIcon, FileTextIcon, DownloadIcon } from "lucide-react";
import nzMapPath from "@assets/NZ.png";

export default function ReportGenerator() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with floating NZ map */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="absolute inset-0 opacity-5">
          <img
            src={nzMapPath}
            alt=""
            className="w-full h-full object-cover animate-float"
            style={{ transform: 'scale(1.2)' }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
              Free Property Development Report
            </h1>
            <p className="text-lg text-gray-700 mb-8">
              Get comprehensive building consent and development guidance for your New Zealand property
            </p>
          </div>

          {/* Report Features */}
          <Card className="mb-8 bg-white/80 backdrop-blur-md border-white/20 shadow-xl">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <FileTextIcon className="h-12 w-12 text-blue-600" />
              </div>
              <CardTitle className="text-2xl text-gray-800">
                Comprehensive Property Analysis
              </CardTitle>
              <CardDescription className="text-lg text-gray-600">
                Everything you need to know about building on your property
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800">Building Consent Analysis</h3>
                  <ul className="space-y-2">
                    {[
                      "Consent requirements for your project",
                      "Application process and timeline",
                      "Required documents and plans",
                      "Estimated costs and fees"
                    ].map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800">Resource Consent & Planning</h3>
                  <ul className="space-y-2">
                    {[
                      "Zoning rules and restrictions",
                      "Setback and height requirements",
                      "Resource consent needs",
                      "Development potential assessment"
                    ].map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA Section */}
          <div className="text-center">
            <Card className="bg-white/80 backdrop-blur-md border-white/20 shadow-xl">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4 text-gray-800">
                  Ready to Start Your Property Assessment?
                </h3>
                <p className="text-lg text-gray-600 mb-6">
                  Get your free comprehensive report in minutes
                </p>
                <div className="space-y-4">
                  <Button 
                    size="lg" 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                    onClick={() => window.location.assign('/premium-chat')}
                  >
                    <FileTextIcon className="mr-2 h-5 w-5" />
                    Start Premium Analysis
                  </Button>
                  <p className="text-sm text-gray-500">
                    No payment required • Get instant results
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
import { PropertyAssessment } from "@/components/assessment/property-assessment";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

const PropertyData = () => {
  const [, navigate] = useLocation();
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="p-6">
          <div className="mb-6 text-center">
            <p className="text-gray-600 mb-4">
              Ask me anything about building, renovating, or developing property in New Zealand
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-sm">
              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full">Building Consent</span>
              <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full">Resource Consent</span>
              <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full">Development Rules</span>
              <span className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full">Property Zoning</span>
            </div>
          </div>
          
          <PropertyAssessment />
          
          <div className="mt-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between">
              <div className="mb-4 sm:mb-0">
                <h3 className="text-lg font-semibold text-gray-900">Unlock advanced features</h3>
                <p className="text-sm text-gray-600">Get detailed reports, AI sketch concepts, and expert reviews</p>
              </div>
              <Button 
                onClick={() => navigate('/pricing')}
                className="whitespace-nowrap"
              >
                View Pricing Plans
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm">
        <div className="bg-white p-4 shadow rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Try asking about:</h3>
          <ul className="space-y-2 text-gray-600">
            <li>• "Can I build a minor dwelling in Auckland?"</li>
            <li>• "I want to renovate my kitchen, do I need consent?"</li>
            <li>• "What consultants do I need to subdivide my property?"</li>
            <li>• "How long does it take to get building consent?"</li>
          </ul>
        </div>
        
        <div className="bg-white p-4 shadow rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Quick Building Tips:</h3>
          <ul className="space-y-2 text-gray-600">
            <li>• Most structural changes require consent</li>
            <li>• Resource consent is separate from building consent</li>
            <li>• NZ Building Code sets national standards for construction</li>
            <li>• Engaging professionals early saves time and money</li>
          </ul>
        </div>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 text-center">
        This tool is connected to a database of New Zealand building regulations and property zoning requirements
      </div>
    </div>
  );
};

export default PropertyData;

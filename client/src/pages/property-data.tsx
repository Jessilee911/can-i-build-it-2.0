import { PropertyAssessment } from "@/components/assessment/property-assessment";

const PropertyData = () => {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Property Development Assessment */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-medium text-gray-900">Can I Build It?</h1>
          <p className="text-sm text-gray-600 mt-1">
            Your personal building assistant for New Zealand property development
          </p>
        </div>
        <div className="p-6">
          <PropertyAssessment />
        </div>
      </div>
      
      {/* Examples and Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6 text-sm">
        <div className="bg-white p-4 shadow rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Example Questions</h3>
          <ul className="space-y-2 text-gray-600">
            <li>• "Can I build a minor dwelling in Auckland?"</li>
            <li>• "I want to renovate my kitchen, do I need consent?"</li>
            <li>• "What consultants do I need to subdivide my property?"</li>
            <li>• "How long does it take to get building consent?"</li>
          </ul>
        </div>
        
        <div className="bg-white p-4 shadow rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Building Consent Tips</h3>
          <ul className="space-y-2 text-gray-600">
            <li>• Most structural changes require consent</li>
            <li>• Minor internal renovations often don't need consent</li>
            <li>• Resource consent is separate from building consent</li>
            <li>• Engaging professionals early saves time and money</li>
          </ul>
        </div>
        
        <div className="bg-white p-4 shadow rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Key Resources</h3>
          <ul className="space-y-2 text-gray-600">
            <li>• Auckland Council GeoMaps</li>
            <li>• New Zealand Building Code</li>
            <li>• LINZ Property Information</li>
            <li>• Auckland Unitary Plan</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PropertyData;

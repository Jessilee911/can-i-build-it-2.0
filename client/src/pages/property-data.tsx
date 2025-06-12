import { PropertyAssessment } from "@/components/assessment/property-assessment";

const PropertyData = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white mb-6">
        <div className="p-6 bg-[#f9fafb]">
          <PropertyAssessment />
        </div>
      </div>
      <div className="mt-6 text-center">
        <p className="text-sm text-blue-600">
          This tool is connected to a database of New Zealand building regulations and property zoning requirements
        </p>
      </div>
    </div>
  );
};

export default PropertyData;

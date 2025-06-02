import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, ArrowLeft, MapPin, User, Building, DollarSign } from "lucide-react";
import { LocationVerificationModal } from "@/components/location-verification-modal";

interface PropertyIntakeFormProps {
  onComplete: (data: PropertyIntakeData) => void;
  onCancel: () => void;
}

export interface PropertyIntakeData {
  name: string;
  address: string;
  coordinates?: [number, number];
  projectType: 'residential' | 'commercial';
  projectDescription: string;
  budget: string;
}

export function PropertyIntakeForm({ onComplete, onCancel }: PropertyIntakeFormProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<PropertyIntakeData>>({
    projectType: 'residential'
  });
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isVerifyingAddress, setIsVerifyingAddress] = useState(false);
  const [addressVerified, setAddressVerified] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = () => {
    if (formData.name && formData.address && formData.projectDescription && formData.budget) {
      onComplete(formData as PropertyIntakeData);
    }
  };

  const handleLocationConfirm = (address: string, coordinates?: [number, number]) => {
    setFormData({ ...formData, address, coordinates });
    setShowLocationModal(false);
  };

  const verifyAddressWithGoogle = async (address: string) => {
    if (!address || address.length < 10) {
      setAddressVerified(false);
      setVerificationMessage("");
      return;
    }

    setIsVerifyingAddress(true);
    try {
      const response = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.coordinates && data.formattedAddress) {
          setFormData({ 
            ...formData, 
            address: data.formattedAddress,
            coordinates: data.coordinates 
          });
          setAddressVerified(true);
          setVerificationMessage("✓ Address verified");
        } else {
          setAddressVerified(false);
          setVerificationMessage("Address not found. Please check and try again.");
        }
      } else {
        setAddressVerified(false);
        setVerificationMessage("Unable to verify address at this time.");
      }
    } catch (error) {
      setAddressVerified(false);
      setVerificationMessage("Unable to verify address at this time.");
    } finally {
      setIsVerifyingAddress(false);
    }
  };

  const handleAddressChange = (address: string) => {
    setFormData({ ...formData, address });
    setAddressVerified(false);
    setVerificationMessage("");
    
    // Debounce the verification
    const timeoutId = setTimeout(() => {
      verifyAddressWithGoogle(address);
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  };

  const isStep1Valid = formData.name && formData.address;
  const isStep2Valid = formData.projectDescription && formData.budget;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Property Analysis Request</h2>
            <button 
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <div className="mt-4 flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                <User className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">Personal Info</span>
            </div>
            <div className="flex-1 h-px bg-gray-200"></div>
            <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                <Building className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">Project Details</span>
            </div>
            <div className="flex-1 h-px bg-gray-200"></div>
            <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                <MapPin className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">Analysis</span>
            </div>
          </div>
        </div>

        {/* Step 1: Personal Information */}
        {step === 1 && (
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Tell us about yourself</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <Input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter your full name"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Address *
                </label>
                <div className="flex space-x-2">
                  <div className="flex-1 relative">
                    <Input
                      type="text"
                      value={formData.address || ''}
                      onChange={(e) => handleAddressChange(e.target.value)}
                      placeholder="Enter the property address"
                      className={`w-full ${addressVerified ? 'border-green-500' : ''}`}
                    />
                    {isVerifyingAddress && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowLocationModal(true)}
                    className="shrink-0"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Confirm Location
                  </Button>
                </div>
                {verificationMessage && (
                  <p className={`text-xs mt-1 ${addressVerified ? 'text-green-600' : 'text-red-600'}`}>
                    {verificationMessage}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Address will be automatically verified. Click "Confirm Location" to view on map.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Project Details */}
        {step === 2 && (
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Project Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Project Type *
                </label>
                <div className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="residential"
                      checked={formData.projectType === 'residential'}
                      onCheckedChange={() => setFormData({ ...formData, projectType: 'residential' })}
                    />
                    <label htmlFor="residential" className="text-sm font-medium">
                      Residential
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="commercial"
                      checked={formData.projectType === 'commercial'}
                      onCheckedChange={() => setFormData({ ...formData, projectType: 'commercial' })}
                    />
                    <label htmlFor="commercial" className="text-sm font-medium">
                      Commercial
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Description *
                </label>
                <Textarea
                  value={formData.projectDescription || ''}
                  onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
                  placeholder="Describe your project in detail (e.g., 'Build a 2-story extension with 3 bedrooms and 2 bathrooms')"
                  className="w-full h-24"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Budget *
                </label>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    value={formData.budget || ''}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    placeholder="e.g., $200,000 - $300,000"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Review Your Information</h3>
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <span className="font-medium text-gray-700">Name:</span> {formData.name}
              </div>
              <div>
                <span className="font-medium text-gray-700">Address:</span> {formData.address}
              </div>
              <div>
                <span className="font-medium text-gray-700">Project Type:</span> {formData.projectType}
              </div>
              <div>
                <span className="font-medium text-gray-700">Description:</span> {formData.projectDescription}
              </div>
              <div>
                <span className="font-medium text-gray-700">Budget:</span> {formData.budget}
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Our AI agent will analyze your property's zoning, regulations, and provide tailored recommendations for your project.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-between">
          <Button
            variant="outline"
            onClick={step === 1 ? onCancel : handleBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{step === 1 ? 'Cancel' : 'Back'}</span>
          </Button>
          
          {step < 3 ? (
            <Button
              onClick={handleNext}
              disabled={step === 1 ? !isStep1Valid : !isStep2Valid}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
            >
              <span>Next</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
            >
              <span>Start Analysis</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Location Verification Modal */}
      {showLocationModal && (
        <LocationVerificationModal
          isOpen={showLocationModal}
          onClose={() => setShowLocationModal(false)}
          onLocationConfirm={handleLocationConfirm}
          initialAddress={formData.address || ''}
        />
      )}
    </div>
  );
}
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, DollarSign, Home, Zap, AlertCircle, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PropertyInfo {
  address: string;
  suburb?: string;
  zoning?: string;
  landArea?: number;
  capitalValue?: number;
  ratesId?: string;
  coordinates?: [number, number];
}

export default function PropertyData() {
  const [searchAddress, setSearchAddress] = useState("");
  const [propertyData, setPropertyData] = useState<PropertyInfo | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const searchProperty = async (address: string): Promise<PropertyInfo[]> => {
    const response = await fetch("/api/property/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address })
    });
    
    if (!response.ok) {
      throw new Error("Failed to search property data");
    }
    
    return response.json();
  };

  const handleSearch = async () => {
    if (!searchAddress.trim()) {
      toast({
        title: "Address Required",
        description: "Please enter a property address to search",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchProperty(searchAddress);
      if (results && results.length > 0) {
        setPropertyData(results[0]);
        toast({
          title: "Property Found",
          description: "Property data retrieved successfully"
        });
      } else {
        toast({
          title: "No Results",
          description: "No property data found for this address",
          variant: "destructive"
        });
        setPropertyData(null);
      }
    } catch (error) {
      toast({
        title: "Search Failed",
        description: "Unable to retrieve property data. Please try again.",
        variant: "destructive"
      });
      setPropertyData(null);
    } finally {
      setIsSearching(false);
    }
  };

  const formatCurrency = (value: number | undefined) => {
    if (!value) return "Not available";
    return new Intl.NumberFormat("en-NZ", {
      style: "currency",
      currency: "NZD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatArea = (area: number | undefined) => {
    if (!area) return "Not available";
    return `${area.toLocaleString()} m²`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Property Data Search
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Search for comprehensive property information including zoning, valuations, and development potential
          </p>
        </div>

        {/* Search Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Property Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Property Address</Label>
              <div className="flex gap-2">
                <Input
                  id="address"
                  placeholder="Enter property address (e.g., 123 Queen Street, Auckland)"
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSearch} 
                  disabled={isSearching}
                  className="min-w-[100px]"
                >
                  {isSearching ? "Searching..." : "Search"}
                </Button>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter a New Zealand property address to retrieve official council data, zoning information, and property valuations.
            </p>
          </CardContent>
        </Card>

        {/* Property Results */}
        {propertyData && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Basic Property Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  Property Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Address
                  </Label>
                  <p className="text-lg font-medium">{propertyData.address}</p>
                </div>
                
                {propertyData.suburb && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Suburb
                    </Label>
                    <p className="font-medium">{propertyData.suburb}</p>
                  </div>
                )}

                {propertyData.ratesId && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Rates ID
                    </Label>
                    <p className="font-mono text-sm">{propertyData.ratesId}</p>
                  </div>
                )}

                {propertyData.coordinates && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Coordinates
                    </Label>
                    <p className="font-mono text-sm">
                      {propertyData.coordinates[1].toFixed(6)}, {propertyData.coordinates[0].toFixed(6)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Valuation & Zoning
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Capital Value
                  </Label>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(propertyData.capitalValue)}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Land Area
                  </Label>
                  <p className="text-lg font-medium">
                    {formatArea(propertyData.landArea)}
                  </p>
                </div>

                {propertyData.zoning && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Zoning
                    </Label>
                    <Badge variant="secondary" className="text-sm">
                      {propertyData.zoning}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Data Sources Notice */}
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="space-y-2">
                <h3 className="font-medium text-blue-900 dark:text-blue-100">
                  Data Sources & Accuracy
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-200">
                  Property data is sourced from official Auckland Council databases and LINZ records. 
                  Information is updated regularly but may not reflect the most recent changes. 
                  Always verify critical details with the relevant council before making development decisions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
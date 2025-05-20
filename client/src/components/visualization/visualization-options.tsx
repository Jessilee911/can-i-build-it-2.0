import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';

interface VisualizationOptionsProps {
  onOptionsChange: (options: {
    visualizationType: string;
    dataLayer: string;
    region: string;
  }) => void;
}

const VisualizationOptions: React.FC<VisualizationOptionsProps> = ({ onOptionsChange }) => {
  const form = useForm({
    defaultValues: {
      visualizationType: 'Map View',
      dataLayer: 'Property Locations',
      region: 'All Regions',
    },
  });
  
  const onSubmit = (data: any) => {
    onOptionsChange(data);
  };

  return (
    <div className="lg:col-span-1">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Visualization Options</h3>
      <div className="bg-gray-50 p-4 rounded-lg space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="visualizationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visualization Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select visualization type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Map View">Map View</SelectItem>
                      <SelectItem value="Heat Map">Heat Map</SelectItem>
                      <SelectItem value="Property Density">Property Density</SelectItem>
                      <SelectItem value="Price Distribution">Price Distribution</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="dataLayer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data Layer</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select data layer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Property Locations">Property Locations</SelectItem>
                      <SelectItem value="Zoning Boundaries">Zoning Boundaries</SelectItem>
                      <SelectItem value="Property Values">Property Values</SelectItem>
                      <SelectItem value="Last Sale Date">Last Sale Date</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="region"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Region</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select region" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="All Regions">All Regions</SelectItem>
                      <SelectItem value="San Francisco, CA">San Francisco, CA</SelectItem>
                      <SelectItem value="Oakland, CA">Oakland, CA</SelectItem>
                      <SelectItem value="Berkeley, CA">Berkeley, CA</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            
            <div className="pt-2">
              <Button 
                type="submit"
                className="w-full inline-flex items-center justify-center"
              >
                Update Visualization
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default VisualizationOptions;

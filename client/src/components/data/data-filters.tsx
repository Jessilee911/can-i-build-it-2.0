import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataSource } from '@shared/schema';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel 
} from '@/components/ui/form';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';

interface DataFiltersProps {
  onFiltersApplied: (filters: {
    dataSource: string;
    dataType: string;
    dateRange: string;
  }) => void;
}

const DataFilters: React.FC<DataFiltersProps> = ({ onFiltersApplied }) => {
  const { data: dataSources, isLoading: isLoadingDataSources } = useQuery<DataSource[]>({
    queryKey: ['/api/data-sources'],
    queryFn: async () => {
      const response = await fetch('/api/data-sources');
      if (!response.ok) throw new Error('Failed to fetch data sources');
      return response.json();
    },
  });
  
  const form = useForm({
    defaultValues: {
      dataSource: 'All Sources',
      dataType: 'All Types',
      dateRange: 'All Time',
    },
  });
  
  const onSubmit = (data: any) => {
    onFiltersApplied(data);
  };

  return (
    <div className="lg:col-span-1">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
      <div className="bg-gray-50 p-4 rounded-lg space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="dataSource"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data Source</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={isLoadingDataSources}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select data source" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="All Sources">All Sources</SelectItem>
                      {dataSources && dataSources.map(source => (
                        <SelectItem key={source.id} value={source.name}>
                          {source.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="dataType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select data type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="All Types">All Types</SelectItem>
                      <SelectItem value="Property">Property</SelectItem>
                      <SelectItem value="Parcel">Parcel</SelectItem>
                      <SelectItem value="Zoning">Zoning</SelectItem>
                      <SelectItem value="Geographic">Geographic</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="dateRange"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date Range</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select date range" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="All Time">All Time</SelectItem>
                      <SelectItem value="Last 7 Days">Last 7 Days</SelectItem>
                      <SelectItem value="Last 30 Days">Last 30 Days</SelectItem>
                      <SelectItem value="Last 90 Days">Last 90 Days</SelectItem>
                      <SelectItem value="Custom Range">Custom Range</SelectItem>
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
                Apply Filters
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default DataFilters;

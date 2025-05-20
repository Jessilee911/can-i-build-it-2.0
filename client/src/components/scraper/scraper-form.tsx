import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const scraperFormSchema = z.object({
  sourceType: z.string(),
  targetUrl: z.string().url({ message: "Please enter a valid URL" }),
  rateLimit: z.coerce.number().min(1).max(100),
  maxPages: z.coerce.number().min(1).max(1000),
  dataSelectors: z.string(),
  useAI: z.boolean().default(false),
  outputFormat: z.string(),
});

type ScraperFormValues = z.infer<typeof scraperFormSchema>;

interface ScraperFormProps {
  onScrapingStart: () => void;
}

const ScraperForm: React.FC<ScraperFormProps> = ({ onScrapingStart }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<ScraperFormValues>({
    resolver: zodResolver(scraperFormSchema),
    defaultValues: {
      sourceType: 'GIS Portal',
      targetUrl: '',
      rateLimit: 10,
      maxPages: 100,
      dataSelectors: '.property-listing .address\n.property-listing .price\n.property-listing .beds\n.property-listing .baths\n.property-details .coordinates',
      useAI: false,
      outputFormat: 'JSON',
    },
  });

  const onSubmit = async (data: ScraperFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Determine sourceId based on sourceType (in a real app, this would come from an API)
      let sourceId = 1;
      switch (data.sourceType) {
        case 'Property Database':
          sourceId = 1;
          break;
        case 'GIS Portal':
          sourceId = 2;
          break;
        case 'Real Estate Listings':
          sourceId = 3;
          break;
        default:
          sourceId = 1;
      }
      
      const response = await apiRequest('POST', '/api/scraping-jobs', {
        sourceId,
        targetUrl: data.targetUrl,
        rateLimit: data.rateLimit,
        maxPages: data.maxPages,
        dataSelectors: data.dataSelectors,
        useAI: data.useAI,
        outputFormat: data.outputFormat,
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Scraping job started successfully",
        });
        onScrapingStart();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start scraping job",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="md:col-span-2">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Configure Web Scraper</h3>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="sourceType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Source Type</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="GIS Portal">GIS Portal</SelectItem>
                    <SelectItem value="Property Database">Property Database</SelectItem>
                    <SelectItem value="Real Estate Listings">Real Estate Listings</SelectItem>
                    <SelectItem value="Government Records">Government Records</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="targetUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://example.com/property-data" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="rateLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rate Limit (requests/min)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="maxPages"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Pages to Scrape</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="dataSelectors"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data Selectors (CSS or XPath)</FormLabel>
                <FormControl>
                  <Textarea 
                    className="font-mono" 
                    rows={4} 
                    placeholder=".property-card .address, .property-card .price"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="useAI"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Use AI to automatically detect data patterns</FormLabel>
                </div>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="outputFormat"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Output Format</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select output format" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="JSON">JSON</SelectItem>
                    <SelectItem value="CSV">CSV</SelectItem>
                    <SelectItem value="GeoJSON">GeoJSON</SelectItem>
                    <SelectItem value="Database">Database</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div>
            <Button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              <span className="material-icons mr-2">play_arrow</span>
              {isSubmitting ? 'Starting...' : 'Start Scraping'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ScraperForm;

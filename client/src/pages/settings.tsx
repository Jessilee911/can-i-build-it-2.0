import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { DataSource, insertDataSourceSchema } from "@shared/schema";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Create enhanced schema with validation for the form
const dataSourceSchema = insertDataSourceSchema.extend({
  url: z.string().url({ message: "Please enter a valid URL" }),
});

const rateSchema = z.object({
  defaultRateLimit: z.coerce.number().min(1).max(100),
  maxPages: z.coerce.number().min(1).max(1000),
  userAgent: z.string(),
  useProxy: z.boolean().default(false),
  proxyUrl: z.string().optional(),
});

type RateFormValues = z.infer<typeof rateSchema>;
type DataSourceFormValues = z.infer<typeof dataSourceSchema>;

const Settings = () => {
  const [editingSource, setEditingSource] = useState<DataSource | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch data sources
  const { data: dataSources, isLoading: isLoadingDataSources } = useQuery<DataSource[]>({
    queryKey: ['/api/data-sources'],
    queryFn: async () => {
      const response = await fetch('/api/data-sources');
      if (!response.ok) throw new Error('Failed to fetch data sources');
      return response.json();
    },
  });

  // Data Source form
  const dataSourceForm = useForm<DataSourceFormValues>({
    resolver: zodResolver(dataSourceSchema),
    defaultValues: {
      name: editingSource?.name || '',
      url: editingSource?.url || '',
      type: editingSource?.type || 'Property',
      description: editingSource?.description || '',
      isActive: editingSource?.isActive ?? true,
    },
  });

  // Rate limiting form
  const rateForm = useForm<RateFormValues>({
    resolver: zodResolver(rateSchema),
    defaultValues: {
      defaultRateLimit: 10,
      maxPages: 100,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      useProxy: false,
      proxyUrl: '',
    },
  });

  // Reset data source form when editing source changes
  useState(() => {
    if (editingSource) {
      dataSourceForm.reset({
        name: editingSource.name,
        url: editingSource.url,
        type: editingSource.type,
        description: editingSource.description || '',
        isActive: editingSource.isActive,
      });
    } else {
      dataSourceForm.reset({
        name: '',
        url: '',
        type: 'Property',
        description: '',
        isActive: true,
      });
    }
  });

  // Create data source mutation
  const createDataSourceMutation = useMutation({
    mutationFn: async (data: DataSourceFormValues) => {
      const response = await apiRequest('POST', '/api/data-sources', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/data-sources'] });
      toast({
        title: "Success",
        description: "Data source created successfully",
      });
      dataSourceForm.reset({
        name: '',
        url: '',
        type: 'Property',
        description: '',
        isActive: true,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create data source: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update data source mutation
  const updateDataSourceMutation = useMutation({
    mutationFn: async (data: { id: number; source: Partial<DataSourceFormValues> }) => {
      const response = await apiRequest('PUT', `/api/data-sources/${data.id}`, data.source);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/data-sources'] });
      toast({
        title: "Success",
        description: "Data source updated successfully",
      });
      setEditingSource(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update data source: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete data source mutation
  const deleteDataSourceMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/data-sources/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/data-sources'] });
      toast({
        title: "Success",
        description: "Data source deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete data source: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Save rate limit settings
  const saveRateSettings = (data: RateFormValues) => {
    // In a real app, this would call an API endpoint
    toast({
      title: "Settings Saved",
      description: "Rate limit settings have been updated",
    });
  };

  // Handle data source form submission
  const onDataSourceSubmit = (data: DataSourceFormValues) => {
    if (editingSource) {
      updateDataSourceMutation.mutate({ id: editingSource.id, source: data });
    } else {
      createDataSourceMutation.mutate(data);
    }
  };

  // Handle data source deletion
  const handleDeleteSource = (id: number) => {
    if (confirm("Are you sure you want to delete this data source?")) {
      deleteDataSourceMutation.mutate(id);
    }
  };

  const isSubmitting = 
    createDataSourceMutation.isPending || 
    updateDataSourceMutation.isPending || 
    deleteDataSourceMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <Tabs defaultValue="data-sources">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="data-sources">Data Sources</TabsTrigger>
          <TabsTrigger value="rate-limiting">Rate Limiting</TabsTrigger>
          <TabsTrigger value="api-access">API Access</TabsTrigger>
        </TabsList>

        {/* Data Sources Tab */}
        <TabsContent value="data-sources" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{editingSource ? 'Edit Data Source' : 'Add New Data Source'}</CardTitle>
              <CardDescription>
                Configure data sources for web scraping
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...dataSourceForm}>
                <form onSubmit={dataSourceForm.handleSubmit(onDataSourceSubmit)} className="space-y-4">
                  <FormField
                    control={dataSourceForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Source Name</FormLabel>
                        <FormControl>
                          <Input placeholder="County Property Records" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={dataSourceForm.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/property-data" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={dataSourceForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
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
                            <SelectItem value="Property">Property</SelectItem>
                            <SelectItem value="GIS">GIS</SelectItem>
                            <SelectItem value="Zoning">Zoning</SelectItem>
                            <SelectItem value="Tax">Tax</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={dataSourceForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe this data source" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={dataSourceForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Active Status</FormLabel>
                          <FormDescription>
                            Enable or disable this data source
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    {editingSource && (
                      <Button 
                        variant="outline" 
                        type="button" 
                        onClick={() => setEditingSource(null)}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                    >
                      {editingSource ? 'Update' : 'Add'} Data Source
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Available Data Sources</CardTitle>
              <CardDescription>
                Manage your existing data sources
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingDataSources ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((_, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="h-4 w-full mt-2" />
                    </div>
                  ))}
                </div>
              ) : dataSources?.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-500">No data sources found. Add one to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dataSources?.map(source => (
                    <div 
                      key={source.id} 
                      className="p-4 border rounded-lg flex flex-col md:flex-row justify-between"
                    >
                      <div>
                        <div className="flex items-center mb-1">
                          <h3 className="font-medium text-lg">{source.name}</h3>
                          <span className={`ml-2 inline-flex rounded-full h-2 w-2 ${
                            source.isActive ? 'bg-green-500' : 'bg-gray-300'
                          }`}></span>
                        </div>
                        <p className="text-sm text-gray-500">{source.url}</p>
                        <div className="flex items-center mt-1">
                          <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            {source.type}
                          </span>
                          {source.description && (
                            <p className="ml-2 text-xs text-gray-500">{source.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center mt-4 md:mt-0 space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setEditingSource(source)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteSource(source.id)}
                          disabled={isSubmitting}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rate Limiting Tab */}
        <TabsContent value="rate-limiting">
          <Card>
            <CardHeader>
              <CardTitle>Rate Limiting Settings</CardTitle>
              <CardDescription>
                Configure rate limiting for web scraping to avoid overloading target websites
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...rateForm}>
                <form onSubmit={rateForm.handleSubmit(saveRateSettings)} className="space-y-4">
                  <FormField
                    control={rateForm.control}
                    name="defaultRateLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Rate Limit (requests/min)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={rateForm.control}
                    name="maxPages"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Max Pages to Scrape</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={rateForm.control}
                    name="userAgent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>User Agent</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={rateForm.control}
                    name="useProxy"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Use Proxy</FormLabel>
                          <CardDescription>
                            Enable proxy for web scraping
                          </CardDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {rateForm.watch("useProxy") && (
                    <FormField
                      control={rateForm.control}
                      name="proxyUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Proxy URL</FormLabel>
                          <FormControl>
                            <Input placeholder="http://proxy.example.com:8080" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="flex justify-end">
                    <Button type="submit">Save Settings</Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Access Tab */}
        <TabsContent value="api-access">
          <Card>
            <CardHeader>
              <CardTitle>API Access</CardTitle>
              <CardDescription>
                Manage API keys and access for external services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">GIS API Credentials</h3>
                  <div className="rounded-lg border p-4">
                    <div className="flex justify-between items-center mb-4">
                      <p className="font-medium">API Key</p>
                      <Button variant="outline" size="sm">Generate New Key</Button>
                    </div>
                    <Input 
                      type="password" 
                      value="••••••••••••••••••••••••••••••" 
                      readOnly 
                      className="mb-2"
                    />
                    <p className="text-xs text-gray-500">Last used: Never</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Property Data API Permissions</h3>
                  <div className="rounded-lg border p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Read Access</p>
                        <p className="text-xs text-gray-500">Allow reading property data</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Write Access</p>
                        <p className="text-xs text-gray-500">Allow creating and updating property data</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Delete Access</p>
                        <p className="text-xs text-gray-500">Allow deleting property data</p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">External Services</h3>
                  <div className="rounded-lg border p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Google Maps API</p>
                        <p className="text-xs text-gray-500">Access to geocoding and mapping features</p>
                      </div>
                      <Button size="sm">Configure</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Property Tax API</p>
                        <p className="text-xs text-gray-500">Access to property tax information</p>
                      </div>
                      <Button size="sm">Configure</Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>Save All API Settings</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ScraperConfig {
  sourceType: string;
  targetUrl: string;
  rateLimit: number;
  maxPages: number;
  dataSelectors: string;
  useAI: boolean;
  outputFormat: string;
}

interface ScraperHookReturn {
  startScraping: (config: ScraperConfig) => Promise<number | undefined>;
  stopScraping: (jobId: number) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

export const useScraper = (): ScraperHookReturn => {
  const [error, setError] = useState<Error | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Start a scraping job
  const { mutate: startMutation, isPending: isStartLoading } = useMutation({
    mutationFn: async (config: ScraperConfig) => {
      // Map source type to source ID (this would be dynamically fetched in a real app)
      let sourceId = 1;
      switch (config.sourceType) {
        case 'GIS Portal':
          sourceId = 2;
          break;
        case 'Property Database':
          sourceId = 1;
          break;
        case 'Real Estate Listings':
          sourceId = 3;
          break;
        default:
          sourceId = 1;
      }
      
      const response = await apiRequest('POST', '/api/scraping-jobs', {
        sourceId,
        targetUrl: config.targetUrl,
        rateLimit: config.rateLimit,
        maxPages: config.maxPages,
        dataSelectors: config.dataSelectors,
        useAI: config.useAI,
        outputFormat: config.outputFormat,
      });
      
      const data = await response.json();
      return data.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scraping-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      toast({
        title: 'Scraping Started',
        description: 'The scraping job has been started successfully.',
      });
    },
    onError: (error: Error) => {
      setError(error);
      toast({
        title: 'Error',
        description: `Failed to start scraping job: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Stop a scraping job
  const { mutate: stopMutation, isPending: isStopLoading } = useMutation({
    mutationFn: async (jobId: number) => {
      await apiRequest('PUT', `/api/scraping-jobs/${jobId}`, {
        status: 'cancelled',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scraping-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      toast({
        title: 'Scraping Stopped',
        description: 'The scraping job has been stopped.',
      });
    },
    onError: (error: Error) => {
      setError(error);
      toast({
        title: 'Error',
        description: `Failed to stop scraping job: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  const startScraping = async (config: ScraperConfig): Promise<number | undefined> => {
    try {
      return await new Promise((resolve, reject) => {
        startMutation(config, {
          onSuccess: (id) => resolve(id),
          onError: (error) => reject(error),
        });
      });
    } catch (err) {
      setError(err as Error);
      return undefined;
    }
  };
  
  const stopScraping = async (jobId: number): Promise<void> => {
    try {
      await new Promise<void>((resolve, reject) => {
        stopMutation(jobId, {
          onSuccess: () => resolve(),
          onError: (error) => reject(error),
        });
      });
    } catch (err) {
      setError(err as Error);
    }
  };
  
  return {
    startScraping,
    stopScraping,
    isLoading: isStartLoading || isStopLoading,
    error,
  };
};

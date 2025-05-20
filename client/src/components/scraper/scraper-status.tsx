import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface ScraperStatusProps {
  isActive: boolean;
  jobId?: number;
}

const ScraperStatus: React.FC<ScraperStatusProps> = ({ isActive, jobId }) => {
  const [progress, setProgress] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState('00:00:00');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const { toast } = useToast();

  // Query for the current job if there's a jobId
  const { data: jobData, error, isLoading } = useQuery({
    queryKey: ['/api/scraping-jobs', jobId],
    queryFn: async () => {
      if (!jobId) return null;
      const response = await fetch(`/api/scraping-jobs/${jobId}`);
      if (!response.ok) throw new Error('Failed to fetch job status');
      return response.json();
    },
    enabled: !!jobId && isActive,
    refetchInterval: isActive ? 2000 : false,
  });

  // Format time elapsed
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isActive && !startTime) {
      setStartTime(new Date());
    }
    
    if (isActive && startTime) {
      timer = setInterval(() => {
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        
        const hours = Math.floor(diffInSeconds / 3600).toString().padStart(2, '0');
        const minutes = Math.floor((diffInSeconds % 3600) / 60).toString().padStart(2, '0');
        const seconds = (diffInSeconds % 60).toString().padStart(2, '0');
        
        setTimeElapsed(`${hours}:${minutes}:${seconds}`);
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isActive, startTime]);

  // Update progress for demo
  useEffect(() => {
    let progressTimer: NodeJS.Timeout;
    
    if (isActive) {
      progressTimer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressTimer);
            return 100;
          }
          return prev + Math.min(5, 100 - prev);
        });
      }, 1000);
    } else {
      setProgress(0);
      setTimeElapsed('00:00:00');
      setStartTime(null);
    }
    
    return () => {
      if (progressTimer) clearInterval(progressTimer);
    };
  }, [isActive]);

  // Handle job completion
  useEffect(() => {
    if (jobData && jobData.status === 'completed') {
      toast({
        title: "Scraping Completed",
        description: `Successfully collected ${jobData.totalRecords} records.`,
      });
    } else if (jobData && jobData.status === 'failed') {
      toast({
        title: "Scraping Failed",
        description: "An error occurred during the scraping process.",
        variant: "destructive",
      });
    }
  }, [jobData, toast]);

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-red-800 mb-2">Error</h3>
        <p className="text-sm text-red-700">Failed to fetch job status</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Scraping Status</h3>
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-500">Current Job</h4>
          <p className="text-base font-medium text-gray-900">
            {isActive 
              ? (jobData?.targetUrl ? `Scraping ${jobData.targetUrl}` : 'Property Database Scan') 
              : 'No active jobs'}
          </p>
        </div>
        
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-500">Progress</h4>
          <Progress 
            value={progress} 
            className="w-full h-5 mt-1" 
          />
          <div className="text-xs text-center font-medium mt-1">
            {progress}%
          </div>
        </div>
        
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-500">Data Collected</h4>
          <p className="text-base font-medium text-gray-900">
            {isLoading ? 'Loading...' : `${jobData?.totalRecords || 0} records`}
          </p>
        </div>
        
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-500">Errors</h4>
          <p className="text-base font-medium text-gray-900">
            {isLoading ? 'Loading...' : `${jobData?.errorCount || 0}`}
          </p>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-500">Time Elapsed</h4>
          <p className="text-base font-medium text-gray-900">{timeElapsed}</p>
        </div>
      </div>
    </div>
  );
};

export default ScraperStatus;

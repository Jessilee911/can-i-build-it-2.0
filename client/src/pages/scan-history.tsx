import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import StatusCard from "@/components/dashboard/status-card";
import { ScrapingJob } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ActivityFeed from "@/components/activity/activity-feed";

const ScanHistory = () => {
  const [selectedJob, setSelectedJob] = useState<number | null>(null);

  // Fetch all scraping jobs
  const { data: jobs, isLoading: isLoadingJobs } = useQuery<ScrapingJob[]>({
    queryKey: ['/api/scraping-jobs'],
    queryFn: async () => {
      const response = await fetch('/api/scraping-jobs');
      if (!response.ok) throw new Error('Failed to fetch scraping jobs');
      return response.json();
    },
  });

  // Fetch activities for selected job if any
  const { data: jobActivities, isLoading: isLoadingActivities } = useQuery({
    queryKey: ['/api/activities', selectedJob],
    queryFn: async () => {
      if (!selectedJob) return [];
      const response = await fetch(`/api/activities?jobId=${selectedJob}`);
      if (!response.ok) throw new Error('Failed to fetch job activities');
      return response.json();
    },
    enabled: !!selectedJob,
  });

  // Calculate statistics
  const successfulJobs = jobs?.filter(job => job.status === 'completed')?.length || 0;
  const failedJobs = jobs?.filter(job => job.status === 'failed')?.length || 0;
  const totalRecords = jobs?.reduce((sum, job) => sum + (job.totalRecords || 0), 0) || 0;

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatusCard
          title="Total Scans"
          value={isLoadingJobs ? "Loading..." : jobs?.length || 0}
          icon="history"
          color="blue"
        />
        <StatusCard
          title="Successful Scans"
          value={isLoadingJobs ? "Loading..." : successfulJobs}
          icon="check_circle"
          color="green"
        />
        <StatusCard
          title="Failed Scans"
          value={isLoadingJobs ? "Loading..." : failedJobs}
          icon="error"
          color="red"
        />
      </div>

      {/* Scan History Table */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Scan History</h3>
          <p className="mt-1 text-sm text-gray-500">View all your previous web scraping jobs</p>
        </div>

        {isLoadingJobs ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((_, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex flex-col md:flex-row justify-between">
                  <Skeleton className="h-6 w-48 mb-2 md:mb-0" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <div className="mt-2 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : jobs?.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">No scraping jobs found. Start a new scan from the dashboard.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Target URL
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Records
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Started
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {jobs?.map((job) => (
                  <tr key={job.id} className={selectedJob === job.id ? "bg-blue-50" : ""}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{job.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                      {job.targetUrl}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(job.status)}`}>
                        {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {job.totalRecords}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(job.startedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {job.completedAt ? formatDate(job.completedAt) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button 
                        variant="link" 
                        size="sm"
                        onClick={() => setSelectedJob(selectedJob === job.id ? null : job.id)}
                      >
                        {selectedJob === job.id ? 'Hide Details' : 'View Details'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Job Details */}
      {selectedJob && (
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Job #{selectedJob} Details</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedJob(null)}
            >
              Close
            </Button>
          </div>
          <div className="p-6">
            {isLoadingActivities ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
              </div>
            ) : (
              <>
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Job Statistics</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Records Collected</p>
                      <p className="text-lg font-semibold">
                        {jobs?.find(j => j.id === selectedJob)?.totalRecords || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Error Count</p>
                      <p className="text-lg font-semibold">
                        {jobs?.find(j => j.id === selectedJob)?.errorCount || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Rate Limit</p>
                      <p className="text-lg font-semibold">
                        {jobs?.find(j => j.id === selectedJob)?.rateLimit || 0} req/min
                      </p>
                    </div>
                  </div>
                </div>
                
                <h4 className="text-sm font-medium text-gray-500 mb-2">Job Activities</h4>
                {jobActivities?.length > 0 ? (
                  <div className="border rounded-lg divide-y">
                    {jobActivities.map((activity) => (
                      <div key={activity.id} className="p-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <span className={`h-8 w-8 rounded-full ${
                              activity.type === 'error' ? 'bg-red-100 text-red-600' : 
                              activity.type === 'export' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                            } flex items-center justify-center`}>
                              <span className="material-icons text-sm">
                                {activity.type === 'error' ? 'error' : 
                                 activity.type === 'export' ? 'save' : 'search'}
                              </span>
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {activity.message}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(activity.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No activities found for this job.</p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <ActivityFeed />
    </>
  );
};

export default ScanHistory;

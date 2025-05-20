import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import StatusCard from "@/components/dashboard/status-card";
import Tabs from "@/components/tabs/tabs";
import ScraperForm from "@/components/scraper/scraper-form";
import ScraperStatus from "@/components/scraper/scraper-status";
import DataTable from "@/components/data/data-table";
import DataFilters from "@/components/data/data-filters";
import MapView from "@/components/visualization/map-view";
import VisualizationOptions from "@/components/visualization/visualization-options";
import ActivityFeed from "@/components/activity/activity-feed";

const Dashboard = () => {
  const [activeJob, setActiveJob] = useState<{ id?: number; isActive: boolean }>({
    isActive: false
  });
  
  const [dataFilters, setDataFilters] = useState({
    dataSource: 'All Sources',
    dataType: 'All Types',
    dateRange: 'All Time',
  });
  
  const [visualizationOptions, setVisualizationOptions] = useState({
    visualizationType: 'Map View',
    dataLayer: 'Property Locations',
    region: 'All Regions',
  });

  // Fetch stats for the dashboard
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/stats'],
    queryFn: async () => {
      const response = await fetch('/api/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
  });

  const handleScrapingStart = () => {
    setActiveJob({ isActive: true });
  };

  return (
    <>
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatusCard
          title="Total Scans"
          value={isLoadingStats ? "Loading..." : stats?.totalScans || 0}
          icon="search"
          color="blue"
        />
        <StatusCard
          title="Collected Records"
          value={isLoadingStats ? "Loading..." : stats?.totalRecords || 0}
          icon="folder"
          color="green"
        />
        <StatusCard
          title="Data Sources"
          value={isLoadingStats ? "Loading..." : stats?.totalDataSources || 0}
          icon="public"
          color="purple"
        />
      </div>

      {/* Main content tabs and sections */}
      <Tabs
        tabs={[
          {
            id: "scraper",
            label: "Web Scraper",
            content: (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <ScraperForm onScrapingStart={handleScrapingStart} />
                  <ScraperStatus 
                    isActive={activeJob.isActive} 
                    jobId={activeJob.id} 
                  />
                </div>
              </div>
            ),
          },
          {
            id: "data",
            label: "Data Management",
            content: (
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <DataFilters 
                    onFiltersApplied={setDataFilters} 
                  />
                  <DataTable 
                    searchParams={{
                      propertyType: dataFilters.dataType !== 'All Types' ? dataFilters.dataType : undefined,
                      source: dataFilters.dataSource !== 'All Sources' ? dataFilters.dataSource : undefined,
                      dateRange: dataFilters.dateRange,
                    }} 
                  />
                </div>
              </div>
            ),
          },
          {
            id: "visualization",
            label: "Visualization",
            content: (
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <VisualizationOptions 
                    onOptionsChange={setVisualizationOptions} 
                  />
                  <div className="lg:col-span-3">
                    <MapView 
                      visualizationType={visualizationOptions.visualizationType}
                      dataLayer={visualizationOptions.dataLayer}
                      region={visualizationOptions.region}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <div className="bg-white shadow rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Property Type Distribution</h4>
                        <div className="h-60 bg-gray-100 rounded flex items-center justify-center">
                          <div className="text-center">
                            <span className="material-icons text-gray-400 text-4xl mb-2">pie_chart</span>
                            <p className="text-gray-400 text-sm">Chart visualization would display here</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white shadow rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Price Trends (Last 12 Months)</h4>
                        <div className="h-60 bg-gray-100 rounded flex items-center justify-center">
                          <div className="text-center">
                            <span className="material-icons text-gray-400 text-4xl mb-2">trending_up</span>
                            <p className="text-gray-400 text-sm">Trend chart would display here</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ),
          },
        ]}
        defaultTabId="scraper"
      />
      
      {/* Recent Activity Section */}
      <ActivityFeed />
    </>
  );
};

export default Dashboard;

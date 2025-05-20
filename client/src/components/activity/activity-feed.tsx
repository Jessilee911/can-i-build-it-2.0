import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity } from '@shared/schema';
import { format, formatDistance } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const ActivityFeed: React.FC = () => {
  const { data: activities, isLoading, error } = useQuery<Activity[]>({
    queryKey: ['/api/activities'],
    queryFn: async () => {
      const response = await fetch('/api/activities');
      if (!response.ok) throw new Error('Failed to fetch activities');
      return response.json();
    },
  });
  
  const getActivityIcon = (type: string) => {
    switch(type.toLowerCase()) {
      case 'scraping':
        return { icon: 'search', bg: 'bg-blue-100', text: 'text-primary' };
      case 'export':
        return { icon: 'save', bg: 'bg-green-100', text: 'text-secondary' };
      case 'error':
        return { icon: 'error', bg: 'bg-red-100', text: 'text-status-error' };
      case 'update':
        return { icon: 'update', bg: 'bg-purple-100', text: 'text-accent' };
      default:
        return { icon: 'info', bg: 'bg-gray-100', text: 'text-gray-500' };
    }
  };
  
  const getTimeAgo = (timestamp: string) => {
    try {
      return formatDistance(new Date(timestamp), new Date(), { addSuffix: true });
    } catch (e) {
      return 'unknown time';
    }
  };
  
  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="bg-gray-50 px-4 py-5 sm:p-6">
          <ul className="divide-y divide-gray-200">
            {[1, 2, 3].map((_, index) => (
              <li key={index} className="py-4">
                <div className="flex space-x-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="bg-red-50 px-4 py-5 sm:p-6 text-center">
          <p className="text-red-600">Failed to load activity feed</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Activity</h3>
      </div>
      <div className="bg-gray-50 px-4 py-5 sm:p-6">
        {activities && activities.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {activities.map((activity) => {
              const { icon, bg, text } = getActivityIcon(activity.type);
              return (
                <li key={activity.id} className="py-4">
                  <div className="flex space-x-3">
                    <div className="flex-shrink-0">
                      <span className={`h-8 w-8 rounded-full ${bg} flex items-center justify-center`}>
                        <span className={`material-icons ${text} text-sm`}>{icon}</span>
                      </span>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium">
                          {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                        </h3>
                        <p className="text-sm text-gray-500">{getTimeAgo(activity.timestamp)}</p>
                      </div>
                      <p className="text-sm text-gray-500">{activity.message}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="text-center py-4 text-gray-500">No recent activity</div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;

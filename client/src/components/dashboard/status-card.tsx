import React from 'react';

interface StatusCardProps {
  title: string;
  value: number | string;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'red';
}

const StatusCard: React.FC<StatusCardProps> = ({ title, value, icon, color }) => {
  // Define color classes based on the color prop
  const colorClasses = {
    blue: {
      bg: 'bg-blue-100',
      text: 'text-primary'
    },
    green: {
      bg: 'bg-green-100',
      text: 'text-secondary'
    },
    purple: {
      bg: 'bg-purple-100',
      text: 'text-accent'
    },
    yellow: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-600'
    },
    red: {
      bg: 'bg-red-100',
      text: 'text-status-error'
    }
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${colorClasses[color].bg} rounded-md p-3`}>
            <span className={`material-icons ${colorClasses[color].text}`}>{icon}</span>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusCard;

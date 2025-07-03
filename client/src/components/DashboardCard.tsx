import { ReactNode } from 'react';

interface DashboardCardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  badge?: string | number;
  children: ReactNode;
  className?: string;
  gradient?: string;
}

const DashboardCard = ({ 
  title, 
  description, 
  icon, 
  badge, 
  children, 
  className = '',
  gradient = 'from-white to-gray-50'
}: DashboardCardProps) => {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-3xl shadow-xl border border-white/20 backdrop-blur-sm overflow-hidden group hover:shadow-2xl transition-all duration-500 ${className}`}>
      {/* Card Header */}
      <div className="p-6 border-b border-gray-100/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            {icon && (
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                {icon}
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold text-gray-900">{title}</h3>
              {description && (
                <p className="text-sm text-gray-600">{description}</p>
              )}
            </div>
          </div>
          {badge && (
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
              {badge}
            </div>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default DashboardCard;

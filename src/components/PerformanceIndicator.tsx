import React from 'react';
import { getPerformanceCategory } from '../utils/performanceCategories';

interface PerformanceIndicatorProps {
  achievementPercentage: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const PerformanceIndicator: React.FC<PerformanceIndicatorProps> = ({ 
  achievementPercentage, 
  showLabel = true,
  size = 'md'
}) => {
  const category = getPerformanceCategory(achievementPercentage);
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center font-semibold rounded-full ${category.bgColor} ${category.textColor} ${sizeClasses[size]}`}>
        {showLabel && `${category.name} - `}{achievementPercentage}%
      </span>
    </div>
  );
};

export default PerformanceIndicator;
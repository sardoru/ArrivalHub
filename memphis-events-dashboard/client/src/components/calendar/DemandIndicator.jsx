import React from 'react';

const demandColors = {
  low: 'bg-green-500',
  moderate: 'bg-yellow-500',
  high: 'bg-orange-500',
  very_high: 'bg-red-500',
  extreme: 'bg-red-700'
};

const demandLabels = {
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
  very_high: 'Very High',
  extreme: 'Extreme'
};

export function DemandIndicator({ level, score, showLabel = false, size = 'md' }) {
  const colorClass = demandColors[level] || demandColors.low;
  const label = demandLabels[level] || 'Unknown';

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`${sizeClasses[size]} ${colorClass} rounded-full`}
        title={`${label} demand (${score || 0})`}
      />
      {showLabel && (
        <span className="text-xs text-gray-600">{label}</span>
      )}
    </div>
  );
}

export function DemandBadge({ level, score }) {
  const badgeClasses = {
    low: 'demand-badge demand-low',
    moderate: 'demand-badge demand-moderate',
    high: 'demand-badge demand-high',
    very_high: 'demand-badge demand-very-high',
    extreme: 'demand-badge demand-extreme'
  };

  const label = demandLabels[level] || 'Unknown';

  return (
    <span className={badgeClasses[level] || badgeClasses.low}>
      {label}
      {score !== undefined && <span className="ml-1 opacity-75">({score})</span>}
    </span>
  );
}

export default DemandIndicator;

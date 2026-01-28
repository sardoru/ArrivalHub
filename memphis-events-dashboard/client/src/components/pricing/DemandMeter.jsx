import React from 'react';

const DEMAND_LEVELS = [
  { key: 'low', label: 'Low', color: 'bg-green-500', range: '0-30' },
  { key: 'moderate', label: 'Moderate', color: 'bg-yellow-500', range: '30-60' },
  { key: 'high', label: 'High', color: 'bg-orange-500', range: '60-100' },
  { key: 'very_high', label: 'Very High', color: 'bg-red-500', range: '100-150' },
  { key: 'extreme', label: 'Extreme', color: 'bg-red-700', range: '150+' }
];

export function DemandMeter({ score, level }) {
  // Calculate position (0-100%)
  const maxScore = 200;
  const position = Math.min(100, (score / maxScore) * 100);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">Demand Score</span>
        <span className="text-2xl font-bold text-gray-900">{score}</span>
      </div>

      {/* Meter bar */}
      <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
        <div className="absolute inset-0 flex">
          {DEMAND_LEVELS.map((lvl, index) => (
            <div
              key={lvl.key}
              className={`flex-1 ${lvl.color} ${index === 0 ? 'rounded-l-full' : ''} ${index === DEMAND_LEVELS.length - 1 ? 'rounded-r-full' : ''}`}
              style={{ opacity: 0.3 }}
            />
          ))}
        </div>

        {/* Indicator */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-gray-900 rounded-full transition-all duration-300"
          style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
        />
      </div>

      {/* Level labels */}
      <div className="flex justify-between text-xs text-gray-500">
        <span>0</span>
        <span>50</span>
        <span>100</span>
        <span>150</span>
        <span>200+</span>
      </div>

      {/* Current level */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-sm text-gray-600">Current Level:</span>
        <span className={`
          inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium
          ${level === 'low' ? 'bg-green-100 text-green-800' : ''}
          ${level === 'moderate' ? 'bg-yellow-100 text-yellow-800' : ''}
          ${level === 'high' ? 'bg-orange-100 text-orange-800' : ''}
          ${level === 'very_high' ? 'bg-red-100 text-red-800' : ''}
          ${level === 'extreme' ? 'bg-red-200 text-red-900' : ''}
        `}>
          {level?.replace('_', ' ').toUpperCase()}
        </span>
      </div>
    </div>
  );
}

export default DemandMeter;

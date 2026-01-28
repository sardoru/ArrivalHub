import React from 'react';
import { DemandIndicator } from './DemandIndicator';

const demandBgColors = {
  low: 'bg-green-50 hover:bg-green-100',
  moderate: 'bg-yellow-50 hover:bg-yellow-100',
  high: 'bg-orange-50 hover:bg-orange-100',
  very_high: 'bg-red-50 hover:bg-red-100',
  extreme: 'bg-red-100 hover:bg-red-200'
};

export function CalendarDay({
  date,
  dayNumber,
  isCurrentMonth,
  isToday,
  isSelected,
  eventCount = 0,
  demandLevel,
  demandScore,
  suggestedPrice,
  onClick
}) {
  const bgColor = demandLevel ? demandBgColors[demandLevel] : 'bg-white hover:bg-gray-50';

  return (
    <button
      onClick={() => onClick?.(date)}
      className={`
        relative min-h-[80px] p-2 border border-gray-200 text-left transition-colors
        ${!isCurrentMonth ? 'opacity-40' : ''}
        ${isToday ? 'ring-2 ring-blue-500 ring-inset' : ''}
        ${isSelected ? 'ring-2 ring-indigo-600 ring-inset' : ''}
        ${bgColor}
      `}
    >
      <div className="flex justify-between items-start">
        <span className={`
          text-sm font-medium
          ${isToday ? 'text-blue-600' : 'text-gray-900'}
        `}>
          {dayNumber}
        </span>
        {demandLevel && (
          <DemandIndicator level={demandLevel} score={demandScore} size="sm" />
        )}
      </div>

      {isCurrentMonth && (
        <div className="mt-1 space-y-1">
          {eventCount > 0 && (
            <div className="text-xs text-gray-600">
              {eventCount} event{eventCount !== 1 ? 's' : ''}
            </div>
          )}
          {suggestedPrice && (
            <div className="text-sm font-semibold text-green-700">
              ${suggestedPrice}
            </div>
          )}
        </div>
      )}
    </button>
  );
}

export default CalendarDay;

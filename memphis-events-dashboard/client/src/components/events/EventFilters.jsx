import React from 'react';

const EVENT_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'concert', label: 'Concerts' },
  { value: 'sports', label: 'Sports' },
  { value: 'festival', label: 'Festivals' },
  { value: 'convention', label: 'Conventions' },
  { value: 'conference', label: 'Conferences' },
  { value: 'theater', label: 'Theater' },
  { value: 'other', label: 'Other' }
];

export function EventFilters({ filters, onChange }) {
  const { eventType, startDate, endDate } = filters;

  const handleChange = (field, value) => {
    onChange({ ...filters, [field]: value });
  };

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex-1 min-w-[150px]">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Event Type
        </label>
        <select
          value={eventType || ''}
          onChange={(e) => handleChange('eventType', e.target.value || null)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
        >
          {EVENT_TYPES.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 min-w-[150px]">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Start Date
        </label>
        <input
          type="date"
          value={startDate || ''}
          onChange={(e) => handleChange('startDate', e.target.value || null)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div className="flex-1 min-w-[150px]">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          End Date
        </label>
        <input
          type="date"
          value={endDate || ''}
          onChange={(e) => handleChange('endDate', e.target.value || null)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div className="flex items-end">
        <button
          onClick={() => onChange({ eventType: null, startDate: null, endDate: null })}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

export default EventFilters;

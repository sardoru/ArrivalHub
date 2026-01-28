import React, { useEffect } from 'react';
import { format } from 'date-fns';
import useStore from '../../store/useStore';
import DemandMeter from './DemandMeter';
import EventCard from '../events/EventCard';

export function PriceSuggestion() {
  const {
    selectedDate,
    selectedDateDetails,
    fetchDateDetails,
    isLoading
  } = useStore();

  useEffect(() => {
    if (selectedDate) {
      fetchDateDetails(selectedDate);
    }
  }, [selectedDate]);

  if (!selectedDate) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Select a Date</h3>
          <p className="mt-1 text-sm text-gray-500">
            Click on a date in the calendar to see pricing suggestions.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (!selectedDateDetails) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <p className="text-gray-500">No pricing data available for this date.</p>
        </div>
      </div>
    );
  }

  const {
    date,
    totalDemandScore,
    eventCount,
    demandLevel,
    priceMultiplier,
    suggestedPrice,
    suggestedMinPrice,
    suggestedMaxPrice,
    baseRate,
    isWeekend,
    holidayBonus,
    events
  } = selectedDateDetails;

  const formattedDate = format(new Date(date), 'EEEE, MMMM d, yyyy');

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 bg-indigo-600">
        <h2 className="text-lg font-semibold text-white">{formattedDate}</h2>
        <p className="text-indigo-200 text-sm">
          {eventCount} event{eventCount !== 1 ? 's' : ''} scheduled
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Price Suggestion */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 text-center">
          <p className="text-sm text-gray-600 mb-1">Suggested Nightly Rate</p>
          <p className="text-5xl font-bold text-green-600">${suggestedPrice}</p>
          <p className="text-sm text-gray-500 mt-2">
            Range: ${suggestedMinPrice} - ${suggestedMaxPrice}
          </p>
        </div>

        {/* Demand Meter */}
        <div className="border-t pt-6">
          <DemandMeter score={totalDemandScore} level={demandLevel} />
        </div>

        {/* Pricing Factors */}
        <div className="border-t pt-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Pricing Factors</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Base Rate</span>
              <span className="font-medium">${baseRate}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Demand Multiplier</span>
              <span className="font-medium">{priceMultiplier}x</span>
            </div>
            {isWeekend && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Weekend</span>
                <span className="font-medium text-blue-600">+15%</span>
              </div>
            )}
            {holidayBonus > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Holiday/Special Event</span>
                <span className="font-medium text-purple-600">+{holidayBonus} pts</span>
              </div>
            )}
          </div>
        </div>

        {/* Events on this date */}
        {events && events.length > 0 && (
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Events Affecting Demand
            </h3>
            <div className="space-y-2">
              {events.map((event, index) => (
                <div
                  key={event.id || index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {event.title}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {event.eventType || event.event_type}
                    </p>
                  </div>
                  <div className="ml-4 text-right">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                      {event.demandImpactScore || event.demand_impact_score} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PriceSuggestion;

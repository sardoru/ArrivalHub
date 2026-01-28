import React from 'react';
import { format } from 'date-fns';
import { DemandBadge } from '../calendar/DemandIndicator';

const eventTypeIcons = {
  concert: '🎵',
  sports: '🏈',
  festival: '🎪',
  convention: '🏛️',
  conference: '💼',
  theater: '🎭',
  other: '📅'
};

const eventTypeColors = {
  concert: 'bg-purple-100 text-purple-800',
  sports: 'bg-blue-100 text-blue-800',
  festival: 'bg-pink-100 text-pink-800',
  convention: 'bg-teal-100 text-teal-800',
  conference: 'bg-indigo-100 text-indigo-800',
  theater: 'bg-amber-100 text-amber-800',
  other: 'bg-gray-100 text-gray-800'
};

export function EventCard({ event, compact = false }) {
  const {
    title,
    event_type,
    start_date,
    start_time,
    venue_name,
    expected_attendance,
    demand_impact_score,
    ticket_price_min,
    ticket_price_max,
    image_url
  } = event;

  const eventDate = new Date(start_date);
  const formattedDate = format(eventDate, 'EEE, MMM d');
  const formattedTime = start_time ? format(new Date(`2000-01-01T${start_time}`), 'h:mm a') : null;

  const icon = eventTypeIcons[event_type] || eventTypeIcons.other;
  const typeColorClass = eventTypeColors[event_type] || eventTypeColors.other;

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
        <span className="text-xl">{icon}</span>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 truncate">{title}</h4>
          <p className="text-xs text-gray-500">{venue_name || 'TBA'}</p>
        </div>
        {demand_impact_score && (
          <div className="text-xs font-medium text-gray-700">
            Impact: {demand_impact_score}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {image_url && (
        <div className="h-32 bg-gray-200">
          <img
            src={image_url}
            alt={title}
            className="w-full h-full object-cover"
            onError={(e) => e.target.style.display = 'none'}
          />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${typeColorClass}`}>
                {icon} {event_type}
              </span>
            </div>
            <h3 className="text-base font-semibold text-gray-900 line-clamp-2">
              {title}
            </h3>
          </div>
          {demand_impact_score && (
            <div className="flex-shrink-0">
              <div className="text-center">
                <div className="text-lg font-bold text-indigo-600">{demand_impact_score}</div>
                <div className="text-xs text-gray-500">Impact</div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-3 space-y-1.5 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{formattedDate}</span>
            {formattedTime && <span>at {formattedTime}</span>}
          </div>

          {venue_name && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate">{venue_name}</span>
            </div>
          )}

          {expected_attendance && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>{expected_attendance.toLocaleString()} expected</span>
            </div>
          )}

          {(ticket_price_min || ticket_price_max) && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                ${ticket_price_min}
                {ticket_price_max && ticket_price_max !== ticket_price_min && ` - $${ticket_price_max}`}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EventCard;

import React, { useEffect, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isToday, isSameDay } from 'date-fns';
import useStore from '../../store/useStore';
import CalendarDay from './CalendarDay';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarView() {
  const {
    currentMonth,
    currentYear,
    setCurrentMonth,
    calendarData,
    dailyPricing,
    selectedDate,
    setSelectedDate,
    fetchCalendarData,
    fetchDailyPricing,
    isLoading
  } = useStore();

  const currentDate = useMemo(
    () => new Date(currentYear, currentMonth - 1, 1),
    [currentYear, currentMonth]
  );

  useEffect(() => {
    fetchCalendarData(currentYear, currentMonth);

    const startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(currentDate), 'yyyy-MM-dd');
    fetchDailyPricing(startDate, endDate);
  }, [currentYear, currentMonth]);

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    // Create lookup maps for quick access
    const eventsByDate = {};
    calendarData.forEach(day => {
      const dateKey = day.start_date.split('T')[0];
      eventsByDate[dateKey] = day;
    });

    const pricingByDate = {};
    dailyPricing.forEach(day => {
      const dateKey = typeof day.date === 'string' ? day.date.split('T')[0] : day.date.toISOString().split('T')[0];
      pricingByDate[dateKey] = day;
    });

    const days = [];
    let day = startDate;

    while (day <= endDate) {
      const dateStr = format(day, 'yyyy-MM-dd');
      const eventData = eventsByDate[dateStr];
      const pricingData = pricingByDate[dateStr];

      days.push({
        date: dateStr,
        dayNumber: format(day, 'd'),
        isCurrentMonth: isSameMonth(day, currentDate),
        isToday: isToday(day),
        isSelected: selectedDate && isSameDay(new Date(selectedDate), day),
        eventCount: eventData?.event_count || 0,
        events: eventData?.events || [],
        demandLevel: pricingData?.demand_level,
        demandScore: pricingData?.total_demand_score,
        suggestedPrice: pricingData?.suggested_min_price
          ? Math.round((pricingData.suggested_min_price + pricingData.suggested_max_price) / 2)
          : null
      });

      day = addDays(day, 1);
    }

    return days;
  }, [currentDate, calendarData, dailyPricing, selectedDate]);

  const goToPreviousMonth = () => {
    const newMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const newYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    setCurrentMonth(newMonth, newYear);
  };

  const goToNextMonth = () => {
    const newMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const newYear = currentMonth === 12 ? currentYear + 1 : currentYear;
    setCurrentMonth(newMonth, newYear);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today.getMonth() + 1, today.getFullYear());
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Calendar Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Today
            </button>
            <div className="flex items-center">
              <button
                onClick={goToPreviousMonth}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={goToNextMonth}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {WEEKDAYS.map(day => (
          <div
            key={day}
            className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      {isLoading ? (
        <div className="h-96 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => (
            <CalendarDay
              key={day.date}
              {...day}
              onClick={setSelectedDate}
            />
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center gap-6 text-xs">
          <span className="text-gray-500">Demand Level:</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Low</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>Moderate</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span>High</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Very High</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-700 rounded-full"></div>
            <span>Extreme</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CalendarView;

import { useEffect } from 'react';
import useStore from '../store/useStore';

export function useEvents(filters = {}) {
  const { events, isLoading, error, fetchEvents } = useStore();

  useEffect(() => {
    fetchEvents(filters);
  }, [JSON.stringify(filters)]);

  return { events, isLoading, error };
}

export function useCalendarEvents(year, month) {
  const { calendarData, isLoading, error, fetchCalendarData } = useStore();

  useEffect(() => {
    if (year && month) {
      fetchCalendarData(year, month);
    }
  }, [year, month]);

  return { calendarData, isLoading, error };
}

export default useEvents;

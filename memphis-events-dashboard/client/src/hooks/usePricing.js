import { useEffect } from 'react';
import useStore from '../store/useStore';

export function useDailyPricing(startDate, endDate) {
  const { dailyPricing, isLoading, error, fetchDailyPricing } = useStore();

  useEffect(() => {
    if (startDate && endDate) {
      fetchDailyPricing(startDate, endDate);
    }
  }, [startDate, endDate]);

  return { dailyPricing, isLoading, error };
}

export function useDateDetails(date) {
  const { selectedDateDetails, isLoading, error, fetchDateDetails } = useStore();

  useEffect(() => {
    if (date) {
      fetchDateDetails(date);
    }
  }, [date]);

  return { details: selectedDateDetails, isLoading, error };
}

export function useSettings() {
  const { settings, fetchSettings, updateSettings } = useStore();

  useEffect(() => {
    fetchSettings();
  }, []);

  return { settings, updateSettings };
}

export default useDailyPricing;

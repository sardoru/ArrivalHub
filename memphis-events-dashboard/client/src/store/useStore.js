import { create } from 'zustand';
import { eventsApi, pricingApi, syncApi } from '../services/api';

const useStore = create((set, get) => ({
  // State
  events: [],
  calendarData: [],
  dailyPricing: [],
  selectedDate: null,
  selectedDateDetails: null,
  settings: null,
  syncStatus: null,
  isLoading: false,
  error: null,
  currentMonth: new Date().getMonth() + 1,
  currentYear: new Date().getFullYear(),

  // Actions
  setSelectedDate: (date) => set({ selectedDate: date }),

  setCurrentMonth: (month, year) => set({ currentMonth: month, currentYear: year }),

  fetchEvents: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await eventsApi.getAll(params);
      set({ events: response.data.data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchCalendarData: async (year, month) => {
    set({ isLoading: true, error: null });
    try {
      const response = await eventsApi.getCalendar(year, month);
      set({ calendarData: response.data.data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchDailyPricing: async (startDate, endDate) => {
    set({ isLoading: true, error: null });
    try {
      const response = await pricingApi.getDaily(startDate, endDate);
      set({ dailyPricing: response.data.data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchDateDetails: async (date) => {
    set({ isLoading: true, error: null });
    try {
      const response = await pricingApi.getSuggestion(date);
      set({ selectedDateDetails: response.data.data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchSettings: async () => {
    try {
      const response = await pricingApi.getSettings();
      set({ settings: response.data.data });
    } catch (error) {
      set({ error: error.message });
    }
  },

  updateSettings: async (newSettings) => {
    try {
      const response = await pricingApi.updateSettings(newSettings);
      set({ settings: response.data.data });
      // Refresh pricing data
      const { currentYear, currentMonth } = get();
      const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
      const endDate = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];
      get().fetchDailyPricing(startDate, endDate);
    } catch (error) {
      set({ error: error.message });
    }
  },

  fetchSyncStatus: async () => {
    try {
      const response = await syncApi.getStatus();
      set({ syncStatus: response.data.data });
    } catch (error) {
      set({ error: error.message });
    }
  },

  triggerSync: async (options = {}) => {
    try {
      await syncApi.trigger(options);
      // Refresh sync status
      setTimeout(() => get().fetchSyncStatus(), 1000);
    } catch (error) {
      set({ error: error.message });
    }
  },

  clearError: () => set({ error: null })
}));

export default useStore;

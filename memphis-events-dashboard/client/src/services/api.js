import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Events API
export const eventsApi = {
  getAll: (params = {}) => api.get('/events', { params }),
  getById: (id) => api.get(`/events/${id}`),
  getCalendar: (year, month) => api.get('/events/calendar', { params: { year, month } })
};

// Pricing API
export const pricingApi = {
  getDaily: (startDate, endDate) => api.get('/pricing/daily', { params: { startDate, endDate } }),
  getSuggestion: (date) => api.get(`/pricing/suggestion/${date}`),
  getSettings: () => api.get('/pricing/settings'),
  updateSettings: (settings) => api.put('/pricing/settings', settings),
  getMonthSummary: (year, month) => api.get('/pricing/summary', { params: { year, month } })
};

// Sync API
export const syncApi = {
  trigger: (options = {}) => api.post('/sync/trigger', options),
  triggerSource: (source) => api.post(`/sync/trigger/${source}`),
  getStatus: () => api.get('/sync/status')
};

export default api;

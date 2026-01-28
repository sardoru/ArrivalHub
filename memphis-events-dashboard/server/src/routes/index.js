import { Router } from 'express';
import {
  getEvents,
  getEventById,
  getCalendarEvents
} from '../controllers/eventsController.js';
import {
  getDailyPricingHandler,
  getSuggestionHandler,
  updateSettingsHandler,
  getSettingsHandler,
  getMonthSummaryHandler
} from '../controllers/pricingController.js';
import {
  triggerSyncHandler,
  triggerSourceSyncHandler,
  getSyncStatusHandler
} from '../controllers/syncController.js';

const router = Router();

// Events routes
router.get('/events', getEvents);
router.get('/events/calendar', getCalendarEvents);
router.get('/events/:id', getEventById);

// Pricing routes
router.get('/pricing/daily', getDailyPricingHandler);
router.get('/pricing/suggestion/:date', getSuggestionHandler);
router.get('/pricing/settings', getSettingsHandler);
router.put('/pricing/settings', updateSettingsHandler);
router.get('/pricing/summary', getMonthSummaryHandler);

// Sync routes
router.post('/sync/trigger', triggerSyncHandler);
router.post('/sync/trigger/:source', triggerSourceSyncHandler);
router.get('/sync/status', getSyncStatusHandler);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;

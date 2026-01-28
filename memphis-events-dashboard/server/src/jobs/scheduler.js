import cron from 'node-cron';
import { syncAllSources, syncSource } from '../services/eventAggregator.js';
import { calculateAndStoreDemand } from '../services/pricingEngine.js';

/**
 * Initialize all scheduled jobs
 */
export function initializeScheduler() {
  console.log('Initializing scheduled jobs...');

  // Ticketmaster & SeatGeek - Every 4 hours
  cron.schedule('0 */4 * * *', async () => {
    console.log('Running scheduled Ticketmaster sync...');
    try {
      await syncSource('ticketmaster', { syncType: 'scheduled' });
    } catch (error) {
      console.error('Scheduled Ticketmaster sync failed:', error.message);
    }
  });

  cron.schedule('15 */4 * * *', async () => {
    console.log('Running scheduled SeatGeek sync...');
    try {
      await syncSource('seatgeek', { syncType: 'scheduled' });
    } catch (error) {
      console.error('Scheduled SeatGeek sync failed:', error.message);
    }
  });

  // PredictHQ - Every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    console.log('Running scheduled PredictHQ sync...');
    try {
      await syncSource('predicthq', { syncType: 'scheduled' });
    } catch (error) {
      console.error('Scheduled PredictHQ sync failed:', error.message);
    }
  });

  // Full sync all sources - Weekly on Sunday at 2 AM
  cron.schedule('0 2 * * 0', async () => {
    console.log('Running weekly full sync...');
    try {
      await syncAllSources({ syncType: 'full' });
    } catch (error) {
      console.error('Weekly full sync failed:', error.message);
    }
  });

  // Recalculate demand scores - Every hour
  cron.schedule('30 * * * *', async () => {
    console.log('Recalculating demand scores...');
    try {
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3);

      await calculateAndStoreDemand(startDate, endDate.toISOString().split('T')[0]);
      console.log('Demand recalculation completed');
    } catch (error) {
      console.error('Demand recalculation failed:', error.message);
    }
  });

  console.log('Scheduled jobs initialized');
}

export default { initializeScheduler };

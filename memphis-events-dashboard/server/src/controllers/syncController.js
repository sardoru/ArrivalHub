import { syncAllSources, syncSource } from '../services/eventAggregator.js';
import { calculateAndStoreDemand } from '../services/pricingEngine.js';
import SyncLog from '../models/SyncLog.js';
import { mockSyncLogs } from '../data/mockData.js';

const ALL_SOURCES = ['ticketmaster', 'predicthq', 'seatgeek', 'downtown_memphis', 'memphis_tourism'];

export async function triggerSyncHandler(req, res) {
  try {
    const { sources, startDate, endDate } = req.body;

    // Start sync in background
    const syncPromise = syncAllSources({
      sources: sources || ALL_SOURCES,
      startDate,
      endDate,
      syncType: 'manual'
    });

    // Don't wait for completion
    syncPromise.then(async (result) => {
      console.log('Sync completed:', result);

      // Recalculate demand after sync
      const start = startDate || new Date().toISOString().split('T')[0];
      const end = endDate || (() => {
        const d = new Date();
        d.setMonth(d.getMonth() + 3);
        return d.toISOString().split('T')[0];
      })();

      await calculateAndStoreDemand(start, end);
      console.log('Demand recalculation completed');
    }).catch(err => {
      console.error('Sync failed:', err);
    });

    res.json({
      success: true,
      message: 'Sync started',
      sources: sources || ALL_SOURCES
    });
  } catch (error) {
    console.error('Error triggering sync:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger sync'
    });
  }
}

export async function triggerSourceSyncHandler(req, res) {
  try {
    const { source } = req.params;
    const { startDate, endDate } = req.body;

    if (!ALL_SOURCES.includes(source)) {
      return res.status(400).json({
        success: false,
        error: `Invalid source. Must be one of: ${ALL_SOURCES.join(', ')}`
      });
    }

    // Start sync in background
    syncSource(source, { startDate, endDate, syncType: 'manual' })
      .then(result => console.log(`${source} sync completed:`, result))
      .catch(err => console.error(`${source} sync failed:`, err));

    res.json({
      success: true,
      message: `${source} sync started`
    });
  } catch (error) {
    console.error('Error triggering source sync:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger sync'
    });
  }
}

export async function getSyncStatusHandler(req, res) {
  try {
    let running, recent;
    
    try {
      running = await SyncLog.getRunning();
      recent = await SyncLog.getLatest(20);
    } catch (dbError) {
      console.log('Database unavailable, using mock sync status');
      running = [];
      recent = mockSyncLogs;
    }

    res.json({
      success: true,
      data: {
        running,
        recent
      }
    });
  } catch (error) {
    console.error('Error fetching sync status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sync status'
    });
  }
}

export default {
  triggerSyncHandler,
  triggerSourceSyncHandler,
  getSyncStatusHandler
};

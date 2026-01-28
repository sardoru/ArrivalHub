/**
 * Manual sync script - can be run from command line
 * Usage: node src/jobs/syncAll.js
 */

import dotenv from 'dotenv';
dotenv.config();

import { syncAllSources } from '../services/eventAggregator.js';
import { calculateAndStoreDemand } from '../services/pricingEngine.js';

async function runFullSync() {
  console.log('Starting full sync...');
  console.log('='.repeat(50));

  const startDate = new Date().toISOString().split('T')[0];
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 3);
  const endDateStr = endDate.toISOString().split('T')[0];

  try {
    // Sync all sources
    const syncResult = await syncAllSources({
      startDate,
      endDate: endDateStr,
      syncType: 'full'
    });

    console.log('\nSync completed:');
    console.log(JSON.stringify(syncResult, null, 2));

    // Recalculate demand
    console.log('\nRecalculating demand scores...');
    await calculateAndStoreDemand(startDate, endDateStr);
    console.log('Demand calculation completed');

    console.log('\n' + '='.repeat(50));
    console.log('Full sync completed successfully!');
  } catch (error) {
    console.error('Sync failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

runFullSync();

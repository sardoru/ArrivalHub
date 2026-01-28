/**
 * Event Aggregator Service
 * Fetches events from all sources, deduplicates, and stores in database.
 */

import { fetchAllMemphisEvents as fetchTicketmaster } from './sources/ticketmaster.js';
import { fetchAllMemphisEvents as fetchPredictHQ } from './sources/predicthq.js';
import { fetchAllMemphisEvents as fetchSeatGeek } from './sources/seatgeek.js';
import { scrapeDowntownMemphis } from '../scrapers/downtownMemphis.js';
import { scrapeMemphisTourism } from '../scrapers/memphisTourism.js';
import { deduplicateEvents } from './deduplication.js';
import { calculateEventDemandScore } from './demandCalculator.js';
import Event from '../models/Event.js';
import Venue from '../models/Venue.js';
import SyncLog from '../models/SyncLog.js';

/**
 * Fetch events from a single source
 */
async function fetchFromSource(sourceName, fetcher, options = {}) {
  const syncLog = await SyncLog.create(sourceName, options.syncType || 'scheduled');

  try {
    console.log(`Fetching events from ${sourceName}...`);
    const events = await fetcher(options);

    await SyncLog.complete(syncLog.id, {
      eventsFetched: events.length
    });

    console.log(`Fetched ${events.length} events from ${sourceName}`);
    return { source: sourceName, events, syncLogId: syncLog.id };
  } catch (error) {
    console.error(`Error fetching from ${sourceName}:`, error.message);
    await SyncLog.fail(syncLog.id, error.message);
    return { source: sourceName, events: [], error: error.message };
  }
}

/**
 * Store events in database
 */
async function storeEvents(events) {
  const stats = {
    added: 0,
    updated: 0,
    errors: 0
  };

  for (const event of events) {
    try {
      // Handle venue first
      let venueId = null;
      if (event.venue) {
        const venue = await Venue.findOrCreate(event.venue);
        venueId = venue.id;
      }

      // Calculate demand score if not already set
      const demandScore = event.demandImpactScore || calculateEventDemandScore(event);

      // Prepare event data
      const eventData = {
        title: event.title,
        normalizedTitle: event.normalizedTitle,
        description: event.description,
        eventType: event.eventType,
        startDate: event.startDate,
        startTime: event.startTime,
        endDate: event.endDate,
        endTime: event.endTime,
        venueId,
        expectedAttendance: event.expectedAttendance,
        demandImpactScore: demandScore,
        status: event.status,
        confidenceScore: event.confidenceScore,
        ticketPriceMin: event.ticketPriceMin,
        ticketPriceMax: event.ticketPriceMax,
        imageUrl: event.imageUrl,
        eventUrl: event.eventUrl
      };

      // Handle sources
      if (event.sources && event.sources.length > 0) {
        // Multiple sources (deduplicated event)
        const createdEvent = await Event.create(eventData);

        for (const source of event.sources) {
          await Event.upsertWithSource(eventData, source);
        }
        stats.added++;
      } else if (event.source) {
        // Single source
        await Event.upsertWithSource(eventData, event.source);
        stats.added++;
      } else {
        await Event.create(eventData);
        stats.added++;
      }
    } catch (error) {
      console.error('Error storing event:', error.message, event.title);
      stats.errors++;
    }
  }

  return stats;
}

/**
 * Sync events from all sources
 */
export async function syncAllSources(options = {}) {
  const {
    startDate = new Date().toISOString().split('T')[0],
    endDate = null,
    sources = ['ticketmaster', 'predicthq', 'seatgeek', 'downtown_memphis', 'memphis_tourism']
  } = options;

  const fetchOptions = { startDate, endDate };

  // Calculate end date if not provided (3 months ahead)
  if (!endDate) {
    const end = new Date();
    end.setMonth(end.getMonth() + 3);
    fetchOptions.endDate = end.toISOString().split('T')[0];
  }

  console.log(`Starting sync from ${fetchOptions.startDate} to ${fetchOptions.endDate}`);

  // Fetch from all enabled sources in parallel
  const fetchPromises = [];

  if (sources.includes('ticketmaster')) {
    fetchPromises.push(fetchFromSource('ticketmaster', fetchTicketmaster, fetchOptions));
  }
  if (sources.includes('predicthq')) {
    fetchPromises.push(fetchFromSource('predicthq', fetchPredictHQ, fetchOptions));
  }
  if (sources.includes('seatgeek')) {
    fetchPromises.push(fetchFromSource('seatgeek', fetchSeatGeek, fetchOptions));
  }
  if (sources.includes('downtown_memphis')) {
    fetchPromises.push(fetchFromSource('downtown_memphis', scrapeDowntownMemphis, fetchOptions));
  }
  if (sources.includes('memphis_tourism')) {
    fetchPromises.push(fetchFromSource('memphis_tourism', scrapeMemphisTourism, fetchOptions));
  }

  const results = await Promise.all(fetchPromises);

  // Combine all events
  const allEvents = results.flatMap(r => r.events);
  console.log(`Total events fetched: ${allEvents.length}`);

  // Deduplicate
  const { events: dedupedEvents, stats: dedupStats } = deduplicateEvents(allEvents);
  console.log(`After deduplication: ${dedupedEvents.length} unique events`);

  // Store in database
  const storeStats = await storeEvents(dedupedEvents);

  const summary = {
    sources: results.map(r => ({
      name: r.source,
      fetched: r.events.length,
      error: r.error
    })),
    totalFetched: allEvents.length,
    duplicatesRemoved: dedupStats.duplicates,
    uniqueEvents: dedupedEvents.length,
    stored: storeStats
  };

  console.log('Sync completed:', summary);
  return summary;
}

/**
 * Sync events from a single source
 */
export async function syncSource(sourceName, options = {}) {
  const fetchers = {
    ticketmaster: fetchTicketmaster,
    predicthq: fetchPredictHQ,
    seatgeek: fetchSeatGeek,
    downtown_memphis: scrapeDowntownMemphis,
    memphis_tourism: scrapeMemphisTourism
  };

  const fetcher = fetchers[sourceName];
  if (!fetcher) {
    throw new Error(`Unknown source: ${sourceName}`);
  }

  const result = await fetchFromSource(sourceName, fetcher, options);

  if (result.error) {
    throw new Error(result.error);
  }

  // Deduplicate (in case of existing events)
  const { events: dedupedEvents, stats: dedupStats } = deduplicateEvents(result.events);

  // Store
  const storeStats = await storeEvents(dedupedEvents);

  return {
    source: sourceName,
    fetched: result.events.length,
    duplicatesRemoved: dedupStats.duplicates,
    stored: storeStats
  };
}

export default {
  syncAllSources,
  syncSource
};

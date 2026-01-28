/**
 * Event Deduplication Engine
 * Merges events from multiple sources, identifying duplicates using
 * blocking + similarity scoring approach.
 */

// Source priority (higher = preferred for master record)
const SOURCE_PRIORITY = {
  'predicthq': 4,
  'ticketmaster': 3,
  'seatgeek': 2,
  'memphis_travel': 1,
  'downtown_memphis': 1
};

/**
 * Normalize text for comparison
 */
function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;

  if (m === 0) return n;
  if (n === 0) return m;

  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[m][n];
}

/**
 * Calculate title similarity (0-1)
 */
function titleSimilarity(title1, title2) {
  const norm1 = normalizeText(title1);
  const norm2 = normalizeText(title2);

  if (norm1 === norm2) return 1;
  if (!norm1 || !norm2) return 0;

  const maxLen = Math.max(norm1.length, norm2.length);
  const distance = levenshteinDistance(norm1, norm2);

  return 1 - (distance / maxLen);
}

/**
 * Calculate date similarity (0-1)
 */
function dateSimilarity(date1, date2) {
  if (!date1 || !date2) return 0;
  if (date1 === date2) return 1;

  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffDays = Math.abs((d1 - d2) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 1;
  if (diffDays === 1) return 0.8;
  if (diffDays <= 3) return 0.5;
  return 0;
}

/**
 * Calculate venue similarity (0-1)
 */
function venueSimilarity(venue1, venue2) {
  if (!venue1 || !venue2) return 0.5; // Neutral if missing

  // Compare by coordinates if available
  if (venue1.latitude && venue1.longitude && venue2.latitude && venue2.longitude) {
    const latDiff = Math.abs(venue1.latitude - venue2.latitude);
    const lngDiff = Math.abs(venue1.longitude - venue2.longitude);

    // Within ~0.5 miles
    if (latDiff < 0.01 && lngDiff < 0.01) return 1;
    // Within ~2 miles
    if (latDiff < 0.03 && lngDiff < 0.03) return 0.8;
    return 0.3;
  }

  // Compare by name
  if (venue1.name && venue2.name) {
    return titleSimilarity(venue1.name, venue2.name);
  }

  return 0.5;
}

/**
 * Calculate event type similarity (0-1)
 */
function typeSimilarity(type1, type2) {
  if (!type1 || !type2) return 0.5;
  if (type1 === type2) return 1;

  // Similar types
  const similarTypes = {
    'concert': ['festival'],
    'festival': ['concert'],
    'conference': ['convention'],
    'convention': ['conference']
  };

  if (similarTypes[type1]?.includes(type2)) return 0.7;
  return 0.3;
}

/**
 * Calculate overall similarity between two events
 * Returns value 0-1
 */
function calculateSimilarity(event1, event2) {
  const weights = {
    title: 0.40,
    date: 0.25,
    venue: 0.25,
    type: 0.10
  };

  const scores = {
    title: titleSimilarity(event1.title, event2.title),
    date: dateSimilarity(event1.startDate, event2.startDate),
    venue: venueSimilarity(event1.venue, event2.venue),
    type: typeSimilarity(event1.eventType, event2.eventType)
  };

  return Object.entries(weights).reduce(
    (total, [key, weight]) => total + scores[key] * weight,
    0
  );
}

/**
 * Create blocking key for an event
 * Used to reduce comparison space
 */
function createBlockingKey(event) {
  const dateKey = event.startDate || 'nodate';
  const titlePrefix = normalizeText(event.title).substring(0, 10);
  return `${dateKey}:${titlePrefix}`;
}

/**
 * Group events into blocks for comparison
 */
function blockEvents(events) {
  const blocks = new Map();

  for (const event of events) {
    const key = createBlockingKey(event);

    // Add to primary block
    if (!blocks.has(key)) {
      blocks.set(key, []);
    }
    blocks.get(key).push(event);

    // Also add to adjacent date blocks (for events that might span days)
    if (event.startDate) {
      const date = new Date(event.startDate);
      const prevDate = new Date(date);
      prevDate.setDate(prevDate.getDate() - 1);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const titlePrefix = normalizeText(event.title).substring(0, 10);
      const prevKey = `${prevDate.toISOString().split('T')[0]}:${titlePrefix}`;
      const nextKey = `${nextDate.toISOString().split('T')[0]}:${titlePrefix}`;

      for (const adjKey of [prevKey, nextKey]) {
        if (!blocks.has(adjKey)) {
          blocks.set(adjKey, []);
        }
        // Only add reference, don't duplicate
        if (!blocks.get(adjKey).includes(event)) {
          blocks.get(adjKey).push(event);
        }
      }
    }
  }

  return blocks;
}

/**
 * Find clusters of similar events
 */
function findClusters(events, threshold = 0.75) {
  const blocks = blockEvents(events);
  const clusters = [];
  const processed = new Set();

  for (const blockEvents of blocks.values()) {
    for (let i = 0; i < blockEvents.length; i++) {
      const event1 = blockEvents[i];
      const eventId1 = event1.source?.sourceEventId || JSON.stringify(event1);

      if (processed.has(eventId1)) continue;

      const cluster = [event1];
      processed.add(eventId1);

      for (let j = i + 1; j < blockEvents.length; j++) {
        const event2 = blockEvents[j];
        const eventId2 = event2.source?.sourceEventId || JSON.stringify(event2);

        if (processed.has(eventId2)) continue;

        const similarity = calculateSimilarity(event1, event2);

        if (similarity >= threshold) {
          cluster.push(event2);
          processed.add(eventId2);
        }
      }

      if (cluster.length > 0) {
        clusters.push(cluster);
      }
    }
  }

  return clusters;
}

/**
 * Merge a cluster of events into a master record
 */
function mergeCluster(cluster) {
  if (cluster.length === 0) return null;
  if (cluster.length === 1) return cluster[0];

  // Sort by source priority (highest first)
  const sorted = [...cluster].sort((a, b) => {
    const priorityA = SOURCE_PRIORITY[a.source?.sourceName] || 0;
    const priorityB = SOURCE_PRIORITY[b.source?.sourceName] || 0;
    return priorityB - priorityA;
  });

  // Start with highest priority event as base
  const master = { ...sorted[0] };
  master.sources = cluster.map(e => e.source).filter(Boolean);

  // Merge in data from other sources (fill in blanks)
  for (let i = 1; i < sorted.length; i++) {
    const event = sorted[i];

    // Fill in missing fields
    if (!master.description && event.description) {
      master.description = event.description;
    }
    if (!master.expectedAttendance && event.expectedAttendance) {
      master.expectedAttendance = event.expectedAttendance;
    }
    if (!master.ticketPriceMin && event.ticketPriceMin) {
      master.ticketPriceMin = event.ticketPriceMin;
    }
    if (!master.ticketPriceMax && event.ticketPriceMax) {
      master.ticketPriceMax = event.ticketPriceMax;
    }
    if (!master.imageUrl && event.imageUrl) {
      master.imageUrl = event.imageUrl;
    }
    if (!master.eventUrl && event.eventUrl) {
      master.eventUrl = event.eventUrl;
    }
    if (!master.venue && event.venue) {
      master.venue = event.venue;
    }

    // Take highest attendance estimate
    if (event.expectedAttendance && event.expectedAttendance > (master.expectedAttendance || 0)) {
      master.expectedAttendance = event.expectedAttendance;
    }

    // PredictHQ demand metrics are valuable
    if (event.demandMetrics) {
      master.demandMetrics = { ...master.demandMetrics, ...event.demandMetrics };
    }

    // Take highest confidence score
    if (event.confidenceScore > (master.confidenceScore || 0)) {
      master.confidenceScore = event.confidenceScore;
    }
  }

  return master;
}

/**
 * Main deduplication function
 * Takes events from multiple sources and returns deduplicated list
 */
export function deduplicateEvents(events, options = {}) {
  const { threshold = 0.75 } = options;

  if (!events || events.length === 0) {
    return { events: [], stats: { total: 0, unique: 0, duplicates: 0 } };
  }

  const clusters = findClusters(events, threshold);
  const deduplicatedEvents = clusters.map(mergeCluster).filter(Boolean);

  return {
    events: deduplicatedEvents,
    stats: {
      total: events.length,
      unique: deduplicatedEvents.length,
      duplicates: events.length - deduplicatedEvents.length
    }
  };
}

export default {
  deduplicateEvents,
  calculateSimilarity,
  normalizeText
};

import axios from 'axios';

const BASE_URL = 'https://api.seatgeek.com/2';
const MEMPHIS_COORDS = { lat: 35.1495, lng: -90.0490 };

function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function mapEventType(type, taxonomies) {
  const typeMap = {
    'concert': 'concert',
    'music_festival': 'festival',
    'sports': 'sports',
    'nfl': 'sports',
    'nba': 'sports',
    'mlb': 'sports',
    'nhl': 'sports',
    'ncaa_football': 'sports',
    'ncaa_basketball': 'sports',
    'theater': 'theater',
    'broadway_tickets_national': 'theater',
    'comedy': 'theater',
    'family': 'other'
  };

  if (typeMap[type]) return typeMap[type];

  // Check taxonomies
  if (taxonomies) {
    for (const tax of taxonomies) {
      if (typeMap[tax.name]) return typeMap[tax.name];
    }
  }

  return 'other';
}

function transformEvent(rawEvent) {
  const venue = rawEvent.venue;
  const stats = rawEvent.stats || {};

  return {
    title: rawEvent.title,
    normalizedTitle: normalizeTitle(rawEvent.title),
    description: rawEvent.description || null,
    eventType: mapEventType(rawEvent.type, rawEvent.taxonomies),
    startDate: rawEvent.datetime_local?.split('T')[0],
    startTime: rawEvent.datetime_local?.split('T')[1]?.substring(0, 8) || null,
    endDate: null,
    endTime: null,
    expectedAttendance: venue?.capacity || null,
    ticketPriceMin: stats.lowest_price || null,
    ticketPriceMax: stats.highest_price || null,
    imageUrl: rawEvent.performers?.[0]?.image || null,
    eventUrl: rawEvent.url,
    status: 'active',
    confidenceScore: 0.90,
    venue: venue ? {
      name: venue.name,
      address: [venue.address, venue.city, venue.state]
        .filter(Boolean).join(', '),
      latitude: venue.location?.lat || null,
      longitude: venue.location?.lon || null,
      capacity: venue.capacity || null
    } : null,
    source: {
      sourceName: 'seatgeek',
      sourceEventId: String(rawEvent.id),
      rawData: rawEvent
    }
  };
}

export async function fetchMemphisEvents(options = {}) {
  const {
    startDate = new Date().toISOString().split('T')[0],
    endDate = null,
    page = 1,
    perPage = 100
  } = options;

  const clientId = process.env.SEATGEEK_CLIENT_ID;
  const clientSecret = process.env.SEATGEEK_CLIENT_SECRET;

  if (!clientId) {
    throw new Error('SEATGEEK_CLIENT_ID is not configured');
  }

  const params = {
    client_id: clientId,
    lat: MEMPHIS_COORDS.lat,
    lon: MEMPHIS_COORDS.lng,
    range: '50mi',
    'datetime_local.gte': startDate,
    per_page: perPage,
    page: page,
    sort: 'datetime_local.asc'
  };

  if (clientSecret) {
    params.client_secret = clientSecret;
  }

  if (endDate) {
    params['datetime_local.lte'] = endDate;
  }

  try {
    const response = await axios.get(`${BASE_URL}/events`, { params });
    const data = response.data;

    return {
      events: (data.events || []).map(transformEvent),
      pagination: {
        page: page,
        perPage: perPage,
        total: data.meta?.total || 0,
        hasMore: data.meta?.page * data.meta?.per_page < data.meta?.total
      }
    };
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error('Invalid SeatGeek credentials');
    }
    if (error.response?.status === 429) {
      throw new Error('SeatGeek rate limit exceeded');
    }
    throw new Error(`SeatGeek API error: ${error.message}`);
  }
}

export async function fetchAllMemphisEvents(options = {}) {
  const allEvents = [];
  let page = 1;
  let hasMore = true;
  const maxPages = options.maxPages || 10;

  while (hasMore && page <= maxPages) {
    const result = await fetchMemphisEvents({ ...options, page });
    allEvents.push(...result.events);

    hasMore = result.pagination.hasMore;
    page++;

    // Rate limiting
    if (hasMore) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  return allEvents;
}

export default {
  fetchMemphisEvents,
  fetchAllMemphisEvents
};

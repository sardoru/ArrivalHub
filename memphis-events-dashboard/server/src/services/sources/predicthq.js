import axios from 'axios';

const BASE_URL = 'https://api.predicthq.com/v1';
const MEMPHIS_COORDS = { lat: 35.1495, lng: -90.0490 };

function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function mapCategory(category) {
  const categoryMap = {
    'concerts': 'concert',
    'festivals': 'festival',
    'sports': 'sports',
    'conferences': 'conference',
    'expos': 'convention',
    'performing-arts': 'theater',
    'community': 'other',
    'academic': 'conference'
  };
  return categoryMap[category] || 'other';
}

function transformEvent(rawEvent) {
  const location = rawEvent.location || [];

  return {
    title: rawEvent.title,
    normalizedTitle: normalizeTitle(rawEvent.title),
    description: rawEvent.description || null,
    eventType: mapCategory(rawEvent.category),
    startDate: rawEvent.start?.split('T')[0],
    startTime: rawEvent.start?.split('T')[1]?.substring(0, 8) || null,
    endDate: rawEvent.end?.split('T')[0] || null,
    endTime: rawEvent.end?.split('T')[1]?.substring(0, 8) || null,
    expectedAttendance: rawEvent.phq_attendance || null,
    ticketPriceMin: null,
    ticketPriceMax: null,
    imageUrl: null,
    eventUrl: null,
    status: rawEvent.state === 'deleted' ? 'cancelled' : 'active',
    confidenceScore: 0.98, // PredictHQ has very reliable data
    venue: rawEvent.entities?.find(e => e.type === 'venue') ? {
      name: rawEvent.entities.find(e => e.type === 'venue').name,
      address: rawEvent.formatted_address || null,
      latitude: location[1] || null,
      longitude: location[0] || null,
      capacity: null
    } : location.length === 2 ? {
      name: rawEvent.formatted_address || 'Memphis Area',
      address: rawEvent.formatted_address || null,
      latitude: location[1],
      longitude: location[0],
      capacity: null
    } : null,
    demandMetrics: {
      rank: rawEvent.rank,
      localRank: rawEvent.local_rank,
      aviationRank: rawEvent.aviation_rank,
      phqAttendance: rawEvent.phq_attendance
    },
    source: {
      sourceName: 'predicthq',
      sourceEventId: rawEvent.id,
      rawData: rawEvent
    }
  };
}

export async function fetchMemphisEvents(options = {}) {
  const {
    startDate = new Date().toISOString().split('T')[0],
    endDate = null,
    offset = 0,
    limit = 100
  } = options;

  const token = process.env.PREDICTHQ_API_TOKEN;
  if (!token) {
    throw new Error('PREDICTHQ_API_TOKEN is not configured');
  }

  const params = {
    'location_around.origin': `${MEMPHIS_COORDS.lat},${MEMPHIS_COORDS.lng}`,
    'location_around.offset': '50mi',
    'active.gte': startDate,
    'category': 'concerts,festivals,sports,conferences,expos,performing-arts,community',
    'state': 'active,predicted',
    'sort': 'start',
    'limit': limit,
    'offset': offset
  };

  if (endDate) {
    params['active.lte'] = endDate;
  }

  try {
    const response = await axios.get(`${BASE_URL}/events/`, {
      params,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    const data = response.data;

    return {
      events: (data.results || []).map(transformEvent),
      pagination: {
        offset: offset,
        limit: limit,
        count: data.count || 0,
        hasMore: data.next !== null
      }
    };
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error('Invalid PredictHQ API token');
    }
    if (error.response?.status === 429) {
      throw new Error('PredictHQ rate limit exceeded');
    }
    throw new Error(`PredictHQ API error: ${error.message}`);
  }
}

export async function fetchAllMemphisEvents(options = {}) {
  const allEvents = [];
  let offset = 0;
  let hasMore = true;
  const limit = 100;
  const maxIterations = options.maxPages || 10;
  let iterations = 0;

  while (hasMore && iterations < maxIterations) {
    const result = await fetchMemphisEvents({ ...options, offset, limit });
    allEvents.push(...result.events);

    hasMore = result.pagination.hasMore;
    offset += limit;
    iterations++;

    // Rate limiting
    if (hasMore) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return allEvents;
}

export default {
  fetchMemphisEvents,
  fetchAllMemphisEvents
};

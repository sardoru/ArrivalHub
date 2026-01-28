import axios from 'axios';

const BASE_URL = 'https://app.ticketmaster.com/discovery/v2';
const MEMPHIS_DMA_ID = '225'; // Memphis DMA
const MEMPHIS_COORDS = { lat: 35.1495, lng: -90.0490 };

function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function mapEventType(classifications) {
  if (!classifications || !classifications.length) return 'other';

  const segment = classifications[0]?.segment?.name?.toLowerCase() || '';
  const genre = classifications[0]?.genre?.name?.toLowerCase() || '';

  if (segment === 'music' || genre.includes('concert')) return 'concert';
  if (segment === 'sports') return 'sports';
  if (segment === 'arts & theatre' || segment === 'theatre') return 'theater';
  if (genre.includes('festival')) return 'festival';
  if (genre.includes('conference') || genre.includes('convention')) return 'convention';

  return 'other';
}

function transformEvent(rawEvent) {
  const venue = rawEvent._embedded?.venues?.[0];
  const priceRange = rawEvent.priceRanges?.[0];

  return {
    title: rawEvent.name,
    normalizedTitle: normalizeTitle(rawEvent.name),
    description: rawEvent.info || rawEvent.pleaseNote || null,
    eventType: mapEventType(rawEvent.classifications),
    startDate: rawEvent.dates?.start?.localDate,
    startTime: rawEvent.dates?.start?.localTime || null,
    endDate: rawEvent.dates?.end?.localDate || null,
    endTime: rawEvent.dates?.end?.localTime || null,
    expectedAttendance: null, // Ticketmaster doesn't provide this
    ticketPriceMin: priceRange?.min || null,
    ticketPriceMax: priceRange?.max || null,
    imageUrl: rawEvent.images?.find(i => i.ratio === '16_9')?.url || rawEvent.images?.[0]?.url,
    eventUrl: rawEvent.url,
    status: rawEvent.dates?.status?.code === 'cancelled' ? 'cancelled' : 'active',
    confidenceScore: 0.95, // High confidence for Ticketmaster
    venue: venue ? {
      name: venue.name,
      address: [venue.address?.line1, venue.city?.name, venue.state?.stateCode]
        .filter(Boolean).join(', '),
      latitude: parseFloat(venue.location?.latitude) || null,
      longitude: parseFloat(venue.location?.longitude) || null,
      capacity: venue.upcomingEvents?._total || null
    } : null,
    source: {
      sourceName: 'ticketmaster',
      sourceEventId: rawEvent.id,
      rawData: rawEvent
    }
  };
}

export async function fetchMemphisEvents(options = {}) {
  const {
    startDate = new Date().toISOString().split('T')[0],
    endDate = null,
    page = 0,
    size = 100
  } = options;

  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) {
    throw new Error('TICKETMASTER_API_KEY is not configured');
  }

  const params = {
    apikey: apiKey,
    dmaId: MEMPHIS_DMA_ID,
    latlong: `${MEMPHIS_COORDS.lat},${MEMPHIS_COORDS.lng}`,
    radius: 50,
    unit: 'miles',
    startDateTime: `${startDate}T00:00:00Z`,
    size,
    page,
    sort: 'date,asc'
  };

  if (endDate) {
    params.endDateTime = `${endDate}T23:59:59Z`;
  }

  try {
    const response = await axios.get(`${BASE_URL}/events.json`, { params });
    const data = response.data;

    const events = data._embedded?.events || [];
    const pageInfo = data.page || {};

    return {
      events: events.map(transformEvent),
      pagination: {
        page: pageInfo.number || 0,
        size: pageInfo.size || size,
        totalElements: pageInfo.totalElements || 0,
        totalPages: pageInfo.totalPages || 0
      }
    };
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error('Invalid Ticketmaster API key');
    }
    if (error.response?.status === 429) {
      throw new Error('Ticketmaster rate limit exceeded');
    }
    throw new Error(`Ticketmaster API error: ${error.message}`);
  }
}

export async function fetchAllMemphisEvents(options = {}) {
  const allEvents = [];
  let page = 0;
  let hasMore = true;
  const maxPages = options.maxPages || 10;

  while (hasMore && page < maxPages) {
    const result = await fetchMemphisEvents({ ...options, page });
    allEvents.push(...result.events);

    hasMore = page < result.pagination.totalPages - 1;
    page++;

    // Rate limiting - Ticketmaster allows 5 requests per second
    if (hasMore) {
      await new Promise(resolve => setTimeout(resolve, 250));
    }
  }

  return allEvents;
}

export default {
  fetchMemphisEvents,
  fetchAllMemphisEvents
};

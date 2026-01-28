/**
 * Downtown Memphis Commission Event Scraper
 * Scrapes events from downtownmemphis.com's API
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseApiDate(monthStr, dayStr, yearHint = new Date().getFullYear()) {
  try {
    const monthMap = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    
    const month = monthMap[monthStr];
    const day = parseInt(dayStr, 10);
    
    if (month !== undefined && !isNaN(day)) {
      let year = yearHint;
      // If month is before current month, it's probably next year
      const now = new Date();
      if (month < now.getMonth() && !(month === now.getMonth() && day >= now.getDate())) {
        year = now.getFullYear() + 1;
      }
      
      const date = new Date(year, month, day);
      return date.toISOString().split('T')[0];
    }
  } catch (e) {
    // Ignore parsing errors
  }
  return null;
}

function parseTime(timeStr) {
  if (!timeStr) return null;

  try {
    const match = timeStr.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2] || '0', 10);
      const period = (match[3] || '').toLowerCase();

      if (period === 'pm' && hours < 12) hours += 12;
      if (period === 'am' && hours === 12) hours = 0;

      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
    }
  } catch (e) {
    // Ignore parsing errors
  }
  return null;
}

function guessEventType(title, description) {
  const text = `${title} ${description}`.toLowerCase();

  if (text.includes('festival') || text.includes('fest')) return 'festival';
  if (text.includes('concert') || text.includes('music') || text.includes('band') || text.includes('live')) return 'concert';
  if (text.includes('grizzlies') || text.includes('redbirds') || text.includes('tigers') || text.includes(' vs ') || text.includes(' vs.')) return 'sports';
  if (text.includes('game') && !text.includes('video game')) return 'sports';
  if (text.includes('conference') || text.includes('summit') || text.includes('symposium')) return 'conference';
  if (text.includes('convention') || text.includes('expo') || text.includes('trade show')) return 'convention';
  if (text.includes('orpheum') || text.includes('theater') || text.includes('theatre') || text.includes('play') || text.includes('broadway') || text.includes('musical')) return 'theater';
  if (text.includes('bbq') || text.includes('barbecue') || text.includes('food')) return 'festival';

  return 'other';
}

export async function scrapeDowntownMemphis(options = {}) {
  const events = [];
  
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.downtownmemphis.com/events/calendar',
  };

  // The Downtown Memphis website loads events from this API
  // Fetch multiple weeks of events
  const apiBaseUrl = 'https://xapi.citylightstudio.net/_bbq/_bbq_results.php?fid=127&key=015233126&bbqparam=';
  
  console.log(`Fetching Downtown Memphis events from API...`);

  // Fetch current week and next 12 weeks (about 3 months)
  const hashParams = [''];
  const maxWeeks = 12;
  let weeksProcessed = 0;
  
  for (let i = 0; i < hashParams.length && weeksProcessed < maxWeeks; i++) {
    const param = hashParams[i];
    weeksProcessed++;
    try {
      const url = apiBaseUrl + param;
      console.log(`Fetching: ${param || 'current week'}`);
      
      const response = await axios.get(url, { headers, timeout: 30000 });
      const $ = cheerio.load(response.data);

      // Parse the header to get the date range
      const headerText = $('.bbq-results-header-middle').text().trim();
      console.log(`Date range: ${headerText}`);
      
      // Each day is in a bbq-row
      $('.bbq-row').each((_, row) => {
        const $row = $(row);
        
        // Get date from bbqdate
        const month = $row.find('.bbqdate-month').text().trim();
        const day = $row.find('.bbqdate-day').text().trim();
        const startDate = parseApiDate(month, day);
        
        if (!startDate) return;
        
        // Skip past dates
        if (new Date(startDate) < new Date(new Date().toISOString().split('T')[0])) return;
        
        // Get all events for this day
        $row.find('.bbq-row-list li a').each((_, eventEl) => {
          const $event = $(eventEl);
          
          const title = $event.find('.lnk-primary').text().trim();
          const secondary = $event.find('.lnk-secondary').text().trim();
          const eventUrl = $event.attr('href');
          
          if (!title) return;
          
          // Parse time and venue from secondary text (e.g., "7pm / FedExForum" or "7:30pm - 10pm / Orpheum Theatre")
          const parts = secondary.split('/').map(s => s.trim());
          const timeText = parts[0] || '';
          const venue = parts[1] || '';
          
          // Avoid duplicates
          const normalizedTitle = normalizeTitle(title);
          if (events.some(e => e.normalizedTitle === normalizedTitle && e.startDate === startDate)) {
            return;
          }
          
          events.push({
            title,
            normalizedTitle,
            description: `${title} at ${venue}. ${timeText}`,
            eventType: guessEventType(title, venue),
            startDate,
            startTime: parseTime(timeText),
            endDate: null,
            endTime: null,
            expectedAttendance: null,
            ticketPriceMin: null,
            ticketPriceMax: null,
            imageUrl: null,
            eventUrl: eventUrl ? `https://www.downtownmemphis.com${eventUrl}` : null,
            status: 'active',
            confidenceScore: 0.75,
            venue: venue ? {
              name: venue,
              address: 'Downtown Memphis, TN',
              latitude: null,
              longitude: null
            } : null,
            source: {
              sourceName: 'downtown_memphis',
              sourceEventId: `dm_${Buffer.from(title + startDate).toString('base64').substring(0, 20)}`,
              rawData: { title, secondary, eventUrl }
            }
          });
        });
      });
      
      // Get next week's hash from the "next" link
      const nextLink = $('.bbq-results-header-right a').attr('href');
      if (nextLink && nextLink.startsWith('#')) {
        const nextParam = nextLink.substring(1);
        if (!hashParams.includes(nextParam)) {
          hashParams.push(nextParam);
        }
      }
      
      // Be polite - wait between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`Error fetching Downtown Memphis events:`, error.message);
    }
  }

  console.log(`Total events scraped from Downtown Memphis: ${events.length}`);
  return events;
}

export default { scrapeDowntownMemphis };

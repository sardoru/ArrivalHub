/**
 * Memphis Tourism Event Scraper
 * Scrapes events from memphistourism.com and memphistravel.com using axios/cheerio
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

function parseDate(dateStr) {
  if (!dateStr) return null;

  try {
    // Clean up the date string
    const cleaned = dateStr.replace(/\s+/g, ' ').trim();

    // Common date patterns
    const patterns = [
      /(\d{4})-(\d{2})-(\d{2})/, // 2024-01-15
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // 1/15/2024
      /(\w+)\s+(\d{1,2}),?\s+(\d{4})/, // January 15, 2024
      /(\w+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*(\d{4}))?/, // January 15th, 2024
    ];

    for (const pattern of patterns) {
      const match = cleaned.match(pattern);
      if (match) {
        let dateString = cleaned;
        // If year is missing, add current year
        if (!dateString.match(/\d{4}/)) {
          dateString += `, ${new Date().getFullYear()}`;
        }
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      }
    }

    // Last resort - try direct parsing
    const date = new Date(cleaned);
    if (!isNaN(date.getTime())) {
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
  if (text.includes('game') || text.includes('vs') || text.includes('grizzlies') || text.includes('redbirds') || text.includes('tigers')) return 'sports';
  if (text.includes('conference') || text.includes('summit') || text.includes('symposium')) return 'conference';
  if (text.includes('convention') || text.includes('expo') || text.includes('trade show')) return 'convention';
  if (text.includes('theater') || text.includes('theatre') || text.includes('orpheum') || text.includes('play') || text.includes('broadway')) return 'theater';
  if (text.includes('bbq') || text.includes('barbecue') || text.includes('food') || text.includes('taste')) return 'festival';
  if (text.includes('marathon') || text.includes('run') || text.includes('race') || text.includes('5k')) return 'sports';

  return 'other';
}

async function scrapeUrl(baseUrl, maxPages, events) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0',
    'sec-ch-ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
  };

  for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
    const url = pageNum === 1
      ? baseUrl
      : `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}page=${pageNum}`;

    console.log(`Scraping ${url}`);

    try {
      const response = await axios.get(url, { headers, timeout: 30000 });
      const $ = cheerio.load(response.data);

      let foundEvents = 0;

      // Try various selectors for event items
      const selectors = [
        '.event-listing',
        '.event-item',
        '.event-card',
        'article.event',
        '.card',
        '.listing-item',
        '[class*="event"]',
        'article'
      ];

      for (const selector of selectors) {
        const elements = $(selector);
        if (elements.length > 0) {
          elements.each((_, el) => {
            const $el = $(el);
            
            // Skip navigation, header, footer elements
            if ($el.is('nav, header, footer, aside')) return;
            
            // Get title
            const titleEl = $el.find('h1, h2, h3, h4, .title, .event-title, .entry-title, [class*="title"] a, [class*="title"]').first();
            const title = titleEl.text().trim();
            
            if (!title || title.length < 3 || title.length > 200) return;

            // Get date
            const dateEl = $el.find('.event-date, .date, time, [datetime], [class*="date"]').first();
            const dateText = dateEl.attr('datetime') || dateEl.text().trim();
            
            // Get time
            const timeEl = $el.find('.event-time, .time, [class*="time"]').first();
            const timeText = timeEl.text().trim();
            
            // Get venue/location
            const venueEl = $el.find('.venue, .location, address, [class*="location"], [class*="venue"]').first();
            const venue = venueEl.text().trim().replace(/\s+/g, ' ').substring(0, 200);
            
            // Get description
            const descEl = $el.find('.excerpt, .description, .summary, p, [class*="description"]').first();
            const description = descEl.text().trim().substring(0, 500);
            
            // Get URL
            const linkEl = $el.find('a[href]').first();
            const eventUrl = linkEl.attr('href');
            
            // Get image
            const imgEl = $el.find('img').first();
            const image = imgEl.attr('src') || imgEl.attr('data-src');

            const startDate = parseDate(dateText);
            
            // Skip if no valid date or past event
            if (!startDate) return;
            if (new Date(startDate) < new Date(new Date().toISOString().split('T')[0])) return;

            // Check for duplicates
            const normalizedTitle = normalizeTitle(title);
            if (events.some(e => e.normalizedTitle === normalizedTitle && e.startDate === startDate)) {
              return;
            }

            events.push({
              title,
              normalizedTitle,
              description: description || null,
              eventType: guessEventType(title, description || ''),
              startDate,
              startTime: parseTime(timeText),
              endDate: null,
              endTime: null,
              expectedAttendance: null,
              ticketPriceMin: null,
              ticketPriceMax: null,
              imageUrl: image || null,
              eventUrl: eventUrl ? (eventUrl.startsWith('http') ? eventUrl : `${new URL(baseUrl).origin}${eventUrl}`) : null,
              status: 'active',
              confidenceScore: 0.60,
              venue: venue ? {
                name: venue.split(',')[0].trim(),
                address: venue,
                latitude: null,
                longitude: null
              } : null,
              source: {
                sourceName: 'memphis_tourism',
                sourceEventId: `mto_${Buffer.from(title + startDate).toString('base64').substring(0, 20)}`,
                rawData: { title, dateText, timeText, venue, description, sourceUrl: baseUrl }
              }
            });
            
            foundEvents++;
          });
          
          if (foundEvents > 0) break; // Found events with this selector, stop trying others
        }
      }

      if (foundEvents === 0) {
        console.log('No events found on this page, stopping');
        break;
      }

      console.log(`Found ${foundEvents} events on page ${pageNum}`);

      // Be polite - wait between requests
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (error) {
      console.error(`Error scraping ${url}:`, error.message);
      if (error.response?.status === 404) break;
    }
  }
}

export async function scrapeMemphisTourism(options = {}) {
  const { maxPages = 3 } = options;
  const events = [];

  // List of URLs to try
  const urlsToTry = [
    'https://www.memphistravel.com/events',
    'https://www.memphistourism.com/events',
    'https://www.memphistourism.com/events-calendar',
  ];

  for (const url of urlsToTry) {
    try {
      console.log(`\nTrying Memphis Tourism source: ${url}`);
      await scrapeUrl(url, maxPages, events);
    } catch (error) {
      console.error(`Failed to scrape ${url}:`, error.message);
    }
  }

  console.log(`\nTotal events scraped from Memphis Tourism sources: ${events.length}`);
  return events;
}

export default { scrapeMemphisTourism };

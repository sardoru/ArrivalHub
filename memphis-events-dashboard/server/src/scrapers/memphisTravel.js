/**
 * Memphis Travel (Memphis CVB) Event Scraper
 * Scrapes events from memphistravel.com/events
 */

import puppeteer from 'puppeteer';

function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseDate(dateStr) {
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (e) {
    // Ignore parsing errors
  }
  return null;
}

function guessEventType(title, description) {
  const text = `${title} ${description}`.toLowerCase();

  if (text.includes('festival') || text.includes('fest')) return 'festival';
  if (text.includes('concert') || text.includes('music') || text.includes('band')) return 'concert';
  if (text.includes('game') || text.includes('vs') || text.includes('match')) return 'sports';
  if (text.includes('conference') || text.includes('summit')) return 'conference';
  if (text.includes('convention') || text.includes('expo')) return 'convention';
  if (text.includes('theater') || text.includes('theatre') || text.includes('play') || text.includes('musical')) return 'theater';

  return 'other';
}

export async function scrapeMemphisTravel(options = {}) {
  const { maxPages = 5 } = options;

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    const events = [];
    let pageNum = 1;

    while (pageNum <= maxPages) {
      const url = `https://www.memphistravel.com/events?page=${pageNum}`;
      console.log(`Scraping Memphis Travel page ${pageNum}...`);

      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // Wait for event listings to load
        await page.waitForSelector('.event-listing, .events-list, article', { timeout: 10000 }).catch(() => null);

        // Extract events from the page
        const pageEvents = await page.evaluate(() => {
          const eventElements = document.querySelectorAll('.event-listing, .event-card, article.event, [data-event]');
          const results = [];

          eventElements.forEach(el => {
            const titleEl = el.querySelector('h2, h3, .event-title, .title');
            const dateEl = el.querySelector('.event-date, .date, time, [datetime]');
            const venueEl = el.querySelector('.venue, .location, .event-venue');
            const descEl = el.querySelector('.description, .event-description, p');
            const linkEl = el.querySelector('a[href*="event"]');

            if (titleEl) {
              results.push({
                title: titleEl.textContent.trim(),
                dateText: dateEl ? (dateEl.getAttribute('datetime') || dateEl.textContent.trim()) : null,
                venue: venueEl ? venueEl.textContent.trim() : null,
                description: descEl ? descEl.textContent.trim().substring(0, 500) : null,
                url: linkEl ? linkEl.href : null
              });
            }
          });

          return results;
        });

        if (pageEvents.length === 0) {
          console.log('No more events found, stopping scrape');
          break;
        }

        // Transform scraped events
        for (const rawEvent of pageEvents) {
          const startDate = parseDate(rawEvent.dateText);

          if (startDate) {
            events.push({
              title: rawEvent.title,
              normalizedTitle: normalizeTitle(rawEvent.title),
              description: rawEvent.description,
              eventType: guessEventType(rawEvent.title, rawEvent.description || ''),
              startDate,
              startTime: null,
              endDate: null,
              endTime: null,
              expectedAttendance: null,
              ticketPriceMin: null,
              ticketPriceMax: null,
              imageUrl: null,
              eventUrl: rawEvent.url,
              status: 'active',
              confidenceScore: 0.70,
              venue: rawEvent.venue ? {
                name: rawEvent.venue,
                address: null,
                latitude: null,
                longitude: null
              } : null,
              source: {
                sourceName: 'memphis_travel',
                sourceEventId: `mt_${Buffer.from(rawEvent.title + startDate).toString('base64').substring(0, 20)}`,
                rawData: rawEvent
              }
            });
          }
        }

        pageNum++;

        // Be polite - wait between requests
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (pageError) {
        console.error(`Error scraping page ${pageNum}:`, pageError.message);
        break;
      }
    }

    return events;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export default { scrapeMemphisTravel };

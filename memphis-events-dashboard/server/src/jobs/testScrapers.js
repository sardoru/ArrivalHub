/**
 * Test script for scrapers - runs without database
 * Usage: node src/jobs/testScrapers.js
 */

import { scrapeDowntownMemphis } from '../scrapers/downtownMemphis.js';
import { scrapeMemphisTourism } from '../scrapers/memphisTourism.js';

async function testScrapers() {
  console.log('='.repeat(60));
  console.log('Testing Memphis Events Scrapers');
  console.log('='.repeat(60));

  // Test Downtown Memphis scraper
  console.log('\n--- Testing Downtown Memphis Scraper ---\n');
  try {
    const downtownEvents = await scrapeDowntownMemphis({ maxPages: 2 });
    console.log(`Found ${downtownEvents.length} events from Downtown Memphis:\n`);
    
    downtownEvents.slice(0, 5).forEach((event, i) => {
      console.log(`${i + 1}. ${event.title}`);
      console.log(`   Date: ${event.startDate} ${event.startTime || ''}`);
      console.log(`   Type: ${event.eventType}`);
      console.log(`   Venue: ${event.venue?.name || 'N/A'}`);
      console.log(`   URL: ${event.eventUrl || 'N/A'}`);
      console.log('');
    });
    
    if (downtownEvents.length > 5) {
      console.log(`... and ${downtownEvents.length - 5} more events\n`);
    }
  } catch (error) {
    console.error('Downtown Memphis scraper error:', error.message);
  }

  // Test Memphis Tourism scraper
  console.log('\n--- Testing Memphis Tourism Scraper ---\n');
  try {
    const tourismEvents = await scrapeMemphisTourism({ maxPages: 2 });
    console.log(`Found ${tourismEvents.length} events from Memphis Tourism:\n`);
    
    tourismEvents.slice(0, 5).forEach((event, i) => {
      console.log(`${i + 1}. ${event.title}`);
      console.log(`   Date: ${event.startDate} ${event.startTime || ''}`);
      console.log(`   Type: ${event.eventType}`);
      console.log(`   Venue: ${event.venue?.name || 'N/A'}`);
      console.log(`   URL: ${event.eventUrl || 'N/A'}`);
      console.log('');
    });
    
    if (tourismEvents.length > 5) {
      console.log(`... and ${tourismEvents.length - 5} more events\n`);
    }
  } catch (error) {
    console.error('Memphis Tourism scraper error:', error.message);
  }

  console.log('='.repeat(60));
  console.log('Scraper testing completed');
  console.log('='.repeat(60));
}

testScrapers().catch(console.error);

/**
 * Debug script to examine API/page structure
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

async function debugAPI() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.downtownmemphis.com/events/calendar',
  };

  // Downtown Memphis Events API
  const apiUrl = 'https://xapi.citylightstudio.net/_bbq/_bbq_results.php?fid=127&key=015233126&bbqparam=';
  
  console.log(`Fetching: ${apiUrl}\n`);
  
  try {
    const response = await axios.get(apiUrl, { headers, timeout: 30000 });
    console.log(`Status: ${response.status}`);
    console.log(`Content length: ${response.data.length} bytes\n`);
    
    // Save raw response
    fs.writeFileSync('/tmp/downtown_api_response.html', response.data);
    console.log('Response saved to /tmp/downtown_api_response.html\n');
    
    // Show first 2000 chars
    console.log('First 2000 characters:\n');
    console.log(response.data.substring(0, 2000));
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
    }
  }
}

debugAPI();

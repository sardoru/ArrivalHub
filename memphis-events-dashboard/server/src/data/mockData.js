/**
 * Mock data for development without database
 */

// Generate dates relative to today
const today = new Date();
const addDays = (days) => {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

// Sample venues
export const mockVenues = [
  { id: '1', name: 'FedExForum', address: '191 Beale St, Memphis, TN 38103', capacity: 18119, venue_type: 'arena' },
  { id: '2', name: 'AutoZone Park', address: '200 Union Ave, Memphis, TN 38103', capacity: 10000, venue_type: 'stadium' },
  { id: '3', name: 'Orpheum Theatre', address: '203 S Main St, Memphis, TN 38103', capacity: 2300, venue_type: 'theater' },
  { id: '4', name: 'Liberty Bowl Memorial Stadium', address: '335 S Hollywood St, Memphis, TN 38104', capacity: 58325, venue_type: 'stadium' },
  { id: '5', name: 'Beale Street', address: 'Beale St, Memphis, TN 38103', capacity: null, venue_type: 'outdoor' },
  { id: '6', name: 'Cannon Center', address: '255 N Main St, Memphis, TN 38103', capacity: 2100, venue_type: 'theater' },
  { id: '7', name: 'Minglewood Hall', address: '1555 Madison Ave, Memphis, TN 38104', capacity: 1500, venue_type: 'concert_hall' },
];

// Sample events - mix of sports, concerts, theater, festivals
export const mockEvents = [
  // This week
  { id: '1', title: 'Memphis Grizzlies vs. New Orleans Pelicans', event_type: 'sports', start_date: addDays(0), start_time: '19:00:00', venue: mockVenues[0], expected_attendance: 18000, demand_impact_score: 85, status: 'active' },
  { id: '2', title: 'The Outsiders - Broadway Musical', event_type: 'theater', start_date: addDays(0), start_time: '19:30:00', venue: mockVenues[2], expected_attendance: 2200, demand_impact_score: 70, status: 'active' },
  { id: '3', title: 'Live Music at Flying Saucer', event_type: 'concert', start_date: addDays(0), start_time: '20:00:00', venue: mockVenues[4], expected_attendance: 300, demand_impact_score: 25, status: 'active' },
  { id: '4', title: 'Memphis Grizzlies vs. Lakers', event_type: 'sports', start_date: addDays(2), start_time: '19:00:00', venue: mockVenues[0], expected_attendance: 18119, demand_impact_score: 95, status: 'active' },
  { id: '5', title: 'The Outsiders - Saturday Matinee', event_type: 'theater', start_date: addDays(1), start_time: '14:00:00', venue: mockVenues[2], expected_attendance: 2200, demand_impact_score: 65, status: 'active' },
  { id: '6', title: 'Beale Street Live Music Night', event_type: 'concert', start_date: addDays(1), start_time: '19:00:00', venue: mockVenues[4], expected_attendance: 5000, demand_impact_score: 55, status: 'active' },
  
  // Next week
  { id: '7', title: 'Memphis Redbirds vs Nashville Sounds', event_type: 'sports', start_date: addDays(7), start_time: '18:30:00', venue: mockVenues[1], expected_attendance: 8000, demand_impact_score: 60, status: 'active' },
  { id: '8', title: 'Hamilton', event_type: 'theater', start_date: addDays(8), start_time: '19:30:00', venue: mockVenues[2], expected_attendance: 2300, demand_impact_score: 80, status: 'active' },
  { id: '9', title: 'Memphis Symphony Orchestra', event_type: 'concert', start_date: addDays(9), start_time: '19:30:00', venue: mockVenues[5], expected_attendance: 2000, demand_impact_score: 50, status: 'active' },
  { id: '10', title: 'Memphis Tigers Basketball', event_type: 'sports', start_date: addDays(10), start_time: '14:00:00', venue: mockVenues[0], expected_attendance: 17000, demand_impact_score: 75, status: 'active' },
  
  // In 2 weeks
  { id: '11', title: 'Beale Street Music Festival', event_type: 'festival', start_date: addDays(14), start_time: '12:00:00', venue: mockVenues[4], expected_attendance: 100000, demand_impact_score: 98, status: 'active' },
  { id: '12', title: 'Beale Street Music Festival - Day 2', event_type: 'festival', start_date: addDays(15), start_time: '12:00:00', venue: mockVenues[4], expected_attendance: 100000, demand_impact_score: 98, status: 'active' },
  { id: '13', title: 'Beale Street Music Festival - Day 3', event_type: 'festival', start_date: addDays(16), start_time: '12:00:00', venue: mockVenues[4], expected_attendance: 100000, demand_impact_score: 98, status: 'active' },
  
  // In 3 weeks
  { id: '14', title: 'Tech Conference Memphis', event_type: 'conference', start_date: addDays(21), start_time: '09:00:00', venue: mockVenues[0], expected_attendance: 5000, demand_impact_score: 70, status: 'active' },
  { id: '15', title: 'Memphis Grizzlies vs Warriors', event_type: 'sports', start_date: addDays(22), start_time: '19:00:00', venue: mockVenues[0], expected_attendance: 18119, demand_impact_score: 90, status: 'active' },
  { id: '16', title: 'Jazz Concert at Minglewood', event_type: 'concert', start_date: addDays(23), start_time: '20:00:00', venue: mockVenues[6], expected_attendance: 1200, demand_impact_score: 45, status: 'active' },
  
  // In 4+ weeks
  { id: '17', title: 'World Championship BBQ Cooking Contest', event_type: 'festival', start_date: addDays(28), start_time: '10:00:00', venue: mockVenues[4], expected_attendance: 80000, demand_impact_score: 95, status: 'active' },
  { id: '18', title: 'Memphis in May Sunset Symphony', event_type: 'concert', start_date: addDays(30), start_time: '18:00:00', venue: mockVenues[4], expected_attendance: 50000, demand_impact_score: 85, status: 'active' },
  { id: '19', title: 'Liberty Bowl Classic', event_type: 'sports', start_date: addDays(35), start_time: '15:00:00', venue: mockVenues[3], expected_attendance: 45000, demand_impact_score: 88, status: 'active' },
  { id: '20', title: 'Indie Rock Festival', event_type: 'festival', start_date: addDays(42), start_time: '14:00:00', venue: mockVenues[6], expected_attendance: 3000, demand_impact_score: 55, status: 'active' },
];

// Generate daily demand for next 90 days
export const mockDailyDemand = [];
for (let i = 0; i < 90; i++) {
  const date = addDays(i);
  const dayOfWeek = new Date(date).getDay();
  
  // Base score by day of week
  let baseScore;
  switch (dayOfWeek) {
    case 0: baseScore = 40; break; // Sunday
    case 1: baseScore = 20; break; // Monday
    case 2: baseScore = 22; break; // Tuesday
    case 3: baseScore = 25; break; // Wednesday
    case 4: baseScore = 35; break; // Thursday
    case 5: baseScore = 55; break; // Friday
    case 6: baseScore = 60; break; // Saturday
    default: baseScore = 30;
  }
  
  // Add some randomness
  baseScore += Math.floor(Math.random() * 20);
  
  // Check for events on this day and boost score
  const eventsOnDay = mockEvents.filter(e => e.start_date === date);
  eventsOnDay.forEach(event => {
    baseScore += event.demand_impact_score * 0.3;
  });
  
  // Cap at 100
  const score = Math.min(Math.round(baseScore), 100);
  
  // Determine level and multiplier
  let level, multiplier;
  if (score < 30) {
    level = 'low';
    multiplier = 0.85;
  } else if (score < 50) {
    level = 'moderate';
    multiplier = 1.0;
  } else if (score < 70) {
    level = 'high';
    multiplier = 1.25;
  } else if (score < 85) {
    level = 'very_high';
    multiplier = 1.5;
  } else {
    level = 'extreme';
    multiplier = 2.0;
  }
  
  // Weekend bonus
  if (dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6) {
    multiplier *= 1.1;
  }
  
  multiplier = Math.round(multiplier * 100) / 100;
  
  mockDailyDemand.push({
    date,
    total_demand_score: score,
    event_count: eventsOnDay.length,
    demand_level: level,
    price_multiplier: multiplier,
    suggested_min_price: Math.round(150 * multiplier * 0.9),
    suggested_max_price: Math.round(150 * multiplier * 1.1),
    events: eventsOnDay.map(e => ({ id: e.id, title: e.title, type: e.event_type }))
  });
}

// Mock sync logs
export const mockSyncLogs = [
  { id: '1', source_name: 'downtown_memphis', status: 'completed', started_at: new Date(Date.now() - 3600000).toISOString(), completed_at: new Date(Date.now() - 3500000).toISOString(), events_fetched: 220, events_added: 45, events_updated: 12, error_message: null },
  { id: '2', source_name: 'ticketmaster', status: 'completed', started_at: new Date(Date.now() - 7200000).toISOString(), completed_at: new Date(Date.now() - 7100000).toISOString(), events_fetched: 85, events_added: 20, events_updated: 5, error_message: null },
];

export default {
  mockVenues,
  mockEvents,
  mockDailyDemand,
  mockSyncLogs
};

/**
 * Demand Impact Calculator
 * Calculates demand impact scores for events based on multiple factors.
 */

// Event type base scores
const EVENT_TYPE_SCORES = {
  'festival': 95,
  'convention': 90,
  'concert': 85,
  'sports': 80,
  'conference': 75,
  'theater': 65,
  'other': 50
};

// Day of week multipliers
const DAY_MULTIPLIERS = {
  0: 1.15, // Sunday
  1: 0.85, // Monday
  2: 0.85, // Tuesday
  3: 0.90, // Wednesday
  4: 0.95, // Thursday
  5: 1.20, // Friday
  6: 1.25  // Saturday
};

/**
 * Calculate attendance score using log scale
 * 100 people = 20, 1000 = 40, 10000 = 60, 50000 = 85, 100000 = 100
 */
function calculateAttendanceScore(attendance) {
  if (!attendance || attendance <= 0) return 30; // Default for unknown

  if (attendance < 100) return Math.max(10, attendance / 5);
  if (attendance < 500) return 20 + (attendance - 100) * 0.025;
  if (attendance < 1000) return 30 + (attendance - 500) * 0.02;
  if (attendance < 5000) return 40 + (attendance - 1000) * 0.005;
  if (attendance < 10000) return 60 + (attendance - 5000) * 0.004;
  if (attendance < 50000) return 80 + (attendance - 10000) * 0.000125;
  if (attendance < 100000) return 85 + (attendance - 50000) * 0.0003;

  return 100;
}

/**
 * Calculate proximity score based on distance from downtown
 * <0.5mi = 100, 1mi = 90, 2mi = 75, 5mi = 50, 10mi = 25
 */
function calculateProximityScore(distanceMiles) {
  if (distanceMiles === null || distanceMiles === undefined) return 70; // Default

  if (distanceMiles < 0.5) return 100;
  if (distanceMiles < 1) return 90;
  if (distanceMiles < 2) return 75;
  if (distanceMiles < 5) return 50;
  if (distanceMiles < 10) return 25;

  return 10;
}

/**
 * Calculate timing score based on day of week and time
 */
function calculateTimingScore(date, time) {
  let score = 50; // Base score

  // Day of week bonus
  const dayOfWeek = new Date(date).getDay();
  const dayMultiplier = DAY_MULTIPLIERS[dayOfWeek];
  score *= dayMultiplier;

  // Evening event bonus (7pm - 10pm)
  if (time) {
    const hour = parseInt(time.split(':')[0], 10);
    if (hour >= 19 && hour <= 22) {
      score *= 1.15;
    } else if (hour >= 17 && hour < 19) {
      score *= 1.10;
    } else if (hour >= 10 && hour <= 14) {
      score *= 1.05; // Lunch events
    }
  }

  return Math.min(100, score);
}

/**
 * Calculate price point score
 * Higher ticket prices indicate higher-value events
 */
function calculatePriceScore(minPrice, maxPrice) {
  const avgPrice = maxPrice ? (minPrice + maxPrice) / 2 : minPrice;

  if (!avgPrice || avgPrice <= 0) return 50; // Default

  if (avgPrice < 25) return 30;
  if (avgPrice < 50) return 45;
  if (avgPrice < 100) return 60;
  if (avgPrice < 200) return 75;
  if (avgPrice < 500) return 90;

  return 100;
}

/**
 * Calculate the demand impact score for a single event
 * Returns score 0-100
 */
export function calculateEventDemandScore(event, options = {}) {
  const weights = {
    attendance: 0.35,
    eventType: 0.20,
    proximity: 0.20,
    timing: 0.15,
    price: 0.10
  };

  // Calculate individual component scores
  const scores = {
    attendance: calculateAttendanceScore(event.expectedAttendance),
    eventType: EVENT_TYPE_SCORES[event.eventType] || EVENT_TYPE_SCORES['other'],
    proximity: calculateProximityScore(event.venue?.downtown_distance_miles || options.venueDistance),
    timing: calculateTimingScore(event.startDate, event.startTime),
    price: calculatePriceScore(event.ticketPriceMin, event.ticketPriceMax)
  };

  // Use PredictHQ metrics if available (they're very accurate)
  if (event.demandMetrics?.phqAttendance) {
    scores.attendance = calculateAttendanceScore(event.demandMetrics.phqAttendance);
  }
  if (event.demandMetrics?.localRank) {
    // Blend with local rank (0-100 scale)
    scores.eventType = (scores.eventType + event.demandMetrics.localRank) / 2;
  }

  // Calculate weighted sum
  const totalScore = Object.entries(weights).reduce(
    (sum, [key, weight]) => sum + scores[key] * weight,
    0
  );

  return Math.round(Math.min(100, Math.max(0, totalScore)));
}

/**
 * Calculate daily demand score with diminishing returns for multiple events
 */
export function calculateDailyDemand(events) {
  if (!events || events.length === 0) {
    return {
      totalScore: 0,
      eventCount: 0,
      demandLevel: 'low',
      events: []
    };
  }

  // Sort events by impact score
  const scoredEvents = events.map(e => ({
    ...e,
    demandImpactScore: e.demandImpactScore || calculateEventDemandScore(e)
  })).sort((a, b) => b.demandImpactScore - a.demandImpactScore);

  // Apply diminishing returns for multiple events
  // First event: 100%, second: 70%, third: 50%, fourth+: 30%
  const diminishingFactors = [1.0, 0.7, 0.5, 0.3];

  let totalScore = 0;
  scoredEvents.forEach((event, index) => {
    const factor = diminishingFactors[Math.min(index, diminishingFactors.length - 1)];
    totalScore += event.demandImpactScore * factor;
  });

  // Determine demand level
  let demandLevel;
  if (totalScore < 30) demandLevel = 'low';
  else if (totalScore < 60) demandLevel = 'moderate';
  else if (totalScore < 100) demandLevel = 'high';
  else if (totalScore < 150) demandLevel = 'very_high';
  else demandLevel = 'extreme';

  return {
    totalScore: Math.round(totalScore),
    eventCount: events.length,
    demandLevel,
    events: scoredEvents
  };
}

/**
 * Check if a date is a holiday or special event
 */
export function getHolidayBonus(date) {
  const d = new Date(date);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const dayOfWeek = d.getDay();

  // Major holidays
  const holidays = {
    '1-1': 50,    // New Year's Day
    '7-4': 40,    // Independence Day
    '12-24': 30,  // Christmas Eve
    '12-25': 35,  // Christmas
    '12-31': 60,  // New Year's Eve
  };

  const key = `${month}-${day}`;
  if (holidays[key]) return holidays[key];

  // Memphis-specific events (approximate dates)
  // Beale Street Music Festival - first weekend in May
  if (month === 5 && day <= 7 && (dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0)) {
    return 70;
  }

  // Memphis in May BBQ - mid-May
  if (month === 5 && day >= 12 && day <= 18 && (dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0)) {
    return 50;
  }

  // Elvis Week - mid-August
  if (month === 8 && day >= 10 && day <= 18) {
    return 40;
  }

  return 0;
}

export default {
  calculateEventDemandScore,
  calculateDailyDemand,
  getHolidayBonus
};

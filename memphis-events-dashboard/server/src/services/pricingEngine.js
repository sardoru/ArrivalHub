/**
 * Pricing Engine
 * Calculates price suggestions based on demand scores and user settings.
 */

import { calculateDailyDemand, getHolidayBonus } from './demandCalculator.js';
import { UserSettings } from '../models/UserSettings.js';
import { DailyDemand } from '../models/DailyDemand.js';
import Event from '../models/Event.js';

// Demand level multipliers
const DEMAND_MULTIPLIERS = {
  'low': 0.85,
  'moderate': 1.0,
  'high': 1.35,
  'very_high': 1.75,
  'extreme': 2.5
};

// Weekend bonus
const WEEKEND_BONUS = 0.15; // 15% extra on weekends

/**
 * Get demand level from total score
 */
function getDemandLevel(score) {
  if (score < 30) return 'low';
  if (score < 60) return 'moderate';
  if (score < 100) return 'high';
  if (score < 150) return 'very_high';
  return 'extreme';
}

/**
 * Check if date is a weekend
 */
function isWeekend(date) {
  const d = new Date(date);
  const day = d.getDay();
  return day === 0 || day === 5 || day === 6; // Fri, Sat, Sun
}

/**
 * Calculate price suggestion for a specific date
 */
export async function calculatePriceSuggestion(date, userId = 'default') {
  // Get user settings
  const settings = await UserSettings.get(userId);
  const baseRate = settings?.base_nightly_rate || parseFloat(process.env.DEFAULT_BASE_RATE) || 100;
  const minRate = settings?.min_nightly_rate || parseFloat(process.env.DEFAULT_MIN_RATE) || 50;
  const maxRate = settings?.max_nightly_rate || parseFloat(process.env.DEFAULT_MAX_RATE) || 500;

  // Get events for the date
  const events = await Event.findByDateRange(date, date);

  // Calculate demand
  const demand = calculateDailyDemand(events);

  // Add holiday/special event bonus
  const holidayBonus = getHolidayBonus(date);
  const adjustedScore = demand.totalScore + holidayBonus;
  const finalDemandLevel = getDemandLevel(adjustedScore);

  // Get base multiplier
  let multiplier = DEMAND_MULTIPLIERS[finalDemandLevel];

  // Apply weekend bonus
  if (isWeekend(date)) {
    multiplier *= (1 + WEEKEND_BONUS);
  }

  // Calculate suggested prices
  let suggestedPrice = baseRate * multiplier;

  // Apply bounds
  suggestedPrice = Math.max(minRate, Math.min(maxRate, suggestedPrice));

  // Calculate range (±10%)
  const suggestedMinPrice = Math.round(suggestedPrice * 0.9);
  const suggestedMaxPrice = Math.round(suggestedPrice * 1.1);

  return {
    date,
    totalDemandScore: adjustedScore,
    eventCount: demand.eventCount,
    demandLevel: finalDemandLevel,
    priceMultiplier: Math.round(multiplier * 100) / 100,
    suggestedPrice: Math.round(suggestedPrice),
    suggestedMinPrice: Math.max(minRate, suggestedMinPrice),
    suggestedMaxPrice: Math.min(maxRate, suggestedMaxPrice),
    baseRate,
    isWeekend: isWeekend(date),
    holidayBonus,
    events: demand.events.slice(0, 5).map(e => ({
      id: e.id,
      title: e.title,
      eventType: e.event_type || e.eventType,
      demandImpactScore: e.demandImpactScore || e.demand_impact_score
    }))
  };
}

/**
 * Calculate and store daily demand for a date range
 */
export async function calculateAndStoreDemand(startDate, endDate, userId = 'default') {
  const settings = await UserSettings.get(userId);
  const baseRate = settings?.base_nightly_rate || parseFloat(process.env.DEFAULT_BASE_RATE) || 100;
  const minRate = settings?.min_nightly_rate || parseFloat(process.env.DEFAULT_MIN_RATE) || 50;
  const maxRate = settings?.max_nightly_rate || parseFloat(process.env.DEFAULT_MAX_RATE) || 500;

  const results = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];

    // Get events for this date
    const events = await Event.findByDateRange(dateStr, dateStr);

    // Calculate demand
    const demand = calculateDailyDemand(events);
    const holidayBonus = getHolidayBonus(dateStr);
    const adjustedScore = demand.totalScore + holidayBonus;
    const demandLevel = getDemandLevel(adjustedScore);

    // Calculate multiplier
    let multiplier = DEMAND_MULTIPLIERS[demandLevel];
    if (isWeekend(dateStr)) {
      multiplier *= (1 + WEEKEND_BONUS);
    }

    // Calculate prices
    let suggestedPrice = baseRate * multiplier;
    suggestedPrice = Math.max(minRate, Math.min(maxRate, suggestedPrice));

    // Store in database
    const stored = await DailyDemand.upsert({
      date: dateStr,
      totalDemandScore: adjustedScore,
      eventCount: demand.eventCount,
      demandLevel,
      priceMultiplier: Math.round(multiplier * 100) / 100,
      suggestedMinPrice: Math.max(minRate, Math.round(suggestedPrice * 0.9)),
      suggestedMaxPrice: Math.min(maxRate, Math.round(suggestedPrice * 1.1))
    });

    results.push(stored);
  }

  return results;
}

/**
 * Get daily pricing for a date range
 */
export async function getDailyPricing(startDate, endDate, userId = 'default') {
  // First try to get from stored data
  let stored = await DailyDemand.findByDateRange(startDate, endDate);

  // If we don't have data for some days, calculate them
  const storedDates = new Set(stored.map(d => d.date.toISOString().split('T')[0]));
  const start = new Date(startDate);
  const end = new Date(endDate);
  const missingDates = [];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    if (!storedDates.has(dateStr)) {
      missingDates.push(dateStr);
    }
  }

  // Calculate missing dates
  if (missingDates.length > 0) {
    for (const date of missingDates) {
      const suggestion = await calculatePriceSuggestion(date, userId);
      await DailyDemand.upsert({
        date,
        totalDemandScore: suggestion.totalDemandScore,
        eventCount: suggestion.eventCount,
        demandLevel: suggestion.demandLevel,
        priceMultiplier: suggestion.priceMultiplier,
        suggestedMinPrice: suggestion.suggestedMinPrice,
        suggestedMaxPrice: suggestion.suggestedMaxPrice
      });
    }

    // Refresh stored data
    stored = await DailyDemand.findByDateRange(startDate, endDate);
  }

  return stored;
}

/**
 * Get detailed suggestion for a specific date
 */
export async function getDetailedSuggestion(date, userId = 'default') {
  return calculatePriceSuggestion(date, userId);
}

export default {
  calculatePriceSuggestion,
  calculateAndStoreDemand,
  getDailyPricing,
  getDetailedSuggestion
};

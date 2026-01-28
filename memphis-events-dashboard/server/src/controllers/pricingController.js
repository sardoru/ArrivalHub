import { getDailyPricing, getDetailedSuggestion } from '../services/pricingEngine.js';
import { UserSettings } from '../models/UserSettings.js';
import { DailyDemand } from '../models/DailyDemand.js';
import { mockDailyDemand, mockEvents } from '../data/mockData.js';

// Default settings when database is unavailable
const defaultSettings = {
  base_nightly_rate: 150,
  min_nightly_rate: 100,
  max_nightly_rate: 350,
  property_type: 'apartment',
  distance_from_downtown: 0.5
};

export async function getDailyPricingHandler(req, res) {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required'
      });
    }

    let pricing;
    
    try {
      pricing = await getDailyPricing(startDate, endDate);
    } catch (dbError) {
      console.log('Database unavailable, using mock data for pricing');
      // Filter mock daily demand for date range
      pricing = mockDailyDemand.filter(d => {
        return d.date >= startDate && d.date <= endDate;
      });
    }

    res.json({
      success: true,
      data: pricing
    });
  } catch (error) {
    console.error('Error fetching daily pricing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch daily pricing'
    });
  }
}

export async function getSuggestionHandler(req, res) {
  try {
    const { date } = req.params;

    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'Date is required'
      });
    }

    let suggestion;
    
    try {
      suggestion = await getDetailedSuggestion(date);
    } catch (dbError) {
      console.log('Database unavailable, using mock data for suggestion');
      // Create suggestion from mock data
      const dayData = mockDailyDemand.find(d => d.date === date) || mockDailyDemand[0];
      const dayEvents = mockEvents.filter(e => e.start_date === date);
      
      suggestion = {
        date,
        demand_level: dayData?.demand_level || 'moderate',
        demand_score: dayData?.total_demand_score || 50,
        price_multiplier: dayData?.price_multiplier || 1.0,
        suggested_price: Math.round(150 * (dayData?.price_multiplier || 1.0)),
        min_price: dayData?.suggested_min_price || 135,
        max_price: dayData?.suggested_max_price || 165,
        events: dayEvents.map(e => ({
          title: e.title,
          type: e.event_type,
          venue: e.venue?.name,
          expected_attendance: e.expected_attendance,
          impact_score: e.demand_impact_score
        })),
        reasoning: `Based on ${dayEvents.length} event(s) in the area with demand level: ${dayData?.demand_level || 'moderate'}`
      };
    }

    res.json({
      success: true,
      data: suggestion
    });
  } catch (error) {
    console.error('Error fetching suggestion:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch price suggestion'
    });
  }
}

export async function updateSettingsHandler(req, res) {
  try {
    const {
      baseNightlyRate,
      minNightlyRate,
      maxNightlyRate,
      propertyType,
      distanceFromDowntown
    } = req.body;

    let settings;
    
    try {
      settings = await UserSettings.update('default', {
        baseNightlyRate,
        minNightlyRate,
        maxNightlyRate,
        propertyType,
        distanceFromDowntown
      });
    } catch (dbError) {
      console.log('Database unavailable, using default settings');
      settings = {
        ...defaultSettings,
        base_nightly_rate: baseNightlyRate || defaultSettings.base_nightly_rate,
        min_nightly_rate: minNightlyRate || defaultSettings.min_nightly_rate,
        max_nightly_rate: maxNightlyRate || defaultSettings.max_nightly_rate,
        property_type: propertyType || defaultSettings.property_type,
        distance_from_downtown: distanceFromDowntown || defaultSettings.distance_from_downtown
      };
    }

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update settings'
    });
  }
}

export async function getSettingsHandler(req, res) {
  try {
    let settings;
    
    try {
      settings = await UserSettings.get('default');
    } catch (dbError) {
      console.log('Database unavailable, using default settings');
      settings = defaultSettings;
    }

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch settings'
    });
  }
}

export async function getMonthSummaryHandler(req, res) {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        error: 'month and year are required'
      });
    }

    let summary;
    
    try {
      summary = await DailyDemand.getMonthSummary(
        parseInt(year, 10),
        parseInt(month, 10)
      );
    } catch (dbError) {
      console.log('Database unavailable, using mock data for month summary');
      // Calculate summary from mock data
      const targetMonth = parseInt(month, 10);
      const targetYear = parseInt(year, 10);
      
      const monthData = mockDailyDemand.filter(d => {
        const date = new Date(d.date);
        return date.getMonth() + 1 === targetMonth && date.getFullYear() === targetYear;
      });
      
      const monthEvents = mockEvents.filter(e => {
        const date = new Date(e.start_date);
        return date.getMonth() + 1 === targetMonth && date.getFullYear() === targetYear;
      });
      
      if (monthData.length > 0) {
        const avgDemand = Math.round(monthData.reduce((sum, d) => sum + d.total_demand_score, 0) / monthData.length);
        const avgMultiplier = Math.round(monthData.reduce((sum, d) => sum + d.price_multiplier, 0) / monthData.length * 100) / 100;
        
        summary = {
          month: targetMonth,
          year: targetYear,
          total_events: monthEvents.length,
          average_demand_score: avgDemand,
          average_price_multiplier: avgMultiplier,
          high_demand_days: monthData.filter(d => d.demand_level === 'high' || d.demand_level === 'very_high' || d.demand_level === 'extreme').length,
          peak_day: monthData.reduce((max, d) => d.total_demand_score > (max?.total_demand_score || 0) ? d : max, null)?.date,
          suggested_avg_price: Math.round(150 * avgMultiplier)
        };
      } else {
        summary = {
          month: targetMonth,
          year: targetYear,
          total_events: 0,
          average_demand_score: 30,
          average_price_multiplier: 1.0,
          high_demand_days: 0,
          peak_day: null,
          suggested_avg_price: 150
        };
      }
    }

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching month summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch month summary'
    });
  }
}

export default {
  getDailyPricingHandler,
  getSuggestionHandler,
  updateSettingsHandler,
  getSettingsHandler,
  getMonthSummaryHandler
};

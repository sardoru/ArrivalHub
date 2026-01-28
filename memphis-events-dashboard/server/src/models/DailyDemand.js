import { query } from '../config/database.js';

export const DailyDemand = {
  async findByDate(date) {
    const { rows } = await query(
      `SELECT * FROM daily_demand WHERE date = $1`,
      [date]
    );
    return rows[0];
  },

  async findByDateRange(startDate, endDate) {
    const { rows } = await query(
      `SELECT * FROM daily_demand
       WHERE date >= $1 AND date <= $2
       ORDER BY date ASC`,
      [startDate, endDate]
    );
    return rows;
  },

  async upsert(demandData) {
    const {
      date, totalDemandScore, eventCount, demandLevel,
      priceMultiplier, suggestedMinPrice, suggestedMaxPrice
    } = demandData;

    const { rows } = await query(
      `INSERT INTO daily_demand (
        date, total_demand_score, event_count, demand_level,
        price_multiplier, suggested_min_price, suggested_max_price,
        calculated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      ON CONFLICT (date) DO UPDATE SET
        total_demand_score = $2,
        event_count = $3,
        demand_level = $4,
        price_multiplier = $5,
        suggested_min_price = $6,
        suggested_max_price = $7,
        calculated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [
        date, totalDemandScore, eventCount, demandLevel,
        priceMultiplier, suggestedMinPrice, suggestedMaxPrice
      ]
    );
    return rows[0];
  },

  async getMonthSummary(year, month) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const { rows } = await query(
      `SELECT
        COUNT(*) as total_days,
        COUNT(CASE WHEN demand_level = 'low' THEN 1 END) as low_days,
        COUNT(CASE WHEN demand_level = 'moderate' THEN 1 END) as moderate_days,
        COUNT(CASE WHEN demand_level = 'high' THEN 1 END) as high_days,
        COUNT(CASE WHEN demand_level = 'very_high' THEN 1 END) as very_high_days,
        COUNT(CASE WHEN demand_level = 'extreme' THEN 1 END) as extreme_days,
        AVG(total_demand_score) as avg_demand,
        AVG(price_multiplier) as avg_multiplier
       FROM daily_demand
       WHERE date >= $1 AND date <= $2`,
      [startDate, endDate]
    );
    return rows[0];
  }
};

export default DailyDemand;

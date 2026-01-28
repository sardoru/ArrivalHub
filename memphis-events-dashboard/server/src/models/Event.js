import { query, transaction } from '../config/database.js';

export const Event = {
  async findAll({ startDate, endDate, eventType, venueId, limit = 100, offset = 0 }) {
    let sql = `
      SELECT e.*, v.name as venue_name, v.address as venue_address
      FROM events e
      LEFT JOIN venues v ON e.venue_id = v.id
      WHERE e.status = 'active'
    `;
    const params = [];
    let paramIndex = 1;

    if (startDate) {
      sql += ` AND e.start_date >= $${paramIndex++}`;
      params.push(startDate);
    }
    if (endDate) {
      sql += ` AND e.start_date <= $${paramIndex++}`;
      params.push(endDate);
    }
    if (eventType) {
      sql += ` AND e.event_type = $${paramIndex++}`;
      params.push(eventType);
    }
    if (venueId) {
      sql += ` AND e.venue_id = $${paramIndex++}`;
      params.push(venueId);
    }

    sql += ` ORDER BY e.start_date ASC, e.start_time ASC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(limit, offset);

    const { rows } = await query(sql, params);
    return rows;
  },

  async findById(id) {
    const { rows } = await query(
      `SELECT e.*, v.name as venue_name, v.address as venue_address,
              v.latitude as venue_lat, v.longitude as venue_lng
       FROM events e
       LEFT JOIN venues v ON e.venue_id = v.id
       WHERE e.id = $1`,
      [id]
    );
    return rows[0];
  },

  async findByDateRange(startDate, endDate) {
    const { rows } = await query(
      `SELECT e.*, v.name as venue_name
       FROM events e
       LEFT JOIN venues v ON e.venue_id = v.id
       WHERE e.start_date >= $1 AND e.start_date <= $2
       AND e.status = 'active'
       ORDER BY e.start_date ASC, e.demand_impact_score DESC`,
      [startDate, endDate]
    );
    return rows;
  },

  async findForCalendar(year, month) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const { rows } = await query(
      `SELECT
        e.start_date,
        COUNT(*) as event_count,
        COALESCE(SUM(e.demand_impact_score), 0) as total_demand,
        json_agg(json_build_object(
          'id', e.id,
          'title', e.title,
          'event_type', e.event_type,
          'demand_impact_score', e.demand_impact_score
        ) ORDER BY e.demand_impact_score DESC) as events
       FROM events e
       WHERE e.start_date >= $1 AND e.start_date <= $2
       AND e.status = 'active'
       GROUP BY e.start_date
       ORDER BY e.start_date`,
      [startDate, endDate]
    );
    return rows;
  },

  async create(eventData) {
    const {
      title, normalizedTitle, description, eventType,
      startDate, startTime, endDate, endTime, venueId,
      expectedAttendance, demandImpactScore, status,
      confidenceScore, ticketPriceMin, ticketPriceMax,
      imageUrl, eventUrl
    } = eventData;

    const { rows } = await query(
      `INSERT INTO events (
        title, normalized_title, description, event_type,
        start_date, start_time, end_date, end_time, venue_id,
        expected_attendance, demand_impact_score, status,
        confidence_score, ticket_price_min, ticket_price_max,
        image_url, event_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        title, normalizedTitle, description, eventType,
        startDate, startTime, endDate, endTime, venueId,
        expectedAttendance, demandImpactScore, status || 'active',
        confidenceScore, ticketPriceMin, ticketPriceMax,
        imageUrl, eventUrl
      ]
    );
    return rows[0];
  },

  async update(id, updates) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    const fieldMap = {
      title: 'title',
      normalizedTitle: 'normalized_title',
      description: 'description',
      eventType: 'event_type',
      startDate: 'start_date',
      startTime: 'start_time',
      endDate: 'end_date',
      endTime: 'end_time',
      venueId: 'venue_id',
      expectedAttendance: 'expected_attendance',
      demandImpactScore: 'demand_impact_score',
      status: 'status',
      confidenceScore: 'confidence_score',
      ticketPriceMin: 'ticket_price_min',
      ticketPriceMax: 'ticket_price_max',
      imageUrl: 'image_url',
      eventUrl: 'event_url'
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (updates[key] !== undefined) {
        fields.push(`${dbField} = $${paramIndex++}`);
        values.push(updates[key]);
      }
    }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const { rows } = await query(
      `UPDATE events SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return rows[0];
  },

  async upsertWithSource(eventData, sourceData) {
    return transaction(async (client) => {
      // Check if event from this source already exists
      const { rows: existingSource } = await client.query(
        `SELECT event_id FROM event_sources
         WHERE source_name = $1 AND source_event_id = $2`,
        [sourceData.sourceName, sourceData.sourceEventId]
      );

      let eventId;
      if (existingSource.length > 0) {
        eventId = existingSource[0].event_id;
        // Update existing event
        await this.update(eventId, eventData);
      } else {
        // Create new event
        const event = await this.create(eventData);
        eventId = event.id;
      }

      // Upsert source record
      await client.query(
        `INSERT INTO event_sources (event_id, source_name, source_event_id, raw_data)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (source_name, source_event_id)
         DO UPDATE SET raw_data = $4, fetched_at = CURRENT_TIMESTAMP`,
        [eventId, sourceData.sourceName, sourceData.sourceEventId, sourceData.rawData]
      );

      return eventId;
    });
  }
};

export default Event;

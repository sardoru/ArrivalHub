import { query } from '../config/database.js';

// Memphis downtown coordinates
const DOWNTOWN_LAT = 35.1495;
const DOWNTOWN_LNG = -90.0490;

function normalizeVenueName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const Venue = {
  async findAll() {
    const { rows } = await query(
      `SELECT * FROM venues ORDER BY name ASC`
    );
    return rows;
  },

  async findById(id) {
    const { rows } = await query(
      `SELECT * FROM venues WHERE id = $1`,
      [id]
    );
    return rows[0];
  },

  async findByNormalizedName(normalizedName) {
    const { rows } = await query(
      `SELECT * FROM venues WHERE normalized_name = $1`,
      [normalizedName]
    );
    return rows[0];
  },

  async findSimilar(name, threshold = 0.5) {
    const normalized = normalizeVenueName(name);
    const { rows } = await query(
      `SELECT *, similarity(normalized_name, $1) as sim
       FROM venues
       WHERE similarity(normalized_name, $1) > $2
       ORDER BY sim DESC
       LIMIT 5`,
      [normalized, threshold]
    );
    return rows;
  },

  async create(venueData) {
    const {
      name, address, latitude, longitude,
      capacity, venueType
    } = venueData;

    const normalizedName = normalizeVenueName(name);
    let downtownDistance = null;

    if (latitude && longitude) {
      downtownDistance = calculateDistance(
        latitude, longitude,
        DOWNTOWN_LAT, DOWNTOWN_LNG
      );
    }

    const { rows } = await query(
      `INSERT INTO venues (
        name, normalized_name, address, latitude, longitude,
        capacity, venue_type, downtown_distance_miles
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        name, normalizedName, address, latitude, longitude,
        capacity, venueType, downtownDistance
      ]
    );
    return rows[0];
  },

  async findOrCreate(venueData) {
    const normalizedName = normalizeVenueName(venueData.name);

    // First try exact match
    let venue = await this.findByNormalizedName(normalizedName);
    if (venue) return venue;

    // Try fuzzy match
    const similar = await this.findSimilar(venueData.name, 0.7);
    if (similar.length > 0) {
      return similar[0];
    }

    // Create new venue
    return this.create(venueData);
  },

  async update(id, updates) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(updates.name);
      fields.push(`normalized_name = $${paramIndex++}`);
      values.push(normalizeVenueName(updates.name));
    }
    if (updates.address !== undefined) {
      fields.push(`address = $${paramIndex++}`);
      values.push(updates.address);
    }
    if (updates.latitude !== undefined) {
      fields.push(`latitude = $${paramIndex++}`);
      values.push(updates.latitude);
    }
    if (updates.longitude !== undefined) {
      fields.push(`longitude = $${paramIndex++}`);
      values.push(updates.longitude);
    }
    if (updates.capacity !== undefined) {
      fields.push(`capacity = $${paramIndex++}`);
      values.push(updates.capacity);
    }
    if (updates.venueType !== undefined) {
      fields.push(`venue_type = $${paramIndex++}`);
      values.push(updates.venueType);
    }

    // Recalculate downtown distance if coordinates changed
    if (updates.latitude !== undefined || updates.longitude !== undefined) {
      const lat = updates.latitude;
      const lng = updates.longitude;
      if (lat && lng) {
        const distance = calculateDistance(lat, lng, DOWNTOWN_LAT, DOWNTOWN_LNG);
        fields.push(`downtown_distance_miles = $${paramIndex++}`);
        values.push(distance);
      }
    }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const { rows } = await query(
      `UPDATE venues SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return rows[0];
  }
};

export default Venue;

import { query } from '../config/database.js';

export const UserSettings = {
  async get(userId = 'default') {
    const { rows } = await query(
      `SELECT * FROM user_settings WHERE user_id = $1`,
      [userId]
    );
    return rows[0];
  },

  async update(userId = 'default', settings) {
    const {
      baseNightlyRate,
      minNightlyRate,
      maxNightlyRate,
      propertyType,
      distanceFromDowntown
    } = settings;

    const { rows } = await query(
      `INSERT INTO user_settings (
        user_id, base_nightly_rate, min_nightly_rate, max_nightly_rate,
        property_type, distance_from_downtown
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id) DO UPDATE SET
        base_nightly_rate = COALESCE($2, user_settings.base_nightly_rate),
        min_nightly_rate = COALESCE($3, user_settings.min_nightly_rate),
        max_nightly_rate = COALESCE($4, user_settings.max_nightly_rate),
        property_type = COALESCE($5, user_settings.property_type),
        distance_from_downtown = COALESCE($6, user_settings.distance_from_downtown)
      RETURNING *`,
      [
        userId,
        baseNightlyRate,
        minNightlyRate,
        maxNightlyRate,
        propertyType,
        distanceFromDowntown
      ]
    );
    return rows[0];
  }
};

export default UserSettings;

import { query } from '../config/database.js';

export const SyncLog = {
  async create(sourceName, syncType = 'scheduled') {
    const { rows } = await query(
      `INSERT INTO sync_log (source_name, sync_type, status)
       VALUES ($1, $2, 'running')
       RETURNING *`,
      [sourceName, syncType]
    );
    return rows[0];
  },

  async complete(id, stats) {
    const {
      eventsFetched = 0,
      eventsAdded = 0,
      eventsUpdated = 0,
      eventsDeduplicated = 0
    } = stats;

    const { rows } = await query(
      `UPDATE sync_log SET
        status = 'completed',
        events_fetched = $2,
        events_added = $3,
        events_updated = $4,
        events_deduplicated = $5,
        completed_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id, eventsFetched, eventsAdded, eventsUpdated, eventsDeduplicated]
    );
    return rows[0];
  },

  async fail(id, errorMessage) {
    const { rows } = await query(
      `UPDATE sync_log SET
        status = 'failed',
        error_message = $2,
        completed_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id, errorMessage]
    );
    return rows[0];
  },

  async getLatest(limit = 10) {
    const { rows } = await query(
      `SELECT * FROM sync_log
       ORDER BY started_at DESC
       LIMIT $1`,
      [limit]
    );
    return rows;
  },

  async getLatestBySource(sourceName) {
    const { rows } = await query(
      `SELECT * FROM sync_log
       WHERE source_name = $1
       ORDER BY started_at DESC
       LIMIT 1`,
      [sourceName]
    );
    return rows[0];
  },

  async getRunning() {
    const { rows } = await query(
      `SELECT * FROM sync_log WHERE status = 'running'`
    );
    return rows;
  }
};

export default SyncLog;

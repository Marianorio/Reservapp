const pool = require('../config/database');

const tableRepository = {
  async findAll() {
    const result = await pool.query(
      'SELECT * FROM restaurant_tables WHERE is_active = true ORDER BY table_number'
    );
    return result.rows;
  },

  async findById(id) {
    const result = await pool.query(
      'SELECT * FROM restaurant_tables WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  async findAvailable(date, time, guestCount, durationMinutes) {
    const result = await pool.query(
      `SELECT * FROM restaurant_tables
       WHERE is_active = true AND capacity >= $1
       AND id NOT IN (
         SELECT table_id FROM reservations
         WHERE status_id IN (1, 4)
         AND reservation_date = $2
         AND reservation_time < $3::time + ($4 || ' minutes')::interval
         AND reservation_time + (duration_minutes || ' minutes')::interval > $3::time
       )
       ORDER BY capacity ASC LIMIT 1`,
      [guestCount, date, time, durationMinutes]
    );
    return result.rows[0] || null;
  },

  async getOccupiedCapacity(date, time, durationMinutes) {
    const result = await pool.query(
      `SELECT COALESCE(SUM(t.capacity), 0) as occupied
       FROM reservations r
       JOIN restaurant_tables t ON r.table_id = t.id
       WHERE r.status_id IN (1, 4)
       AND r.reservation_date = $1
       AND r.reservation_time < $2::time + ($3 || ' minutes')::interval
       AND r.reservation_time + (r.duration_minutes || ' minutes')::interval > $2::time`,
      [date, time, durationMinutes]
    );
    return parseInt(result.rows[0].occupied);
  },

  async getTotalCapacity() {
    const result = await pool.query(
      'SELECT COALESCE(SUM(capacity), 0) as total FROM restaurant_tables WHERE is_active = true'
    );
    return parseInt(result.rows[0].total);
  },
};

module.exports = tableRepository;

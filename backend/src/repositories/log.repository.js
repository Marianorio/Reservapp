const pool = require('../config/database');

const logRepository = {
  async create({ reservation_id, action, changes }) {
    const result = await pool.query(
      `INSERT INTO reservation_logs (reservation_id, action, changes)
       VALUES ($1, $2, $3) RETURNING *`,
      [reservation_id, action, changes ? JSON.stringify(changes) : null]
    );
    return result.rows[0];
  },

  async findByReservationId(reservationId) {
    const result = await pool.query(
      'SELECT * FROM reservation_logs WHERE reservation_id = $1 ORDER BY created_at ASC',
      [reservationId]
    );
    return result.rows;
  },
};

module.exports = logRepository;

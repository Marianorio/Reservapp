const pool = require('../config/database');

const reservationRepository = {
  async findAll({ date, customer_name, phone, status_id, guest_count, user_id, page, limit, sortBy, sortOrder }) {
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (user_id) {
      conditions.push(`r.user_id = $${paramIndex++}`);
      params.push(user_id);
    }
    if (date) {
      conditions.push(`r.reservation_date = $${paramIndex++}`);
      params.push(date);
    }
    if (customer_name) {
      conditions.push(`c.name ILIKE $${paramIndex++}`);
      params.push(`%${customer_name}%`);
    }
    if (phone) {
      conditions.push(`c.phone ILIKE $${paramIndex++}`);
      params.push(`%${phone}%`);
    }
    if (status_id) {
      conditions.push(`r.status_id = $${paramIndex++}`);
      params.push(status_id);
    }
    if (guest_count) {
      conditions.push(`r.guest_count = $${paramIndex++}`);
      params.push(guest_count);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const allowedSort = ['reservation_date', 'c.name', 'guest_count'];
    const sortColumn = allowedSort.includes(sortBy) ? sortBy : 'r.reservation_date';
    const order = sortOrder === 'asc' ? 'ASC' : 'DESC';

    const offset = (page - 1) * limit;

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM reservations r
       JOIN customers c ON r.customer_id = c.id
       ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const dataResult = await pool.query(
      `SELECT r.*, c.name AS customer_name, c.phone AS customer_phone,
       c.email AS customer_email, t.table_number, s.name AS status_name
       FROM reservations r
       JOIN customers c ON r.customer_id = c.id
       JOIN restaurant_tables t ON r.table_id = t.id
       JOIN reservation_status s ON r.status_id = s.id
       ${whereClause}
       ORDER BY ${sortColumn} ${order}, r.reservation_time ASC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, offset]
    );

    return { data: dataResult.rows, total, page, limit };
  },

  async findById(id) {
    const result = await pool.query(
      `SELECT r.*, c.name AS customer_name, c.phone AS customer_phone,
       c.email AS customer_email, t.table_number, s.name AS status_name
       FROM reservations r
       JOIN customers c ON r.customer_id = c.id
       JOIN restaurant_tables t ON r.table_id = t.id
       JOIN reservation_status s ON r.status_id = s.id
       WHERE r.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async findOverlapping(tableId, date, time, durationMinutes, excludeId) {
    const params = [tableId, date, time, durationMinutes];
    let excludeClause = '';
    if (excludeId) {
      excludeClause = 'AND r.id != $5';
      params.push(excludeId);
    }

    const result = await pool.query(
      `SELECT r.* FROM reservations r
       WHERE r.table_id = $1
       AND r.reservation_date = $2
       AND r.status_id IN (1, 4)
       AND r.reservation_time < $3::time + ($4 || ' minutes')::interval
       AND r.reservation_time + (r.duration_minutes || ' minutes')::interval > $3::time
       ${excludeClause}
       LIMIT 1`,
      params
    );
    return result.rows[0] || null;
  },

  async countByDateAndStatus(date, statusId) {
    const result = await pool.query(
      'SELECT COUNT(*) FROM reservations WHERE reservation_date = $1 AND status_id = $2',
      [date, statusId]
    );
    return parseInt(result.rows[0].count);
  },

  async countByDate(date) {
    const result = await pool.query(
      'SELECT COUNT(*) FROM reservations WHERE reservation_date = $1',
      [date]
    );
    return parseInt(result.rows[0].count);
  },

  async getDailySummary(date) {
    const result = await pool.query(
      `SELECT s.name AS status, COUNT(*) AS count
       FROM reservations r
       JOIN reservation_status s ON r.status_id = s.id
       WHERE r.reservation_date = $1
       GROUP BY s.name`,
      [date]
    );
    return result.rows;
  },

  async create({ user_id, customer_id, table_id, reservation_date, reservation_time, guest_count, special_requests, duration_minutes }) {
    const result = await pool.query(
      `INSERT INTO reservations (user_id, customer_id, table_id, status_id, reservation_date, reservation_time, guest_count, special_requests, duration_minutes)
       VALUES ($1, $2, $3, 1, $4, $5, $6, $7, $8) RETURNING *`,
      [user_id, customer_id, table_id, reservation_date, reservation_time, guest_count, special_requests, duration_minutes]
    );
    return result.rows[0];
  },

  async update(id, { customer_id, table_id, status_id, reservation_date, reservation_time, guest_count, special_requests, duration_minutes }) {
    const fields = [];
    const params = [];
    let paramIndex = 1;

    if (customer_id !== undefined) { fields.push(`customer_id = $${paramIndex++}`); params.push(customer_id); }
    if (table_id !== undefined) { fields.push(`table_id = $${paramIndex++}`); params.push(table_id); }
    if (status_id !== undefined) { fields.push(`status_id = $${paramIndex++}`); params.push(status_id); }
    if (reservation_date !== undefined) { fields.push(`reservation_date = $${paramIndex++}`); params.push(reservation_date); }
    if (reservation_time !== undefined) { fields.push(`reservation_time = $${paramIndex++}`); params.push(reservation_time); }
    if (guest_count !== undefined) { fields.push(`guest_count = $${paramIndex++}`); params.push(guest_count); }
    if (special_requests !== undefined) { fields.push(`special_requests = $${paramIndex++}`); params.push(special_requests); }
    if (duration_minutes !== undefined) { fields.push(`duration_minutes = $${paramIndex++}`); params.push(duration_minutes); }

    if (fields.length === 0) return null;

    params.push(id);
    const result = await pool.query(
      `UPDATE reservations SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`,
      params
    );
    return result.rows[0] || null;
  },

  async delete(id) {
    const result = await pool.query(
      'UPDATE reservations SET status_id = 2, updated_at = NOW() WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0] || null;
  },
};

module.exports = reservationRepository;

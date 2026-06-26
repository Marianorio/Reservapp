const pool = require('../config/database');

const customerRepository = {
  async findByPhone(phone) {
    const result = await pool.query(
      'SELECT * FROM customers WHERE phone = $1',
      [phone]
    );
    return result.rows[0] || null;
  },

  async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM customers WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  },

  async findById(id) {
    const result = await pool.query(
      'SELECT * FROM customers WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  async create({ name, phone, email }) {
    const result = await pool.query(
      `INSERT INTO customers (name, phone, email)
       VALUES ($1, $2, $3) RETURNING *`,
      [name, phone, email]
    );
    return result.rows[0];
  },

  async update(id, { name, phone, email }) {
    const result = await pool.query(
      `UPDATE customers SET name = COALESCE($1, name),
       phone = COALESCE($2, phone), email = COALESCE($3, email)
       WHERE id = $4 RETURNING *`,
      [name, phone, email, id]
    );
    return result.rows[0] || null;
  },
};

module.exports = customerRepository;

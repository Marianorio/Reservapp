const pool = require('../config/database');

const userRepository = {
  async findByEmail(email) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  },

  async findById(id) {
    const result = await pool.query('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findByGoogleId(googleId) {
    const result = await pool.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
    return result.rows[0] || null;
  },

  async create({ name, email, password, googleId, role }) {
    const result = await pool.query(
      `INSERT INTO users (name, email, password, google_id, role)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, created_at`,
      [name, email, password || null, googleId || null, role || 'user']
    );
    return result.rows[0];
  },
};

module.exports = userRepository;

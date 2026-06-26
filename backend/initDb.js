const pool = require('./db');

const createTableSQL = `
  CREATE TABLE IF NOT EXISTS reservations (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    guest_count INTEGER NOT NULL CHECK (guest_count >= 1),
    special_requests TEXT,
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

const createIndexesSQL = `
  CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(reservation_date);
  CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
`;

async function initDatabase() {
  try {
    await pool.query(createTableSQL);
    await pool.query(createIndexesSQL);
    console.log('Base de datos inicializada correctamente');
  } catch (err) {
    console.error('Error al inicializar la base de datos:', err.message);
    console.log('Asegúrate de que PostgreSQL esté corriendo y configurado correctamente.');
    process.exit(1);
  }
}

module.exports = initDatabase;

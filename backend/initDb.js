const pool = require('./src/config/database');
const logger = require('./src/config/logger');
const bcrypt = require('bcryptjs');

const migrate = `
  DROP TABLE IF EXISTS reservation_logs CASCADE;
  DROP TABLE IF EXISTS reservations CASCADE;
  DROP TABLE IF EXISTS reservation_status CASCADE;
  DROP TABLE IF EXISTS restaurant_tables CASCADE;
  DROP TABLE IF EXISTS customers CASCADE;
  DROP TABLE IF EXISTS users CASCADE;
`;

const schema = `
  CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255),
    google_id VARCHAR(255) UNIQUE,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE restaurant_tables (
    id SERIAL PRIMARY KEY,
    table_number INTEGER NOT NULL UNIQUE,
    capacity INTEGER NOT NULL CHECK (capacity >= 1),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE reservation_status (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE
  );

  INSERT INTO reservation_status (id, name) VALUES
    (1, 'confirmed'), (2, 'cancelled'), (3, 'completed'), (4, 'no_show');

  CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    table_id INTEGER NOT NULL REFERENCES restaurant_tables(id),
    status_id INTEGER NOT NULL DEFAULT 1 REFERENCES reservation_status(id),
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    guest_count INTEGER NOT NULL CHECK (guest_count >= 1),
    special_requests TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 90,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE reservation_logs (
    id SERIAL PRIMARY KEY,
    reservation_id INTEGER NOT NULL REFERENCES reservations(id),
    action VARCHAR(50) NOT NULL,
    changes JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX idx_users_email ON users(email);
  CREATE INDEX idx_reservations_date ON reservations(reservation_date);
  CREATE INDEX idx_reservations_user ON reservations(user_id);
  CREATE INDEX idx_reservations_customer ON reservations(customer_id);
  CREATE INDEX idx_reservations_table ON reservations(table_id);
  CREATE INDEX idx_reservations_status ON reservations(status_id);
  CREATE INDEX idx_logs_reservation ON reservation_logs(reservation_id);
`;

const seedData = `
  INSERT INTO restaurant_tables (table_number, capacity) VALUES
    (1, 2), (2, 2), (3, 4), (4, 4), (5, 4),
    (6, 6), (7, 6), (8, 8), (9, 2), (10, 4),
    (11, 4), (12, 6), (13, 2), (14, 2), (15, 8);
`;

async function initDatabase() {
  try {
    logger.info('Migrando esquema de base de datos...');
    await pool.query(migrate);
    await pool.query(schema);
    await pool.query(seedData);

    const hash = await bcrypt.hash('admin', 10);
    await pool.query(
      `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING`,
      ['Admin', 'admin@admin.com', hash, 'admin']
    );
    logger.info('Usuario admin creado (admin@admin.com / admin)');

    logger.info('Base de datos inicializada correctamente');
  } catch (err) {
    logger.error('Error al inicializar la base de datos:', err.message);
    throw err;
  }
}

module.exports = initDatabase;

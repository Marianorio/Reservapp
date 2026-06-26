const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./db');
const initDatabase = require('./initDb');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/reservations', async (req, res) => {
  try {
    const { date } = req.query;
    let query = 'SELECT * FROM reservations WHERE status = $1 ORDER BY reservation_date, reservation_time';
    let params = ['confirmed'];

    if (date) {
      query = 'SELECT * FROM reservations WHERE status = $1 AND reservation_date = $2 ORDER BY reservation_time';
      params = ['confirmed', date];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener reservas:', err);
    res.status(500).json({ error: 'Error al obtener reservas' });
  }
});

app.post('/api/reservations', async (req, res) => {
  try {
    const { customer_name, phone, email, reservation_date, reservation_time, guest_count, special_requests } = req.body;

    if (!customer_name || !phone || !email || !reservation_date || !reservation_time || !guest_count) {
      return res.status(400).json({ error: 'Todos los campos obligatorios deben ser completados' });
    }

    const result = await pool.query(
      `INSERT INTO reservations (customer_name, phone, email, reservation_date, reservation_time, guest_count, special_requests)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [customer_name, phone, email, reservation_date, reservation_time, guest_count, special_requests || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al crear reserva:', err);
    res.status(500).json({ error: 'Error al crear la reserva' });
  }
});

app.delete('/api/reservations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE reservations SET status = $1 WHERE id = $2 RETURNING *',
      ['cancelled', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    res.json({ message: 'Reserva cancelada exitosamente' });
  } catch (err) {
    console.error('Error al cancelar reserva:', err);
    res.status(500).json({ error: 'Error al cancelar la reserva' });
  }
});

initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Reservapp corriendo en http://localhost:${PORT}`);
  });
});

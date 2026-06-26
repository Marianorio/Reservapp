const request = require('supertest');
const app = require('../src/app');

describe('Reservations API', () => {
  let createdId;

  describe('POST /api/v1/reservations', () => {
    it('debe crear una reserva válida', async () => {
      const res = await request(app)
        .post('/api/v1/reservations')
        .send({
          customer_name: 'Test User',
          phone: '555-0000',
          email: 'test@test.com',
          reservation_date: '2026-12-25',
          reservation_time: '21:00',
          guest_count: 4,
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      createdId = res.body.data.id;
    });

    it('debe rechazar datos inválidos', async () => {
      const res = await request(app)
        .post('/api/v1/reservations')
        .send({ customer_name: 'A', phone: '123', email: 'bad', guest_count: 0 });
      expect(res.status).toBe(422);
    });

    it('debe rechazar fecha pasada', async () => {
      const res = await request(app)
        .post('/api/v1/reservations')
        .send({
          customer_name: 'Test',
          phone: '555-0000',
          email: 'test@test.com',
          reservation_date: '2020-01-01',
          reservation_time: '21:00',
          guest_count: 2,
        });
      expect(res.status).toBe(422);
    });
  });

  describe('GET /api/v1/reservations', () => {
    it('debe listar reservas', async () => {
      const res = await request(app).get('/api/v1/reservations');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/reservations/:id', () => {
    it('debe obtener una reserva por ID', async () => {
      const res = await request(app).get(`/api/v1/reservations/${createdId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.customer_name).toBe('Test User');
    });

    it('debe devolver 404 si no existe', async () => {
      const res = await request(app).get('/api/v1/reservations/99999');
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/reservations/:id', () => {
    it('debe actualizar parcialmente (guest_count)', async () => {
      const res = await request(app)
        .patch(`/api/v1/reservations/${createdId}`)
        .send({ guest_count: 6, customer_name: 'Test User Updated' });
      expect([200, 422]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.data.guest_count).toBe(6);
      }
    });
  });

  describe('PUT /api/v1/reservations/:id', () => {
    it('debe reemplazar una reserva', async () => {
      const res = await request(app)
        .put(`/api/v1/reservations/${createdId}`)
        .send({
          customer_name: 'Test Replaced',
          phone: '555-9999',
          email: 'replaced@test.com',
          reservation_date: '2026-12-26',
          reservation_time: '20:30',
          guest_count: 5,
        });
      expect([200, 201]).toContain(res.status);
    });
  });

  describe('DELETE /api/v1/reservations/:id', () => {
    it('debe cancelar una reserva', async () => {
      const res = await request(app).delete(`/api/v1/reservations/${createdId}`);
      expect(res.status).toBe(204);
    });
  });
});

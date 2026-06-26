const request = require('supertest');
const app = require('../src/app');
const initDatabase = require('../initDb');

describe('Reservations API', () => {
  let userToken;
  let adminToken;
  let createdId;

  beforeAll(async () => {
    await initDatabase();
    const userRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Test User', email: 'testuser@test.com', password: '123456' });
    userToken = userRes.body.token;

    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@admin.com', password: 'admin' });
    adminToken = adminRes.body.token;
  });

  describe('POST /api/v1/reservations', () => {
    it('debe rechazar sin token', async () => {
      const res = await request(app)
        .post('/api/v1/reservations')
        .send({ customer_name: 'Test', phone: '555-0000', email: 't@t.com', reservation_date: '2026-12-25', reservation_time: '21:00', guest_count: 2 });
      expect(res.status).toBe(401);
    });

    it('debe crear una reserva con token de admin', async () => {
      const res = await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ customer_name: 'Admin Test', phone: '555-1111', email: 'admin@test.com', reservation_date: '2026-12-25', reservation_time: '21:00', guest_count: 4 });
      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
      createdId = res.body.data.id;
    });

    it('debe rechazar datos inválidos', async () => {
      const res = await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ customer_name: 'A', phone: '123', email: 'bad', guest_count: 0 });
      expect([422, 401]).toContain(res.status);
    });
  });

  describe('GET /api/v1/reservations', () => {
    it('debe listar reservas (admin)', async () => {
      const res = await request(app)
        .get('/api/v1/reservations')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/reservations/:id', () => {
    it('debe obtener una reserva por ID', async () => {
      const res = await request(app)
        .get(`/api/v1/reservations/${createdId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('debe devolver 404 si no existe', async () => {
      const res = await request(app)
        .get('/api/v1/reservations/99999')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/reservations/:id', () => {
    it('debe cancelar una reserva', async () => {
      const res = await request(app)
        .delete(`/api/v1/reservations/${createdId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(204);
    });
  });
});

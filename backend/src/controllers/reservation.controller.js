const reservationService = require('../services/reservation.service');

const reservationController = {
  async list(req, res, next) {
    try {
      const result = await reservationService.list(req.query);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const reservation = await reservationService.getById(req.params.id);
      res.json({ success: true, data: reservation });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const reservation = await reservationService.create(req.body);
      res.status(201).json({ success: true, data: reservation });
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const reservation = await reservationService.update(req.params.id, req.body);
      res.json({ success: true, data: reservation });
    } catch (err) {
      next(err);
    }
  },

  async replace(req, res, next) {
    try {
      const reservation = await reservationService.update(req.params.id, req.body);
      res.json({ success: true, data: reservation });
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      await reservationService.delete(req.params.id);
      res.status(204).json({ success: true, message: 'Reserva cancelada exitosamente' });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = reservationController;

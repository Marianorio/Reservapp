const reservationService = require('../services/reservation.service');

const reservationController = {
  async list(req, res, next) {
    try {
      const result = await reservationService.list(req.query, req.user);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const reservation = await reservationService.getById(parseInt(req.params.id), req.user);
      res.json({ success: true, data: reservation });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const reservation = await reservationService.create(req.body, req.user);
      res.status(201).json({ success: true, data: reservation });
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const reservation = await reservationService.update(parseInt(req.params.id), req.body, req.user);
      res.json({ success: true, data: reservation });
    } catch (err) {
      next(err);
    }
  },

  async replace(req, res, next) {
    try {
      const reservation = await reservationService.update(parseInt(req.params.id), req.body, req.user);
      res.json({ success: true, data: reservation });
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      await reservationService.delete(parseInt(req.params.id), req.user);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
};

module.exports = reservationController;

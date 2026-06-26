const authService = require('../services/auth.service');

const authController = {
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const result = await authService.login(req.body);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  async google(req, res, next) {
    try {
      const result = await authService.googleLogin(req.body.credential);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  async me(req, res, next) {
    try {
      const user = await authService.me(req.user.id);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = authController;

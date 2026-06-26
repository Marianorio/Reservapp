const logger = require('../config/logger');

const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Solicitud procesada', {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
    });
  });
  next();
};

module.exports = requestLogger;

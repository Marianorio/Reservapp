const logger = require('../config/logger');

const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Error interno del servidor';

  if (!err.isOperational) {
    logger.error('Error inesperado:', { error: err.message, stack: err.stack, path: req.originalUrl, method: req.method });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;

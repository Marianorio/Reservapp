const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

const JWT_SECRET = process.env.JWT_SECRET || 'reservapp-secret-key-change-in-production';

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function verifyToken(req, _res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new AppError('Token de autenticación requerido', 401));
  }
  try {
    const token = header.split(' ')[1];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return next(new AppError('Token inválido o expirado', 401));
  }
}

function adminOnly(req, _res, next) {
  if (req.user.role !== 'admin') {
    return next(new AppError('Acceso denegado. Se requieren permisos de administrador', 403));
  }
  next();
}

module.exports = { generateToken, verifyToken, adminOnly, JWT_SECRET };

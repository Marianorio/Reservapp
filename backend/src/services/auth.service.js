const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/user.repository');
const { generateToken } = require('../middlewares/auth');
const AppError = require('../utils/AppError');

const authService = {
  async register({ name, email, password }) {
    const existing = await userRepository.findByEmail(email);
    if (existing) throw new AppError('El correo ya está registrado', 409);

    const hash = await bcrypt.hash(password, 10);
    const user = await userRepository.create({ name, email, password: hash, role: 'user' });

    const token = generateToken(user);
    return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
  },

  async login({ email, password }) {
    const user = await userRepository.findByEmail(email);
    if (!user) throw new AppError('Credenciales inválidas', 401);

    if (!user.password) throw new AppError('Esta cuenta usa Google. Inicia sesión con Google.', 401);

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new AppError('Credenciales inválidas', 401);

    const token = generateToken(user);
    return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
  },

  async googleLogin(credential) {
    try {
      const { OAuth2Client } = require('google-auth-library');
      const clientId = process.env.GOOGLE_CLIENT_ID;

      if (!clientId) {
        throw new AppError('Google login no configurado. Contacte al administrador.', 501);
      }

      const client = new OAuth2Client(clientId);
      const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
      const payload = ticket.getPayload();

      const email = payload.email;
      const name = payload.name || email.split('@')[0];
      const googleId = payload.sub;

      let user = await userRepository.findByGoogleId(googleId);
      if (!user) {
        const existingByEmail = await userRepository.findByEmail(email);
        if (existingByEmail) {
          throw new AppError('El correo ya está registrado con otra cuenta', 409);
        }
        user = await userRepository.create({ name, email, googleId, role: 'user' });
      }

      const token = generateToken(user);
      return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
    } catch (err) {
      if (err.isOperational) throw err;
      throw new AppError('Error al verificar credencial de Google', 401);
    }
  },

  async me(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('Usuario no encontrado', 404);
    return user;
  },
};

module.exports = authService;

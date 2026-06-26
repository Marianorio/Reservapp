const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(100),
  email: z.string().email('El correo electrónico no es válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').max(100),
});

const loginSchema = z.object({
  email: z.string().email('El correo electrónico no es válido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

const googleSchema = z.object({
  credential: z.string().min(1, 'Credencial de Google requerida'),
});

module.exports = { registerSchema, loginSchema, googleSchema };

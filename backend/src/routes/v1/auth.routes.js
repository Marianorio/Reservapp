const express = require('express');
const router = express.Router();
const authController = require('../../controllers/auth.controller');
const validate = require('../../middlewares/validate');
const { verifyToken } = require('../../middlewares/auth');
const { registerSchema, loginSchema, googleSchema } = require('../../validators/auth.validator');

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     summary: Registrar nuevo usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       201: { description: Usuario registrado }
 *       409: { description: Email ya registrado }
 */
router.post('/register', validate(registerSchema), authController.register);

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Auth]
 *     responses:
 *       200: { description: Token JWT }
 *       401: { description: Credenciales inválidas }
 */
router.post('/login', validate(loginSchema), authController.login);

/**
 * @openapi
 * /api/v1/auth/google:
 *   post:
 *     summary: Iniciar sesión con Google
 *     tags: [Auth]
 *     responses:
 *       200: { description: Token JWT }
 */
router.post('/google', validate(googleSchema), authController.google);

/**
 * @openapi
 * /api/v1/auth/me:
 *   get:
 *     summary: Obtener usuario actual
 *     tags: [Auth]
 *     responses:
 *       200: { description: Datos del usuario }
 */
router.get('/me', verifyToken, authController.me);

module.exports = router;

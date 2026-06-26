const express = require('express');
const router = express.Router();
const reservationController = require('../../controllers/reservation.controller');
const validate = require('../../middlewares/validate');
const { createReservationSchema, updateReservationSchema, querySchema } = require('../../validators/reservation.validator');

/**
 * @openapi
 * components:
 *   schemas:
 *     Reservation:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         customer_name: { type: string }
 *         phone: { type: string }
 *         email: { type: string }
 *         reservation_date: { type: string, format: date }
 *         reservation_time: { type: string }
 *         guest_count: { type: integer }
 *         special_requests: { type: string, nullable: true }
 *         status: { type: string }
 *         table_number: { type: integer }
 */

/**
 * @openapi
 * /api/v1/reservations:
 *   get:
 *     summary: Listar reservas
 *     tags: [Reservations]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Lista paginada de reservas
 */
router.get('/', validate(querySchema, 'query'), reservationController.list);

/**
 * @openapi
 * /api/v1/reservations/{id}:
 *   get:
 *     summary: Obtener reserva por ID
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Datos de la reserva
 *       404:
 *         description: Reserva no encontrada
 */
router.get('/:id', reservationController.getById);

/**
 * @openapi
 * /api/v1/reservations:
 *   post:
 *     summary: Crear nueva reserva
 *     tags: [Reservations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Reservation'
 *     responses:
 *       201:
 *         description: Reserva creada
 *       422:
 *         description: Error de validación
 *       409:
 *         description: Conflicto - mesa no disponible
 */
router.post('/', validate(createReservationSchema), reservationController.create);

/**
 * @openapi
 * /api/v1/reservations/{id}:
 *   put:
 *     summary: Reemplazar reserva completamente
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Reserva actualizada
 */
router.put('/:id', validate(createReservationSchema), reservationController.replace);

/**
 * @openapi
 * /api/v1/reservations/{id}:
 *   patch:
 *     summary: Actualizar parcialmente una reserva
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Reserva actualizada
 */
router.patch('/:id', validate(updateReservationSchema), reservationController.update);

/**
 * @openapi
 * /api/v1/reservations/{id}:
 *   delete:
 *     summary: Cancelar una reserva
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204:
 *         description: Reserva cancelada
 */
router.delete('/:id', reservationController.delete);

module.exports = router;

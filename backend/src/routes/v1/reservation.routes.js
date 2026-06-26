const express = require('express');
const router = express.Router();
const reservationController = require('../../controllers/reservation.controller');
const validate = require('../../middlewares/validate');
const { verifyToken } = require('../../middlewares/auth');
const { createReservationSchema, updateReservationSchema, querySchema } = require('../../validators/reservation.validator');

router.get('/', verifyToken, validate(querySchema, 'query'), reservationController.list);
router.get('/:id', verifyToken, reservationController.getById);
router.post('/', verifyToken, validate(createReservationSchema), reservationController.create);
router.put('/:id', verifyToken, validate(createReservationSchema), reservationController.replace);
router.patch('/:id', verifyToken, validate(updateReservationSchema), reservationController.update);
router.delete('/:id', verifyToken, reservationController.delete);

module.exports = router;

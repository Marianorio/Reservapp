const express = require('express');
const router = express.Router();

router.use('/v1/auth', require('./v1/auth.routes'));
router.use('/v1/reservations', require('./v1/reservation.routes'));

module.exports = router;

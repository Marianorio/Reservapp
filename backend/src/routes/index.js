const express = require('express');
const router = express.Router();

router.use('/v1/reservations', require('./v1/reservation.routes'));

module.exports = router;

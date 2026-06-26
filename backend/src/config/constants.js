const RESTAURANT = {
  name: 'Reservapp Restaurant',
  maxCapacity: 100,
  defaultDuration: 90,
  openingHours: [
    { day: 1, start: '12:00', end: '15:00' },
    { day: 1, start: '20:00', end: '23:59' },
    { day: 2, start: '12:00', end: '15:00' },
    { day: 2, start: '20:00', end: '23:59' },
    { day: 3, start: '12:00', end: '15:00' },
    { day: 3, start: '20:00', end: '23:59' },
    { day: 4, start: '12:00', end: '15:00' },
    { day: 4, start: '20:00', end: '23:59' },
    { day: 5, start: '12:00', end: '15:00' },
    { day: 5, start: '20:00', end: '23:59' },
    { day: 6, start: '12:00', end: '16:00' },
    { day: 6, start: '20:00', end: '23:59' },
    { day: 0, start: '12:00', end: '16:00' },
    { day: 0, start: '20:00', end: '23:00' },
  ],
};

const PAGINATION = {
  defaultPage: 1,
  defaultLimit: 20,
  maxLimit: 100,
};

const RESERVATION_STATUS = {
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  NO_SHOW: 'no_show',
};

module.exports = { RESTAURANT, PAGINATION, RESERVATION_STATUS };

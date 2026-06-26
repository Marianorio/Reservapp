const reservationRepository = require('../repositories/reservation.repository');
const customerRepository = require('../repositories/customer.repository');
const tableRepository = require('../repositories/table.repository');
const logRepository = require('../repositories/log.repository');
const AppError = require('../utils/AppError');
const { RESTAURANT, RESERVATION_STATUS } = require('../config/constants');

function isValidTime(date, time) {
  const day = new Date(date + 'T00:00:00').getDay();
  const timeStr = time.slice(0, 5);
  return RESTAURANT.openingHours.some((slot) => {
    if (slot.day !== day) return false;
    return timeStr >= slot.start && timeStr < slot.end;
  });
}

const reservationService = {
  async list(query) {
    const page = parseInt(query.page) || 1;
    const limit = Math.min(parseInt(query.limit) || 20, 100);
    const sortBy = query.sortBy || 'reservation_date';
    const sortOrder = query.sortOrder || 'desc';
    const status_id = query.status_id ? parseInt(query.status_id) : undefined;

    return reservationRepository.findAll({
      date: query.date,
      customer_name: query.customer_name,
      phone: query.phone,
      status_id,
      guest_count: query.guest_count ? parseInt(query.guest_count) : undefined,
      page,
      limit,
      sortBy,
      sortOrder,
    });
  },

  async getById(id) {
    const reservation = await reservationRepository.findById(id);
    if (!reservation) throw new AppError('Reserva no encontrada', 404);
    return reservation;
  },

  async create(data) {
    if (!isValidTime(data.reservation_date, data.reservation_time)) {
      throw new AppError('La hora seleccionada está fuera del horario de atención', 422);
    }

    let customer = await customerRepository.findByPhone(data.phone);
    if (customer) {
      await customerRepository.update(customer.id, {
        name: data.customer_name,
        email: data.email,
        phone: data.phone,
      });
    } else {
      customer = await customerRepository.create({
        name: data.customer_name,
        phone: data.phone,
        email: data.email,
      });
    }

    const totalCapacity = await tableRepository.getTotalCapacity();
    const occupiedCapacity = await tableRepository.getOccupiedCapacity(
      data.reservation_date, data.reservation_time, RESTAURANT.defaultDuration
    );

    if (occupiedCapacity + data.guest_count > totalCapacity) {
      throw new AppError(
        'El restaurante ha alcanzado su capacidad máxima en este horario',
        409
      );
    }

    const table = await tableRepository.findAvailable(
      data.reservation_date, data.reservation_time, data.guest_count, RESTAURANT.defaultDuration
    );

    if (!table) {
      throw new AppError(
        'No hay mesas disponibles para la cantidad de personas en el horario solicitado',
        409
      );
    }

    const existing = await reservationRepository.findOverlapping(
      table.id, data.reservation_date, data.reservation_time, RESTAURANT.defaultDuration
    );

    if (existing) {
      throw new AppError('Ya existe una reserva en esa mesa en el mismo horario', 409);
    }

    const reservation = await reservationRepository.create({
      customer_id: customer.id,
      table_id: table.id,
      reservation_date: data.reservation_date,
      reservation_time: data.reservation_time,
      guest_count: data.guest_count,
      special_requests: data.special_requests || null,
      duration_minutes: RESTAURANT.defaultDuration,
    });

    await logRepository.create({
      reservation_id: reservation.id,
      action: 'created',
      changes: data,
    });

    return reservationRepository.findById(reservation.id);
  },

  async update(id, data) {
    const existing = await reservationRepository.findById(id);
    if (!existing) throw new AppError('Reserva no encontrada', 404);

    const updates = {};

    if (data.customer_name || data.phone || data.email) {
      const customer = await customerRepository.findById(existing.customer_id);
      if (customer) {
        await customerRepository.update(customer.id, {
          name: data.customer_name || customer.name,
          phone: data.phone || customer.phone,
          email: data.email || customer.email,
        });
      }
    }

    if (data.reservation_date || data.reservation_time || data.guest_count) {
      const date = data.reservation_date || existing.reservation_date;
      const time = data.reservation_time || existing.reservation_time;

      if (!isValidTime(date, time)) {
        throw new AppError('La hora seleccionada está fuera del horario de atención', 422);
      }

      const table = await tableRepository.findAvailable(date, time, data.guest_count || existing.guest_count, RESTAURANT.defaultDuration);
      if (!table) throw new AppError('No hay mesas disponibles para la nueva configuración', 409);

      updates.table_id = table.id;

      const overlapping = await reservationRepository.findOverlapping(table.id, date, time, RESTAURANT.defaultDuration, id);
      if (overlapping) throw new AppError('Conflicto de horario con otra reserva', 409);
    }

    if (data.reservation_date !== undefined) updates.reservation_date = data.reservation_date;
    if (data.reservation_time !== undefined) updates.reservation_time = data.reservation_time;
    if (data.guest_count !== undefined) updates.guest_count = data.guest_count;
    if (data.special_requests !== undefined) updates.special_requests = data.special_requests;
    if (data.status_id !== undefined) updates.status_id = data.status_id;

    const reservation = await reservationRepository.update(id, updates);

    await logRepository.create({
      reservation_id: id,
      action: 'updated',
      changes: updates,
    });

    return reservationRepository.findById(reservation.id);
  },

  async delete(id) {
    const existing = await reservationRepository.findById(id);
    if (!existing) throw new AppError('Reserva no encontrada', 404);

    const reservation = await reservationRepository.delete(id);

    await logRepository.create({
      reservation_id: id,
      action: 'cancelled',
      changes: { status: RESERVATION_STATUS.CANCELLED },
    });

    return reservation;
  },

  async getDailySummary(date) {
    const summary = await reservationRepository.getDailySummary(date);
    const total = summary.reduce((acc, s) => acc + parseInt(s.count), 0);
    return { date, total, details: summary };
  },
};

module.exports = reservationService;

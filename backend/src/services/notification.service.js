const logger = require('../config/logger');

class NotificationService {
  async sendEmail(to, subject, body) {
    logger.info(`[Email pendiente] Para: ${to}, Asunto: ${subject}`);
    throw new Error('Servicio de email no implementado');
  }

  async sendWhatsApp(to, message) {
    logger.info(`[WhatsApp pendiente] Para: ${to}, Mensaje: ${message}`);
    throw new Error('Servicio de WhatsApp no implementado');
  }

  async sendSMS(to, message) {
    logger.info(`[SMS pendiente] Para: ${to}, Mensaje: ${message}`);
    throw new Error('Servicio de SMS no implementado');
  }

  async sendConfirmation(reservation, customer) {
    const message = `Reserva confirmada para ${customer.name} el ${reservation.reservation_date} a las ${reservation.reservation_time}. Mesa ${reservation.table_number}.`;
    logger.info(`Notificación pendiente: ${message}`);
  }

  async sendCancellation(reservation, customer) {
    const message = `Reserva cancelada para ${customer.name} el ${reservation.reservation_date}.`;
    logger.info(`Notificación pendiente: ${message}`);
  }
}

module.exports = new NotificationService();

const { z } = require('zod');

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const phoneRegex = /^[\d\s\-+()]{7,20}$/;
const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;

const createReservationSchema = z.object({
  customer_name: z.string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre debe tener máximo 100 caracteres')
    .regex(nameRegex, 'El nombre contiene caracteres no válidos'),
  phone: z.string()
    .regex(phoneRegex, 'El teléfono debe tener un formato válido (7-20 dígitos)'),
  email: z.string()
    .email('El correo electrónico no es válido'),
  reservation_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD')
    .refine((date) => {
      const d = new Date(date + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return d >= today;
    }, 'No se permiten reservas en fechas pasadas'),
  reservation_time: z.string()
    .regex(timeRegex, 'La hora debe tener formato HH:MM'),
  guest_count: z.number().int()
    .min(1, 'Debe haber al menos 1 persona')
    .max(20, 'Máximo 20 personas por reserva'),
  special_requests: z.string().max(500, 'Máximo 500 caracteres').optional().nullable(),
});

const updateReservationSchema = z.object({
  customer_name: z.string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre debe tener máximo 100 caracteres')
    .regex(nameRegex, 'El nombre contiene caracteres no válidos')
    .optional(),
  phone: z.string()
    .regex(phoneRegex, 'El teléfono debe tener un formato válido')
    .optional(),
  email: z.string()
    .email('El correo electrónico no es válido')
    .optional(),
  reservation_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD')
    .refine((date) => {
      const d = new Date(date + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return d >= today;
    }, 'No se permiten reservas en fechas pasadas')
    .optional(),
  reservation_time: z.string()
    .regex(timeRegex, 'La hora debe tener formato HH:MM')
    .optional(),
  guest_count: z.number().int()
    .min(1, 'Debe haber al menos 1 persona')
    .max(20, 'Máximo 20 personas por reserva')
    .optional(),
  special_requests: z.string().max(500, 'Máximo 500 caracteres').optional().nullable(),
  status_id: z.number().int().min(1).max(4).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Debe enviar al menos un campo para actualizar',
});

const querySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido').optional(),
  customer_name: z.string().optional(),
  phone: z.string().optional(),
  status_id: z.string().optional(),
  guest_count: z.string().optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
  sortBy: z.enum(['reservation_date', 'customer_name', 'guest_count']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

module.exports = { createReservationSchema, updateReservationSchema, querySchema };

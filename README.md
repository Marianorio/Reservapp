# Reservapp

Sistema de gestión de reservas para restaurantes. Backend en Node.js + Express con PostgreSQL y frontend responsive con Bootstrap 5.

## Tecnologías

- **Backend:** Node.js, Express, PostgreSQL (node-postgres), Zod, Winston, Swagger, Helmet
- **Frontend:** Bootstrap 5, JavaScript vanilla, Bootstrap Icons
- **Infra:** Docker, Docker Compose
- **Testing:** Jest + Supertest
- **Calidad:** ESLint + Prettier

## Arquitectura

```
src/
├── config/         # DB connection, logger, constants, Swagger
├── controllers/    # HTTP handlers (thin layer)
├── services/       # Business logic
├── repositories/   # Database access (SQL)
├── routes/v1/      # API versioned routes
├── middlewares/     # Validation, error handler, rate limiter, sanitize
├── validators/     # Zod schemas
├── utils/          # AppError class
└── server.js       # Entry point

public/             # Static frontend
```

## Instalación y ejecución

### Local

```bash
# Requisitos: Node.js 22+, PostgreSQL 18+

cd backend
cp .env.example .env   # Configurar DB_PASSWORD
npm install
npm start              # http://localhost:3000
```

### Docker

```bash
docker compose up
```

## API

Documentación interactiva: `http://localhost:3000/api/docs`

| Método | Ruta                    | Descripción            |
|--------|-------------------------|------------------------|
| GET    | /api/v1/reservations    | Listar (con filtros y paginación) |
| GET    | /api/v1/reservations/:id| Obtener por ID         |
| POST   | /api/v1/reservations    | Crear reserva          |
| PUT    | /api/v1/reservations/:id| Reemplazar             |
| PATCH  | /api/v1/reservations/:id| Actualización parcial  |
| DELETE | /api/v1/reservations/:id| Cancelar (soft-delete) |

### Parámetros de consulta (GET)

- `date`, `customer_name`, `phone`, `status_id`, `guest_count` — filtros
- `page`, `limit` — paginación
- `sortBy`, `sortOrder` — ordenamiento

## Scripts disponibles

```bash
npm start         # Iniciar servidor
npm run dev       # Modo desarrollo (--watch)
npm test          # Ejecutar tests
npm run lint      # ESLint
npm run format    # Prettier
```

## Funcionalidades

- Reserva con asignación automática de mesas según capacidad y disponibilidad
- Validación de horarios de atención (mediodía y noche)
- Control de capacidad máxima del restaurante
- Prevención de reservas duplicadas (misma mesa, fecha y hora)
- Historial de cambios (auditoría) en tabla reservation_logs
- Dashboard con estadísticas del día
- Vista calendario con navegación mensual
- Filtros combinados (fecha, nombre, teléfono, estado)
- Paginación y ordenamiento en listado
- Soft-delete (cancelación con estado)
- Arquitectura preparada para notificaciones (email, WhatsApp, SMS)

## Variables de entorno

| Variable       | Por defecto    | Descripción                    |
|----------------|----------------|--------------------------------|
| DB_HOST        | localhost      | Host de PostgreSQL             |
| DB_PORT        | 5432           | Puerto de PostgreSQL           |
| DB_NAME        | reservapp      | Nombre de la base de datos     |
| DB_USER        | postgres       | Usuario de PostgreSQL          |
| DB_PASSWORD    | postgres       | Contraseña de PostgreSQL       |
| PORT           | 3000           | Puerto del servidor Express    |
| CORS_ORIGIN    | *              | Origen permitido para CORS     |
| LOG_LEVEL      | info           | Nivel de log (Winston)         |
| NODE_ENV       | development    | Entorno de ejecución           |

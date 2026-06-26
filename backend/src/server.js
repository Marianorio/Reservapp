const app = require('./app');
const initDatabase = require('../initDb');
const logger = require('./config/logger');

const PORT = process.env.PORT || 3000;

initDatabase().then(() => {
  logger.info('Base de datos inicializada correctamente');
  app.listen(PORT, () => {
    logger.info(`Reservapp corriendo en http://localhost:${PORT}`);
    logger.info(`Documentación API: http://localhost:${PORT}/api/docs`);
  });
}).catch((err) => {
  logger.error('Error al iniciar la aplicación:', err);
  process.exit(1);
});

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const limiter = require('./middlewares/rateLimiter');
const sanitize = require('./middlewares/sanitize');
const requestLogger = require('./middlewares/requestLogger');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] }));
app.use(limiter);
app.use(express.json({ limit: '10kb' }));
app.use(sanitize);
app.use(requestLogger);

app.use('/api', routes);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: 'Reservapp API Docs' }));

app.use(express.static(path.join(__dirname, '..', '..', 'public')));

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'public', 'index.html'));
});

app.use(errorHandler);

module.exports = app;

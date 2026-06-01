const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');

const env = require('./config/env');
const logger = require('./utils/logger');
const { globalLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

const profilesRoutes = require('./routes/profiles.routes');
const healthRoutes = require('./routes/health.routes');
const swaggerSpec = require('./docs/swagger');

const app = express();
app.set('trust proxy', 1);
// Security and utility middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Morgan HTTP request logging using Winston as the stream destination
app.use(
  morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

// Mount Swagger Docs prior to global rate limiting
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Global Rate Limiter
app.use(globalLimiter);

// Mount main routers
app.use('/health', healthRoutes);
app.use('/api/profiles', profilesRoutes);

// 404 handler for unmatched routes
app.use((req, res, next) => {
  const AppError = require('./utils/AppError');
  next(new AppError(404, `Cannot ${req.method} ${req.originalUrl}`));
});

// Central Error Handler
app.use(errorHandler);

// Only listen if this file is run directly, allows supertest imports without locking ports
if (require.main === module) {
  app.listen(env.PORT, () => {
    logger.info(`🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    logger.info(`📝 Interactive API documentation live at http://localhost:${env.PORT}/api-docs`);
  });
}

module.exports = app;
app.get('/', (req, res) => {
  res.json({
    project: 'GitHub Profile Analyzer API',
    status: 'running',
    health: '/health',
    docs: '/api-docs'
  });
});

app.use(notFoundHandler);
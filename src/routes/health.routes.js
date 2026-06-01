const express = require('express');
const pool = require('../config/db');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Service health check
 *     description: Evaluates status of the API and direct connectivity to the MySQL database.
 *     responses:
 *       200:
 *         description: Service is healthy and connected to DB
 *       503:
 *         description: Database is down or unreachable
 */
router.get('/', async (req, res) => {
  try {
    // Quick test query to verify database connection pool viability
    await pool.execute('SELECT 1');

    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      db: 'connected',
    });
  } catch (err) {
    logger.error('Health check failed database connectivity test:', err);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      db: 'disconnected',
      message: 'Database check failed',
    });
  }
});

module.exports = router;

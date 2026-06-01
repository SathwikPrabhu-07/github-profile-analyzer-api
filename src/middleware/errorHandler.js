const logger = require('../utils/logger');

/**
 * Central Error Handler Middleware.
 * Standardizes API responses on errors, shields stack traces in production.
 */
function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;
  const message = err.statusCode ? err.message : 'Internal server error';

  // Log 5xx errors as errors, 4xx as warnings
  if (status >= 500) {
    logger.error(`Unhandleable Server Error: ${err.message}`, err);
  } else {
    logger.warn(`Client Error (${status}): ${err.message}`);
  }

  // Set response headers like Retry-After if provided in meta (e.g. rate limits)
  if (err.meta && err.meta.retry_after) {
    res.set('Retry-After', String(err.meta.retry_after));
  }

  const responseBody = {
    status: 'error',
    message,
  };

  // Only include extra metadata (like validation details or retry timing) if it exists
  if (err.meta && Object.keys(err.meta).length > 0) {
    Object.assign(responseBody, err.meta);
  }

  res.status(status).json(responseBody);
}

module.exports = errorHandler;

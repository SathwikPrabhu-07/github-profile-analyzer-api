/**
 * Custom application error with HTTP status code.
 * Used by services and middleware to throw typed, handleable errors.
 */
class AppError extends Error {
  /**
   * @param {number} statusCode - HTTP status code (e.g. 400, 404, 429, 500)
   * @param {string} message    - Human-readable error message
   * @param {object} meta       - Optional extra fields to include in the response
   */
  constructor(statusCode, message, meta = {}) {
    super(message);
    this.statusCode = statusCode;
    this.meta = meta;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;

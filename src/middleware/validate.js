const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

/**
 * Middleware that checks for express-validator results.
 * If validation fails, aborts request immediately with the first validation error.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstErrorMessage = errors.array()[0].msg;
    return next(new AppError(400, firstErrorMessage));
  }
  next();
}

module.exports = validate;

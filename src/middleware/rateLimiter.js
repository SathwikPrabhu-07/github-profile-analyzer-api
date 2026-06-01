const rateLimit = require('express-rate-limit');
const env = require('../config/env');
const AppError = require('../utils/AppError');

// Global rate limiter applied to all application routes
const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new AppError(429, 'Too many requests. Please try again later.'));
  },
});

// Stricter rate limiter specifically for POST /analyze because it calls external APIs
const analyzeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max 20 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new AppError(429, 'Profile analysis requests are heavily limited to prevent abuse. Retry in 15 minutes.'));
  },
});

module.exports = { globalLimiter, analyzeLimiter };

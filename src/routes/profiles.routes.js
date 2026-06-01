const express = require('express');
const { body, query, param } = require('express-validator');
const profilesController = require('../controllers/profiles.controller');
const validate = require('../middleware/validate');
const rateLimiter = require('../middleware/rateLimiter');

const router = express.Router();

// Username regex validation based on GitHub requirements:
// Alphanumeric or single hyphens, not starting or ending with a hyphen, max 39 chars.
const usernameRegex = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

/**
 * @swagger
 * /api/profiles/analyze:
 *   post:
 *     summary: Analyze and store a GitHub profile
 *     description: Fetches raw data for a username, runs metrics extraction, and stores/updates in database.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *             properties:
 *               username:
 *                 type: string
 *                 example: octocat
 *     responses:
 *       201:
 *         description: Profile successfully analyzed and created
 *       200:
 *         description: Profile successfully re-analyzed and updated
 *       400:
 *         description: Invalid input validation
 *       404:
 *         description: GitHub user not found
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Database or server failure
 */
router.post(
  '/analyze',
  rateLimiter.analyzeLimiter,
  body('username')
    .exists().withMessage('username is required')
    .isString().withMessage('username must be a string')
    .trim()
    .matches(usernameRegex).withMessage('Invalid GitHub username format'),
  validate,
  profilesController.analyze
);

/**
 * @swagger
 * /api/profiles:
 *   get:
 *     summary: Get all analyzed profiles
 *     description: Retrieve a paginated list of all previously analyzed profiles.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [analyzed_at, followers, total_stars, username]
 *           default: analyzed_at
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: List of profiles retrieved successfully
 *       400:
 *         description: Invalid query parameters
 */
router.get(
  '/',
  query('page').optional().isInt({ min: 1 }).withMessage('page must be an integer >= 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  query('sort').optional().isIn(['analyzed_at', 'followers', 'total_stars', 'username']).withMessage('invalid sort field'),
  query('order').optional().isIn(['asc', 'desc']).withMessage('order must be asc or desc'),
  validate,
  profilesController.getAll
);

/**
 * @swagger
 * /api/profiles/{username}:
 *   get:
 *     summary: Get profile by username
 *     description: Retrieves a single previously analyzed profile from the database.
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Profile found and returned
 *       404:
 *         description: Profile not yet analyzed
 */
router.get(
  '/:username',
  param('username')
    .trim()
    .matches(usernameRegex).withMessage('Invalid GitHub username format'),
  validate,
  profilesController.getOne
);

module.exports = router;

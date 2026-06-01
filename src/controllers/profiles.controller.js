/**
 * Profiles Controller — Orchestrates routes by calling appropriate services
 * and formatting responses. Keeps HTTP logic separate from business logic.
 */
const githubService = require('../services/github.service');
const analysisService = require('../services/analysis.service');
const profilesRepo = require('../repositories/profiles.repository');
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

/**
 * Trigger analysis of a GitHub profile.
 * Fetches user profile, repository list, computes metrics, and upserts.
 */
async function analyze(req, res, next) {
  try {
    const { username } = req.body;
    logger.info(`Starting analysis for username: ${username}`);

    // Fetch user and repos in parallel to optimize response time
    const [user, repos] = await Promise.all([
      githubService.fetchUser(username),
      githubService.fetchRepos(username),
    ]);

    // Compute derived metrics
    const analyzedData = analysisService.computeMetrics(user, repos);

    // Upsert database record
    const { id, isNew } = await profilesRepo.upsert(analyzedData);
    logger.info(`Successfully analyzed profile for ${username}. Row ID: ${id}. isNew: ${isNew}`);

    // Fetch final record from database to return the exact representation stored
    const finalProfile = await profilesRepo.findByUsername(username);

    res.status(isNew ? 201 : 200).json({
      status: 'success',
      data: finalProfile,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Fetch all analyzed profiles with pagination, sorting, and ordering.
 */
async function getAll(req, res, next) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const sort = req.query.sort || 'analyzed_at';
    const order = req.query.order || 'desc';

    logger.debug(`Fetching analyzed profiles. Page: ${page}, Limit: ${limit}, Sort: ${sort}, Order: ${order}`);

    const { rows, total } = await profilesRepo.findAll({ page, limit, sort, order });

    res.status(200).json({
      status: 'success',
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      data: rows,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Fetch a single analyzed profile from stored database rows.
 */
async function getOne(req, res, next) {
  try {
    const { username } = req.params;
    logger.debug(`Retrieving profile for username: ${username}`);

    const profile = await profilesRepo.findByUsername(username);
    if (!profile) {
      throw new AppError(404, `Profile for '${username}' not found. Use POST /api/profiles/analyze first.`);
    }

    res.status(200).json({
      status: 'success',
      data: profile,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { analyze, getAll, getOne };

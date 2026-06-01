/**
 * GitHub Service — all GitHub REST API interactions.
 * Uses axios with a pre-configured instance (auth header, timeout).
 */
const axios = require('axios');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const githubApi = axios.create({
  baseURL: 'https://api.github.com',
  timeout: 8000,
  headers: {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    'X-GitHub-Api-Version': '2022-11-28',
  },
});

/**
 * Fetch a single GitHub user profile.
 * @param {string} username
 * @returns {object} GitHub user data
 */
async function fetchUser(username) {
  try {
    const { data } = await githubApi.get(`/users/${encodeURIComponent(username)}`);
    return data;
  } catch (err) {
    handleGitHubError(err, username);
  }
}

/**
 * Fetch all public repositories for a user (paginated, max 500).
 * @param {string} username
 * @returns {object[]} Array of repository objects
 */
async function fetchRepos(username) {
  const allRepos = [];
  const maxPages = 5;

  for (let page = 1; page <= maxPages; page++) {
    try {
      const { data } = await githubApi.get(`/users/${encodeURIComponent(username)}/repos`, {
        params: { per_page: 100, page, sort: 'updated' },
      });

      allRepos.push(...data);

      // If we received fewer than 100, there are no more pages
      if (data.length < 100) break;
    } catch (err) {
      handleGitHubError(err, username);
    }
  }

  return allRepos;
}

/**
 * Map GitHub API errors to typed AppErrors.
 */
function handleGitHubError(err, username) {
  if (err.response) {
    const { status, headers } = err.response;

    if (status === 404) {
      throw new AppError(404, `GitHub user '${username}' not found`);
    }

    if (status === 403 || status === 429) {
      const resetEpoch = headers['x-ratelimit-reset'];
      const retryAfter = resetEpoch
        ? Math.max(0, Math.ceil(resetEpoch - Date.now() / 1000))
        : 3600;
      throw new AppError(429, 'GitHub API rate limit exceeded. Try again later.', {
        retry_after: retryAfter,
      });
    }

    throw new AppError(502, `GitHub API returned status ${status}`);
  }

  if (err.code === 'ECONNABORTED') {
    throw new AppError(504, 'GitHub API request timed out');
  }

  logger.error('GitHub API network error:', err.message);
  throw new AppError(502, 'Unable to reach GitHub API');
}

module.exports = { fetchUser, fetchRepos };

/**
 * Profiles Repository — all SQL queries for the github_profiles table.
 * Uses parameterized queries exclusively (no string interpolation).
 */
const pool = require('../config/db');

/**
 * Upsert a profile — insert if new, update if username already exists.
 * @param {object} data - Profile data object
 * @returns {object} { id, isNew } — the row id and whether it was an insert
 */
async function upsert(data) {
  const sql = `
    INSERT INTO github_profiles
      (github_id, username, name, bio, avatar_url, html_url,
       followers, following, public_repos,
       account_age_days, total_stars, total_forks,
       most_starred_repo, primary_language, analyzed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE
      github_id         = VALUES(github_id),
      name              = VALUES(name),
      bio               = VALUES(bio),
      avatar_url        = VALUES(avatar_url),
      html_url          = VALUES(html_url),
      followers         = VALUES(followers),
      following         = VALUES(following),
      public_repos      = VALUES(public_repos),
      account_age_days  = VALUES(account_age_days),
      total_stars       = VALUES(total_stars),
      total_forks       = VALUES(total_forks),
      most_starred_repo = VALUES(most_starred_repo),
      primary_language  = VALUES(primary_language),
      analyzed_at       = NOW()
  `;

  const params = [
    data.github_id,
    data.username,
    data.name,
    data.bio,
    data.avatar_url,
    data.html_url,
    data.followers,
    data.following,
    data.public_repos,
    data.account_age_days,
    data.total_stars,
    data.total_forks,
    data.most_starred_repo,
    data.primary_language,
  ];

  const [result] = await pool.execute(sql, params);

  // affectedRows === 1 → insert, === 2 → update (MySQL upsert behaviour)
  const isNew = result.affectedRows === 1;
  const id = isNew ? result.insertId : null;

  // If updated, fetch the existing id
  if (!isNew) {
    const row = await findByUsername(data.username);
    return { id: row.id, isNew: false };
  }

  return { id, isNew: true };
}

/**
 * Find all profiles with pagination and sorting.
 * @param {object} options - { page, limit, sort, order }
 * @returns {{ rows: object[], total: number }}
 */
async function findAll({ page = 1, limit = 20, sort = 'analyzed_at', order = 'desc' } = {}) {
  // Whitelist allowed sort columns to prevent SQL injection
  const allowedSorts = ['analyzed_at', 'followers', 'total_stars', 'username'];
  const safeSort = allowedSorts.includes(sort) ? sort : 'analyzed_at';
  const safeOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  const offset = (page - 1) * limit;

  const [countResult] = await pool.execute('SELECT COUNT(*) AS total FROM github_profiles');
  const total = countResult[0].total;

  const [rows] = await pool.execute(
    `SELECT * FROM github_profiles ORDER BY ${safeSort} ${safeOrder} LIMIT ? OFFSET ?`,
    [String(limit), String(offset)]
  );

  return { rows, total };
}

/**
 * Find a single profile by username (case-insensitive).
 * @param {string} username
 * @returns {object|null}
 */
async function findByUsername(username) {
  const [rows] = await pool.execute(
    'SELECT * FROM github_profiles WHERE LOWER(username) = LOWER(?)',
    [username]
  );
  return rows[0] || null;
}

module.exports = { upsert, findAll, findByUsername };

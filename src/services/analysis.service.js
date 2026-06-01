/**
 * Analysis Service — transforms raw GitHub data into storable metrics.
 * Pure computation, no I/O.
 */

/**
 * Compute derived metrics from a GitHub user profile and their repositories.
 * @param {object} user  - GitHub user object (from /users/:username)
 * @param {object[]} repos - Array of repo objects (from /users/:username/repos)
 * @returns {object} Flat object ready for profiles.repository.upsert()
 */
function computeMetrics(user, repos) {
  const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
  const totalForks = repos.reduce((sum, r) => sum + (r.forks_count || 0), 0);

  // Most starred repository
  const mostStarred = repos.length > 0
    ? repos.reduce((best, r) => (r.stargazers_count > best.stargazers_count ? r : best), repos[0])
    : null;

  // Primary language by frequency (ignore repos with null language)
  const langCount = {};
  for (const repo of repos) {
    if (repo.language) {
      langCount[repo.language] = (langCount[repo.language] || 0) + 1;
    }
  }
  const primaryLanguage = Object.keys(langCount).length > 0
    ? Object.entries(langCount).sort((a, b) => b[1] - a[1])[0][0]
    : null;

  // Account age in days
  const createdAt = new Date(user.created_at);
  const accountAgeDays = Math.floor((Date.now() - createdAt.getTime()) / 86400000);

  return {
    github_id: user.id,
    username: user.login,
    name: user.name || null,
    bio: user.bio || null,
    avatar_url: user.avatar_url || null,
    html_url: user.html_url || null,
    followers: user.followers || 0,
    following: user.following || 0,
    public_repos: user.public_repos || 0,
    account_age_days: accountAgeDays,
    total_stars: totalStars,
    total_forks: totalForks,
    most_starred_repo: mostStarred ? mostStarred.name : null,
    primary_language: primaryLanguage,
  };
}

module.exports = { computeMetrics };

const { computeMetrics } = require('../../src/services/analysis.service');

describe('Analysis Service Unit Tests', () => {
  const mockUser = {
    id: 1024,
    login: 'octocat',
    name: 'The Octocat',
    bio: 'Testing bio',
    avatar_url: 'https://octocat.avatar',
    html_url: 'https://octocat.github',
    followers: 1500,
    following: 50,
    public_repos: 4,
    created_at: '2020-01-01T00:00:00Z',
  };

  const mockRepos = [
    { name: 'repo-a', stargazers_count: 10, forks_count: 5, language: 'JavaScript' },
    { name: 'repo-b', stargazers_count: 50, forks_count: 20, language: 'TypeScript' },
    { name: 'repo-c', stargazers_count: 20, forks_count: 10, language: 'JavaScript' },
    { name: 'repo-d', stargazers_count: 0, forks_count: 0, language: null },
  ];

  // Set the current time to a fixed point to make tests reproducible
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date('2025-01-01T00:00:00Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  test('correctly calculates total stars and forks', () => {
    const result = computeMetrics(mockUser, mockRepos);
    expect(result.total_stars).toBe(80);
    expect(result.total_forks).toBe(35);
  });

  test('correctly picks the most starred repository name', () => {
    const result = computeMetrics(mockUser, mockRepos);
    expect(result.most_starred_repo).toBe('repo-b');
  });

  test('correctly picks the primary language based on frequency', () => {
    const result = computeMetrics(mockUser, mockRepos);
    expect(result.primary_language).toBe('JavaScript'); // 2 JavaScript vs 1 TypeScript (null ignored)
  });

  test('correctly computes the account age in days', () => {
    const result = computeMetrics(mockUser, mockRepos);
    // Jan 1 2025 minus Jan 1 2020 = 5 years = 5 * 365 + 2 leap days (2020 and 2024 are leap years) = 1827 days
    expect(result.account_age_days).toBe(1827);
  });

  test('handles empty repository array gracefully', () => {
    const result = computeMetrics(mockUser, []);
    expect(result.total_stars).toBe(0);
    expect(result.total_forks).toBe(0);
    expect(result.most_starred_repo).toBeNull();
    expect(result.primary_language).toBeNull();
  });

  test('handles all repos having null language gracefully', () => {
    const result = computeMetrics(mockUser, [
      { name: 'repo-1', stargazers_count: 5, language: null },
      { name: 'repo-2', stargazers_count: 1, language: null },
    ]);
    expect(result.primary_language).toBeNull();
  });
});

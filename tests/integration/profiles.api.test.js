const request = require('supertest');
const nock = require('nock');

// Mock out the DB pool to prevent real queries during integration tests
jest.mock('../../src/config/db', () => {
  const mockExecute = jest.fn();
  return {
    execute: mockExecute,
  };
});

// Load DB mock inside the test context
const mockDb = require('../../src/config/db');
const app = require('../../src/app');

describe('Integration API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    nock.cleanAll();
  });

  describe('GET /health', () => {
    test('returns 200 and healthy status when DB query succeeds', async () => {
      mockDb.execute.mockResolvedValueOnce([[1]]); // resolve 'SELECT 1'

      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.db).toBe('connected');
    });

    test('returns 503 and error status when DB fails', async () => {
      mockDb.execute.mockRejectedValueOnce(new Error('Connection failure'));

      const res = await request(app).get('/health');
      expect(res.status).toBe(503);
      expect(res.body.status).toBe('error');
      expect(res.body.db).toBe('disconnected');
    });
  });

  describe('GET /api/profiles/:username', () => {
    test('returns 200 and data when user profile is in DB', async () => {
      const mockDbRow = {
        id: 1,
        github_id: 12345,
        username: 'test-user',
        total_stars: 42,
      };
      mockDb.execute.mockResolvedValueOnce([[mockDbRow]]); // resolve 'SELECT * FROM github_profiles WHERE LOWER(username) = LOWER(?)'

      const res = await request(app).get('/api/profiles/test-user');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.username).toBe('test-user');
      expect(res.body.data.total_stars).toBe(42);
    });

    test('returns 404 when profile is not found in DB', async () => {
      mockDb.execute.mockResolvedValueOnce([[]]); // resolve with empty rows

      const res = await request(app).get('/api/profiles/test-user');
      expect(res.status).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('Profile for \'test-user\' not found');
    });

    test('returns 400 for invalid username formats', async () => {
      const res = await request(app).get('/api/profiles/-badusername');
      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Invalid GitHub username format');
    });
  });

  describe('POST /api/profiles/analyze', () => {
    const mockUserPayload = {
      id: 12345,
      login: 'test-user',
      name: 'Testy Tester',
      bio: 'Testing profile API',
      avatar_url: 'https://avatar.url',
      html_url: 'https://github.url',
      followers: 10,
      following: 5,
      public_repos: 2,
      created_at: '2022-01-01T00:00:00Z',
    };

    const mockReposPayload = [
      { name: 'repo1', stargazers_count: 5, forks_count: 2, language: 'JavaScript' },
      { name: 'repo2', stargazers_count: 10, forks_count: 4, language: 'JavaScript' },
    ];

    test('performs successful analysis and inserts new profile row (returns 201)', async () => {
      // Mock GitHub requests via nock
      nock('https://api.github.com')
        .get('/users/test-user')
        .reply(200, mockUserPayload);

      nock('https://api.github.com')
        .get('/users/test-user/repos')
        .query({ per_page: 100, page: 1, sort: 'updated' })
        .reply(200, mockReposPayload);

      // Mock repository behavior
      // 1. upsert result (1 affected row indicates creation)
      mockDb.execute.mockResolvedValueOnce([{ affectedRows: 1, insertId: 99 }]);
      // 2. findByUsername call (after success)
      const mockResultRow = { id: 99, username: 'test-user', total_stars: 15, primary_language: 'JavaScript' };
      mockDb.execute.mockResolvedValueOnce([[mockResultRow]]);

      const res = await request(app)
        .post('/api/profiles/analyze')
        .send({ username: 'test-user' });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.id).toBe(99);
      expect(res.body.data.total_stars).toBe(15);
      expect(res.body.data.primary_language).toBe('JavaScript');
    });

    test('returns 429 when GitHub returns 403 / 429 rate limits', async () => {
      nock('https://api.github.com')
        .get('/users/test-user')
        .reply(403, {}, {
          'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 120),
        });

      nock('https://api.github.com')
        .get('/users/test-user/repos')
        .query(true)
        .reply(403, {}, {
          'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 120),
        });

      const res = await request(app)
        .post('/api/profiles/analyze')
        .send({ username: 'test-user' });

      expect(res.status).toBe(429);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('GitHub API rate limit exceeded');
    });

    test('returns 404 when GitHub user is not found', async () => {
      nock('https://api.github.com')
        .get('/users/missing-user')
        .reply(404);

      nock('https://api.github.com')
        .get('/users/missing-user/repos')
        .query(true)
        .reply(404);

      const res = await request(app)
        .post('/api/profiles/analyze')
        .send({ username: 'missing-user' });

      expect(res.status).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('GitHub user \'missing-user\' not found');
    });
  });
});

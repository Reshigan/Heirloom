/**
 * Auth route tests — login, signup, token validation.
 *
 * These tests guard against:
 *  - Missing field validation regressions
 *  - Auth routes accidentally becoming public
 *  - Protected routes returning 200 without a valid JWT
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { env, SELF } from 'cloudflare:test';
import { applyMigrations } from './helpers/migrate';

const API = 'http://localhost';

function post(path: string, body: unknown, headers: Record<string, string> = {}) {
  return SELF.fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

function get(path: string, headers: Record<string, string> = {}) {
  return SELF.fetch(`${API}${path}`, { headers });
}

// ─── Login validation ────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await applyMigrations(env.DB!);
  });

  it('400 when body is empty', async () => {
    const res = await post('/api/auth/login', {});
    expect(res.status).toBe(400);
  });

  it('400 when email is missing', async () => {
    const res = await post('/api/auth/login', { password: 'anything' });
    expect(res.status).toBe(400);
  });

  it('400 when password is missing', async () => {
    const res = await post('/api/auth/login', { email: 'user@example.com' });
    expect(res.status).toBe(400);
  });

  it('401 for non-existent user', async () => {
    const res = await post('/api/auth/login', {
      email: 'nobody@does.not.exist',
      password: 'irrelevant',
    });
    expect(res.status).toBe(401);
  });
});

// ─── Signup validation ───────────────────────────────────────────────────────

// The register endpoint is /api/auth/register (not /signup)
describe('POST /api/auth/register', () => {
  beforeEach(async () => {
    await applyMigrations(env.DB!);
  });

  it('400 when required fields are missing', async () => {
    const res = await post('/api/auth/register', {});
    expect(res.status).toBe(400);
  });

  it('400 when email is invalid format', async () => {
    const res = await post('/api/auth/register', {
      email: 'notanemail',
      password: 'ValidPass1!',
      firstName: 'Test',
      lastName: 'User',
    });
    expect(res.status).toBe(400);
  });

  it('400 when password is too short', async () => {
    const res = await post('/api/auth/register', {
      email: 'valid@example.com',
      password: '123',
      firstName: 'Test',
      lastName: 'User',
    });
    expect(res.status).toBe(400);
  });

  it('creates account and returns token for valid data', async () => {
    const res = await post('/api/auth/register', {
      email: `reg-test-${Date.now()}@heirloom.test`,
      password: 'ValidPassword123!',
      firstName: 'Test',
      lastName: 'Register',
      acceptedTerms: true,
    });
    // 200 or 201 — either is fine
    expect(res.status).toBeLessThan(300);
    const body = await res.json() as any;
    expect(body.token ?? body.accessToken).toBeTruthy();
  });

  it('409 when email already exists', async () => {
    const email = `dup-${Date.now()}@heirloom.test`;
    await post('/api/auth/register', {
      email,
      password: 'ValidPassword123!',
      firstName: 'First',
      lastName: 'User',
      acceptedTerms: true,
    });
    const res = await post('/api/auth/register', {
      email,
      password: 'AnotherValidPass1!',
      firstName: 'Second',
      lastName: 'User',
      acceptedTerms: true,
    });
    expect(res.status).toBe(409);
  });
});

// ─── Protected route guards ──────────────────────────────────────────────────
// Every one of these must return 401 without a token.

describe('Protected route auth guards', () => {
  const protectedRoutes = [
    ['/api/memories', 'GET'],
    ['/api/letters', 'GET'],
    ['/api/family', 'GET'],
    ['/api/billing', 'GET'],
    ['/api/settings', 'GET'],
  ] as const;

  for (const [route, method] of protectedRoutes) {
    it(`${method} ${route} returns 401 without token`, async () => {
      const res = await SELF.fetch(`${API}${route}`, { method });
      expect(res.status).toBe(401);
    });
  }

  it('GET /api/memories returns 401 with invalid token', async () => {
    const res = await get('/api/memories', { Authorization: 'Bearer not.a.valid.jwt' });
    expect(res.status).toBe(401);
  });
});

/**
 * memories.spec.ts — Phase 10c
 *
 * Core memory CRUD via the live API. Auth is handled through the API directly
 * (no UI form interaction) to keep the suite fast and free of autofill races.
 *
 * Run: BASE_URL=https://heirloom.blue npx playwright test e2e/memories.spec.ts --project=chromium
 */

import { test, expect, request as pwRequest } from '@playwright/test';

const API_BASE = 'https://api.heirloom.blue/api';
const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'regression@heirloom.blue';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'Heirloom2026!';

let authToken = '';

test.beforeAll(async () => {
  const ctx = await pwRequest.newContext();

  let resp = await ctx.post(`${API_BASE}/auth/login`, {
    data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    headers: { 'Content-Type': 'application/json' },
  });

  // Back off once on rate-limit.
  if (resp.status() === 429) {
    await new Promise(r => setTimeout(r, 10000));
    resp = await ctx.post(`${API_BASE}/auth/login`, {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!resp.ok()) {
    throw new Error(`beforeAll login failed: ${resp.status()} ${await resp.text()}`);
  }

  const data = await resp.json() as { token?: string };
  if (!data.token) throw new Error('Login returned no token');
  authToken = data.token;
});

test.describe('Memory CRUD via API', () => {
  let createdId = '';

  test('unauthenticated request returns 401', async ({ request }) => {
    const resp = await request.get(`${API_BASE}/memories`);
    expect(resp.status()).toBe(401);
  });

  test('list memories returns array', async ({ request }) => {
    const resp = await request.get(`${API_BASE}/memories?limit=10`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    const items = Array.isArray(body) ? body : (body as { data?: unknown[] }).data;
    expect(Array.isArray(items)).toBe(true);
  });

  test('create memory returns 201 with id', async ({ request }) => {
    const resp = await request.post(`${API_BASE}/memories`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { title: 'E2E test memory', description: 'Playwright Phase 10c suite', type: 'TEXT' },
    });
    expect(resp.status()).toBe(201);
    const body = await resp.json() as { id?: string };
    expect(body.id).toBeTruthy();
    createdId = body.id!;
  });

  test('read created memory returns correct title', async ({ request }) => {
    test.skip(!createdId, 'depends on create test');
    const resp = await request.get(`${API_BASE}/memories/${createdId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json() as { title?: string };
    expect(body.title).toBe('E2E test memory');
  });

  test('update memory title returns 200', async ({ request }) => {
    test.skip(!createdId, 'depends on create test');
    const resp = await request.patch(`${API_BASE}/memories/${createdId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { title: 'E2E test memory (updated)' },
    });
    expect(resp.status()).toBe(200);
  });

  test('invalid type returns 400', async ({ request }) => {
    const resp = await request.post(`${API_BASE}/memories`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { title: 'Bad type test', description: 'test', type: 'INVALID_TYPE_XYZ' },
    });
    expect(resp.status()).toBe(400);
  });

  test('delete test memory returns 200 or 204', async ({ request }) => {
    test.skip(!createdId, 'depends on create test');
    const resp = await request.delete(`${API_BASE}/memories/${createdId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect([200, 204]).toContain(resp.status());
    createdId = '';
  });
});

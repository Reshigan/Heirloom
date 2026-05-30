import { describe, it, expect, vi } from 'vitest';

// auth.service imports the Redis + Prisma clients at module load (which would
// otherwise open real connections). We only exercise the pure password/token
// logic here, so stub those clients out.
vi.mock('../config/redis', () => ({
  redis: { on: vi.fn(), get: vi.fn(), set: vi.fn(), del: vi.fn(), setex: vi.fn() },
  cache: { get: vi.fn(), set: vi.fn(), del: vi.fn(), delPattern: vi.fn() },
}));
vi.mock('../config/database', () => ({ default: {}, prisma: {} }));

import { authService } from './auth.service';

describe('authService — password hashing', () => {
  it('hashes a password to a bcrypt string that is not the plaintext', async () => {
    const hash = await authService.hashPassword('s3cret-pass');
    expect(hash).not.toBe('s3cret-pass');
    expect(hash.startsWith('$2')).toBe(true); // bcrypt prefix
  });

  it('verifies a correct password and rejects a wrong one', async () => {
    const hash = await authService.hashPassword('s3cret-pass');
    expect(await authService.verifyPassword('s3cret-pass', hash)).toBe(true);
    expect(await authService.verifyPassword('wrong-pass', hash)).toBe(false);
  });

  it('produces distinct hashes for the same password (random salt)', async () => {
    const h1 = await authService.hashPassword('same');
    const h2 = await authService.hashPassword('same');
    expect(h1).not.toBe(h2);
  });
});

describe('authService — JWT tokens', () => {
  const payload = { userId: 'u1', email: 'a@b.com', sessionId: 's1' };

  it('issues an access + refresh token that verify back to the payload', () => {
    const tokens = authService.generateTokens(payload);
    expect(tokens.accessToken).toBeTruthy();
    expect(tokens.refreshToken).toBeTruthy();
    expect(tokens.expiresIn).toBe(7 * 86400);

    const access = authService.verifyAccessToken(tokens.accessToken);
    expect(access?.userId).toBe('u1');
    expect(access?.email).toBe('a@b.com');
  });

  it('rejects a refresh token used as an access token and vice versa', () => {
    const tokens = authService.generateTokens(payload);
    // refresh token is signed with the refresh secret → access verify fails
    expect(authService.verifyAccessToken(tokens.refreshToken)).toBeNull();
    // access token lacks type:'refresh' → refresh verify fails
    expect(authService.verifyRefreshToken(tokens.accessToken)).toBeNull();
  });

  it('verifies a genuine refresh token', () => {
    const tokens = authService.generateTokens(payload);
    expect(authService.verifyRefreshToken(tokens.refreshToken)?.userId).toBe('u1');
  });

  it('returns null for garbage tokens', () => {
    expect(authService.verifyAccessToken('not.a.jwt')).toBeNull();
    expect(authService.verifyRefreshToken('not.a.jwt')).toBeNull();
  });
});

describe('authService — parseExpiration', () => {
  it('parses unit suffixes to seconds', () => {
    expect(authService.parseExpiration('30s')).toBe(30);
    expect(authService.parseExpiration('15m')).toBe(15 * 60);
    expect(authService.parseExpiration('2h')).toBe(2 * 3600);
    expect(authService.parseExpiration('7d')).toBe(7 * 86400);
  });

  it('falls back to 7 days on malformed input', () => {
    expect(authService.parseExpiration('garbage')).toBe(604800);
  });
});

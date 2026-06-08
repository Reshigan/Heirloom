import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry error tracking.
 * No-op when VITE_SENTRY_DSN is not set (dev, or pre-Sentry-project setup).
 * To activate: add VITE_SENTRY_DSN=https://...@sentry.io/... to the
 * Cloudflare Pages environment variables.
 */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    // Sample 10% of transactions for performance monitoring.
    tracesSampleRate: 0.1,
    // No session replays — privacy-first.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    // Don't report errors from browser extensions or local dev.
    denyUrls: [/extensions\//i, /^chrome:\/\//i],
  });
}

export { Sentry };

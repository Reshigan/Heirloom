/**
 * Chunk-load error recovery.
 *
 * Vite hashes asset filenames on every build. When we redeploy, an
 * already-loaded tab is still holding references (via React.lazy +
 * dynamic imports) to chunk filenames that no longer exist on the
 * server. Navigating to a lazy-loaded route then throws:
 *
 *   - WebKit/Safari: "Importing a module script failed"
 *   - Chrome: "Failed to fetch dynamically imported module"
 *   - Firefox: "error loading dynamically imported module"
 *
 * The fix is to reload the page once on detection — that pulls the
 * current index.html, which references the current chunk hashes.
 *
 * We guard against reload loops with a sessionStorage flag: if a
 * reload doesn't resolve the issue (e.g. real bug, real network
 * outage), we surface the error to the ErrorBoundary instead of
 * looping forever.
 */
const RELOAD_FLAG = 'heirloom:chunk-reload-attempted';

const CHUNK_ERROR_PATTERNS = [
  /Failed to fetch dynamically imported module/i,
  /error loading dynamically imported module/i,
  /Importing a module script failed/i,
  /ChunkLoadError/i,
  /Loading chunk \d+ failed/i,
  /Loading CSS chunk \d+ failed/i,
];

function isChunkLoadError(message: string | undefined | null): boolean {
  if (!message) return false;
  return CHUNK_ERROR_PATTERNS.some((re) => re.test(message));
}

/**
 * Reload the page once. Sets a sessionStorage flag so a subsequent
 * chunk error won't trigger another reload. The flag is cleared after
 * a successful render (see clearChunkReloadFlag, called from App.tsx).
 */
function reloadOnce(): void {
  if (sessionStorage.getItem(RELOAD_FLAG) === '1') {
    // Already tried reloading. Don't loop. Let the ErrorBoundary handle it.
    console.error('[chunkReload] reload already attempted; not retrying.');
    return;
  }
  sessionStorage.setItem(RELOAD_FLAG, '1');
  console.warn('[chunkReload] stale chunk detected; reloading to pick up the new build.');
  window.location.reload();
}

/**
 * Install global handlers. Call once from main.tsx before the React
 * tree mounts.
 */
export function installChunkReloadHandlers(): void {
  // Unhandled promise rejections — the typical path for a failing
  // import() since React.lazy wraps the dynamic import in a Promise.
  window.addEventListener('unhandledrejection', (e) => {
    const reason = e.reason;
    const message = typeof reason === 'string' ? reason : reason?.message;
    if (isChunkLoadError(message)) {
      e.preventDefault();
      reloadOnce();
    }
  });

  // Window errors — covers script-level evaluation failures.
  window.addEventListener('error', (e) => {
    if (isChunkLoadError(e.message)) {
      e.preventDefault();
      reloadOnce();
    }
  });
}

/**
 * Call after the app has mounted successfully to clear the
 * "we already reloaded" flag, so a future stale-chunk event will
 * trigger a fresh reload attempt.
 */
export function clearChunkReloadFlag(): void {
  sessionStorage.removeItem(RELOAD_FLAG);
}

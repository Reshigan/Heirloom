import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { installChunkReloadHandlers } from './lib/chunkReload';
import { registerServiceWorker } from './lib/registerSW';
import './styles/globals.css';

// Catch stale-chunk errors after a redeploy and reload once. See
// src/lib/chunkReload.ts for the rationale and the matched messages.
installChunkReloadHandlers();

// Register the PWA service worker (production builds only). See
// src/lib/registerSW.ts — enables install + offline; never caches /api.
registerServiceWorker();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Tear down the pre-hydration cold-boot splash (#hl-splash in index.html) now
// that React has mounted. This is the CSP-safe path: the splash's own teardown
// lives in /splash-boot.js (external, allowed by `script-src 'self'`) as a
// load-event safety net, but inline scripts are blocked in production — so this
// module, which always runs, is what guarantees the splash never lingers over
// the app. Two rAFs let the first real paint land before the 360ms fade.
function leaveColdBootSplash() {
  const splash = document.getElementById('hl-splash');
  if (!splash) return;
  splash.setAttribute('data-leaving', '');
  window.setTimeout(() => splash.remove(), 420);
}
requestAnimationFrame(() => requestAnimationFrame(leaveColdBootSplash));

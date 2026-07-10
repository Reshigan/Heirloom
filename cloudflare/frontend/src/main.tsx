import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { installChunkReloadHandlers } from './lib/chunkReload';
import { registerServiceWorker } from './lib/registerSW';
import { initSentry } from './lib/sentry';
import { captureRef } from './lib/attribution';
import { initSettleSound } from './lib/settleSound';

// Self-hosted typefaces (no render-blocking third-party font requests).
// BRAND §6.2 type system — three faces, no fourth: Fraunces = display/voice
// (variable, opsz-aware), Source Serif 4 = reading/prose/inputs/UI (variable),
// JetBrains Mono = archival labels/metadata. A UI sans would read as 2026.
import '@fontsource-variable/fraunces/full.css';
import '@fontsource-variable/fraunces/wght-italic.css';
import '@fontsource-variable/source-serif-4';
import '@fontsource-variable/source-serif-4/wght-italic.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/700.css';

import './styles/globals.css';
import './styles/cosmic.css';

// Error tracking — no-op when VITE_SENTRY_DSN is absent.
initSentry();

// First-party attribution: lift ?ref= into localStorage + one visit beacon per
// session (no cookies, no IP — see lib/attribution.ts).
captureRef();

// The one sound the product makes: the settle (lib/settleSound.ts).
initSettleSound();

// Catch stale-chunk errors after a redeploy and reload once.
installChunkReloadHandlers();

// Register the PWA service worker (production builds only).
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

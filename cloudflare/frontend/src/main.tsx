import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { installChunkReloadHandlers } from './lib/chunkReload';
import { registerServiceWorker } from './lib/registerSW';
import { initSentry } from './lib/sentry';

// Self-hosted typefaces (no render-blocking third-party font requests). Weights
// mirror what was previously requested from Google Fonts. Cormorant Garamond is
// display-only (≥24px); Spectral is the reading workhorse; Space Mono labels;
// Inter residual UI; Tangerine the signature hand.
import '@fontsource/cormorant-garamond/300.css';
import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/700.css';
import '@fontsource/cormorant-garamond/400-italic.css';
import '@fontsource/cormorant-garamond/500-italic.css';
import '@fontsource/spectral/300.css';
import '@fontsource/spectral/400.css';
import '@fontsource/spectral/500.css';
import '@fontsource/spectral/600.css';
import '@fontsource/spectral/300-italic.css';
import '@fontsource/spectral/400-italic.css';
import '@fontsource/space-mono/400.css';
import '@fontsource/space-mono/700.css';
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/tangerine/400.css';
import '@fontsource/tangerine/700.css';

import './styles/globals.css';
import './styles/cosmic.css';

// Error tracking — no-op when VITE_SENTRY_DSN is absent.
initSentry();

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

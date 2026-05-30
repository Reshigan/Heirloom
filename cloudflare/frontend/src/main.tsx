import React from 'react';
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
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

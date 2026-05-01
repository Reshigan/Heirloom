import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { installChunkReloadHandlers } from './lib/chunkReload';
import './styles/globals.css';

// Catch stale-chunk errors after a redeploy and reload once. See
// src/lib/chunkReload.ts for the rationale and the matched messages.
installChunkReloadHandlers();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

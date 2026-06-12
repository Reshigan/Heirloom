/**
 * WarpThreads — warp-first loading, the app's Suspense fallback.
 *
 * Before a room is woven, the loom is strung: vertical warp threads rise in
 * sequence on the canonical curve, then sit taut until the room's weft
 * arrives. No spinner, no text — the strung warp IS the loading state.
 * Styling + reduced-motion fallback live in styles/globals.css
 * (`.warp-loading`).
 */
export function WarpThreads() {
  return (
    <div className="warp-loading" role="status" aria-label="Loading">
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} />
      ))}
    </div>
  );
}

export default WarpThreads;

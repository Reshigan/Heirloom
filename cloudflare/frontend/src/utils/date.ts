/**
 * Shared date/duration formatting utilities.
 * Import from here — do not redefine formatDate in page files.
 */

/**
 * Format an ISO date string for display.
 * Returns '—' for null/undefined/invalid input.
 * Output: "3 Jun 2024"
 */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

/**
 * Format seconds into mm:ss display string.
 */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

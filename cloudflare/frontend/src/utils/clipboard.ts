/**
 * Copies text to clipboard with a textarea fallback for iOS PWA / older Safari
 * where navigator.clipboard is unavailable or throws without a user gesture.
 */
export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    return navigator.clipboard.writeText(text).catch(() => execCommandFallback(text));
  }
  return execCommandFallback(text);
}

function execCommandFallback(text: string): Promise<void> {
  try {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.cssText = 'position:absolute;left:-9999px;top:-9999px;';
    document.body.appendChild(el);
    el.select();
    el.setSelectionRange(0, el.value.length);
    document.execCommand('copy');
    document.body.removeChild(el);
    return Promise.resolve();
  } catch {
    return Promise.reject(new Error('copy failed'));
  }
}

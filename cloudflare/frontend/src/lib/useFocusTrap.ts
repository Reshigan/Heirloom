import { useEffect, type RefObject } from 'react';

/**
 * useFocusTrap — keyboard containment for a blocking overlay.
 *
 * While `active`, this hook:
 *   1. focuses the first focusable element inside `ref` on mount,
 *   2. traps Tab / Shift+Tab so focus cycles within the container
 *      (never escaping to the page behind the overlay),
 *   3. calls `onClose` on Escape.
 *
 * Extracted from VaultModal's inline trap and generalized so every blocking
 * role="dialog" surface can reuse the one correct implementation.
 */
export function useFocusTrap(
  ref: RefObject<HTMLElement>,
  onClose: () => void,
  active = true,
) {
  useEffect(() => {
    if (!active) return;
    const el = ref.current;
    if (!el) return;
    const focusable = el.querySelectorAll<HTMLElement>(
      'a[href], input, select, textarea, button, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length) focusable[0].focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab') return;
      const nodes = Array.from(focusable);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
    };
    document.addEventListener('keydown', trap);
    return () => document.removeEventListener('keydown', trap);
  }, [ref, onClose, active]);
}

export default useFocusTrap;

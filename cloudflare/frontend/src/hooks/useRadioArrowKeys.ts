import type { KeyboardEvent } from 'react';

/**
 * WAI-ARIA radiogroup arrow-key roving focus.
 *
 * A `role="radiogroup"` with roving `tabIndex` (only the checked radio in the
 * tab order) is unreachable by keyboard unless arrow keys move the selection —
 * Enter/Space alone strands the user on the one focusable radio. Call this from
 * each radio's `onKeyDown`, alongside the existing Enter/Space activation, to
 * move selection to the next/previous radio (wrapping) and focus it.
 *
 *   Down / Right → next radio
 *   Up   / Left  → previous radio
 *
 * Assumes the radios render in DOM order matching the option order and live
 * inside the nearest `[role="radiogroup"]` ancestor (each marked `role="radio"`).
 *
 * @param e      keydown event from the radio element
 * @param index  this radio's index in the group
 * @param count  total radios in the group
 * @param select called with the next index to update selection
 */
export function handleRadioArrowKeys(
  e: KeyboardEvent<HTMLElement>,
  index: number,
  count: number,
  select: (nextIndex: number) => void,
): void {
  let next: number;
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (index + 1) % count;
  else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (index - 1 + count) % count;
  else return;
  e.preventDefault();
  select(next);
  const group = e.currentTarget.closest('[role="radiogroup"]');
  const radios = group?.querySelectorAll<HTMLElement>('[role="radio"]');
  radios?.[next]?.focus();
}

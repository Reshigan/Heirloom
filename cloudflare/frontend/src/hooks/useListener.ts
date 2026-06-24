import { useMemo, useState, useCallback } from 'react';

const PROMPTS = [
  'What did you almost forget to write down today?',
  'What would your younger self not believe about your life right now?',
  'Name one person whose patience you have relied on this week.',
  'What small thing happened today that you want to remember in 20 years?',
  'What is a belief you held last year that you no longer hold?',
  'What is the oldest memory you have of your mother?',
  'What would you want your great-grandchildren to know about where you live right now?',
  'What is something you made with your hands this month?',
  'What did you say to someone that you wish you could take back?',
  'What is the last thing that made you laugh until you couldn\'t breathe?',
  'Describe the smell of the house you grew up in.',
  'What does your father\'s voice sound like in your memory?',
  'What was the song that always played on long car rides?',
  'What do you know now that you wish someone had told you at twenty?',
  'What conversation are you still turning over in your mind?',
  'Who in your family carried something they never talked about?',
  'What is the view from a window you remember?',
  'What did your grandparents smell like?',
  'What is the first meal you remember cooking for yourself?',
  'What do you do when no one is watching that you would never tell anyone?',
  'What is the most important thing you own that has no monetary value?',
  'What was the last thing you changed your mind about?',
  'Who do you miss most right now?',
  'What did you carry from your childhood that you\'ve never set down?',
  'What were you afraid of as a child that you\'re no longer afraid of?',
  'What were you afraid of as a child that you\'re still afraid of?',
  'What is the story your family tells about you that you\'ve always found embarrassing?',
  'What talent do you have that no one in your family knows about?',
  'What is a meal that is tied to a specific memory?',
  'What is the most important thing your parents never said out loud?',
  'What would your home say about you if it could speak?',
  'What is something you\'ve kept secret for more than ten years?',
  'Who taught you how to love?',
  'What do you do when you\'re grieving?',
  'What is a kindness a stranger once showed you that you still think about?',
  'What is the last thing you did that surprised even yourself?',
  'What is the one photograph you would save if your home was on fire?',
  'What does home feel like to you — not a place, but a feeling?',
  'What is a question you are afraid to ask?',
  'What is a question you are afraid someone might ask you?',
  'Who was your first real friend, and what happened to them?',
  'What do you want to be remembered for that has nothing to do with your work?',
  'What did you learn from the hardest year of your life?',
  'What is something you\'ve never forgiven yourself for?',
  'What is something you have forgiven yourself for, finally?',
  'What do you want the people who come after you to understand about the world you lived in?',
  'What is the quietest moment you can remember?',
  'What sounds remind you of being young?',
  'What is the most beautiful thing you\'ve ever seen?',
  'What would your life look like if you had made a different choice at twenty-five?',
  'What do you still need to say to someone?',
  'What do you need to hear from someone you can no longer ask?',
];

const STORAGE_KEY = 'heirloom.listener.lastIdx';

// Pure: pick an index different from `last`, deterministic given `seed` in [0,1).
// Exposed for the rotation assertion script.
export function nextIndex(last: number, total: number, seed: number): number {
  if (total <= 1) return 0;
  const offset = 1 + Math.floor(seed * (total - 1)); // 1..total-1, never 0
  return ((last < 0 ? 0 : last) + offset) % total;
}

// Today's prompt index — deterministic from the calendar day, so the same
// question holds all day and turns over at the day boundary (local midnight).
function dayIndex(total: number): number {
  if (total <= 0) return 0;
  const now = new Date();
  const daysSinceEpoch = Math.floor(
    new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 86400000,
  );
  return ((daysSinceEpoch % total) + total) % total;
}

function writeLast(i: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(i));
  } catch {
    /* private mode / disabled storage — rotation degrades to per-mount only */
  }
}

export interface Listener {
  prompt: string;
  reroll: () => void;
}

/**
 * useListener — a fresh prompt on every open/login. Persists the last index in
 * localStorage and advances by a non-zero offset so the same prompt never
 * repeats back-to-back. `reroll()` advances again for the ↻ affordance.
 */
export function useListener(): Listener {
  const total = PROMPTS.length;
  const [idx, setIdx] = useState(() => {
    const i = dayIndex(total);
    writeLast(i);
    return i;
  });
  const reroll = useCallback(() => {
    setIdx((cur) => {
      const i = nextIndex(cur, total, Math.random());
      writeLast(i);
      return i;
    });
  }, [total]);
  const prompt = useMemo(() => PROMPTS[idx], [idx]);
  return { prompt, reroll };
}

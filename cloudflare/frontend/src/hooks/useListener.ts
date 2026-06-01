import { useMemo } from 'react';

const PROMPTS = [
  'What did you almost forget to write down today?',
  'What would your younger self not believe about your life right now?',
  'Name one person whose patience you have relied on this week.',
  'What small thing happened today that you want to remember in 20 years?',
  'What is a belief you held last year that you no longer hold?',
  'What is the oldest memory you have of your mother?',
  'What would you want your great-grandchildren to know about where you live right now?',
  'What is something you made with your hands this month?',
];

export function useListener(): string {
  return useMemo(() => {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000
    );
    return PROMPTS[dayOfYear % PROMPTS.length];
  }, []);
}

import type { LoomEntry, LoomLigature } from '../components/Loom';

/**
 * Eleanor Hartshorn's loom — the canonical sample family used across
 * every Loom screen so the UI shows real-feeling content rather than
 * lorem ipsum. When the resonance backend lands (v1.1) this is the
 * only file that needs to be replaced; every screen reads from here.
 */

export const ELEANOR_ENTRIES: LoomEntry[] = [
  { year: 1962, month: 4, lane: 1, kind: 'photo', title: 'first day of school' },
  { year: 1968, month: 9, lane: 2, kind: 'letter', title: 'from grandfather, on graduation' },
  { year: 1971, month: 6, lane: 0, kind: 'milestone', title: 'left home' },
  { year: 1974, month: 3, lane: 3, kind: 'voice', title: 'voice memo, 2am, kitchen' },
  { year: 1978, month: 11, lane: 2, kind: 'photo', title: "mother's last birthday" },
  { year: 1981, month: 7, lane: 1, kind: 'letter', title: 'to D, the night before' },
  { year: 1983, month: 5, lane: 0, kind: 'milestone', title: 'wedding' },
  { year: 1986, month: 2, lane: 3, kind: 'photo', title: 'the kitchen window, daffodils' },
  { year: 1989, month: 8, lane: 2, kind: 'letter', title: "from father, 'on patience'" },
  { year: 1992, month: 1, lane: 4, kind: 'voice', title: 'humming, sunday' },
  { year: 1995, month: 10, lane: 1, kind: 'photo', title: 'Maya, age 4, asleep' },
  { year: 1998, month: 6, lane: 2, kind: 'letter', title: 'to Maya, when she turns 18' },
  { year: 2001, month: 3, lane: 3, kind: 'memory', title: 'the move to oak street' },
  { year: 2004, month: 9, lane: 0, kind: 'milestone', title: 'father passed' },
  { year: 2007, month: 4, lane: 1, kind: 'letter', title: 'to Maya, when she leaves home' },
  { year: 2010, month: 11, lane: 2, kind: 'photo', title: 'thanksgiving, all of us' },
  { year: 2013, month: 7, lane: 3, kind: 'voice', title: 'Maya, 22, calling from Berlin' },
  { year: 2016, month: 5, lane: 1, kind: 'letter', title: 'the difficult year' },
  { year: 2019, month: 8, lane: 4, kind: 'memory', title: "Maya's wedding morning" },
  { year: 2022, month: 2, lane: 2, kind: 'photo', title: 'the first grandchild' },
  { year: 2024, month: 6, lane: 1, kind: 'letter', title: 'to my granddaughter, today' },
  { year: 2026, month: 5, lane: 0, kind: 'milestone', title: 'today' },
  // tied off
  { year: 2031, month: 6, lane: 2, kind: 'letter', title: 'to Maya, on her 40th', locked: true },
  { year: 2042, month: 8, lane: 1, kind: 'letter', title: 'to Iris, when she turns 18', locked: true },
  { year: 2055, month: 11, lane: 3, kind: 'letter', title: 'to Iris, on her wedding day', locked: true },
  { year: 2068, month: 4, lane: 2, kind: 'letter', title: 'to whoever still keeps this', locked: true },
];

export const ELEANOR_RESONANCES: (LoomLigature & { label: string })[] = [
  { from: 1, to: 8, label: 'letters about patience, both written by fathers', show: true },
  { from: 7, to: 18, label: "your mother's daffodils & Maya's wedding morning bouquet", show: true },
  { from: 9, to: 16, label: 'humming, sunday — and Maya humming the same tune', show: true },
  { from: 5, to: 14, label: "letters written 'the night before'", show: true },
  { from: 11, to: 22, label: 'the same letter, 33 years apart', show: true },
];

export const ELEANOR_KIN = [
  { name: 'August Hartshorn', born: 1892, died: 1971, you: false, picks: [1912, 1928, 1944, 1958, 1968] },
  { name: 'Margaret Wells Hartshorn', born: 1928, died: 2004, you: false, picks: [1948, 1962, 1978, 1991, 2001] },
  { name: 'Eleanor Hartshorn', born: 1958, died: null, you: true, picks: [1971, 1983, 1995, 2010, 2024] },
  { name: 'Maya Hartshorn', born: 1991, died: null, you: false, picks: [2007, 2013, 2019, 2024] },
  { name: 'Iris Hartshorn-Vega', born: 2024, died: null, you: false, picks: [2024] },
];

export const ELEANOR_TIED = [
  { date: '2027·04·17', recip: 'to Maya, on her 36th',                years: '1 yr from today', kind: 'letter',         weft: 0.06 },
  { date: '2031·06·02', recip: 'to Maya, on her 40th',                years: '5 yrs',           kind: 'letter + voice', weft: 0.14 },
  { date: '2035·12·25', recip: 'to all of them, christmas morning',   years: '9 yrs',           kind: 'letter',         weft: 0.22 },
  { date: '2042·08·11', recip: 'to Iris, when she turns 18',          years: '16 yrs',          kind: 'letter + photo', weft: 0.36 },
  { date: '2049·03·04', recip: 'to August, on his wedding day',       years: '23 yrs',          kind: 'voice',          weft: 0.48 },
  { date: '2055·11·08', recip: 'to Iris, on her 31st',                years: '29 yrs',          kind: 'letter',         weft: 0.59 },
  { date: '2068·04·22', recip: 'to whoever still keeps this',         years: '42 yrs',          kind: 'letter',         weft: 0.82 },
];

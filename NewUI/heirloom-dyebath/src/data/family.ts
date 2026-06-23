// The family archive's data. Swap this out for your real backend later;
// every screen reads from here so the UI stays declarative.

export type DyeName = 'walnut' | 'madder' | 'indigo' | 'woad' | 'cochineal' | 'weld'

export const DYES: Record<DyeName, { label: string; hex: string }> = {
  walnut: { label: 'walnut', hex: '#9A7A4F' },
  madder: { label: 'madder', hex: '#C2543F' },
  indigo: { label: 'indigo', hex: '#3E6190' },
  woad: { label: 'woad', hex: '#5E8A97' },
  cochineal: { label: 'cochineal', hex: '#B45576' },
  weld: { label: 'weld', hex: '#D9AE4A' },
}

export interface Entry {
  id: string
  year: number
  author: string
  dye: DyeName
  kind: string // "a memory", "a letter", "a note"
  title: string
  body: string[]
  /** vertical position on the home water, 0 = surface (today) … 1 = deep (founding) */
  depth: number
}

export const FAMILY_NAME = 'Mercer'

// Ordered surface -> deep (recent -> founding)
export const ENTRIES: Entry[] = [
  {
    id: 'maya-2024', year: 2024, author: 'Maya', dye: 'weld', kind: 'a note', depth: 0.12,
    title: 'Under the same tree',
    body: [
      'I climbed the orchard tree today, the one in all the old photographs.',
      'Gran said our great-great-grandmother sat under it the day she arrived. I did not know that when I climbed it. I know it now.',
    ],
  },
  {
    id: 'eleanor-2003', year: 2003, author: 'Eleanor', dye: 'madder', kind: 'a memory', depth: 0.28,
    title: 'The morning everything changed',
    body: [
      'It was barely light. The house held the particular silence of a morning that has not decided yet what kind of day it will be.',
      'Your grandfather had a letter in his hand and would not put it down, and I understood from the way he held it that whatever it said had changed the shape of our lives while we slept.',
    ],
  },
  {
    id: 'david-2016', year: 2016, author: 'David', dye: 'woad', kind: 'a letter', depth: 0.43,
    title: 'What I want you to know',
    body: [
      'If you are reading this, then the book has done what it was meant to do.',
      'I want you to know that you come from people who wrote things down so that you would never have to wonder where you came from.',
    ],
  },
  {
    id: 'thomas-1971', year: 1971, author: 'Thomas', dye: 'indigo', kind: 'a letter', depth: 0.57,
    title: 'How your grandmother and I met',
    body: [
      'She was standing at the edge of the orchard wall and I had walked the long way round three days in a row pretending I had not.',
      'On the fourth day I stopped pretending.',
    ],
  },
  {
    id: 'thomas-1948', year: 1948, author: 'Thomas', dye: 'walnut', kind: 'a story', depth: 0.71,
    title: 'After the war, the orchard',
    body: [
      'We came home to a house that had kept itself for us, and an orchard that had not.',
      'We spent that first spring putting both back in order, and somewhere in the work the family began again.',
    ],
  },
  {
    id: 'edith-1901', year: 1901, author: 'Edith', dye: 'cochineal', kind: 'a memory', depth: 0.86,
    title: 'We came over with one trunk',
    body: [
      'We came over with one trunk, and your great-grandmother\u2019s ring sewn into the hem.',
      'I set it down here so that whoever keeps the book will know we did not arrive with nothing. We arrived with each other.',
    ],
  },
]

export interface Contribution { author: string; dye: DyeName; count: number }

export const CONTRIBUTIONS: Contribution[] = [
  { author: 'Thomas', dye: 'walnut', count: 11 },
  { author: 'Eleanor', dye: 'madder', count: 10 },
  { author: 'Margaret', dye: 'indigo', count: 8 },
  { author: 'David', dye: 'woad', count: 7 },
  { author: 'Edith', dye: 'cochineal', count: 6 },
  { author: 'Maya', dye: 'weld', count: 5 },
]

export const TOTAL_DROPS = CONTRIBUTIONS.reduce((s, c) => s + c.count, 0)

// The sealed, time-locked heirloom
export const SEALED = {
  forWhom: 'for Maya, when she turns eighteen',
  opens: '16 June 2034',
}

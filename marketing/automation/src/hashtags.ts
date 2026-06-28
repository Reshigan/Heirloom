// Monthly-rotating hashtag bank.
//
// 2026 reality check (researched, not folklore):
//   - Instagram: 3-5 highly relevant tags beat tag walls; tags with 50k-500k
//     posts are the discovery sweet spot; caption KEYWORDS now carry ~70% of
//     search discovery, tags ~30%.
//   - LinkedIn: 3-5. Pinterest: 2-5 keyword-rich. Bluesky: 2-3 (they count
//     against the 300-char budget). Facebook: 1-3.
//   - Repeating the identical tag block on every post is a spam signal on
//     every platform — accounts get quietly downranked for it.
//
// So the bank rotates two ways:
//   1. MONTHLY — monthlyHashtagPool() slides a deterministic window over each
//      tier, so the candidate set the model picks from is different every
//      month and a tag rests for months between appearances.
//   2. PER-POST — the model picks per-post relevance from that pool, and
//      variants.ts backfills from a per-slot rotation, so no two posts carry
//      the same block even within a month.
//
// Tier sizes follow the volume pyramid: 1-2 broad tags for ceiling, mids for
// the 50k-500k discovery sweet spot, niche/intent tags where someone searching
// is already the customer.

// ~1M+ posts. Crowded — a post surfaces here briefly, so never more than 1-2.
const BROAD = [
  "family",
  "ancestors",
  "oldphotos",
  "grandparents",
  "storytelling",
  "memories",
  "nostalgia",
  "familytime",
  "vintagephotos",
  "parenting",
];

// 50k-500k posts — the discovery sweet spot. The core of every post's tags.
const MID = [
  "familyhistory",
  "genealogy",
  "familytree",
  "heritage",
  "ancestry",
  "familystories",
  "oralhistory",
  "familymemories",
  "generations",
  "memorykeeping",
  "familylegacy",
  "oldfamilyphotos",
  "knowyourroots",
  "familyroots",
  "lifestory",
  "grandparentstories",
];

// Low-volume, high-intent — anyone searching these is already the audience.
const NICHE = [
  "questionstoaskdad",
  "questionstoaskmom",
  "questionstoaskgrandparents",
  "agingparents",
  "sandwichgeneration",
  "caregiverlife",
  "digitallegacy",
  "legacyplanning",
  "timecapsule",
  "familyarchive",
  "preservefamilystories",
  "familykeepsake",
  "writeyourstory",
  "tellyourstory",
  "recordyourstory",
  "familyinterview",
  "savetheirvoice",
  "generationalstories",
  "familyhistorian",
  "genealogyresearch",
  "familyphotoarchive",
  "voicememoir",
  "audiolegacy",
  "memoirwriting",
  "lifewriting",
  "passiton",
  "familytraditions",
  "familyrecipes",
  "heirloom",
  "keepsake",
];

// GROUP — tags that map to the actual family-history / genealogy / memory-
// keeping community pages and group clusters on Facebook, Reddit, and the
// forums. These are the "groups" the posts land on: a single GROUP tag on a
// Facebook post surfaces it to that community's hashtag page. The monthly
// rotation cycles through these so the account keeps reaching NEW groups
// instead of camping on one cluster — "dynamically choosing new groups".
// Lowercase, no '#'.
const GROUP = [
  "genealogy",
  "familyhistory",
  "oralhistory",
  "memorykeeping",
  "familyroots",
  "knowyourroots",
  "familystories",
  "ancestryresearch",
  "genealogylife",
  "familyhistoryresearch",
  "genealogycommunity",
  "familyhistorysociety",
  "genealogyhelp",
  "rootstech",
  "familysearch",
  "findagrave",
  "ancestrydna",
  "myheritage",
  "genealogist",
  "familyhistorian",
  "preservehistory",
  "historicalphotos",
  "familyphotographs",
  "oldphotographs",
  "vintagefamilyphotos",
  "forgottenstories",
  "eldermemories",
  "grandparentslegacy",
  "storycorps",
  "lifestorywriting",
  "memoircommunity",
  "writingcommunity",
  "giftideas",
  "meaningfulgifts",
  "giftsforgrandparents",
  "giftsforparents",
];

// Slide a window of `take` tags over `bank`, advancing by a stride each month.
// Stride is coprime-ish to typical bank sizes so consecutive months overlap
// partially (some continuity for the algorithm) while every tag cycles through
// rest periods instead of appearing in a fixed always-on block.
function monthlyWindow(bank: string[], take: number, monthIndex: number, stride: number): string[] {
  const start = (monthIndex * stride) % bank.length;
  const out: string[] = [];
  for (let i = 0; i < take && i < bank.length; i++) {
    out.push(bank[(start + i) % bank.length]);
  }
  return out;
}

// The month's candidate pool: ~26 tags the generator chooses from. Distinct
// every month, deterministic (same month → same pool, so CI runs agree). The
// GROUP window is the dynamic-groups lever — a fresh slice of community/group
// tags each month, so the account keeps landing on NEW group pages instead of
// the same cluster forever.
export function monthlyHashtagPool(date: Date = new Date()): string[] {
  const monthIndex = date.getUTCFullYear() * 12 + date.getUTCMonth();
  return [
    ...monthlyWindow(BROAD, 4, monthIndex, 3),
    ...monthlyWindow(MID, 7, monthIndex, 5),
    ...monthlyWindow(NICHE, 9, monthIndex, 7),
    ...monthlyWindow(GROUP, 6, monthIndex, 11),
  ];
}

// Deterministic per-slot rotation of a tag list — used for backfill so two
// posts in the same month never share the exact same fallback block.
export function rotateForSlot(tags: string[], slotSeed: number): string[] {
  if (tags.length === 0) return tags;
  const shift = ((slotSeed % tags.length) + tags.length) % tags.length;
  return [...tags.slice(shift), ...tags.slice(0, shift)];
}

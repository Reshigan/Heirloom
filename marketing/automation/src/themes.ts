// Weekly themes for the autonomous content engine.
//
// Each ISO week of the year has a primary theme and an optional seasonal
// context. The seasonal context overrides the theme when active (Mother's Day,
// Father's Day, Grandparents Day, Christmas — the four peaks per PLAYBOOK §3).
//
// Themes are deliberately about the *user's parent or grandparent*, not the
// user themselves. The buyer is often the adult child (the Keeper); the
// person whose stories enter the thread is the parent or grandparent (the
// Elder). Copy reflects that — but Heirloom is NOT a year-of-stories gift
// product (that is Storyworth, and voice.ts rule 8 forbids that framing).
// The thing being given/started is a perpetual family thread: append-only,
// multi-author, time-lockable, built to outlive the company. A season or
// holiday is the *occasion* to open or write into the thread, never a
// 52-week subscription that ends. Avoid "a year of stories," "first prompt
// arrives Monday," "52 weeks" — frame around the thread, the time-lock, and
// one question today.

export type RelationFocus =
  | "mom"
  | "dad"
  | "grandma"
  | "grandpa"
  | "parent"
  | "grandparent"
  | "self";

export interface Theme {
  id: string;
  title: string;
  hook: string;
  relation: RelationFocus;
  // Suggested content angles — the generator picks one per post.
  angles: string[];
}

export interface SeasonalWindow {
  id: string;
  // Inclusive ISO date range (YYYY-MM-DD). Year is ignored; matches every year.
  startMonthDay: string;
  endMonthDay: string;
  theme: Theme;
}

// 52-week rolling calendar. Index 0 = ISO week 1.
export const WEEKLY_THEMES: Theme[] = [
  { id: "w01-resolutions", title: "Stories before resolutions", hook: "Resolutions fade by February. The questions you never asked don't come back at all.", relation: "parent", angles: ["new-year reflection", "one question this week", "what would you regret not asking?"] },
  { id: "w02-recipes", title: "Recipes you'll never get back", hook: "The recipe dies with the cook. Hers is still in her head — for now.", relation: "parent", angles: ["recipe with no card", "voice recording while cooking", "food = memory"] },
  { id: "w03-childhood", title: "Their childhood you don't know", hook: "Your mom was ten once. You have no idea what that day looked like.", relation: "parent", angles: ["earliest memory", "favorite toy", "most embarrassing moment"] },
  { id: "w04-music", title: "Songs of their life", hook: "There's a song that stops your dad cold every time. You don't know which one.", relation: "parent", angles: ["wedding song", "first concert", "song that makes them cry"] },
  { id: "w05-love", title: "How your parents met", hook: "You know the version they tell at parties. Ask for the one that's true.", relation: "parent", angles: ["first date", "first kiss", "first fight"] },
  { id: "w06-valentines", title: "Love letters worth keeping", hook: "The letter you keep meaning to write is the one they'll reread for years.", relation: "self", angles: ["letter to spouse", "letter to child", "letter to younger self"] },
  { id: "w07-courage", title: "The bravest thing they ever did", hook: "Your parent survived something they've never told you about. Ask.", relation: "parent", angles: ["a moment of fear", "a hard decision", "what they almost didn't survive"] },
  { id: "w08-regrets", title: "What they'd do differently", hook: "Ask your parent what they'd do differently. They've been waiting to be asked.", relation: "parent", angles: ["a missed opportunity", "advice to younger self", "lesson too late"] },
  { id: "w09-work", title: "First jobs and worst jobs", hook: "Before they were your parent, they were 17 and clocking in somewhere. Where?", relation: "parent", angles: ["first paycheck", "worst boss", "the job that changed them"] },
  { id: "w10-friends", title: "The friend they lost touch with", hook: "There's a friend your parent still thinks about and never calls. Ask who.", relation: "parent", angles: ["best friend at 20", "the falling-out", "the one they wish they'd called"] },
  { id: "w11-home", title: "The house they grew up in", hook: "Ask them to walk you through the house they grew up in. Every room is a story.", relation: "parent", angles: ["the kitchen", "their bedroom", "the smell of home"] },
  { id: "w12-spring", title: "First spring memories", hook: "One smell takes your parent straight back fifty years. Find out which one.", relation: "parent", angles: ["a specific spring", "a place from childhood", "a season they miss"] },
  { id: "w13-school", title: "School stories you've never heard", hook: "There's a teacher your parent never forgot — for better or worse. Ask the name.", relation: "parent", angles: ["favorite teacher", "biggest school memory", "the day they got in trouble"] },
  { id: "w14-grandparents", title: "Their grandparents, your great-grandparents", hook: "Your great-grandparents are two questions away from being gone for good.", relation: "grandparent", angles: ["what they remember", "a story they were told", "a face in an old photo"] },
  { id: "w15-fears", title: "Things they're scared of", hook: "The thing that keeps your parent up at night — they'll tell you, if you ask gently.", relation: "parent", angles: ["a current fear", "a childhood fear", "what keeps them up"] },
  { id: "w16-mothersday-prep", title: "Mother's Day is 3 weeks away", hook: "Flowers die in a week. Ask her something this Mother's Day that won't.", relation: "mom", angles: ["the gift that outlives the giver", "start the thread with one question for her", "an entry her great-granddaughter opens in 2120", "what flowers can't carry — her voice, her exact words", "the question she's been waiting for someone to ask", "her handwriting on a recipe is not the same as her voice saying it"] },
  { id: "w17-mothersday-prep2", title: "Mother's Day is 2 weeks away", hook: "Last year's Mother's Day gift is already in a landfill. Start one that outlives her.", relation: "mom", angles: ["why a thread beats flowers", "ask mom the one question no one asks", "lock an entry for a grandchild not born yet", "the last Mother's Day you can't take back — and the next one you still have", "her version of your childhood — not yours, hers", "a gift she opens every year for the rest of her life"] },
  { id: "w18-mothersday", title: "Mother's Day", hook: "Ask her one real question today. Lock the answer for a grandchild not yet born.", relation: "mom", angles: ["record one answer this afternoon", "open the family thread with her voice", "a time-locked entry for a descendant", "the question she's never been asked — not 'how are you', something real", "what she was doing at your age — her life before she was your mom", "one sentence about her own mother — the chain going back", "a letter from her to a grandchild she hasn't met yet", "what she'd do differently — the honest question most children never ask", "the recipe in her voice, not her handwriting", "the moment she knew she was a mother — not the birth, the realization"] },
  { id: "w19-postmom", title: "After Mother's Day", hook: "You called. But did you ask her anything you'll still have in 20 years?", relation: "mom", angles: ["a question for this week", "the conversation you didn't have", "next Sunday's call"] },
  { id: "w20-summer-stories", title: "Summer stories, told slow", hook: "The summer your parent was 16 is a whole life you've never heard about.", relation: "parent", angles: ["a summer job", "a road trip", "first heartbreak"] },
  { id: "w21-fathersday-prep", title: "Father's Day is 3 weeks away", hook: "Dads don't open up to gifts. They open up to the right question. Father's Day is coming.", relation: "dad", angles: ["why dads don't talk", "the question that opens dad up", "his stories matter too", "the gift he'd never ask for but would keep", "what your dad was doing at 25 — before he was your dad", "asking takes 3 minutes; the answer reaches your kids for generations"] },
  { id: "w22-fathersday-prep2", title: "Father's Day is 2 weeks away", hook: "He says he doesn't want anything. He's just never been asked the right thing.", relation: "dad", angles: ["dad gifts that aren't ties", "the quiet way to ask", "open a thread his grandkids will read", "the bravest thing he ever did that he never told you", "his first job, his worst boss — before he was your dad", "what he thinks about when he goes quiet"] },
  { id: "w23-fathersday", title: "Father's Day", hook: "He'll go his whole life without being asked. Don't let him.", relation: "dad", angles: ["ask one thing today, record the answer", "lock the story for your kids to open later", "what dads actually answer when asked", "the question dads never get asked — not 'how are you', something real", "his father — the grandfather you never knew, filtered through him", "what he was doing at your exact age — the inversion that opens everything", "the bravest thing he never told you", "the moment he knew he was a father — not the birth, when it became real", "what he actually wanted from his life — the dream before the responsibility", "a time-locked letter from him to his youngest grandchild", "the story he's been waiting for someone to care enough to ask about"] },
  { id: "w24-postdad", title: "After Father's Day", hook: "Ask your dad about his dad. That's a grandfather you'll never otherwise meet.", relation: "dad", angles: ["grandfather questions", "what your dad never said about his dad", "two-generation story"] },
  { id: "w25-summer-2", title: "Travel and family", hook: "The trip you remember and the trip they remember aren't the same trip. Ask.", relation: "parent", angles: ["a trip together", "where they wanted to go", "a passport story"] },
  { id: "w26-midyear", title: "Halfway through the year", hook: "Half the year is gone. How many of their stories did you actually save?", relation: "self", angles: ["account audit", "one this week", "habit not project"] },
  { id: "w27-regret-followup", title: "What you'll regret if you don't ask", hook: "Nobody regrets asking too much. Everybody regrets asking too late.", relation: "parent", angles: ["urgent without scary", "the cost of waiting", "a story you'll never get back"] },
  { id: "w28-old-friends", title: "People they used to know", hook: "Ask about the people your parent lost touch with. Each name is a story going cold.", relation: "parent", angles: ["a name from the past", "someone they lost touch with", "old photos"] },
  { id: "w29-photos", title: "Photos with no captions", hook: "Your kids will inherit 4,000 photos and not one story to go with them.", relation: "parent", angles: ["caption an old photo", "the people in the picture", "story per photo"] },
  { id: "w30-summer-end", title: "Last weeks of summer", hook: "Before the kids go back to school, ask your parent about their first day ever.", relation: "parent", angles: ["first day of school", "kids growing up", "a back-to-school story"] },
  { id: "w31-grandparents-prep", title: "Grandparents Day is 3 weeks away", hook: "Your grandparent remembers a world no one else alive does. Grandparents Day is coming.", relation: "grandparent", angles: ["what they remember, no one else alive does", "record their voice while you can", "the great-grandchild who'll read it", "the world they were born into — a different century in every sense", "one afternoon of questions that no one else will ever ask them"] },
  { id: "w32-grandparents-prep2", title: "Grandparents Day is 2 weeks away", hook: "They're 80. The clock isn't a metaphor. Ask now.", relation: "grandparent", angles: ["urgency without fear", "ask now", "they want to be asked", "the story they've been waiting 40 years for someone to ask about", "record one afternoon — more than most grandchildren will ever have"] },
  { id: "w33-grandparents-day", title: "Grandparents Day", hook: "They don't want another card. They want one afternoon of being truly asked.", relation: "grandparent", angles: ["sit down and hit record this week", "an afternoon becomes a thread your family keeps", "lock an entry for a great-grandchild not yet born", "the world they were born into — not history, their actual life", "what they know that no one else alive knows anymore", "their version of a family story you think you already know — ask anyway", "one question that opens the whole afternoon: 'what do you wish someone had asked you'", "a voice recording of one story — the one they always wanted to tell"] },
  { id: "w34-fall-stories", title: "Fall and tradition", hook: "The fall ritual your family repeats every year — does anyone know how it started?", relation: "parent", angles: ["a holiday tradition", "a fall photo", "a family ritual"] },
  { id: "w35-letters", title: "Letters they wrote", hook: "Somewhere there's a letter in your mother's handwriting. Find it before it's lost.", relation: "parent", angles: ["an old letter", "a love letter", "letters as legacy"] },
  { id: "w36-immigration", title: "Where they came from", hook: "Someone in your family made the leap that put you here. Do you know their name?", relation: "parent", angles: ["a family migration", "first generation", "a country of origin"] },
  { id: "w37-money", title: "How they thought about money", hook: "Ask your parents about the thing they could never afford. It explains everything.", relation: "parent", angles: ["first big purchase", "money lesson", "what they couldn't afford"] },
  { id: "w38-faith", title: "What they believed", hook: "What your parent believes now isn't what they believed at 20. Ask what changed.", relation: "parent", angles: ["a belief they held", "a belief they lost", "what they pass on"] },
  { id: "w39-kids", title: "What they thought you'd be", hook: "Before you could talk, your parents pictured who you'd become. Ask what they imagined.", relation: "parent", angles: ["dreams for their child", "what surprised them about parenting", "what they got wrong"] },
  { id: "w40-fall-end", title: "Halloween and ghost stories", hook: "Every family has one story no one can explain. Get your parent to tell it.", relation: "parent", angles: ["a ghost story", "a strange night", "something unexplained"] },
  { id: "w41-thanksgiving-prep", title: "Thanksgiving is 3 weeks away", hook: "Thanksgiving puts three generations at one table. Bring better questions than usual.", relation: "parent", angles: ["table conversation", "a question to bring", "the older person at the table", "the one question that opens up the whole table", "what your grandparent remembers about Thanksgiving when they were young"] },
  { id: "w42-thanksgiving-prep2", title: "Thanksgiving prep", hook: "This year, bring a question to the table, not just a side dish.", relation: "parent", angles: ["the question to ask", "open the conversation", "record it on your phone", "the family story that gets told every year — write it down this year", "ask before the seats at the table change"] },
  { id: "w43-thanksgiving", title: "Thanksgiving", hook: "Around the table today, ask the one question you've never had the nerve to ask.", relation: "parent", angles: ["the table moment", "permission to record", "one question per person", "the story that's been told a hundred times — write it down once", "the oldest person at the table: one story before the meal"] },
  { id: "w44-postthanks", title: "Post-Thanksgiving", hook: "The best thing said at dinner — did anyone write it down? Do it now.", relation: "parent", angles: ["a story you got", "something you'll keep", "the next call", "the story you almost didn't think to ask — write it before the details fade"] },
  { id: "w45-christmas-prep", title: "Christmas gift ideas they'll actually open", hook: "Another candle gets re-gifted by February. Give something that's still here in 2120.", relation: "parent", angles: ["the gift that outlives everyone at the table", "give a thread, not a thing", "a gift their grandchildren inherit", "no shipping, no returns, no expiry date — and it gets more valuable every year", "what to give someone who already has everything"] },
  { id: "w46-christmas-prep2", title: "2 weeks to Christmas", hook: "Two weeks to Christmas. Nothing to ship, nothing that runs out, nothing to throw away.", relation: "parent", angles: ["a gift with no end date", "open the thread together on the day", "the first entry can be one question", "give the gift of being listened to — the surprising gap in what elders actually want", "the Christmas gift they'll still have in 2120"] },
  { id: "w47-christmas-prep3", title: "1 week to Christmas", hook: "One week left. The only gift that's worth more every year your family adds to it.", relation: "parent", angles: ["no shipping, ready tonight", "a thread the whole bloodline writes into", "lock an entry to open years from now", "a time-locked letter to a grandchild not yet born — sealed until their 18th birthday", "the gift that doesn't get thrown away, re-gifted, or forgotten after January"] },
  { id: "w48-christmas", title: "Christmas Day", hook: "Open one thread around the tree today. Your family writes into it for a century.", relation: "parent", angles: ["around the tree, record one story", "the moment the thread begins", "a time-locked entry for a future Christmas", "the story they always tell at Christmas — record it properly this year", "a letter from grandparent to grandchild, sealed until their 18th birthday", "the tradition that started before you were born — write down how it started"] },
  { id: "w49-betweenyears", title: "Between Christmas and New Year", hook: "The quiet days between Christmas and New Year are the best ones to ask the big questions.", relation: "parent", angles: ["family time", "old photos", "a slow conversation"] },
  { id: "w50-yearend", title: "Year-end reflection", hook: "Name the question you meant to ask this year and didn't. Next year isn't guaranteed.", relation: "self", angles: ["regret-free angle", "next year resolution", "habit setting"] },
  { id: "w51-newyear-prep", title: "New Year resolutions that actually matter", hook: "Skip the gym resolution. Make the one you'll actually regret breaking: ask before it's too late.", relation: "parent", angles: ["a resolution that outlasts you", "one question a week, written into the thread", "the habit of asking before it's too late"] },
  { id: "w52-newyear", title: "New Year", hook: "This is the year the thread begins. A thread doesn't have a last year.", relation: "parent", angles: ["start with one entry today", "the door is one question", "an append-only thread, not a 12-month project"] },
];

export const SEASONAL_WINDOWS: SeasonalWindow[] = [
  // Mother's Day — second Sunday in May. We approximate as May 8–14.
  {
    id: "mothers-day",
    startMonthDay: "05-01",
    endMonthDay: "05-14",
    theme: WEEKLY_THEMES.find((t) => t.id === "w18-mothersday")!,
  },
  // Father's Day — third Sunday in June. Approximate as June 14–22.
  {
    id: "fathers-day",
    startMonthDay: "06-01",
    endMonthDay: "06-22",
    theme: WEEKLY_THEMES.find((t) => t.id === "w23-fathersday")!,
  },
  // Grandparents Day — first Sunday after Labor Day. Approximate as Sept 5–15.
  {
    id: "grandparents-day",
    startMonthDay: "09-01",
    endMonthDay: "09-15",
    theme: WEEKLY_THEMES.find((t) => t.id === "w33-grandparents-day")!,
  },
  // Christmas window.
  {
    id: "christmas",
    startMonthDay: "12-15",
    endMonthDay: "12-25",
    theme: WEEKLY_THEMES.find((t) => t.id === "w48-christmas")!,
  },
];

// High-intent discovery tags per seasonal window. These are the search/landing
// terms people actually browse during the peak — including one tag on the post
// lands it on that hashtag's page (Instagram/Threads/Shorts) and surfaces it in
// the matching Pinterest/LinkedIn topic where buying intent is highest. Kept to
// gift/occasion language because that is what people search in-season; the
// always-on community tags (#familyhistory etc.) still come from the platform
// guideline. Lowercase, no '#'.
export const SEASONAL_HASHTAGS: Record<string, string[]> = {
  "mothers-day": ["mothersday", "mothersdaygift", "mothersdaygiftideas", "giftformom"],
  "fathers-day": ["fathersday", "fathersdaygift", "fathersdaygiftideas", "giftfordad"],
  "grandparents-day": ["grandparentsday", "grandparents", "grandparentlove"],
  "christmas": ["christmasgift", "christmasgiftideas", "familychristmas", "meaningfulgift"],
};

// The active seasonal window for a date, or null outside the four peaks. Drives
// both the seasonal copy override (themeForDate) and the seasonal posting
// cadence + discovery tags in run.ts / variants.ts.
export function seasonForDate(date: Date = new Date()): SeasonalWindow | null {
  return SEASONAL_WINDOWS.find((w) => inWindow(date, w)) ?? null;
}

// Convenience: the discovery tags for whatever season is active, or [] outside
// a window.
export function seasonalHashtagsForDate(date: Date = new Date()): string[] {
  const s = seasonForDate(date);
  return s ? SEASONAL_HASHTAGS[s.id] ?? [] : [];
}

function isoWeek(date: Date): number {
  const tmp = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function inWindow(date: Date, w: SeasonalWindow): boolean {
  const md = `${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
  return md >= w.startMonthDay && md <= w.endMonthDay;
}

export function themeForDate(date: Date = new Date()): Theme {
  const seasonal = SEASONAL_WINDOWS.find((w) => inWindow(date, w));
  if (seasonal) return seasonal.theme;

  const week = isoWeek(date);
  return WEEKLY_THEMES[(week - 1) % WEEKLY_THEMES.length];
}

// In-season variety: slots after a day's first pull an evergreen theme instead
// of the seasonal one. A three-week window that pins every slot to one occasion
// turns the feed into a single idea on loop — and gives followers outside that
// relation nothing. Pool excludes all occasion-bound themes plus anything aimed
// at the active season's relation; the offset rotates within the day so two
// evergreen slots diverge.
const OCCASION_THEME_IDS = /mothersday|fathersday|grandparents|thanksgiving|christmas|postmom|postdad|postthanks|valentines|newyear/;

export function evergreenThemeForDate(date: Date = new Date(), offset = 0): Theme {
  const seasonal = SEASONAL_WINDOWS.find((w) => inWindow(date, w));
  const pool = WEEKLY_THEMES.filter(
    (t) =>
      !OCCASION_THEME_IDS.test(t.id) &&
      (!seasonal || t.relation !== seasonal.theme.relation),
  );
  return pool[(isoWeek(date) + offset) % pool.length];
}

// ── Brand / product selling-point themes ─────────────────────────────────
// The 52-week calendar is story-hooks (the elder, the question, the regret of
// not asking). BRAND_THEMES are the product itself — the differentiators that
// make Heirloom worth starting, framed in the same quiet, anti-generic voice
// as the story posts. The engine rotates one in on a cadence (see run.ts) so
// the feed mixes "ask your dad" with "here's what you're keeping it in" —
// story-hook → product, never product-first. relation is "self" (the Keeper
// who starts the thread), never the elder.
export const BRAND_THEMES: Theme[] = [
  {
    id: "b01-family-water",
    title: "Your family's water is yours alone",
    hook: "Every family that joins Heirloom gets a different deep water — because the water is seeded by that family's own colours.",
    relation: "self",
    angles: [
      "each member owns a natural dye (madder, woad, indigo, walnut…); the dye enters the water — your bloodline tints the Deep",
      "one author → a single hue; many authors → a gradient through every member's colour, surface to deep",
      "add a member, the water recolours live — the water is a living portrait of who's in the bloodline right now",
      "no two families share the same water; yours is mixed from your dyes alone",
    ],
  },
  {
    id: "b02-the-book",
    title: "One day the Deep becomes a book",
    hook: "The things you settle into the Deep online become a real book on a shelf — hardcover or softcover, the family's water on the cover.",
    relation: "self",
    angles: [
      "memories, letters, and voice → four page layouts → a physical heirloom book",
      "voice entries carry their transcriptions into print",
      "the cover snapshots the family's own water — the same water, bound",
      "a thread that starts as one line and ends as a book your great-granddaughter holds",
    ],
  },
  {
    id: "b03-the-seal",
    title: "Press and hold to seal it across time",
    hook: "You don't hit save. You seal. Press and hold, and your colour fills the seal — the entry is closed across time.",
    relation: "self",
    angles: [
      "the commit gesture is a press-and-hold seal filled with your own dye, not a save button",
      "time-lock an entry for a grandchild not yet born — sealed until their 18th birthday",
      "append-only: nothing is deleted, only settled deeper",
      "your colour, your seal, your thread — identity as gesture, not a profile pic",
    ],
  },
  {
    id: "b04-living-backdrop",
    title: "The backdrop is alive",
    hook: "Heirloom isn't a feed on a screen — it's one body of living water. It stirs, and it takes on your family's colours as they speak into it.",
    relation: "self",
    angles: [
      "the whole app is one deep water; scrolling down is diving — recent memories near the surface, the oldest at the bed",
      "the water is dark and still until your family speaks; every entry lowered in tints it, so the backdrop slowly fills with colour",
      "open it a year in and the water is a living portrait of everything your bloodline has said",
      "no dashboards, no grid, no feed — you read your family by hand, by depth",
    ],
  },
  {
    id: "b05-invite-the-bloodline",
    title: "It only gets deeper when they join",
    hook: "One voice is a drop. A whole family speaking in is a deep water that outlasts all of you. Call them in.",
    relation: "self",
    angles: [
      "invite a parent, a sibling, a grandparent — each arrives with their own colour and the water grows",
      "the people who tend it with you are private, encrypted, and inherit it when you're gone",
      "share your family's Deep with the one relative who remembers everything — before they don't",
      "a gift that compounds: what your family lowers in today, your great-grandchildren draw back up",
    ],
  },
];

// Pick a brand theme on a rotating offset so the same selling point doesn't
// repeat back-to-back. Deterministic off the date + slot so a re-run doesn't
// flip the choice.
export function brandThemeForDate(date: Date = new Date(), offset = 0): Theme {
  return BRAND_THEMES[(isoWeek(date) + offset) % BRAND_THEMES.length];
}

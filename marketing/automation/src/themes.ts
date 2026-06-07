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
  { id: "w01-resolutions", title: "Stories before resolutions", hook: "This year, ask before they're gone.", relation: "parent", angles: ["new-year reflection", "one question this week", "what would you regret not asking?"] },
  { id: "w02-recipes", title: "Recipes you'll never get back", hook: "Mom's spaghetti. Grandma's roti. Dad's bbq rub.", relation: "parent", angles: ["recipe with no card", "voice recording while cooking", "food = memory"] },
  { id: "w03-childhood", title: "Their childhood you don't know", hook: "What was your mom doing at age 10?", relation: "parent", angles: ["earliest memory", "favorite toy", "most embarrassing moment"] },
  { id: "w04-music", title: "Songs of their life", hook: "Every parent has a song. Find theirs.", relation: "parent", angles: ["wedding song", "first concert", "song that makes them cry"] },
  { id: "w05-love", title: "How your parents met", hook: "You think you know the story. You don't.", relation: "parent", angles: ["first date", "first kiss", "first fight"] },
  { id: "w06-valentines", title: "Love letters worth keeping", hook: "Write one before you regret not writing it.", relation: "self", angles: ["letter to spouse", "letter to child", "letter to younger self"] },
  { id: "w07-courage", title: "The bravest thing they ever did", hook: "Most parents never tell this story.", relation: "parent", angles: ["a moment of fear", "a hard decision", "what they almost didn't survive"] },
  { id: "w08-regrets", title: "What they'd do differently", hook: "The question every parent answers — when asked.", relation: "parent", angles: ["a missed opportunity", "advice to younger self", "lesson too late"] },
  { id: "w09-work", title: "First jobs and worst jobs", hook: "Before they were 'mom' or 'dad', they were 17.", relation: "parent", angles: ["first paycheck", "worst boss", "the job that changed them"] },
  { id: "w10-friends", title: "The friend they lost touch with", hook: "Every parent has one.", relation: "parent", angles: ["best friend at 20", "the falling-out", "the one they wish they'd called"] },
  { id: "w11-home", title: "The house they grew up in", hook: "Walk them through it, room by room.", relation: "parent", angles: ["the kitchen", "their bedroom", "the smell of home"] },
  { id: "w12-spring", title: "First spring memories", hook: "Spring smells like something specific. What?", relation: "parent", angles: ["a specific spring", "a place from childhood", "a season they miss"] },
  { id: "w13-school", title: "School stories you've never heard", hook: "The teacher they loved. The one they hated.", relation: "parent", angles: ["favorite teacher", "biggest school memory", "the day they got in trouble"] },
  { id: "w14-grandparents", title: "Their grandparents, your great-grandparents", hook: "Two generations back. Already half-lost.", relation: "grandparent", angles: ["what they remember", "a story they were told", "a face in an old photo"] },
  { id: "w15-fears", title: "Things they're scared of", hook: "Being asked. So ask gently.", relation: "parent", angles: ["a current fear", "a childhood fear", "what keeps them up"] },
  { id: "w16-mothersday-prep", title: "Mother's Day is 3 weeks away", hook: "Don't buy flowers. Open a thread.", relation: "mom", angles: ["the gift that outlives the giver", "start the thread with one question for her", "an entry her great-granddaughter opens in 2120", "what flowers can't carry — her voice, her exact words", "the question she's been waiting for someone to ask", "her handwriting on a recipe is not the same as her voice saying it"] },
  { id: "w17-mothersday-prep2", title: "Mother's Day is 2 weeks away", hook: "Last year's flowers are gone. Start something that isn't.", relation: "mom", angles: ["why a thread beats flowers", "ask mom the one question no one asks", "lock an entry for a grandchild not born yet", "the last Mother's Day you can't take back — and the next one you still have", "her version of your childhood — not yours, hers", "a gift she opens every year for the rest of her life"] },
  { id: "w18-mothersday", title: "Mother's Day", hook: "Ask her one thing today. Lock the answer for whoever comes next.", relation: "mom", angles: ["record one answer this afternoon", "open the family thread with her voice", "a time-locked entry for a descendant", "the question she's never been asked — not 'how are you', something real", "what she was doing at your age — her life before she was your mom", "one sentence about her own mother — the chain going back", "a letter from her to a grandchild she hasn't met yet", "what she'd do differently — the honest question most children never ask", "the recipe in her voice, not her handwriting", "the moment she knew she was a mother — not the birth, the realization"] },
  { id: "w19-postmom", title: "After Mother's Day", hook: "Did you call? Did you ask?", relation: "mom", angles: ["a question for this week", "the conversation you didn't have", "next Sunday's call"] },
  { id: "w20-summer-stories", title: "Summer stories, told slow", hook: "The summer they were 16.", relation: "parent", angles: ["a summer job", "a road trip", "first heartbreak"] },
  { id: "w21-fathersday-prep", title: "Father's Day is 3 weeks away", hook: "Dads are harder. So ask better questions.", relation: "dad", angles: ["why dads don't talk", "the question that opens dad up", "his stories matter too", "the gift he'd never ask for but would keep forever", "what your dad was doing at 25 — before he was your dad", "asking takes 3 minutes. not asking takes forever."] },
  { id: "w22-fathersday-prep2", title: "Father's Day is 2 weeks away", hook: "He says he doesn't need anything. He doesn't mean it.", relation: "dad", angles: ["dad gifts that aren't ties", "the quiet way to ask", "open a thread his grandkids will read", "the bravest thing he ever did that he never told you", "his first job, his worst boss — before he was your dad", "what he thinks about when he goes quiet"] },
  { id: "w23-fathersday", title: "Father's Day", hook: "He'll never ask you to. Do it anyway.", relation: "dad", angles: ["ask one thing today, record the answer", "lock the story for your kids to open later", "what dads actually answer when asked", "the question dads never get asked — not 'how are you', something real", "his father — the grandfather you never knew, filtered through him", "what he was doing at your exact age — the inversion that opens everything", "the bravest thing he never told you", "the moment he knew he was a father — not the birth, when it became real", "what he actually wanted from his life — the dream before the responsibility", "a time-locked letter from him to his youngest grandchild", "the story he's been waiting for someone to care enough to ask about"] },
  { id: "w24-postdad", title: "After Father's Day", hook: "Ask him about his dad.", relation: "dad", angles: ["grandfather questions", "what your dad never said about his dad", "two-generation story"] },
  { id: "w25-summer-2", title: "Travel and family", hook: "The vacation you remember. The one they remember.", relation: "parent", angles: ["a trip together", "where they wanted to go", "a passport story"] },
  { id: "w26-midyear", title: "Halfway through the year", hook: "How many stories have you saved?", relation: "self", angles: ["account audit", "one this week", "habit not project"] },
  { id: "w27-regret-followup", title: "What you'll regret if you don't ask", hook: "Most people regret two things. Money you didn't save. Stories you didn't ask for.", relation: "parent", angles: ["urgent without scary", "the cost of waiting", "a story you'll never get back"] },
  { id: "w28-old-friends", title: "People they used to know", hook: "Old friends become old stories.", relation: "parent", angles: ["a name from the past", "someone they lost touch with", "old photos"] },
  { id: "w29-photos", title: "Photos with no captions", hook: "Your kids will inherit the JPGs. Save the stories behind them.", relation: "parent", angles: ["caption an old photo", "the people in the picture", "story per photo"] },
  { id: "w30-summer-end", title: "Last weeks of summer", hook: "School starts soon. Ask about their first day.", relation: "parent", angles: ["first day of school", "kids growing up", "a back-to-school story"] },
  { id: "w31-grandparents-prep", title: "Grandparents Day is 3 weeks away", hook: "Two generations back is already half-lost. Ask now.", relation: "grandparent", angles: ["what they remember, no one else alive does", "record their voice while you can", "the great-grandchild who'll read it", "the world they were born into — a different century in every sense", "one afternoon of questions that no one else will ever ask them"] },
  { id: "w32-grandparents-prep2", title: "Grandparents Day is 2 weeks away", hook: "They're 80. The clock is real.", relation: "grandparent", angles: ["urgency without fear", "ask now", "they want to be asked", "the story they've been waiting 40 years for someone to ask about", "record one afternoon — more than most grandchildren will ever have"] },
  { id: "w33-grandparents-day", title: "Grandparents Day", hook: "Give them what they actually want — to be heard.", relation: "grandparent", angles: ["sit down and hit record this week", "an afternoon becomes a thread your family keeps", "lock an entry for a great-grandchild not yet born", "the world they were born into — not history, their actual life", "what they know that no one else alive knows anymore", "their version of a family story you think you already know — ask anyway", "one question that opens the whole afternoon: 'what do you wish someone had asked you'", "a voice recording of one story — the one they always wanted to tell"] },
  { id: "w34-fall-stories", title: "Fall and tradition", hook: "Every family has a fall ritual. Capture yours.", relation: "parent", angles: ["a holiday tradition", "a fall photo", "a family ritual"] },
  { id: "w35-letters", title: "Letters they wrote", hook: "Did your mom write? Find what's left.", relation: "parent", angles: ["an old letter", "a love letter", "letters as legacy"] },
  { id: "w36-immigration", title: "Where they came from", hook: "Every family has a 'how we got here' story.", relation: "parent", angles: ["a family migration", "first generation", "a country of origin"] },
  { id: "w37-money", title: "How they thought about money", hook: "What your parents learned. What they wished they'd learned.", relation: "parent", angles: ["first big purchase", "money lesson", "what they couldn't afford"] },
  { id: "w38-faith", title: "What they believed", hook: "Faith, doubt, change.", relation: "parent", angles: ["a belief they held", "a belief they lost", "what they pass on"] },
  { id: "w39-kids", title: "What they thought you'd be", hook: "Their hopes for you, before you knew.", relation: "parent", angles: ["dreams for their child", "what surprised them about parenting", "what they got wrong"] },
  { id: "w40-fall-end", title: "Halloween and ghost stories", hook: "Every family has one. What's yours?", relation: "parent", angles: ["a ghost story", "a strange night", "something unexplained"] },
  { id: "w41-thanksgiving-prep", title: "Thanksgiving is 3 weeks away", hook: "The dinner where you can ask better questions.", relation: "parent", angles: ["table conversation", "a question to bring", "the older person at the table", "the one question that opens up the whole table", "what your grandparent remembers about Thanksgiving when they were young"] },
  { id: "w42-thanksgiving-prep2", title: "Thanksgiving prep", hook: "Bring a question, not a side dish.", relation: "parent", angles: ["the question to ask", "open the conversation", "record it on your phone", "the family story that gets told every year — write it down this year", "ask before the seats at the table change"] },
  { id: "w43-thanksgiving", title: "Thanksgiving", hook: "Today, ask one thing you've never asked.", relation: "parent", angles: ["the table moment", "permission to record", "one question per person", "the story that's been told a hundred times — write it down once", "the oldest person at the table: one story before the meal"] },
  { id: "w44-postthanks", title: "Post-Thanksgiving", hook: "What did you learn?", relation: "parent", angles: ["a story you got", "something you'll keep", "the next call", "the story you almost didn't think to ask — write it before the details fade"] },
  { id: "w45-christmas-prep", title: "Christmas gift ideas they'll actually open", hook: "Don't buy another candle.", relation: "parent", angles: ["the gift that outlives everyone at the table", "give a thread, not a thing", "a gift their grandchildren inherit", "no shipping, no returns, no expiry date — and it gets more valuable every year", "what to give someone who already has everything"] },
  { id: "w46-christmas-prep2", title: "2 weeks to Christmas", hook: "Nothing to ship. Nothing that runs out.", relation: "parent", angles: ["a gift with no end date", "open the thread together on the day", "the first entry can be one question", "give the gift of being listened to — the surprising gap in what elders actually want", "the Christmas gift they'll still have in 2120"] },
  { id: "w47-christmas-prep3", title: "1 week to Christmas", hook: "The one gift that gets older with your family.", relation: "parent", angles: ["no shipping, ready tonight", "a thread the whole bloodline writes into", "lock an entry to open years from now", "a time-locked letter to a grandchild not yet born — sealed until their 18th birthday", "the gift that doesn't get thrown away, re-gifted, or forgotten after January"] },
  { id: "w48-christmas", title: "Christmas Day", hook: "Open one thread today. Your family writes into it for the next century.", relation: "parent", angles: ["around the tree, record one story", "the moment the thread begins", "a time-locked entry for a future Christmas", "the story they always tell at Christmas — record it properly this year", "a letter from grandparent to grandchild, sealed until their 18th birthday", "the tradition that started before you were born — write down how it started"] },
  { id: "w49-betweenyears", title: "Between Christmas and New Year", hook: "Quiet days. Big questions.", relation: "parent", angles: ["family time", "old photos", "a slow conversation"] },
  { id: "w50-yearend", title: "Year-end reflection", hook: "What do you wish you'd asked last year?", relation: "self", angles: ["regret-free angle", "next year resolution", "habit setting"] },
  { id: "w51-newyear-prep", title: "New Year resolutions that actually matter", hook: "Not the gym. The questions you keep meaning to ask.", relation: "parent", angles: ["a resolution that outlasts you", "one question a week, written into the thread", "the habit of asking before it's too late"] },
  { id: "w52-newyear", title: "New Year", hook: "This is the year the thread starts. It doesn't have a last year.", relation: "parent", angles: ["start with one entry today", "the door is one question", "an append-only thread, not a 12-month project"] },
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

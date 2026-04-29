// Weekly themes for the autonomous content engine.
//
// Each ISO week of the year has a primary theme and an optional seasonal
// context. The seasonal context overrides the theme when active (Mother's Day,
// Father's Day, Grandparents Day, Christmas — the four peaks per PLAYBOOK §3).
//
// Themes are deliberately about the *user's parent or grandparent*, not the
// user themselves. The wedge is gift purchase: the buyer is the adult child,
// the user is the parent. Copy must reflect that.

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
  { id: "w16-mothersday-prep", title: "Mother's Day is 3 weeks away", hook: "Don't buy flowers. Buy time.", relation: "mom", angles: ["the gift that lasts", "weekly story prompts", "the year-end book"] },
  { id: "w17-mothersday-prep2", title: "Mother's Day is 2 weeks away", hook: "Last year's flowers are gone. This year, a year of stories.", relation: "mom", angles: ["why a story is better than flowers", "what mom would actually want", "give her a year"] },
  { id: "w18-mothersday", title: "Mother's Day", hook: "It's not too late to give her something that lasts.", relation: "mom", angles: ["gift purchase last-minute", "first prompt arrives Monday", "what other moms have said"] },
  { id: "w19-postmom", title: "After Mother's Day", hook: "Did you call? Did you ask?", relation: "mom", angles: ["a question for this week", "the conversation you didn't have", "next Sunday's call"] },
  { id: "w20-summer-stories", title: "Summer stories, told slow", hook: "The summer they were 16.", relation: "parent", angles: ["a summer job", "a road trip", "first heartbreak"] },
  { id: "w21-fathersday-prep", title: "Father's Day is 3 weeks away", hook: "Dads are harder. So ask better questions.", relation: "dad", angles: ["why dads don't talk", "the question that opens dad up", "his stories matter too"] },
  { id: "w22-fathersday-prep2", title: "Father's Day is 2 weeks away", hook: "He says he doesn't need anything. He doesn't mean it.", relation: "dad", angles: ["dad gifts that aren't ties", "the quiet way to ask", "give him a year"] },
  { id: "w23-fathersday", title: "Father's Day", hook: "He'll never ask you to. Do it anyway.", relation: "dad", angles: ["last-minute gift", "first prompt arrives Monday", "what dads actually answer"] },
  { id: "w24-postdad", title: "After Father's Day", hook: "Ask him about his dad.", relation: "dad", angles: ["grandfather questions", "what your dad never said about his dad", "two-generation story"] },
  { id: "w25-summer-2", title: "Travel and family", hook: "The vacation you remember. The one they remember.", relation: "parent", angles: ["a trip together", "where they wanted to go", "a passport story"] },
  { id: "w26-midyear", title: "Halfway through the year", hook: "How many stories have you saved?", relation: "self", angles: ["account audit", "one this week", "habit not project"] },
  { id: "w27-regret-followup", title: "What you'll regret if you don't ask", hook: "Most people regret two things. Money you didn't save. Stories you didn't ask for.", relation: "parent", angles: ["urgent without scary", "the cost of waiting", "a story you'll never get back"] },
  { id: "w28-old-friends", title: "People they used to know", hook: "Old friends become old stories.", relation: "parent", angles: ["a name from the past", "someone they lost touch with", "old photos"] },
  { id: "w29-photos", title: "Photos with no captions", hook: "Your kids will inherit the JPGs. Save the stories behind them.", relation: "parent", angles: ["caption an old photo", "the people in the picture", "story per photo"] },
  { id: "w30-summer-end", title: "Last weeks of summer", hook: "School starts soon. Ask about their first day.", relation: "parent", angles: ["first day of school", "kids growing up", "a back-to-school story"] },
  { id: "w31-grandparents-prep", title: "Grandparents Day is 3 weeks away", hook: "The grandparent gift no one else thinks of.", relation: "grandparent", angles: ["why this gift matters more for grandparents", "the kid voice behind it", "the great-grandkid angle"] },
  { id: "w32-grandparents-prep2", title: "Grandparents Day is 2 weeks away", hook: "They're 80. The clock is real.", relation: "grandparent", angles: ["urgency without fear", "ask now", "they want to be asked"] },
  { id: "w33-grandparents-day", title: "Grandparents Day", hook: "Give them what they actually want — to be heard.", relation: "grandparent", angles: ["the gift purchase moment", "first call this week", "their story matters most"] },
  { id: "w34-fall-stories", title: "Fall and tradition", hook: "Every family has a fall ritual. Capture yours.", relation: "parent", angles: ["a holiday tradition", "a fall photo", "a family ritual"] },
  { id: "w35-letters", title: "Letters they wrote", hook: "Did your mom write? Find what's left.", relation: "parent", angles: ["an old letter", "a love letter", "letters as legacy"] },
  { id: "w36-immigration", title: "Where they came from", hook: "Every family has a 'how we got here' story.", relation: "parent", angles: ["a family migration", "first generation", "a country of origin"] },
  { id: "w37-money", title: "How they thought about money", hook: "What your parents learned. What they wished they'd learned.", relation: "parent", angles: ["first big purchase", "money lesson", "what they couldn't afford"] },
  { id: "w38-faith", title: "What they believed", hook: "Faith, doubt, change.", relation: "parent", angles: ["a belief they held", "a belief they lost", "what they pass on"] },
  { id: "w39-kids", title: "What they thought you'd be", hook: "Their hopes for you, before you knew.", relation: "parent", angles: ["dreams for their child", "what surprised them about parenting", "what they got wrong"] },
  { id: "w40-fall-end", title: "Halloween and ghost stories", hook: "Every family has one. What's yours?", relation: "parent", angles: ["a ghost story", "a strange night", "something unexplained"] },
  { id: "w41-thanksgiving-prep", title: "Thanksgiving is 3 weeks away", hook: "The dinner where you can ask better questions.", relation: "parent", angles: ["table conversation", "a question to bring", "the older person at the table"] },
  { id: "w42-thanksgiving-prep2", title: "Thanksgiving prep", hook: "Bring a question, not a side dish.", relation: "parent", angles: ["the question to ask", "open the conversation", "record it on your phone"] },
  { id: "w43-thanksgiving", title: "Thanksgiving", hook: "Today, ask one thing you've never asked.", relation: "parent", angles: ["the table moment", "permission to record", "one question per person"] },
  { id: "w44-postthanks", title: "Post-Thanksgiving", hook: "What did you learn?", relation: "parent", angles: ["a story you got", "something you'll keep", "the next call"] },
  { id: "w45-christmas-prep", title: "Christmas gift ideas they'll actually open", hook: "Don't buy another candle.", relation: "parent", angles: ["gift guide angle", "the gift that lasts", "vs other gifts"] },
  { id: "w46-christmas-prep2", title: "2 weeks to Christmas", hook: "Order now. First prompt arrives Monday.", relation: "parent", angles: ["last-minute gift", "delivered instantly", "the year ahead"] },
  { id: "w47-christmas-prep3", title: "1 week to Christmas", hook: "Print the gift card tonight.", relation: "parent", angles: ["digital gift", "no shipping", "wrapped in 2 minutes"] },
  { id: "w48-christmas", title: "Christmas Day", hook: "The gift that keeps giving — for 52 weeks.", relation: "parent", angles: ["under the tree", "the moment they see it", "what's coming Monday"] },
  { id: "w49-betweenyears", title: "Between Christmas and New Year", hook: "Quiet days. Big questions.", relation: "parent", angles: ["family time", "old photos", "a slow conversation"] },
  { id: "w50-yearend", title: "Year-end reflection", hook: "What do you wish you'd asked last year?", relation: "self", angles: ["regret-free angle", "next year resolution", "habit setting"] },
  { id: "w51-newyear-prep", title: "New Year resolutions that actually matter", hook: "Not the gym. Their stories.", relation: "parent", angles: ["resolutions that matter", "small habit", "1 question per week"] },
  { id: "w52-newyear", title: "New Year", hook: "This is the year you actually do it.", relation: "parent", angles: ["start small", "1 story a week", "by next year you'll have 52"] },
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

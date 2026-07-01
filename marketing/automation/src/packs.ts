// Need-state packs — the curated content track.
//
// Four audiences, each with its own signature water (a forced dye), a constant
// copper addressing line ("FOR A NEW MOTHER" — the thing that makes a stranger
// feel seen in the first half-second), and a library of strong, specific sayings
// that speak to that audience's emotional core. Depth, never urgency: no
// countdowns, scarcity, or growth-SaaS pressure (brand/social/STRATEGY.md).
//
// packForSlot() rotates need-states and sayings deterministically by date+slot,
// so the next three months (and beyond) post varied, on-brand packs with no LLM
// call and repeats spaced ~a month apart.
import type { SourcePost } from "./generate.js";
import { resolveSlotHour } from "./slot.js";

export type NeedState = "newmom" | "loss" | "parents" | "grand";

export interface Pack {
  needState: NeedState;
  dye: string;      // a DYES name in image.ts — the pack's signature water colour
  eyebrow: string;  // copper mono addressing line above the ∞
  hashtags: string[];
  sayings: string[];
  // The closing engagement prompt + soft sign-off that frame the saying in the
  // post caption (the image already carries the saying itself).
  prompt: string;
  cta: string;
}

export const PACK_LIBRARY: Record<NeedState, Pack> = {
  newmom: {
    needState: "newmom",
    dye: "kermes",
    eyebrow: "For a new mother",
    // Pool is intentionally larger than a single post uses — buildPackVariants
    // rotates through it per slot so coverage spreads across communities over the
    // quarter without ever tag-walling one post (brand: no hashtag spam).
    hashtags: ["newmom", "motherhood", "momlife", "newbaby", "babymemories", "firstyear", "familystories", "memorykeeping"],
    prompt: "What's the one thing about her right now you never want to forget?",
    cta: "Start her thread at heirloom.blue",
    sayings: [
      "One day she won't remember being this small. You will.",
      "She'll ask what she was like as a baby. Have the answer ready.",
      "The nights feel endless. The years won't. Write one down.",
      "You'll forget the weight of her at birth unless you keep it.",
      "Someday she'll hold her own. Tell her how you held her.",
      "What you whisper at three in the morning is worth keeping.",
      "Be the one who remembers his first of everything.",
      "The first time she smiled at you — write it before it blurs.",
      "You are her whole history right now. Start writing it down.",
      "She won't remember this year. Make sure someone does.",
      "One day she'll want to know she was wanted this much. Tell her.",
      "The grip of her hand, the smell of her head — words outlast both.",
      "Before the baby becomes a person who talks back, save who she is.",
      "You'll be amazed how fast you forget. Write tonight, not someday.",
    ],
  },
  loss: {
    needState: "loss",
    dye: "indigo",
    eyebrow: "When someone is gone",
    hashtags: ["grief", "grieving", "griefjourney", "inmemory", "remembrance", "familystories", "memorykeeping", "familyhistory"],
    prompt: "What's the small thing about them you'd keep if you could keep only one?",
    cta: "Keep their voice at heirloom.blue",
    sayings: [
      "His voice is the first thing you'll forget. Keep it before you do.",
      "Grief is love with nowhere to go. Give it somewhere.",
      "You can't call them anymore. You can still keep them.",
      "The stories die with the people unless someone writes them down.",
      "What you'd give for one more conversation. Save the ones you had.",
      "Her handwriting, his laugh, the way she said your name — hold them.",
      "You think you'll remember everything. You won't. Write it now.",
      "A year from now the details fade. Catch them while they're sharp.",
      "They live as long as they're remembered. Make the remembering last.",
      "The hardest part is forgetting the small things. Don't let it happen.",
      "Write the letter you didn't get to send.",
      "Some people are too important to leave to memory alone.",
      "Before grief blurs into time, set down what you can't lose.",
      "Keep their voice where your grandchildren can still hear it.",
    ],
  },
  parents: {
    needState: "parents",
    dye: "saffron",
    eyebrow: "For the ones raising them",
    hashtags: ["parenting", "raisingkids", "momlife", "dadlife", "familystories", "familytime", "memorykeeping", "familyhistory"],
    prompt: "What's a story your kids haven't heard yet?",
    cta: "Begin yours at heirloom.blue",
    sayings: [
      "Your kids will want the stories you're too busy to tell.",
      "They'll spend their whole lives quoting you. Choose the words.",
      "One day they'll ask where they come from. Have an answer.",
      "The years are short. The stories don't have to be.",
      "They won't remember the gifts. They'll remember what you told them.",
      "What you know about your family will leave with you. Pass it down.",
      "Someday your voice is the one they replay. Record it now.",
      "Tell them about you before you were their parent.",
      "Your kids think you've always been old. Show them who you were.",
      "The lessons you mean to teach one day — today is the day.",
      "They'll inherit your face. Leave them your story too.",
      "Write what you'd want them to know if you weren't there to say it.",
      "Your children write their childhood from what you give them.",
      "The dinner-table stories are worth more than you think. Keep them.",
    ],
  },
  grand: {
    needState: "grand",
    dye: "oakgall",
    eyebrow: "For the keeper of the stories",
    hashtags: ["grandparents", "grandchildren", "familyhistory", "genealogy", "ancestry", "familystories", "memorykeeping", "legacy"],
    prompt: "Whose voice in your family should outlast all of us?",
    cta: "Leave the stories at heirloom.blue",
    sayings: [
      "Your grandchildren will know you through what you leave behind.",
      "You are the last one who remembers them. Don't let it end with you.",
      "Photographs show your face. Words show who you were.",
      "Your great-grandchildren will never meet you. Let them hear you anyway.",
      "Everything you know about the family — write it before it's lost.",
      "You remember people no one else alive does. Keep them here.",
      "A hundred years from now, someone will want your voice. Leave it.",
      "The recipes, the names, the old stories — they vanish unless you save them.",
      "You are a library no one has read yet. Open it.",
      "What you carry, only you carry. Set it down for the ones after you.",
      "Your life is the family's history. Tell it in your own words.",
      "One day a grandchild will ask what they were like. Be the answer.",
      "The past lives as long as someone records it. Be the one who does.",
      "Leave more than a surname. Leave the stories behind the name.",
    ],
  },
};

// The cron slots in fire order — used to turn date+hour into a single rising
// post counter so need-states and sayings march cleanly instead of pairing the
// same two audiences every day.
const SLOT_ORDER = [13, 17, 23];
const ROTATION: NeedState[] = ["newmom", "loss", "parents", "grand"];

function dayOfYear(d: Date): number {
  return Math.floor((d.getTime() - Date.UTC(d.getUTCFullYear(), 0, 0)) / 86_400_000);
}

// Deterministic post index for a date+slot. Same input → same pack, forever.
function postIndex(date: Date, slotHour: number): number {
  const pos = SLOT_ORDER.indexOf(slotHour);
  return dayOfYear(date) * SLOT_ORDER.length + (pos < 0 ? 0 : pos);
}

export interface ResolvedPack {
  needState: NeedState;
  dye: string;
  eyebrow: string;
  saying: string;
  source: SourcePost;
}

// The pack for a given date+slot — a SourcePost ready for the variant/render/post
// pipeline, plus the dye + eyebrow the renderer needs for the pack look.
export function packForSlot(date = new Date(), slotHour = resolveSlotHour(date)): ResolvedPack {
  const n = postIndex(date, slotHour);
  const pack = PACK_LIBRARY[ROTATION[n % ROTATION.length]];
  const saying = pack.sayings[Math.floor(n / ROTATION.length) % pack.sayings.length];
  const source: SourcePost = {
    hook: saying,
    saying,
    body: `${saying}\n\n${pack.prompt}`,
    cta: pack.cta,
    imagePrompt: `Deep still water with a ${pack.dye} tint, the saying centred in cream serif, a small copper infinity mark above. Quiet, timeless, no people.`,
    hashtags: pack.hashtags,
  };
  return { needState: pack.needState, dye: pack.dye, eyebrow: pack.eyebrow, saying, source };
}

// What the next N days would post (both/all slots per day) — for review.
export function previewSchedule(startDate = new Date(), days = 90): Array<{
  date: string;
  slot: number;
  needState: NeedState;
  saying: string;
}> {
  const out: Array<{ date: string; slot: number; needState: NeedState; saying: string }> = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate.getTime() + i * 86_400_000);
    for (const slot of [13, 23]) {
      const p = packForSlot(d, slot);
      out.push({ date: d.toISOString().slice(0, 10), slot, needState: p.needState, saying: p.saying });
    }
  }
  return out;
}

/**
 * AI Routes
 * Handles AI-powered features: prompts, future letters, legacy score
 */

import { Hono } from 'hono';
import type { Env, Variables } from '../index';
import { readDescription } from '../lib/legacyArchive';

export const aiRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// Prompt categories for AI generation
const PROMPT_CATEGORIES = [
  'childhood',
  'family_traditions',
  'life_lessons',
  'love_and_relationships',
  'career_and_purpose',
  'regrets_and_growth',
  'sensory_memories',
  'turning_points',
  'legacy_wishes',
  'gratitude'
];

// ============================================
// AI MEMORY PROMPTS
// ============================================

// Module-level rate limit map (in-memory fallback if KV unavailable)
const aiRateMap = new Map<string, { count: number; resetAt: number }>();

// Derive an age in whole years from an ISO birth_date (YYYY-MM-DD). Returns
// null for missing/unparseable/implausible dates so personalisation degrades
// gracefully to neutral phrasing.
function ageFromBirthDate(birthDate: unknown): number | null {
  // Require a full ISO date (YYYY-MM-DD); a bare year would mis-age to Jan 1.
  if (typeof birthDate !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(birthDate)) return null;
  const d = new Date(birthDate);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  if (age < 0 || age > 120) return null;
  return age;
}

// A short life-stage label + the kinds of memory that tend to be richest at
// that stage. Used to bias category selection and colour the system prompt —
// never to exclude anything.
function lifeStage(age: number): { label: string; lean: string } {
  if (age < 25) return { label: 'a young adult', lean: 'first independence, formative friendships, early ambitions, the family you came from' };
  if (age < 40) return { label: 'in early adulthood', lean: 'building a life, love and partnership, young children, career beginnings' };
  if (age < 55) return { label: 'in midlife', lean: 'raising a family, turning points, what you have learned, who you have become' };
  if (age < 70) return { label: 'in later midlife', lean: 'legacy, grown children, long marriages, reflection on the road travelled' };
  return { label: 'an elder', lean: 'wisdom to pass on, grandchildren, the long view, what mattered most' };
}

aiRoutes.get('/prompt', async (c) => {
  const userId = c.get('userId');

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Rate limit: 10 AI calls per user per minute
  const rateLimitKey = `ai:${userId}:${Math.floor(Date.now() / 60000)}`;
  try {
    const count = parseInt(await c.env.KV.get(rateLimitKey) ?? '0', 10);
    if (count >= 10) {
      return c.json({ error: 'Rate limit exceeded. Try again in a minute.' }, 429);
    }
    await c.env.KV.put(rateLimitKey, String(count + 1), { expirationTtl: 60 });
  } catch {
    // KV unavailable — fall back to in-memory map
    const now = Date.now();
    const entry = aiRateMap.get(rateLimitKey);
    if (entry && entry.resetAt > now) {
      if (entry.count >= 10) {
        return c.json({ error: 'Rate limit exceeded. Try again in a minute.' }, 429);
      }
      entry.count++;
    } else {
      aiRateMap.set(rateLimitKey, { count: 1, resetAt: now + 60000 });
    }
  }

  // The room the prompt is for shapes its voice: a memory to record, a sealed
  // letter to someone, or a voice recording. Defaults to memory.
  const typeParam = (c.req.query('type') || 'memory').toLowerCase();
  const entryType: 'memory' | 'letter' | 'voice' =
    typeParam === 'letter' ? 'letter' : typeParam === 'voice' ? 'voice' : 'memory';

  try {
    // Get user's existing memories to understand what they've captured, plus
    // their profile for life-stage + gender personalisation.
    const [memories, voiceRecordings, profile] = await Promise.all([
      c.env.DB.prepare(`
        SELECT title, description, description_enc, description_iv, type FROM memories WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 50
      `).bind(userId).all(),
      c.env.DB.prepare(`
        SELECT title, prompt FROM voice_recordings WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 20
      `).bind(userId).all(),
      c.env.DB.prepare(`SELECT birth_date, gender FROM users WHERE id = ?`).bind(userId).first(),
    ]);

    // Build context for AI
    const existingContent = [
      ...(await Promise.all(memories.results.map(async (m: any) => m.title || (await readDescription(c.env, m))))),
      ...voiceRecordings.results.map((v: any) => v.title || v.prompt)
    ].filter(Boolean).join(', ');

    // ── Personalisation ────────────────────────────────────────────────────
    const age = ageFromBirthDate(profile?.birth_date);
    const gender = typeof profile?.gender === 'string' ? profile.gender.trim() : '';
    const stage = age !== null ? lifeStage(age) : null;

    // Bias category selection toward the author's life stage when known, while
    // still allowing the full set so prompts stay varied.
    const STAGE_CATEGORIES: Record<string, string[]> = {
      'a young adult': ['childhood', 'family_traditions', 'love_and_relationships', 'turning_points', 'gratitude'],
      'in early adulthood': ['love_and_relationships', 'career_and_purpose', 'family_traditions', 'turning_points', 'sensory_memories'],
      'in midlife': ['life_lessons', 'career_and_purpose', 'regrets_and_growth', 'turning_points', 'family_traditions'],
      'in later midlife': ['life_lessons', 'legacy_wishes', 'love_and_relationships', 'regrets_and_growth', 'gratitude'],
      'an elder': ['legacy_wishes', 'life_lessons', 'family_traditions', 'gratitude', 'love_and_relationships'],
    };
    const pool = stage ? (STAGE_CATEGORIES[stage.label] ?? PROMPT_CATEGORIES) : PROMPT_CATEGORIES;
    const category = pool[Math.floor(Math.random() * pool.length)];

    const typeVoice =
      entryType === 'letter'
        ? 'Frame it as a sealed letter they could write to someone they love — something to be read later, even after they are gone.'
        : entryType === 'voice'
          ? 'Frame it as something they could say aloud in their own voice, as if speaking directly to a loved one.'
          : 'Frame it as a memory to capture in writing or with a photograph.';

    const personaLines = [
      stage ? `The author is ${stage.label} (around ${age}). Lean toward: ${stage.lean}.` : '',
      gender ? `The author describes their gender as "${gender}" — let this gently inform tone without stereotyping; keep pronoun use light.` : '',
    ].filter(Boolean).join('\n');

    // Generate prompt using Cloudflare AI
    const systemPrompt = `You are a thoughtful memory prompt generator for Heirloom, a digital legacy platform. Generate ONE specific, emotionally compelling prompt that helps someone capture a meaningful memory they haven't recorded yet.

Rules:
- Be specific, not generic (e.g., "the smell of your grandmother's kitchen" not "a childhood memory")
- Evoke sensory details (smells, sounds, textures, tastes)
- Focus on moments, not summaries
- Keep the prompt under 20 words
- No quotation marks in output
- ${typeVoice}
- Category: ${category.replace(/_/g, ' ')}
${personaLines ? `\n${personaLines}` : ''}
${existingContent ? `\nThe user has already captured memories about: ${existingContent.slice(0, 500)}. Generate something DIFFERENT.` : ''}`;

    const response = await c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Generate one memory prompt.' }
      ],
      max_tokens: 50,
      temperature: 0.8
    });
    
    const promptText = (response as any).response?.trim() || 'What moment changed how you see the world?';
    
    // Store the prompt
    const promptId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO ai_prompts (id, user_id, prompt, category)
      VALUES (?, ?, ?, ?)
    `).bind(promptId, userId, promptText, category).run();
    
    return c.json({
      id: promptId,
      prompt: promptText,
      category,
      type: entryType
    });
  } catch (error) {
    console.error('AI prompt generation error:', error);
    // Fallback prompts
    const fallbacks = [
      'What smell instantly takes you back to childhood?',
      'Describe a meal that felt like love.',
      'What sound reminds you of home?',
      'Tell me about a moment you felt truly proud.',
      'What advice would you give your younger self?'
    ];
    return c.json({
      id: crypto.randomUUID(),
      prompt: fallbacks[Math.floor(Math.random() * fallbacks.length)],
      category: 'general'
    });
  }
});

// Cached prompts endpoint - serves from KV cache to minimize AI token costs
aiRoutes.get('/prompts', async (c) => {
  const userId = c.get('userId');
  const count = Math.min(parseInt(c.req.query('count') || '5'), 12);
  
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    // Try to get cached prompts from KV
    const cachedData = await c.env.KV.get('ai_prompts_cache', 'json') as { prompts: Array<{ id: string; prompt: string; category: string }>; generatedAt: string } | null;
    
    if (cachedData && cachedData.prompts && cachedData.prompts.length >= count) {
      // Serve random prompts from cache
      const shuffled = [...cachedData.prompts].sort(() => 0.5 - Math.random());
      const selectedPrompts = shuffled.slice(0, count);
      
      return c.json({ 
        prompts: selectedPrompts,
        cached: true,
        cacheAge: cachedData.generatedAt
      });
    }
    
    // Cache miss or insufficient prompts — kick off generation in background
    // and return fallbacks immediately to avoid Worker timeout.
    console.log('AI prompts cache miss - generating fresh batch in background');
    c.executionCtx.waitUntil(generateAndCachePrompts(c.env, 50));
    const fallbackPrompts = FALLBACK_PROMPTS.slice(0, count).map(p => ({
      id: crypto.randomUUID(),
      prompt: p,
      category: 'general'
    }));
    return c.json({
      prompts: fallbackPrompts,
      cached: false,
      generating: true
    });
  } catch (error) {
    console.error('AI prompts error:', error);
    // Fallback to static prompts if everything fails
    const fallbackPrompts = FALLBACK_PROMPTS.slice(0, count).map(p => ({
      id: crypto.randomUUID(),
      prompt: p,
      category: 'general'
    }));
    return c.json({ prompts: fallbackPrompts, fallback: true });
  }
});

// Fallback prompts for when AI/cache is unavailable
const FALLBACK_PROMPTS = [
  'What smell instantly takes you back to childhood?',
  'Describe a meal that felt like love.',
  'What sound reminds you of home?',
  'Tell me about a moment you felt truly proud.',
  'What advice would you give your younger self?',
  'Describe the view from your childhood bedroom window.',
  'What song always makes you think of someone special?',
  'Tell me about a tradition your family had.',
  'What was the best gift you ever received?',
  'Describe a moment when you felt completely at peace.',
  'What lesson did you learn the hard way?',
  'Tell me about someone who changed your life.',
];

// Generate prompts and cache them in KV
async function generateAndCachePrompts(env: Env, count: number = 50): Promise<Array<{ id: string; prompt: string; category: string }>> {
  const prompts: Array<{ id: string; prompt: string; category: string }> = [];
  
  // Generate prompts in batches to avoid timeout
  const batchSize = 10;
  const batches = Math.ceil(count / batchSize);
  
  for (let batch = 0; batch < batches; batch++) {
    const batchPrompts = [];
    const currentBatchSize = Math.min(batchSize, count - (batch * batchSize));
    
    for (let i = 0; i < currentBatchSize; i++) {
      const categoryIndex = (batch * batchSize + i) % PROMPT_CATEGORIES.length;
      const category = PROMPT_CATEGORIES[categoryIndex];
      
      try {
        const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
          messages: [
            { 
              role: 'system', 
              content: `Generate ONE specific memory prompt about ${category.replace(/_/g, ' ')}. Under 20 words. No quotes. Evoke sensory details and emotions.` 
            },
            { role: 'user', content: 'Generate prompt.' }
          ],
          max_tokens: 50,
          temperature: 0.9
        });
        
        const promptText = (response as any).response?.trim();
        if (promptText && promptText.length > 10) {
          batchPrompts.push({
            id: crypto.randomUUID(),
            prompt: promptText,
            category
          });
        }
      } catch (err) {
        console.error(`Failed to generate prompt for ${category}:`, err);
      }
    }
    
    prompts.push(...batchPrompts);
  }
  
  // Add fallback prompts if we didn't generate enough
  if (prompts.length < 20) {
    FALLBACK_PROMPTS.forEach((p, i) => {
      prompts.push({
        id: crypto.randomUUID(),
        prompt: p,
        category: PROMPT_CATEGORIES[i % PROMPT_CATEGORIES.length]
      });
    });
  }
  
  // Cache in KV with 12-hour TTL
  const cacheData = {
    prompts,
    generatedAt: new Date().toISOString()
  };
  
  await env.KV.put('ai_prompts_cache', JSON.stringify(cacheData), {
    expirationTtl: 12 * 60 * 60 // 12 hours
  });
  
  console.log(`Cached ${prompts.length} AI prompts`);
  return prompts;
}

// Export for use in cron job
export { generateAndCachePrompts };

aiRoutes.post('/prompt/:id/used', async (c) => {
  const userId = c.get('userId');
  const promptId = c.req.param('id');
  
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  await c.env.DB.prepare(`
    UPDATE ai_prompts SET used_at = ? WHERE id = ? AND user_id = ?
  `).bind(new Date().toISOString(), promptId, userId).run();
  
  return c.json({ success: true });
});

aiRoutes.post('/prompt/:id/shared', async (c) => {
  const userId = c.get('userId');
  const promptId = c.req.param('id');
  
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  await c.env.DB.prepare(`
    UPDATE ai_prompts SET shared_at = ? WHERE id = ? AND user_id = ?
  `).bind(new Date().toISOString(), promptId, userId).run();
  
  return c.json({ success: true });
});

// ============================================
// AI FUTURE LETTER
// ============================================

aiRoutes.post('/future-letter', async (c) => {
  const userId = c.get('userId');

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Rate limit: 10 AI calls per user per minute
  const rateLimitKey = `ai:${userId}:${Math.floor(Date.now() / 60000)}`;
  try {
    const count = parseInt(await c.env.KV.get(rateLimitKey) ?? '0', 10);
    if (count >= 10) {
      return c.json({ error: 'Rate limit exceeded. Try again in a minute.' }, 429);
    }
    await c.env.KV.put(rateLimitKey, String(count + 1), { expirationTtl: 60 });
  } catch {
    const now = Date.now();
    const entry = aiRateMap.get(rateLimitKey);
    if (entry && entry.resetAt > now) {
      if (entry.count >= 10) {
        return c.json({ error: 'Rate limit exceeded. Try again in a minute.' }, 429);
      }
      entry.count++;
    } else {
      aiRateMap.set(rateLimitKey, { count: 1, resetAt: now + 60000 });
    }
  }

  const body = await c.req.json();
  const { currentAge, values, hopes, fears, lovedOnes } = body;
  
  if (!currentAge || currentAge < 18 || currentAge > 100) {
    return c.json({ error: 'Please provide a valid age between 18 and 100' }, 400);
  }
  
  try {
    // Get user info
    const user = await c.env.DB.prepare(
      'SELECT first_name FROM users WHERE id = ?'
    ).bind(userId).first();
    
    const firstName = (user?.first_name as string) || 'Friend';
    
    const systemPrompt = `You are writing a heartfelt, wise letter from someone's 85-year-old self to their current ${currentAge}-year-old self. The letter should be:
- Warm, loving, and deeply personal
- 200-250 words
- Written in first person as the older self
- Include specific references to their values, hopes, fears, and loved ones
- Offer perspective that only comes with age
- End with encouragement and love
- No generic platitudes - be specific and emotionally resonant

The person's name is ${firstName}.
${values ? `Their core values: ${values}` : ''}
${hopes ? `Their hopes: ${hopes}` : ''}
${fears ? `Their fears: ${fears}` : ''}
${lovedOnes ? `People they love: ${lovedOnes}` : ''}`;

    const response = await c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Write a letter from 85-year-old ${firstName} to ${currentAge}-year-old ${firstName}.` }
      ],
      max_tokens: 500,
      temperature: 0.7
    });
    
    const letterContent = (response as any).response?.trim() || 
      `Dear ${firstName},\n\nI'm writing to you from a place of deep love and understanding. At 85, I've learned that the things you worry about today matter far less than the moments of connection and love you create.\n\nTrust yourself. Be kind to yourself. The journey ahead is beautiful.\n\nWith all my love,\nYour future self`;
    
    // Generate share text
    const shareText = `I just received a letter from my 85-year-old self through @HeirloomApp. It made me cry. 💛`;
    
    // Store the letter
    const letterId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO ai_future_letters (id, user_id, current_age, user_values, hopes, fears, loved_ones, letter_content, share_text)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(letterId, userId, currentAge, values || null, hopes || null, fears || null, lovedOnes || null, letterContent, shareText).run();
    
    return c.json({
      id: letterId,
      letter: letterContent,
      shareText
    });
  } catch (error) {
    console.error('Future letter generation error:', error);
    return c.json({ error: 'Failed to generate letter' }, 500);
  }
});

aiRoutes.get('/future-letters', async (c) => {
  const userId = c.get('userId');
  
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const letters = await c.env.DB.prepare(`
    SELECT id, current_age, letter_content, share_text, shared_at, created_at
    FROM ai_future_letters
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).bind(userId).all();
  
  return c.json({
    letters: letters.results.map((l: any) => ({
      id: l.id,
      currentAge: l.current_age,
      letter: l.letter_content,
      shareText: l.share_text,
      sharedAt: l.shared_at,
      createdAt: l.created_at
    }))
  });
});

aiRoutes.post('/future-letter/:id/shared', async (c) => {
  const userId = c.get('userId');
  const letterId = c.req.param('id');
  
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  await c.env.DB.prepare(`
    UPDATE ai_future_letters SET shared_at = ? WHERE id = ? AND user_id = ?
  `).bind(new Date().toISOString(), letterId, userId).run();
  
  return c.json({ success: true });
});

// ============================================
// LEGACY SCORE
// ============================================

aiRoutes.get('/legacy-score', async (c) => {
  const userId = c.get('userId');
  
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    // Get counts for scoring
    const [memories, voiceRecordings, letters, familyMembers, legacyContacts, deadManSwitch] = await Promise.all([
      c.env.DB.prepare('SELECT COUNT(*) as count FROM memories WHERE user_id = ? AND deleted_at IS NULL').bind(userId).first(),
      c.env.DB.prepare('SELECT COUNT(*) as count, SUM(duration) as total_duration FROM voice_recordings WHERE user_id = ? AND deleted_at IS NULL').bind(userId).first(),
      c.env.DB.prepare('SELECT COUNT(*) as count FROM letters WHERE user_id = ? AND deleted_at IS NULL').bind(userId).first(),
      c.env.DB.prepare('SELECT COUNT(*) as count FROM family_members WHERE user_id = ?').bind(userId).first(),
      c.env.DB.prepare('SELECT COUNT(*) as count FROM legacy_contacts WHERE user_id = ?').bind(userId).first(),
      c.env.DB.prepare('SELECT enabled FROM dead_man_switches WHERE user_id = ?').bind(userId).first()
    ]);
    
    // Calculate scores (max 100)
    const memoryCount = (memories?.count as number) || 0;
    const voiceCount = (voiceRecordings?.count as number) || 0;
    const voiceDuration = Math.floor(((voiceRecordings?.total_duration as number) || 0) / 60); // minutes
    const letterCount = (letters?.count as number) || 0;
    const familyCount = (familyMembers?.count as number) || 0;
    const contactCount = (legacyContacts?.count as number) || 0;
    const dmsEnabled = deadManSwitch?.enabled === 1;
    
    const breakdown = {
      memories: { points: Math.min(memoryCount * 2, 30), max: 30, count: memoryCount },
      voiceRecordings: { points: Math.min(voiceCount * 5, 25), max: 25, count: voiceCount },
      voiceDuration: { points: Math.min(voiceDuration, 10), max: 10, minutes: voiceDuration },
      letters: { points: Math.min(letterCount * 5, 15), max: 15, count: letterCount },
      familyMembers: { points: Math.min(familyCount * 2, 10), max: 10, count: familyCount },
      legacyContacts: { points: Math.min(contactCount * 3, 6), max: 6, count: contactCount },
      deadManSwitch: { points: dmsEnabled ? 4 : 0, max: 4, enabled: dmsEnabled }
    };
    
    const totalScore = Object.values(breakdown).reduce((sum, item) => sum + item.points, 0);
    const percentage = Math.round(totalScore);
    
    // Determine tier
    let tier: { name: string; emoji: string; description: string };
    if (percentage >= 80) {
      tier = { name: 'Legacy Guardian', emoji: '👑', description: 'You are preserving an incredible legacy!' };
    } else if (percentage >= 60) {
      tier = { name: 'Memory Keeper', emoji: '⭐', description: 'Your legacy is taking beautiful shape.' };
    } else if (percentage >= 40) {
      tier = { name: 'Story Builder', emoji: '📖', description: 'You are building something meaningful.' };
    } else if (percentage >= 20) {
      tier = { name: 'Beginning', emoji: '🌱', description: 'Every great legacy starts with a single memory.' };
    } else {
      tier = { name: 'Just Started', emoji: '✨', description: 'Welcome! Your journey begins now.' };
    }
    
    // Generate suggestions
    const suggestions = [];
    if (memoryCount < 15) suggestions.push('Add more photos and memories to reach 15');
    if (voiceCount < 5) suggestions.push('Record 5 voice messages for your loved ones');
    if (letterCount < 3) suggestions.push('Write 3 heartfelt letters');
    if (familyCount < 5) suggestions.push('Add more family members to your tree');
    if (!dmsEnabled) suggestions.push('Enable the Dead Man\'s Switch for peace of mind');
    if (contactCount < 2) suggestions.push('Add legacy contacts to receive your memories');
    
    return c.json({
      score: totalScore,
      percentage,
      tier,
      breakdown,
      suggestions: suggestions.slice(0, 3),
      shareText: `I'm a ${tier.name} on Heirloom with a Legacy Score of ${percentage}%! ${tier.emoji} Start preserving your legacy at heirloom.blue`
    });
  } catch (error) {
    console.error('Legacy score calculation error:', error);
    return c.json({ error: 'Failed to calculate legacy score' }, 500);
  }
});

// ============================================
// PERSON-SPECIFIC AI PROMPTS
// ============================================

aiRoutes.get('/person-prompts/:familyMemberId', async (c) => {
  const userId = c.get('userId');
  const familyMemberId = c.req.param('familyMemberId');
  
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const familyMember = await c.env.DB.prepare(`
      SELECT * FROM family_members WHERE id = ? AND user_id = ?
    `).bind(familyMemberId, userId).first();
    
    if (!familyMember) {
      return c.json({ error: 'Family member not found' }, 404);
    }
    
    const name = familyMember.name as string;
    const relationship = (familyMember.relationship as string).toLowerCase();
    
    const existingLetters = await c.env.DB.prepare(`
      SELECT l.title, l.body FROM letters l
      JOIN letter_recipients lr ON l.id = lr.letter_id
      WHERE lr.family_member_id = ? AND l.deleted_at IS NULL
      ORDER BY l.created_at DESC LIMIT 5
    `).bind(familyMemberId).all();
    
    const existingVoice = await c.env.DB.prepare(`
      SELECT v.title, v.prompt FROM voice_recordings v
      JOIN voice_recipients vr ON v.id = vr.voice_recording_id
      WHERE vr.family_member_id = ? AND v.deleted_at IS NULL
      ORDER BY v.created_at DESC LIMIT 5
    `).bind(familyMemberId).all();
    
    const existingContent = [
      ...existingLetters.results.map((l: any) => l.title || ''),
      ...existingVoice.results.map((v: any) => v.title || v.prompt || '')
    ].filter(Boolean).join(', ');
    
    const relationshipPromptMap: Record<string, string[]> = {
      'child': [
        `Tell ${name} about the first time you felt proud of them`,
        `Share with ${name} a lesson you learned from being their parent`,
        `Describe to ${name} what you hope their future looks like`,
        `Tell ${name} about the day they were born`,
        `Share a funny story about ${name} when they were little`,
      ],
      'spouse': [
        `Tell ${name} what you first noticed about them`,
        `Share with ${name} your favorite memory together`,
        `Describe to ${name} what makes them irreplaceable`,
        `Tell ${name} about a moment when you fell in love all over again`,
        `Share what you admire most about ${name}`,
      ],
      'partner': [
        `Tell ${name} what you first noticed about them`,
        `Share with ${name} your favorite memory together`,
        `Describe to ${name} what makes them irreplaceable`,
        `Tell ${name} about a moment when you fell in love all over again`,
        `Share what you admire most about ${name}`,
      ],
      'parent': [
        `Thank ${name} for something they did that shaped who you are`,
        `Tell ${name} about a lesson they taught you that you still carry`,
        `Share with ${name} a memory from childhood you treasure`,
        `Describe to ${name} what you hope they know about your love for them`,
        `Tell ${name} about a time they made you feel safe`,
      ],
      'sibling': [
        `Tell ${name} about your favorite childhood memory together`,
        `Share with ${name} what you admire about them`,
        `Describe to ${name} a time they were there for you`,
        `Tell ${name} about something you've never told them`,
        `Share what makes your bond with ${name} special`,
      ],
      'grandchild': [
        `Tell ${name} about what the world was like when you were their age`,
        `Share with ${name} a story about their parent when they were young`,
        `Describe to ${name} what you hope they remember about you`,
        `Tell ${name} about a family tradition and why it matters`,
        `Share advice with ${name} that you wish someone had told you`,
      ],
      'grandparent': [
        `Thank ${name} for the wisdom they've shared`,
        `Tell ${name} about a memory with them you treasure`,
        `Share with ${name} what you've learned from their life`,
        `Describe to ${name} what their love has meant to you`,
        `Tell ${name} about a tradition you want to continue`,
      ],
      'friend': [
        `Tell ${name} what their friendship has meant to you`,
        `Share with ${name} your favorite memory together`,
        `Describe to ${name} a time they showed up for you`,
        `Tell ${name} something you've always wanted to say`,
        `Share what makes ${name} irreplaceable in your life`,
      ],
    };
    
    let basePrompts = relationshipPromptMap[relationship] || relationshipPromptMap['friend'] || [];
    
    if (basePrompts.length === 0 || existingContent) {
      const systemPrompt = `You are generating deeply personal memory prompts for someone to record messages for their ${relationship} named ${name}.

Rules:
- Generate 3 specific, emotionally compelling prompts
- Each prompt should be personal to the ${relationship} relationship
- Use ${name}'s name in each prompt
- Focus on specific moments, feelings, or stories - not generic advice
- Keep each prompt under 20 words
- No quotation marks in output
- Return prompts as a JSON array of strings
${existingContent ? `\nThey have already recorded content about: ${existingContent.slice(0, 300)}. Generate DIFFERENT prompts.` : ''}`;

      try {
        const response = await c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Generate 3 prompts for messages to ${name} (${relationship}).` }
          ],
          max_tokens: 200,
          temperature: 0.8
        });
        
        const responseText = (response as any).response?.trim() || '';
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            const aiPrompts = JSON.parse(jsonMatch[0]);
            if (Array.isArray(aiPrompts) && aiPrompts.length > 0) {
              basePrompts = aiPrompts.slice(0, 5);
            }
          } catch {
            // Use fallback prompts
          }
        }
      } catch (err) {
        console.error('AI prompt generation error:', err);
      }
    }
    
    const shuffled = [...basePrompts].sort(() => 0.5 - Math.random());
    const prompts = shuffled.slice(0, 3).map(prompt => ({
      id: crypto.randomUUID(),
      prompt,
      category: relationship
    }));
    
    return c.json({ prompts });
  } catch (error) {
    console.error('Person prompts error:', error);
    return c.json({ error: 'Failed to generate prompts' }, 500);
  }
});

// ============================================
// DYE AUTO-CLASSIFY — suggest a natural-dye colour from memory text
// ============================================

const DYE_DESCRIPTIONS: Record<string, string> = {
  weld:      'daily life, routines, ordinary moments, gratitude',
  walnut:    'travel, adventure, exploration, journeys',
  saffron:   'achievement, pride, milestones, success',
  woad:      'contemplation, quiet, introspection, solitude',
  madder:    'joy, celebration, happiness, laughter',
  kermes:    'love, romance, tenderness, family warmth',
  cochineal: 'grief, loss, mourning, sorrow',
  indigo:    'reflection, memory, nostalgia, the past',
  oakgall:   'record, history, documentation, facts',
  iron:      'endings, farewells, transitions, letting go',
};

aiRoutes.post('/suggest-dye', async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  // Rate limit: 10 AI calls per user per minute
  const rateLimitKey = `ai:${userId}:${Math.floor(Date.now() / 60000)}`;
  try {
    const count = parseInt(await c.env.KV.get(rateLimitKey) ?? '0', 10);
    if (count >= 10) {
      return c.json({ error: 'Rate limit exceeded. Try again in a minute.' }, 429);
    }
    await c.env.KV.put(rateLimitKey, String(count + 1), { expirationTtl: 60 });
  } catch {
    const now = Date.now();
    const entry = aiRateMap.get(rateLimitKey);
    if (entry && entry.resetAt > now) {
      if (entry.count >= 10) {
        return c.json({ error: 'Rate limit exceeded. Try again in a minute.' }, 429);
      }
      entry.count++;
    } else {
      aiRateMap.set(rateLimitKey, { count: 1, resetAt: now + 60000 });
    }
  }

  let text = '';
  try {
    const body = await c.req.json();
    text = (body.text || '').slice(0, 600);
  } catch {
    return c.json({ error: 'Invalid body' }, 400);
  }

  if (text.length < 20) {
    return c.json({ dye: 'walnut', motif: 'travel', reason: 'too short to classify' });
  }

  const palette = Object.entries(DYE_DESCRIPTIONS)
    .map(([key, desc]) => `${key}: ${desc}`)
    .join('\n');

  try {
    const response = await c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
      messages: [
        {
          role: 'system',
          content: `You are a colour classifier for a memory archive. Given a short piece of writing, pick the single best-matching natural dye colour from this palette:\n\n${palette}\n\nRespond with ONLY the dye key (one word, lowercase). No explanation.`,
        },
        { role: 'user', content: text },
      ],
      max_tokens: 10,
      temperature: 0.3,
    });

    const raw = ((response as any).response || '').trim().toLowerCase();
    const dye = Object.keys(DYE_DESCRIPTIONS).find((k) => raw.includes(k)) ?? 'walnut';
    const motif = DYE_DESCRIPTIONS[dye]?.split(',')[0]?.trim() ?? 'daily';

    return c.json({ dye, motif });
  } catch {
    return c.json({ dye: 'walnut', motif: 'travel' });
  }
});

// ============================================
// EMOTION AUTO-CLASSIFY — the Composer's subtle Listener names the feeling.
// Same taxonomy as classifyEmotionWithAI so a suggestion round-trips with the
// server-side classifier that runs on save.
// ============================================

const EMOTION_PALETTE = [
  'joyful', 'nostalgic', 'grateful', 'loving', 'bittersweet',
  'sad', 'reflective', 'proud', 'peaceful', 'hopeful',
] as const;

aiRoutes.post('/suggest-emotion', async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  // Rate limit: 10 AI calls per user per minute (shared bucket with suggest-dye).
  const rateLimitKey = `ai:${userId}:${Math.floor(Date.now() / 60000)}`;
  try {
    const count = parseInt(await c.env.KV.get(rateLimitKey) ?? '0', 10);
    if (count >= 10) return c.json({ error: 'Rate limit exceeded. Try again in a minute.' }, 429);
    await c.env.KV.put(rateLimitKey, String(count + 1), { expirationTtl: 60 });
  } catch {
    const now = Date.now();
    const entry = aiRateMap.get(rateLimitKey);
    if (entry && entry.resetAt > now) {
      if (entry.count >= 10) return c.json({ error: 'Rate limit exceeded. Try again in a minute.' }, 429);
      entry.count++;
    } else {
      aiRateMap.set(rateLimitKey, { count: 1, resetAt: now + 60000 });
    }
  }

  let text = '';
  try {
    const body = await c.req.json();
    text = (body.text || '').slice(0, 600);
  } catch {
    return c.json({ error: 'Invalid body' }, 400);
  }

  if (text.length < 20) {
    return c.json({ emotion: 'reflective', reason: 'too short to classify' });
  }

  try {
    const response = await c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
      messages: [
        {
          role: 'system',
          content: `You are an emotion classifier for a family memory archive. Read the writing and pick the single best-matching feeling from this list:\n\n${EMOTION_PALETTE.join(', ')}\n\nRespond with ONLY the feeling (one word, lowercase). No explanation.`,
        },
        { role: 'user', content: text },
      ],
      max_tokens: 10,
      temperature: 0.3,
    });

    const raw = ((response as any).response || '').trim().toLowerCase();
    const emotion = EMOTION_PALETTE.find((e) => raw.includes(e)) ?? 'reflective';
    return c.json({ emotion });
  } catch {
    return c.json({ emotion: 'reflective' });
  }
});

// ============================================
// INTERVIEW FOLLOW-UP — generate next interview question from context
// ============================================

aiRoutes.post('/interview-followup', async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  let currentQuestion = '';
  let transcriptSoFar = '';
  try {
    const body = await c.req.json();
    currentQuestion = (body.currentQuestion || '').slice(0, 500);
    transcriptSoFar = (body.transcriptSoFar || '').slice(0, 2000);
  } catch {
    return c.json({ error: 'Invalid body' }, 400);
  }

  // Rate limit: 10 AI calls per user per minute
  const rateLimitKey = `ai:${userId}:${Math.floor(Date.now() / 60000)}`;
  try {
    const count = parseInt(await c.env.KV.get(rateLimitKey) ?? '0', 10);
    if (count >= 10) {
      return c.json({ error: 'Rate limit exceeded. Try again in a minute.' }, 429);
    }
    await c.env.KV.put(rateLimitKey, String(count + 1), { expirationTtl: 60 });
  } catch {
    const now = Date.now();
    const entry = aiRateMap.get(rateLimitKey);
    if (entry && entry.resetAt > now) {
      if (entry.count >= 10) {
        return c.json({ error: 'Rate limit exceeded. Try again in a minute.' }, 429);
      }
      entry.count++;
    } else {
      aiRateMap.set(rateLimitKey, { count: 1, resetAt: now + 60000 });
    }
  }

  const FOLLOWUP_FALLBACKS = [
    'Can you tell me more about how that made you feel?',
    'What happened next?',
    'Who else was there with you?',
    'How did that experience shape who you are today?',
    'Is there a particular detail from that moment you still remember vividly?',
  ];

  try {
    const systemPrompt = `You are a compassionate oral history interviewer helping someone record their life story for Heirloom, a family legacy platform. Given the current interview question and the transcript so far, generate ONE natural follow-up question that deepens the conversation.

Rules:
- Ask one focused question (under 20 words)
- Build naturally on what was said — don't repeat covered ground
- Evoke memory, emotion, or sensory detail
- No quotation marks in output`;

    const userContent = [
      currentQuestion ? `Current question: ${currentQuestion}` : '',
      transcriptSoFar ? `Transcript so far: ${transcriptSoFar}` : '',
      'Generate one follow-up question.',
    ].filter(Boolean).join('\n');

    const response = await c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      max_tokens: 60,
      temperature: 0.7,
    });

    const followup = ((response as any).response || '').trim().replace(/^["']|["']$/g, '');
    return c.json({
      followup: followup || FOLLOWUP_FALLBACKS[Math.floor(Math.random() * FOLLOWUP_FALLBACKS.length)],
    });
  } catch {
    return c.json({
      followup: FOLLOWUP_FALLBACKS[Math.floor(Math.random() * FOLLOWUP_FALLBACKS.length)],
    });
  }
});

// ============================================
// TRANSCRIBE — transcribe audio from a URL via Whisper
// ============================================

aiRoutes.post('/transcribe', async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  let audioUrl = '';
  try {
    const body = await c.req.json();
    audioUrl = (body.audioUrl || '').trim();
  } catch {
    return c.json({ error: 'Invalid body' }, 400);
  }

  if (!audioUrl) {
    return c.json({ transcript: '' });
  }

  try {
    // Fetch the audio from the provided URL
    const resp = await fetch(audioUrl);
    if (!resp.ok) {
      return c.json({ error: 'Failed to fetch audio', transcript: '' }, 400);
    }
    const audioBuffer = await resp.arrayBuffer();

    const result = await c.env.AI.run('@cf/openai/whisper', {
      audio: [...new Uint8Array(audioBuffer)],
    });

    const transcript = (result as any).text || '';
    return c.json({ transcript });
  } catch (err: any) {
    console.error('AI transcribe error:', err);
    // Return empty transcript as graceful fallback
    return c.json({ transcript: '' });
  }
});

// ============================================
// ON-THIS-DAY NARRATION — ambient one-line thread commentary
// ============================================

aiRoutes.post('/on-this-day-narration', async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  // Rate limit: 10 AI calls per user per minute
  const rateLimitKey = `ai:${userId}:${Math.floor(Date.now() / 60000)}`;
  try {
    const count = parseInt(await c.env.KV.get(rateLimitKey) ?? '0', 10);
    if (count >= 10) {
      return c.json({ error: 'Rate limit exceeded. Try again in a minute.' }, 429);
    }
    await c.env.KV.put(rateLimitKey, String(count + 1), { expirationTtl: 60 });
  } catch {
    const now = Date.now();
    const entry = aiRateMap.get(rateLimitKey);
    if (entry && entry.resetAt > now) {
      if (entry.count >= 10) {
        return c.json({ error: 'Rate limit exceeded. Try again in a minute.' }, 429);
      }
      entry.count++;
    } else {
      aiRateMap.set(rateLimitKey, { count: 1, resetAt: now + 60000 });
    }
  }

  let memories: { title?: string; description?: string; yearsAgo?: number; type?: string }[] = [];
  try {
    const body = await c.req.json();
    memories = (body.memories || []).slice(0, 8);
  } catch {
    return c.json({ error: 'Invalid body' }, 400);
  }

  if (memories.length === 0) {
    return c.json({ narration: null });
  }

  const summary = memories.map((m) => {
    const ago = m.yearsAgo && m.yearsAgo > 0 ? `${m.yearsAgo} year${m.yearsAgo === 1 ? '' : 's'} ago` : 'this year';
    return `- ${m.title || 'untitled'} (${m.type || 'memory'}, ${ago}): ${(m.description || '').slice(0, 120)}`;
  }).join('\n');

  try {
    const response = await c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
      messages: [
        {
          role: 'system',
          content: `You are the Listener — a quiet, reflective voice inside a family memory archive. Given a list of memories written on this date in past years, compose a single poetic, ambient sentence (under 20 words) that notices a pattern, an echo, or a quiet truth across them. Do not name specific people. Do not use quotation marks. No explanation — just the sentence.`,
        },
        { role: 'user', content: `Memories written on this date:\n${summary}` },
      ],
      max_tokens: 60,
      temperature: 0.7,
    });

    const narration = ((response as any).response || '').trim().replace(/^["']|["']$/g, '');
    return c.json({ narration: narration || null });
  } catch {
    return c.json({ narration: null });
  }
});

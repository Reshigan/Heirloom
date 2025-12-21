/**
 * AI Routes
 * Handles AI-powered features: prompts, future letters, legacy score
 */

import { Hono } from 'hono';
import type { Env, Variables } from '../index';

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

aiRoutes.get('/prompt', async (c) => {
  const userId = c.get('userId');
  
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    // Get user's existing memories to understand what they've captured
    const memories = await c.env.DB.prepare(`
      SELECT title, description, type FROM memories WHERE user_id = ? ORDER BY created_at DESC LIMIT 50
    `).bind(userId).all();
    
    const voiceRecordings = await c.env.DB.prepare(`
      SELECT title, prompt FROM voice_recordings WHERE user_id = ? ORDER BY created_at DESC LIMIT 20
    `).bind(userId).all();
    
    // Build context for AI
    const existingContent = [
      ...memories.results.map((m: any) => m.title || m.description),
      ...voiceRecordings.results.map((v: any) => v.title || v.prompt)
    ].filter(Boolean).join(', ');
    
    const category = PROMPT_CATEGORIES[Math.floor(Math.random() * PROMPT_CATEGORIES.length)];
    
    // Generate prompt using Cloudflare AI
    const systemPrompt = `You are a thoughtful memory prompt generator for Heirloom, a digital legacy platform. Generate ONE specific, emotionally compelling prompt that helps someone capture a meaningful memory they haven't recorded yet.

Rules:
- Be specific, not generic (e.g., "the smell of your grandmother's kitchen" not "a childhood memory")
- Evoke sensory details (smells, sounds, textures, tastes)
- Focus on moments, not summaries
- Keep the prompt under 20 words
- No quotation marks in output
- Category: ${category.replace(/_/g, ' ')}
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
      category
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
    
    // Cache miss or insufficient prompts - generate fresh batch and cache
    console.log('AI prompts cache miss - generating fresh batch');
    const prompts = await generateAndCachePrompts(c.env, 50);
    
    // Return requested count
    const shuffled = [...prompts].sort(() => 0.5 - Math.random());
    return c.json({ 
      prompts: shuffled.slice(0, count),
      cached: false
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
      c.env.DB.prepare('SELECT COUNT(*) as count FROM memories WHERE user_id = ?').bind(userId).first(),
      c.env.DB.prepare('SELECT COUNT(*) as count, SUM(duration) as total_duration FROM voice_recordings WHERE user_id = ?').bind(userId).first(),
      c.env.DB.prepare('SELECT COUNT(*) as count FROM letters WHERE user_id = ?').bind(userId).first(),
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

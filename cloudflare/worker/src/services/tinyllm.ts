/**
 * TinyLLM Service for Cloudflare Workers
 * 
 * Uses keyword-based emotion classification as a fallback
 * Can be extended to use Cloudflare AI or external LLM APIs
 */

export type EmotionType = 
  | 'joyful' 
  | 'nostalgic' 
  | 'grateful' 
  | 'loving' 
  | 'bittersweet' 
  | 'sad' 
  | 'reflective' 
  | 'proud' 
  | 'peaceful' 
  | 'hopeful';

export interface EmotionResult {
  label: EmotionType;
  confidence: number;
}

// Keyword patterns for emotion classification
const emotionKeywords: Record<EmotionType, string[]> = {
  joyful: ['happy', 'joy', 'excited', 'wonderful', 'amazing', 'fantastic', 'celebrate', 'laugh', 'smile', 'fun', 'delight', 'thrilled', 'ecstatic', 'cheerful', 'elated'],
  nostalgic: ['remember', 'memory', 'memories', 'past', 'childhood', 'used to', 'back then', 'those days', 'reminisce', 'old times', 'years ago', 'when we were', 'looking back'],
  grateful: ['thank', 'grateful', 'appreciate', 'blessed', 'fortunate', 'lucky', 'gratitude', 'thankful', 'indebted', 'recognition'],
  loving: ['love', 'adore', 'cherish', 'heart', 'dear', 'beloved', 'affection', 'care', 'treasure', 'precious', 'sweetheart', 'darling', 'devoted'],
  bittersweet: ['miss', 'wish', 'if only', 'regret', 'longing', 'farewell', 'goodbye', 'last time', 'never again', 'mixed feelings', 'both happy and sad'],
  sad: ['sad', 'sorry', 'grief', 'loss', 'cry', 'tears', 'mourn', 'heartbreak', 'sorrow', 'pain', 'hurt', 'devastated', 'depressed'],
  reflective: ['think', 'wonder', 'realize', 'understand', 'learn', 'lesson', 'perspective', 'insight', 'contemplate', 'ponder', 'consider', 'meditate'],
  proud: ['proud', 'achievement', 'accomplish', 'success', 'overcome', 'strength', 'courage', 'brave', 'honor', 'triumph', 'victory', 'milestone'],
  peaceful: ['peace', 'calm', 'serene', 'tranquil', 'content', 'rest', 'quiet', 'harmony', 'balance', 'still', 'gentle', 'soothing'],
  hopeful: ['hope', 'future', 'dream', 'wish', 'aspire', 'believe', 'faith', 'optimistic', 'looking forward', 'someday', 'will be', 'promise'],
};

/**
 * Classify the emotion of a text using keyword analysis
 */
export function classifyEmotion(text: string): EmotionResult {
  const lowerText = text.toLowerCase();
  const scores: Record<EmotionType, number> = {
    joyful: 0,
    nostalgic: 0,
    grateful: 0,
    loving: 0,
    bittersweet: 0,
    sad: 0,
    reflective: 0,
    proud: 0,
    peaceful: 0,
    hopeful: 0,
  };

  // Count keyword matches for each emotion
  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        scores[emotion as EmotionType] += matches.length;
      }
    }
  }

  // Find the emotion with the highest score
  let maxScore = 0;
  let topEmotion: EmotionType = 'loving'; // Default emotion for letters/memories

  for (const [emotion, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      topEmotion = emotion as EmotionType;
    }
  }

  // Calculate confidence based on score distribution
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = totalScore > 0 ? Math.min(0.95, 0.5 + (maxScore / totalScore) * 0.45) : 0.5;

  return {
    label: topEmotion,
    confidence,
  };
}

/**
 * Generate letter suggestions based on recipient and context
 */
export interface LetterSuggestionInput {
  recipientName: string;
  relationship: string;
  occasion?: string;
  tone?: string;
  keywords?: string[];
}

export interface LetterSuggestion {
  salutation: string;
  body: string;
  signature: string;
  emotion: EmotionType;
}

const salutations: Record<string, string> = {
  child: 'My dearest',
  son: 'My dearest',
  daughter: 'My dearest',
  spouse: 'My beloved',
  husband: 'My beloved',
  wife: 'My beloved',
  partner: 'My beloved',
  parent: 'Dear',
  mother: 'Dear Mom',
  father: 'Dear Dad',
  sibling: 'Dear',
  brother: 'Dear',
  sister: 'Dear',
  grandchild: 'My precious',
  grandson: 'My precious',
  granddaughter: 'My precious',
  friend: 'Dear',
  default: 'Dear',
};

const signatures: Record<string, string> = {
  child: 'With all my love, forever and always',
  son: 'With all my love, forever and always',
  daughter: 'With all my love, forever and always',
  spouse: 'Yours eternally',
  husband: 'Yours eternally',
  wife: 'Yours eternally',
  partner: 'Yours eternally',
  parent: 'With love and gratitude',
  mother: 'With love and gratitude',
  father: 'With love and gratitude',
  sibling: 'With love',
  brother: 'With love',
  sister: 'With love',
  grandchild: 'With endless love',
  grandson: 'With endless love',
  granddaughter: 'With endless love',
  friend: 'Your friend, always',
  default: 'With love',
};

const occasionBodies: Record<string, string> = {
  birthday: `As you celebrate another year of life, I want you to know how much joy you bring to everyone around you. Your presence in this world is a gift, and I am so grateful to be part of your journey. May this year bring you all the happiness, love, and success you deserve.`,
  wedding: `On this beautiful day, as you begin this new chapter of your life, I want you to know how proud I am of the person you have become. May your marriage be filled with love, laughter, and endless happiness. Remember that love is patient, love is kind, and it will see you through all of life's adventures together.`,
  graduation: `Congratulations on this incredible achievement! Your hard work and dedication have brought you to this moment. I am so proud of everything you have accomplished and excited for all that lies ahead. Remember that this is not an ending, but a beautiful beginning.`,
  holiday: `During this special time of year, I find myself reflecting on all the moments we've shared together. The holidays remind me of how blessed I am to have you in my life. May this season bring you warmth, joy, and the company of those you love most.`,
  default: `I wanted to take a moment to tell you how much you mean to me. Life moves so quickly, and sometimes we forget to express the love we carry in our hearts. You are a blessing in my life, and I cherish every moment we share together. Know that no matter where life takes us, my love for you remains constant and true.`,
};

export function generateLetterSuggestion(input: LetterSuggestionInput): LetterSuggestion {
  const { recipientName, relationship, occasion } = input;
  const relationshipLower = relationship.toLowerCase();
  
  const salutation = `${salutations[relationshipLower] || salutations.default} ${recipientName}`;
  const signature = signatures[relationshipLower] || signatures.default;
  const body = occasionBodies[occasion?.toLowerCase() || 'default'] || occasionBodies.default;
  
  // Classify the emotion of the generated body
  const emotionResult = classifyEmotion(body);
  
  return {
    salutation,
    body,
    signature,
    emotion: emotionResult.label,
  };
}

/**
 * Analyze text and return emotion with context
 */
export function analyzeText(text: string): { emotion: EmotionResult; summary: string } {
  const emotion = classifyEmotion(text);
  
  const summaries: Record<EmotionType, string> = {
    joyful: 'This content expresses happiness and celebration.',
    nostalgic: 'This content reflects on cherished memories from the past.',
    grateful: 'This content expresses deep appreciation and thankfulness.',
    loving: 'This content conveys warmth, affection, and love.',
    bittersweet: 'This content captures both joy and sadness in reflection.',
    sad: 'This content expresses grief or sorrow.',
    reflective: 'This content shows thoughtful contemplation and insight.',
    proud: 'This content celebrates achievements and accomplishments.',
    peaceful: 'This content conveys serenity and contentment.',
    hopeful: 'This content looks forward with optimism and faith.',
  };
  
  return {
    emotion,
    summary: summaries[emotion.label],
  };
}

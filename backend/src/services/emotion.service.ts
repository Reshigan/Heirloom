type EmotionLabel = 'joyful' | 'nostalgic' | 'grateful' | 'loving' | 'bittersweet' | 'sad' | 'reflective' | 'proud' | 'peaceful' | 'hopeful';

interface EmotionResult {
  label: EmotionLabel;
  confidence: number;
  scores?: Record<EmotionLabel, number>;
}

const EMOTION_KEYWORDS: Record<EmotionLabel, string[]> = {
  joyful: ['happy', 'joy', 'laugh', 'smile', 'celebrate', 'wonderful', 'amazing', 'excited', 'fun', 'delight'],
  nostalgic: ['remember', 'memory', 'past', 'childhood', 'years ago', 'back then', 'used to', 'old days', 'reminisce', 'those times'],
  grateful: ['thank', 'grateful', 'blessed', 'appreciate', 'fortunate', 'lucky', 'gratitude', 'thankful'],
  loving: ['love', 'heart', 'dear', 'cherish', 'adore', 'beloved', 'affection', 'care', 'treasure'],
  bittersweet: ['miss', 'wish', 'gone', 'farewell', 'goodbye', 'last time', 'never again', 'both happy and sad'],
  sad: ['sad', 'cry', 'tears', 'loss', 'grief', 'mourn', 'sorrow', 'heartbreak', 'pain'],
  reflective: ['think', 'wonder', 'ponder', 'realize', 'understand', 'learn', 'lesson', 'wisdom', 'insight'],
  proud: ['proud', 'accomplish', 'achieve', 'success', 'overcome', 'strength', 'courage', 'brave'],
  peaceful: ['peace', 'calm', 'serene', 'quiet', 'tranquil', 'content', 'rest', 'gentle', 'harmony'],
  hopeful: ['hope', 'future', 'dream', 'wish', 'someday', 'believe', 'faith', 'optimistic', 'forward'],
};

class EmotionService {
  async analyzeText(text: string): Promise<EmotionResult> {
    const lowerText = text.toLowerCase();
    const scores: Record<EmotionLabel, number> = {
      joyful: 0, nostalgic: 0, grateful: 0, loving: 0, bittersweet: 0,
      sad: 0, reflective: 0, proud: 0, peaceful: 0, hopeful: 0,
    };

    for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
      for (const keyword of keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = lowerText.match(regex);
        if (matches) {
          scores[emotion as EmotionLabel] += matches.length;
        }
      }
    }

    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
    
    if (totalScore === 0) {
      return { label: 'reflective', confidence: 0.3, scores };
    }

    const normalizedScores = Object.fromEntries(
      Object.entries(scores).map(([k, v]) => [k, v / totalScore])
    ) as Record<EmotionLabel, number>;

    const topEmotion = Object.entries(normalizedScores).reduce((a, b) => 
      a[1] > b[1] ? a : b
    );

    return {
      label: topEmotion[0] as EmotionLabel,
      confidence: topEmotion[1],
      scores: normalizedScores,
    };
  }

  async classifyLetter(body: string, salutation?: string, signature?: string): Promise<EmotionResult> {
    const fullText = [salutation, body, signature].filter(Boolean).join(' ');
    return this.analyzeText(fullText);
  }

  async classifyMemory(title: string, description?: string): Promise<EmotionResult> {
    const fullText = [title, description].filter(Boolean).join(' ');
    return this.analyzeText(fullText);
  }

  async classifyVoiceTranscript(transcript: string): Promise<EmotionResult> {
    return this.analyzeText(transcript);
  }
}

export const emotionService = new EmotionService();
export type { EmotionLabel, EmotionResult };

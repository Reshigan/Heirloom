import { emotionService, EmotionResult } from './emotion.service';

interface LetterSuggestionInput {
  recipientName: string;
  relationship: string;
  occasion?: string;
  tone?: string;
  keywords?: string[];
}

interface LetterSuggestion {
  salutation: string;
  body: string;
  signature: string;
  emotion: string;
}

class TinyLLMService {
  private baseUrl: string | null;
  private apiKey: string | null;
  private model: string;
  private isOllama: boolean;

  constructor() {
    this.baseUrl = process.env.TINYLLM_BASE_URL || process.env.OLLAMA_URL || null;
    this.apiKey = process.env.TINYLLM_API_KEY || null;
    this.model = process.env.TINYLLM_MODEL || 'tinyllama';
    this.isOllama = this.baseUrl?.includes('ollama') || this.baseUrl?.includes('11434') || false;
  }

  private isConfigured(): boolean {
    return !!this.baseUrl && (this.isOllama || !!this.apiKey);
  }

  async classifyEmotion(text: string): Promise<EmotionResult> {
    if (!this.isConfigured()) {
      return emotionService.analyzeText(text);
    }

    try {
      const endpoint = this.isOllama ? `${this.baseUrl}/api/chat` : `${this.baseUrl}/chat/completions`;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (!this.isOllama && this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const systemPrompt = 'You are an emotion classifier. Analyze the text and respond with ONLY a JSON object containing: {"label": "emotion", "confidence": 0.0-1.0}. Valid emotions are: joyful, nostalgic, grateful, loving, bittersweet, sad, reflective, proud, peaceful, hopeful.';
      
      const body = this.isOllama ? {
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
        stream: false,
        options: { temperature: 0.3, num_predict: 100 },
      } : {
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
        temperature: 0.3,
        max_tokens: 100,
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        console.warn('TinyLLM API error, falling back to keyword analysis');
        return emotionService.analyzeText(text);
      }

      const data = await response.json();
      const content = this.isOllama 
        ? (data as { message?: { content?: string } }).message?.content || ''
        : (data as { choices?: Array<{ message?: { content?: string } }> }).choices?.[0]?.message?.content || '';
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          label: parsed.label,
          confidence: parsed.confidence || 0.8,
        };
      }
      
      return emotionService.analyzeText(text);
    } catch (error) {
      console.warn('TinyLLM classification failed, falling back to keyword analysis:', error);
      return emotionService.analyzeText(text);
    }
  }

  async suggestLetter(input: LetterSuggestionInput): Promise<LetterSuggestion> {
    const { recipientName, relationship, occasion, tone, keywords } = input;

    if (!this.isConfigured()) {
      return this.generateFallbackLetter(input);
    }

    try {
      const prompt = `Write a heartfelt letter for a ${relationship} named ${recipientName}.
${occasion ? `Occasion: ${occasion}` : ''}
${tone ? `Tone: ${tone}` : 'Tone: warm and loving'}
${keywords?.length ? `Include themes: ${keywords.join(', ')}` : ''}

Respond with ONLY a JSON object:
{
  "salutation": "Dear...",
  "body": "The letter body...",
  "signature": "With love..."
}`;

      const endpoint = this.isOllama ? `${this.baseUrl}/api/chat` : `${this.baseUrl}/chat/completions`;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (!this.isOllama && this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const systemPrompt = 'You are a compassionate letter writer helping people express their feelings to loved ones. Write sincere, emotional letters that capture the essence of family bonds and lasting memories.';
      
      const body = this.isOllama ? {
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        stream: false,
        options: { temperature: 0.7, num_predict: 500 },
      } : {
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        console.warn('TinyLLM API error, using fallback letter');
        return this.generateFallbackLetter(input);
      }

      const data = await response.json();
      const content = this.isOllama 
        ? (data as { message?: { content?: string } }).message?.content || ''
        : (data as { choices?: Array<{ message?: { content?: string } }> }).choices?.[0]?.message?.content || '';
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const emotionResult = await this.classifyEmotion(parsed.body || '');
        
        return {
          salutation: parsed.salutation || `Dear ${recipientName}`,
          body: parsed.body || this.generateFallbackLetter(input).body,
          signature: parsed.signature || 'With love',
          emotion: emotionResult.label,
        };
      }
      
      return this.generateFallbackLetter(input);
    } catch (error) {
      console.warn('TinyLLM letter suggestion failed, using fallback:', error);
      return this.generateFallbackLetter(input);
    }
  }

  private generateFallbackLetter(input: LetterSuggestionInput): LetterSuggestion {
    const { recipientName, relationship, occasion } = input;
    
    const salutations: Record<string, string> = {
      child: `My dearest ${recipientName}`,
      spouse: `My beloved ${recipientName}`,
      parent: `Dear ${recipientName}`,
      sibling: `Dear ${recipientName}`,
      grandchild: `My precious ${recipientName}`,
      friend: `Dear ${recipientName}`,
    };

    const signatures: Record<string, string> = {
      child: 'With all my love, forever and always',
      spouse: 'Yours eternally',
      parent: 'With love and gratitude',
      sibling: 'With love',
      grandchild: 'With endless love',
      friend: 'Your friend, always',
    };

    const bodies: Record<string, string> = {
      birthday: `As you celebrate another year of life, I want you to know how much joy you bring to everyone around you. Your presence in this world is a gift, and I am so grateful to be part of your journey.`,
      wedding: `On this beautiful day, as you begin this new chapter of your life, I want you to know how proud I am of the person you have become. May your marriage be filled with love, laughter, and endless happiness.`,
      graduation: `Congratulations on this incredible achievement! Your hard work and dedication have brought you to this moment. I am so proud of everything you have accomplished and excited for all that lies ahead.`,
      default: `I wanted to take a moment to tell you how much you mean to me. Life moves so quickly, and sometimes we forget to express the love we carry in our hearts. You are a blessing in my life, and I cherish every moment we share together.`,
    };

    const salutation = salutations[relationship.toLowerCase()] || `Dear ${recipientName}`;
    const signature = signatures[relationship.toLowerCase()] || 'With love';
    const body = bodies[occasion?.toLowerCase() || 'default'] || bodies.default;

    return {
      salutation,
      body,
      signature,
      emotion: 'loving',
    };
  }
}

export const tinyLLMService = new TinyLLMService();
export type { LetterSuggestionInput, LetterSuggestion };

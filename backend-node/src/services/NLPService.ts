import axios from 'axios';

interface SentimentResult {
  label: string;
  score: number;
  confidence: number;
}

interface EntityResult {
  people: string[];
  places: string[];
  dates: string[];
  emotions: string[];
}

interface NLPAnalysisResult {
  sentiment: SentimentResult;
  entities: EntityResult;
  keywords: string[];
  summary: string;
}

export class NLPService {
  private ollamaUrl: string;
  private model: string;
  private enabled: boolean;

  constructor() {
    this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.model = process.env.OLLAMA_MODEL || 'phi3:mini';
    this.enabled = process.env.OLLAMA_ENABLED !== 'false';
  }

  async analyzeSentiment(text: string): Promise<SentimentResult> {
    if (!this.enabled) {
      return this.fallbackSentiment(text);
    }

    try {
      const prompt = `Analyze the sentiment of this text and respond with ONLY a JSON object in this exact format:
{"label": "happy|sad|angry|neutral|joyful|nostalgic", "score": <number between -1 and 1>, "confidence": <number between 0 and 1>}

Text: "${text}"

JSON:`;

      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: this.model,
        prompt,
        stream: false,
        options: {
          temperature: 0.3,
          num_predict: 100
        }
      }, {
        timeout: 30000
      });

      const result = response.data.response.trim();
      const jsonMatch = result.match(/\{[^}]+\}/);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          label: this.normalizeSentimentLabel(parsed.label),
          score: parsed.score || 0,
          confidence: parsed.confidence || 0.5
        };
      }

      return this.fallbackSentiment(text);
    } catch (error) {
      console.error('Ollama sentiment analysis failed:', error);
      return this.fallbackSentiment(text);
    }
  }

  async extractEntities(text: string): Promise<EntityResult> {
    if (!this.enabled) {
      return this.fallbackEntities(text);
    }

    try {
      const prompt = `Extract entities from this text and respond with ONLY a JSON object in this exact format:
{"people": ["name1", "name2"], "places": ["place1"], "dates": ["date1"], "emotions": ["emotion1"]}

Text: "${text}"

JSON:`;

      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: this.model,
        prompt,
        stream: false,
        options: {
          temperature: 0.3,
          num_predict: 200
        }
      }, {
        timeout: 30000
      });

      const result = response.data.response.trim();
      const jsonMatch = result.match(/\{[^}]+\}/);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          people: parsed.people || [],
          places: parsed.places || [],
          dates: parsed.dates || [],
          emotions: parsed.emotions || []
        };
      }

      return this.fallbackEntities(text);
    } catch (error) {
      console.error('Ollama entity extraction failed:', error);
      return this.fallbackEntities(text);
    }
  }

  async parseSearchIntent(query: string): Promise<{ sentiment?: string; person?: string; timeframe?: string; keywords: string[] }> {
    if (!this.enabled) {
      return this.fallbackSearchIntent(query);
    }

    try {
      const prompt = `Parse this search query and extract intent. Respond with ONLY a JSON object:
{"sentiment": "happy|sad|angry|joyful|nostalgic|null", "person": "person name or null", "timeframe": "timeframe or null", "keywords": ["keyword1", "keyword2"]}

Query: "${query}"

Examples:
- "when was dad happy" -> {"sentiment": "happy", "person": "dad", "timeframe": null, "keywords": ["dad", "happy"]}
- "mom's birthday last year" -> {"sentiment": null, "person": "mom", "timeframe": "last year", "keywords": ["mom", "birthday", "last year"]}

JSON:`;

      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: this.model,
        prompt,
        stream: false,
        options: {
          temperature: 0.3,
          num_predict: 150
        }
      }, {
        timeout: 30000
      });

      const result = response.data.response.trim();
      const jsonMatch = result.match(/\{[^}]+\}/);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          sentiment: parsed.sentiment === 'null' ? undefined : parsed.sentiment,
          person: parsed.person === 'null' ? undefined : parsed.person,
          timeframe: parsed.timeframe === 'null' ? undefined : parsed.timeframe,
          keywords: parsed.keywords || []
        };
      }

      return this.fallbackSearchIntent(query);
    } catch (error) {
      console.error('Ollama search intent parsing failed:', error);
      return this.fallbackSearchIntent(query);
    }
  }

  async analyzeMemory(text: string): Promise<NLPAnalysisResult> {
    const [sentiment, entities] = await Promise.all([
      this.analyzeSentiment(text),
      this.extractEntities(text)
    ]);

    const keywords = this.extractKeywords(text);
    const summary = this.generateSummary(text);

    return {
      sentiment,
      entities,
      keywords,
      summary
    };
  }

  private normalizeSentimentLabel(label: string): string {
    const normalized = label.toLowerCase().trim();
    const validLabels = ['happy', 'sad', 'angry', 'neutral', 'joyful', 'nostalgic'];
    
    if (validLabels.includes(normalized)) {
      return normalized;
    }

    if (normalized.includes('joy') || normalized.includes('excit')) return 'joyful';
    if (normalized.includes('happ')) return 'happy';
    if (normalized.includes('sad') || normalized.includes('depress')) return 'sad';
    if (normalized.includes('ang') || normalized.includes('frust')) return 'angry';
    if (normalized.includes('nostalg') || normalized.includes('remember')) return 'nostalgic';
    
    return 'neutral';
  }

  private fallbackSentiment(text: string): SentimentResult {
    const lowerText = text.toLowerCase();
    
    const happyWords = ['happy', 'joy', 'love', 'wonderful', 'amazing', 'great', 'excited', 'celebration'];
    const sadWords = ['sad', 'miss', 'lost', 'gone', 'cry', 'tears', 'grief', 'sorrow'];
    const angryWords = ['angry', 'mad', 'furious', 'frustrated', 'annoyed'];
    const nostalgicWords = ['remember', 'memory', 'nostalgia', 'past', 'used to', 'back then'];

    let score = 0;
    let label = 'neutral';

    happyWords.forEach(word => { if (lowerText.includes(word)) score += 1; });
    sadWords.forEach(word => { if (lowerText.includes(word)) score -= 1; });
    angryWords.forEach(word => { if (lowerText.includes(word)) score -= 0.5; });
    
    if (nostalgicWords.some(word => lowerText.includes(word))) {
      label = 'nostalgic';
    } else if (score >= 2) {
      label = 'joyful';
    } else if (score >= 1) {
      label = 'happy';
    } else if (score <= -2) {
      label = 'sad';
    } else if (score <= -1) {
      label = 'angry';
    }

    return {
      label,
      score: Math.max(-1, Math.min(1, score / 3)),
      confidence: 0.6
    };
  }

  private fallbackEntities(text: string): EntityResult {
    const words = text.split(/\s+/);
    const capitalizedWords = words.filter(word => /^[A-Z][a-z]+/.test(word));
    
    return {
      people: capitalizedWords.slice(0, 3),
      places: [],
      dates: [],
      emotions: []
    };
  }

  private fallbackSearchIntent(query: string): { sentiment?: string; person?: string; timeframe?: string; keywords: string[] } {
    const lowerQuery = query.toLowerCase();
    const words = query.split(/\s+/);
    
    let sentiment: string | undefined;
    let person: string | undefined;
    let timeframe: string | undefined;

    const sentimentWords = ['happy', 'sad', 'angry', 'joyful', 'nostalgic'];
    sentimentWords.forEach(word => {
      if (lowerQuery.includes(word)) sentiment = word;
    });

    const familyWords = ['dad', 'mom', 'father', 'mother', 'son', 'daughter', 'brother', 'sister'];
    familyWords.forEach(word => {
      if (lowerQuery.includes(word)) person = word;
    });

    const timeWords = ['yesterday', 'last week', 'last year', 'last month', 'today'];
    timeWords.forEach(word => {
      if (lowerQuery.includes(word)) timeframe = word;
    });

    return {
      sentiment,
      person,
      timeframe,
      keywords: words.filter(w => w.length > 2)
    };
  }

  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    const stopWords = new Set(['this', 'that', 'with', 'from', 'have', 'been', 'were', 'they', 'what', 'when', 'where']);
    const filtered = words.filter(word => !stopWords.has(word));
    
    const frequency: Record<string, number> = {};
    filtered.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  private generateSummary(text: string): string {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    return sentences[0]?.trim().substring(0, 150) || text.substring(0, 150);
  }
}

export const nlpService = new NLPService();

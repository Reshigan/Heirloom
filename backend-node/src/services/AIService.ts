import Sentiment from 'sentiment';
import natural from 'natural';
import nlp from 'compromise';

const sentiment = new Sentiment();
const tokenizer = new natural.WordTokenizer();
const TfIdf = natural.TfIdf;

export class AIService {
  analyzeSentiment(text: string): { score: number; comparative: number; tokens: string[] } {
    const result = sentiment.analyze(text);
    return {
      score: result.score,
      comparative: result.comparative,
      tokens: result.tokens
    };
  }

  extractKeywords(text: string, limit: number = 5): string[] {
    const tfidf = new TfIdf();
    tfidf.addDocument(text);
    
    const keywords: Array<{ term: string; score: number }> = [];
    tfidf.listTerms(0).forEach((item: any) => {
      if (item.term.length > 3) {
        keywords.push({ term: item.term, score: item.tfidf });
      }
    });
    
    return keywords
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(k => k.term);
  }

  extractEntities(text: string): { people: string[]; places: string[]; dates: string[] } {
    const doc = nlp(text);
    
    return {
      people: doc.people().out('array'),
      places: doc.places().out('array'),
      dates: doc.dates().out('array')
    };
  }

  generateSummary(text: string, maxLength: number = 150): string {
    const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [text];
    
    if (sentences.length <= 2) {
      return text.substring(0, maxLength);
    }

    const tfidf = new TfIdf();
    sentences.forEach(sentence => tfidf.addDocument(sentence));

    const scores: Array<{ sentence: string; score: number; index: number }> = [];
    sentences.forEach((sentence, index) => {
      let score = 0;
      tfidf.listTerms(index).forEach((item: any) => {
        score += item.tfidf;
      });
      scores.push({ sentence, score, index });
    });

    scores.sort((a, b) => b.score - a.score);
    
    const topSentences = scores.slice(0, 2).sort((a, b) => a.index - b.index);
    const summary = topSentences.map(s => s.sentence.trim()).join(' ');
    
    return summary.length > maxLength 
      ? summary.substring(0, maxLength) + '...'
      : summary;
  }

  categorizeEmotion(sentimentScore: number): string {
    if (sentimentScore >= 3) return 'joyful';
    if (sentimentScore >= 1) return 'happy';
    if (sentimentScore > -1) return 'neutral';
    if (sentimentScore > -3) return 'sad';
    return 'distressed';
  }

  calculateImportance(text: string, metadata: any = {}): number {
    let score = 5;

    const sentimentResult = this.analyzeSentiment(text);
    const emotionalIntensity = Math.abs(sentimentResult.comparative);
    score += emotionalIntensity * 2;

    const entities = this.extractEntities(text);
    score += entities.people.length * 0.5;
    score += entities.places.length * 0.3;
    score += entities.dates.length * 0.2;

    if (metadata.hasMedia) score += 1;
    if (metadata.hasVoice) score += 1.5;
    if (metadata.hasVideo) score += 2;

    return Math.min(10, Math.max(1, Math.round(score)));
  }

  async analyzeMemory(text: string, metadata: any = {}) {
    const sentimentResult = this.analyzeSentiment(text);
    const keywords = this.extractKeywords(text);
    const entities = this.extractEntities(text);
    const emotion = this.categorizeEmotion(sentimentResult.score);
    const importance = this.calculateImportance(text, metadata);
    const summary = this.generateSummary(text);

    return {
      sentiment: {
        score: sentimentResult.score,
        comparative: sentimentResult.comparative,
        emotion
      },
      keywords,
      entities,
      importance,
      summary
    };
  }

  calculateSimilarity(text1: string, text2: string): number {
    const tokens1 = tokenizer.tokenize(text1.toLowerCase()) || [];
    const tokens2 = tokenizer.tokenize(text2.toLowerCase()) || [];
    
    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  findRelatedMemories(targetText: string, targetKeywords: string[], allMemories: Array<{ id: string; text: string; keywords: string[] }>, limit: number = 5): string[] {
    const scores = allMemories.map(memory => {
      let score = 0;
      
      score += this.calculateSimilarity(targetText, memory.text) * 0.4;
      
      const keywordOverlap = targetKeywords.filter(k => memory.keywords.includes(k)).length;
      score += (keywordOverlap / Math.max(targetKeywords.length, 1)) * 0.6;
      
      return { id: memory.id, score };
    });

    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .filter(s => s.score > 0.1)
      .map(s => s.id);
  }
}

export const aiService = new AIService();

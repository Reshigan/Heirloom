import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { Ollama } from 'ollama';
import { logger } from '../utils/logger';
import { config } from '../utils/config';

export interface AIStoryRequest {
  userId: string;
  familyId: string;
  memoryIds: string[];
  prompt?: string;
  style?: 'narrative' | 'poetic' | 'documentary' | 'children' | 'formal';
  tone?: 'warm' | 'nostalgic' | 'celebratory' | 'reflective' | 'humorous';
  length?: 'short' | 'medium' | 'long';
}

export interface AIAnalysisRequest {
  userId: string;
  content: string;
  type: 'memory' | 'photo' | 'document';
}

export interface AIRecommendation {
  type: 'memory_connection' | 'story_idea' | 'time_capsule' | 'legacy_plan';
  title: string;
  description: string;
  confidence: number;
  data?: any;
}

export class AIService {
  private ollama: Ollama;
  private isConnected: boolean = false;
  private modelName: string = 'llama3.1:70b'; // Using Llama 3.1 70B as it's more available than Llama 4

  constructor(
    private prisma: PrismaClient,
    private redis: Redis
  ) {
    this.ollama = new Ollama({
      host: config.ollama.host || 'http://localhost:11434'
    });
    this.initializeAI();
  }

  private async initializeAI() {
    try {
      // Check if Ollama is running
      const models = await this.ollama.list();
      logger.info('Available Ollama models:', models.models.map(m => m.name));

      // Check if our preferred model is available
      const hasModel = models.models.some(m => m.name.includes('llama3.1'));
      
      if (!hasModel) {
        logger.info('Pulling Llama 3.1 model...');
        await this.ollama.pull({ model: this.modelName });
      }

      this.isConnected = true;
      logger.info('AI Service initialized successfully with Llama 3.1');
    } catch (error) {
      logger.error('Failed to initialize AI service:', error);
      this.isConnected = false;
    }
  }

  async start() {
    if (!this.isConnected) {
      await this.initializeAI();
    }
  }

  isHealthy(): boolean {
    return this.isConnected;
  }

  async generateStory(request: AIStoryRequest): Promise<{
    story: string;
    title: string;
    confidence: number;
    generationTime: number;
  }> {
    const startTime = Date.now();

    try {
      // Fetch memories for context
      const memories = await this.prisma.memory.findMany({
        where: {
          id: { in: request.memoryIds },
          familyId: request.familyId
        },
        include: {
          author: {
            select: { firstName: true, lastName: true }
          }
        }
      });

      // Build context from memories
      const memoryContext = memories.map(memory => ({
        title: memory.title,
        description: memory.description,
        content: memory.content,
        date: memory.date?.toISOString(),
        location: memory.location,
        author: `${memory.author.firstName} ${memory.author.lastName}`,
        type: memory.type
      }));

      // Create the prompt
      const systemPrompt = this.buildStoryPrompt(request.style, request.tone, request.length);
      const userPrompt = this.buildUserPrompt(memoryContext, request.prompt);

      // Generate story using Ollama
      const response = await this.ollama.chat({
        model: this.modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        options: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: request.length === 'long' ? 2000 : request.length === 'medium' ? 1000 : 500
        }
      });

      const generationTime = Date.now() - startTime;
      const story = response.message.content;

      // Generate a title
      const titleResponse = await this.ollama.chat({
        model: this.modelName,
        messages: [
          { 
            role: 'system', 
            content: 'You are a creative title generator. Create a compelling, emotional title for the following story. Return only the title, nothing else.' 
          },
          { role: 'user', content: story.substring(0, 500) + '...' }
        ],
        options: {
          temperature: 0.8,
          max_tokens: 20
        }
      });

      const title = titleResponse.message.content.replace(/['"]/g, '').trim();

      // Calculate confidence based on response quality
      const confidence = this.calculateStoryConfidence(story, memories.length);

      // Save the story
      await this.prisma.story.create({
        data: {
          title,
          content: story,
          prompt: request.prompt || 'AI-generated family story',
          style: request.style || 'narrative',
          aiModel: this.modelName,
          generationTime,
          confidence,
          authorId: request.userId,
          familyId: request.familyId,
          memoryIds: request.memoryIds
        }
      });

      // Log AI interaction
      await this.logAIInteraction({
        userId: request.userId,
        type: 'story_generation',
        prompt: userPrompt,
        response: story,
        responseTime: generationTime,
        confidence
      });

      return {
        story,
        title,
        confidence,
        generationTime
      };

    } catch (error) {
      logger.error('Story generation failed:', error);
      throw new Error('Failed to generate story. Please try again.');
    }
  }

  async analyzeMemory(request: AIAnalysisRequest): Promise<{
    summary: string;
    tags: string[];
    sentiment: 'positive' | 'neutral' | 'negative';
    importance: number;
    suggestions: string[];
  }> {
    try {
      const analysisPrompt = `
        Analyze the following ${request.type} content and provide insights:
        
        Content: ${request.content}
        
        Please provide:
        1. A brief summary (2-3 sentences)
        2. Relevant tags (5-8 keywords)
        3. Emotional sentiment (positive/neutral/negative)
        4. Importance score (1-5, where 5 is most important for family legacy)
        5. Suggestions for connections or enhancements
        
        Format your response as JSON with keys: summary, tags, sentiment, importance, suggestions
      `;

      const response = await this.ollama.chat({
        model: this.modelName,
        messages: [
          { role: 'system', content: 'You are an expert family historian and memory analyst. Provide thoughtful, sensitive analysis of family memories.' },
          { role: 'user', content: analysisPrompt }
        ],
        options: {
          temperature: 0.3,
          format: 'json'
        }
      });

      const analysis = JSON.parse(response.message.content);

      // Log AI interaction
      await this.logAIInteraction({
        userId: request.userId,
        type: 'memory_analysis',
        prompt: analysisPrompt,
        response: response.message.content,
        responseTime: 0,
        confidence: 0.8
      });

      return {
        summary: analysis.summary,
        tags: Array.isArray(analysis.tags) ? analysis.tags : [],
        sentiment: analysis.sentiment,
        importance: Math.min(5, Math.max(1, parseInt(analysis.importance) || 3)),
        suggestions: Array.isArray(analysis.suggestions) ? analysis.suggestions : []
      };

    } catch (error) {
      logger.error('Memory analysis failed:', error);
      throw new Error('Failed to analyze memory. Please try again.');
    }
  }

  async generateRecommendations(userId: string, familyId: string): Promise<AIRecommendation[]> {
    try {
      // Get user's recent memories and activity
      const recentMemories = await this.prisma.memory.findMany({
        where: { familyId, authorId: userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          title: true,
          description: true,
          type: true,
          tags: true,
          importance: true
        }
      });

      // Get family context
      const family = await this.prisma.family.findUnique({
        where: { id: familyId },
        include: {
          members: {
            include: {
              user: {
                select: { firstName: true, lastName: true }
              }
            }
          }
        }
      });

      const contextPrompt = `
        Based on this family's recent memories and activity, suggest 5 personalized recommendations:
        
        Family: ${family?.name}
        Members: ${family?.members.map(m => `${m.user.firstName} ${m.user.lastName}`).join(', ')}
        
        Recent Memories:
        ${recentMemories.map(m => `- ${m.title}: ${m.description} (${m.type}, importance: ${m.importance})`).join('\n')}
        
        Provide recommendations for:
        1. Memory connections to explore
        2. Story ideas to develop
        3. Time capsule suggestions
        4. Legacy planning opportunities
        
        Format as JSON array with objects containing: type, title, description, confidence (0-1)
      `;

      const response = await this.ollama.chat({
        model: this.modelName,
        messages: [
          { role: 'system', content: 'You are a family legacy advisor. Provide thoughtful, personalized recommendations to help families preserve and share their stories.' },
          { role: 'user', content: contextPrompt }
        ],
        options: {
          temperature: 0.6,
          format: 'json'
        }
      });

      const recommendations = JSON.parse(response.message.content);

      // Log AI interaction
      await this.logAIInteraction({
        userId,
        type: 'recommendation',
        prompt: contextPrompt,
        response: response.message.content,
        responseTime: 0,
        confidence: 0.7
      });

      return Array.isArray(recommendations) ? recommendations : [];

    } catch (error) {
      logger.error('Recommendation generation failed:', error);
      return [];
    }
  }

  async generateTimeCapsuleMessage(
    userId: string,
    familyId: string,
    recipientInfo: string,
    deliveryYear: number
  ): Promise<string> {
    try {
      // Get family context
      const family = await this.prisma.family.findUnique({
        where: { id: familyId },
        include: {
          memories: {
            orderBy: { importance: 'desc' },
            take: 5,
            select: { title: true, description: true, date: true }
          }
        }
      });

      const currentYear = new Date().getFullYear();
      const yearsInFuture = deliveryYear - currentYear;

      const prompt = `
        Create a heartfelt time capsule message for a family member to be opened in ${deliveryYear} (${yearsInFuture} years from now).
        
        Recipient: ${recipientInfo}
        Family: ${family?.name}
        
        Recent family highlights:
        ${family?.memories.map(m => `- ${m.title} (${m.date?.getFullYear()}): ${m.description}`).join('\n')}
        
        Write a warm, personal message that:
        1. Reflects on the current time and family situation
        2. Shares hopes and dreams for the future
        3. Includes wisdom and love for the recipient
        4. Captures the essence of this moment in time
        
        Keep it heartfelt, personal, and meaningful. Length: 200-400 words.
      `;

      const response = await this.ollama.chat({
        model: this.modelName,
        messages: [
          { role: 'system', content: 'You are a thoughtful family member writing a loving message to be preserved for the future. Write with warmth, wisdom, and genuine emotion.' },
          { role: 'user', content: prompt }
        ],
        options: {
          temperature: 0.8,
          max_tokens: 600
        }
      });

      return response.message.content;

    } catch (error) {
      logger.error('Time capsule message generation failed:', error);
      throw new Error('Failed to generate time capsule message. Please try again.');
    }
  }

  private buildStoryPrompt(style?: string, tone?: string, length?: string): string {
    const styleGuide = {
      narrative: 'Tell the story in a flowing, narrative style with vivid details and emotional depth.',
      poetic: 'Write in a poetic, lyrical style with beautiful imagery and metaphors.',
      documentary: 'Present the story in a factual, documentary style with clear chronology.',
      children: 'Write in a simple, engaging style appropriate for children and young readers.',
      formal: 'Use a formal, respectful tone suitable for official family records.'
    };

    const toneGuide = {
      warm: 'Use a warm, loving tone that brings comfort and joy.',
      nostalgic: 'Evoke nostalgia and fond memories of times past.',
      celebratory: 'Celebrate achievements and happy moments with enthusiasm.',
      reflective: 'Take a thoughtful, contemplative approach to the memories.',
      humorous: 'Include gentle humor and lighthearted moments where appropriate.'
    };

    return `
      You are a master storyteller specializing in family histories and legacy preservation.
      Your role is to transform family memories into compelling, emotionally resonant stories
      that will be treasured by future generations.
      
      Style: ${styleGuide[style as keyof typeof styleGuide] || styleGuide.narrative}
      Tone: ${toneGuide[tone as keyof typeof toneGuide] || toneGuide.warm}
      Length: ${length === 'long' ? 'Write a detailed, comprehensive story (1500-2000 words)' : 
                length === 'medium' ? 'Write a well-developed story (800-1200 words)' : 
                'Write a concise but complete story (400-600 words)'}
      
      Guidelines:
      - Focus on emotional connections and relationships
      - Include sensory details that bring memories to life
      - Respect the dignity and privacy of all family members
      - Create a story that will be meaningful to future generations
      - Weave memories together in a coherent, engaging narrative
    `;
  }

  private buildUserPrompt(memories: any[], customPrompt?: string): string {
    const memoryText = memories.map(memory => 
      `Memory: "${memory.title}"
       Date: ${memory.date || 'Unknown'}
       Location: ${memory.location || 'Unknown'}
       Author: ${memory.author}
       Type: ${memory.type}
       Description: ${memory.description || 'No description'}
       Content: ${memory.content || 'No additional content'}`
    ).join('\n\n');

    return `
      ${customPrompt ? `Special Request: ${customPrompt}\n\n` : ''}
      
      Please create a beautiful family story based on these memories:
      
      ${memoryText}
      
      Transform these memories into a cohesive, meaningful story that captures
      the essence of this family's journey and will be treasured by future generations.
    `;
  }

  private calculateStoryConfidence(story: string, memoryCount: number): number {
    let confidence = 0.5; // Base confidence
    
    // Adjust based on story length and quality indicators
    if (story.length > 500) confidence += 0.1;
    if (story.length > 1000) confidence += 0.1;
    
    // Adjust based on number of memories used
    confidence += Math.min(0.2, memoryCount * 0.05);
    
    // Check for quality indicators
    if (story.includes('family') || story.includes('love') || story.includes('memory')) confidence += 0.1;
    if (story.split('.').length > 5) confidence += 0.1; // Multiple sentences
    
    return Math.min(1.0, confidence);
  }

  // Advanced AI functions for vault system
  async analyzeMemoryForVault(memory: any) {
    try {
      const prompt = `
      Analyze this memory for emotional context and search metadata:
      
      Title: ${memory.title}
      Content: ${memory.content}
      Type: ${memory.type}
      Created: ${memory.createdAt}
      
      Please provide:
      1. Emotional context (sentiment, emotions, intensity)
      2. Age context if mentioned (subject age, age range, life stage)
      3. Search metadata (keywords, people, places, events, time references)
      
      Return as JSON with this structure:
      {
        "emotionalContext": {
          "sentiment": "positive|negative|neutral|very_positive|very_negative",
          "emotions": ["joy", "love", "nostalgia", "pride"],
          "intensity": 0.8,
          "ageContext": {
            "subjectAge": 35,
            "ageRange": "30s",
            "lifeStage": "parent"
          }
        },
        "searchMetadata": {
          "keywords": ["vacation", "beach", "family"],
          "people": ["mom", "dad", "children"],
          "places": ["Miami", "beach", "hotel"],
          "events": ["vacation", "swimming", "dinner"],
          "timeReferences": ["summer", "2023", "weekend"]
        }
      }
      `;

      const response = await this.ollama.chat({
        model: this.modelName,
        messages: [
          { role: 'system', content: 'You are an expert memory analyst specializing in emotional context and metadata extraction for private family vaults.' },
          { role: 'user', content: prompt }
        ],
        options: {
          temperature: 0.3,
          format: 'json'
        }
      });

      try {
        return JSON.parse(response.message.content);
      } catch (parseError) {
        // Fallback analysis if JSON parsing fails
        return {
          emotionalContext: {
            sentiment: 'neutral',
            emotions: [],
            intensity: 0.5,
            ageContext: {}
          },
          searchMetadata: {
            keywords: [],
            people: [],
            places: [],
            events: [],
            timeReferences: []
          }
        };
      }
    } catch (error) {
      logger.error('Memory vault analysis failed:', error);
      throw new Error('Failed to analyze memory for vault');
    }
  }

  async parseNaturalLanguageQuery(query: string) {
    try {
      const prompt = `
      Parse this natural language query for memory search:
      "${query}"
      
      Extract and return as JSON:
      {
        "sentiment": "positive|negative|neutral|very_positive|very_negative",
        "emotions": ["joy", "sadness", "love", "pride"],
        "ageRange": "20s|30s|40s|childhood|teenage|young_adult|middle_age|elderly",
        "timeRange": {
          "start": "YYYY-MM-DD or relative like '10 years ago'",
          "end": "YYYY-MM-DD or relative like 'last year'"
        },
        "people": ["mom", "dad", "sister", "friend"],
        "places": ["home", "school", "beach", "Paris"],
        "events": ["birthday", "wedding", "vacation", "graduation"],
        "keywords": ["happy", "celebration", "family"]
      }
      
      Examples:
      - "tell me when my mom was happy in her 30s" → sentiment: "positive", ageRange: "30s", people: ["mom"]
      - "show me sad memories from childhood" → sentiment: "negative", ageRange: "childhood"
      - "find joyful family moments from last summer" → sentiment: "positive", emotions: ["joy"], keywords: ["family"], timeRange: {"start": "last summer"}
      `;

      const response = await this.ollama.chat({
        model: this.modelName,
        messages: [
          { role: 'system', content: 'You are an expert natural language processor specializing in emotional memory queries.' },
          { role: 'user', content: prompt }
        ],
        options: {
          temperature: 0.2,
          format: 'json'
        }
      });

      try {
        return JSON.parse(response.message.content);
      } catch (parseError) {
        // Fallback parsing
        const parsedQuery: any = {
          sentiment: null,
          emotions: [],
          ageRange: null,
          timeRange: {},
          people: [],
          places: [],
          events: [],
          keywords: []
        };

        // Simple keyword extraction as fallback
        const lowerQuery = query.toLowerCase();
        
        // Sentiment detection
        if (lowerQuery.includes('happy') || lowerQuery.includes('joy') || lowerQuery.includes('good')) {
          parsedQuery.sentiment = 'positive';
        } else if (lowerQuery.includes('sad') || lowerQuery.includes('upset') || lowerQuery.includes('bad')) {
          parsedQuery.sentiment = 'negative';
        }

        // Age range detection
        if (lowerQuery.includes('20s')) parsedQuery.ageRange = '20s';
        else if (lowerQuery.includes('30s')) parsedQuery.ageRange = '30s';
        else if (lowerQuery.includes('40s')) parsedQuery.ageRange = '40s';
        else if (lowerQuery.includes('childhood')) parsedQuery.ageRange = 'childhood';

        // People detection
        const people = ['mom', 'dad', 'mother', 'father', 'sister', 'brother', 'friend', 'family'];
        parsedQuery.people = people.filter(person => lowerQuery.includes(person));

        return parsedQuery;
      }
    } catch (error) {
      logger.error('Natural language query parsing failed:', error);
      throw new Error('Failed to parse natural language query');
    }
  }

  async rankSearchResults(vaultMemories: any[], query: string) {
    try {
      if (!query || vaultMemories.length === 0) {
        return vaultMemories;
      }

      const prompt = `
      Rank these memory search results based on relevance to the query: "${query}"
      
      Memories:
      ${vaultMemories.map((vm, index) => `
      ${index + 1}. ${vm.memory.title}
      Content: ${vm.memory.content.substring(0, 200)}...
      Sentiment: ${vm.emotionalContext?.sentiment || 'unknown'}
      Emotions: ${vm.emotionalContext?.emotions?.join(', ') || 'none'}
      Age Context: ${vm.emotionalContext?.ageContext?.ageRange || 'unknown'}
      `).join('\n')}
      
      Return only the numbers (1, 2, 3, etc.) in order of relevance, separated by commas.
      Most relevant first.
      `;

      const response = await this.ollama.chat({
        model: this.modelName,
        messages: [
          { role: 'system', content: 'You are an expert at ranking memory search results based on emotional and contextual relevance.' },
          { role: 'user', content: prompt }
        ],
        options: {
          temperature: 0.1
        }
      });

      const rankingText = response.message.content.trim();
      
      try {
        const rankings = rankingText.split(',').map(n => parseInt(n.trim()) - 1);
        const rankedResults = rankings
          .filter(index => index >= 0 && index < vaultMemories.length)
          .map(index => vaultMemories[index]);
        
        // Add any missing memories at the end
        const usedIndices = new Set(rankings);
        const remainingMemories = vaultMemories.filter((_, index) => !usedIndices.has(index));
        
        return [...rankedResults, ...remainingMemories];
      } catch (parseError) {
        return vaultMemories; // Return original order if parsing fails
      }
    } catch (error) {
      logger.error('Search result ranking failed:', error);
      return vaultMemories; // Return original order if ranking fails
    }
  }

  async generateEmotionalInsights(memories: any[]) {
    try {
      const prompt = `
      Analyze these memories for emotional patterns and insights:
      
      ${memories.map(memory => `
      Title: ${memory.title}
      Content: ${memory.content.substring(0, 150)}...
      Date: ${memory.createdAt}
      Sentiment: ${memory.aiInsights?.sentiment || 'unknown'}
      `).join('\n')}
      
      Provide insights about:
      1. Emotional journey over time
      2. Recurring themes and patterns
      3. Significant emotional moments
      4. Overall emotional health indicators
      5. Recommendations for memory preservation
      
      Return as JSON:
      {
        "emotionalJourney": "description of emotional progression",
        "patterns": ["pattern1", "pattern2"],
        "significantMoments": [{"title": "moment", "significance": "why important"}],
        "healthIndicators": {"overall": "positive|neutral|concerning", "details": "explanation"},
        "recommendations": ["recommendation1", "recommendation2"]
      }
      `;

      const response = await this.ollama.chat({
        model: this.modelName,
        messages: [
          { role: 'system', content: 'You are a compassionate family therapist and memory analyst specializing in emotional patterns and family dynamics.' },
          { role: 'user', content: prompt }
        ],
        options: {
          temperature: 0.4,
          format: 'json'
        }
      });

      try {
        return JSON.parse(response.message.content);
      } catch (parseError) {
        return {
          emotionalJourney: "Unable to analyze emotional journey at this time.",
          patterns: [],
          significantMoments: [],
          healthIndicators: { overall: "neutral", details: "Analysis unavailable" },
          recommendations: ["Continue preserving memories", "Add more context to memories"]
        };
      }
    } catch (error) {
      logger.error('Emotional insights generation failed:', error);
      throw new Error('Failed to generate emotional insights');
    }
  }

  private async logAIInteraction(data: {
    userId: string;
    type: string;
    prompt: string;
    response: string;
    responseTime: number;
    confidence: number;
    userRating?: number;
  }) {
    try {
      await this.prisma.aIInteraction.create({
        data: {
          userId: data.userId,
          type: data.type,
          prompt: data.prompt,
          response: data.response,
          model: this.modelName,
          responseTime: data.responseTime,
          confidence: data.confidence,
          userRating: data.userRating
        }
      });
    } catch (error) {
      logger.error('Failed to log AI interaction:', error);
    }
  }
}
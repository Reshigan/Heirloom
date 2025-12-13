import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Types
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  type?: 'text' | 'suggestion' | 'emotion' | 'caption';
}

interface EmotionAnalysis {
  primary: string;
  secondary: string;
  confidence: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  suggestedTags: string[];
}

interface WritingSuggestion {
  type: 'letter' | 'caption' | 'voice_prompt';
  suggestions: string[];
  tone: string;
}

// Ollama API service
class OllamaService {
  private baseUrl: string;
  private model: string;

  constructor(baseUrl: string = 'http://localhost:11434', model: string = 'tinyllama') {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async generate(prompt: string, systemPrompt?: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt: prompt,
          system: systemPrompt || this.getDefaultSystemPrompt(),
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            max_tokens: 500,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Ollama API request failed');
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Ollama error:', error);
      // Fallback to mock responses if Ollama is not available
      return this.getMockResponse(prompt);
    }
  }

  async streamGenerate(
    prompt: string,
    onToken: (token: string) => void,
    systemPrompt?: string
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt: prompt,
          system: systemPrompt || this.getDefaultSystemPrompt(),
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Ollama API request failed');
      }

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(Boolean);
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.response) {
              onToken(data.response);
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    } catch (error) {
      console.error('Ollama streaming error:', error);
      // Fallback
      const mockResponse = this.getMockResponse(prompt);
      for (const char of mockResponse) {
        onToken(char);
        await new Promise(resolve => setTimeout(resolve, 20));
      }
    }
  }

  private getDefaultSystemPrompt(): string {
    return `You are a warm, empathetic AI assistant for Heirloom, a digital legacy platform. 
Your role is to help users:
1. Write heartfelt letters to loved ones (including time-capsule letters for the future)
2. Create meaningful captions for photos and memories
3. Generate voice recording prompts and story ideas
4. Analyze and classify emotions in their content

Be gentle, supportive, and help users express their deepest feelings. 
Focus on legacy, family connections, gratitude, and preserving meaningful moments.
Keep responses concise but meaningful. Use warm, personal language.`;
  }

  private getMockResponse(prompt: string): string {
    // Provide intelligent fallback responses when Ollama is unavailable
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('letter') || lowerPrompt.includes('write')) {
      return `Here's a heartfelt starting point for your letter:

"My dearest [name],

As I sit down to write this, I'm filled with so many feelings I want to share with you. There are moments in life that shape who we become, and you have been central to so many of mine.

I want you to know how much you mean to me, not just today, but always..."

Would you like me to help you continue with a specific memory or feeling you'd like to express?`;
    }
    
    if (lowerPrompt.includes('caption') || lowerPrompt.includes('photo')) {
      return `Here are some caption ideas for your memory:

✨ "Some moments are too precious for words, but I'll try anyway..."
✨ "This is what happiness looks like in our family."
✨ "A moment I never want to forget."
✨ "The little things that become the big memories."

Which style resonates with you? I can help customize it further.`;
    }
    
    if (lowerPrompt.includes('voice') || lowerPrompt.includes('story') || lowerPrompt.includes('prompt')) {
      return `Here are some voice recording prompts to get you started:

🎙️ "Tell me about a time when you felt truly proud of yourself..."
🎙️ "What's a family tradition you hope continues for generations?"
🎙️ "Describe your favorite childhood memory in detail..."
🎙️ "What advice would you give to your younger self?"

Would you like me to create more prompts around a specific theme?`;
    }
    
    if (lowerPrompt.includes('emotion') || lowerPrompt.includes('feeling') || lowerPrompt.includes('analyze')) {
      return `Based on what you've shared, I sense a mix of emotions:

💛 Primary: Nostalgia - a warm longing for cherished moments
💜 Secondary: Gratitude - appreciation for the people in your life
Sentiment: Deeply positive

This content would resonate well with themes of: family, love, memories, togetherness

Would you like suggestions on how to enhance these emotional elements?`;
    }
    
    return `I'd love to help you with that! As your Heirloom assistant, I can help you:

• Write heartfelt letters to loved ones
• Create meaningful captions for your photos
• Generate voice recording prompts
• Analyze the emotions in your memories

What would you like to explore today?`;
  }

  async analyzeEmotion(text: string): Promise<EmotionAnalysis> {
    const prompt = `Analyze the emotional content of this text and respond in JSON format:
"${text}"

Respond with ONLY valid JSON in this exact format:
{"primary": "emotion", "secondary": "emotion", "confidence": 0.85, "sentiment": "positive", "suggestedTags": ["tag1", "tag2"]}`;

    try {
      const response = await this.generate(prompt, 'You are an emotion analysis AI. Respond only with valid JSON.');
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Emotion analysis error:', e);
    }

    // Fallback emotion analysis
    return {
      primary: 'Joy',
      secondary: 'Nostalgia',
      confidence: 0.75,
      sentiment: 'positive',
      suggestedTags: ['family', 'love', 'memories'],
    };
  }

  async generateWritingSuggestions(
    type: 'letter' | 'caption' | 'voice_prompt',
    context?: string
  ): Promise<WritingSuggestion> {
    const prompts = {
      letter: `Generate 3 heartfelt letter opening lines for someone writing to a loved one. ${context ? `Context: ${context}` : ''} Respond with just the suggestions, numbered 1-3.`,
      caption: `Generate 3 meaningful photo captions that evoke emotion and memory. ${context ? `Context: ${context}` : ''} Respond with just the suggestions, numbered 1-3.`,
      voice_prompt: `Generate 3 thoughtful voice recording prompts that help someone share their life story. ${context ? `Context: ${context}` : ''} Respond with just the prompts, numbered 1-3.`,
    };

    const response = await this.generate(prompts[type]);
    const suggestions = response
      .split(/\d+[\.\)]\s*/)
      .filter(Boolean)
      .map(s => s.trim())
      .slice(0, 3);

    return {
      type,
      suggestions: suggestions.length ? suggestions : this.getDefaultSuggestions(type),
      tone: 'warm and personal',
    };
  }

  private getDefaultSuggestions(type: 'letter' | 'caption' | 'voice_prompt'): string[] {
    const defaults = {
      letter: [
        "My dearest, as I write these words, I'm thinking of all the moments we've shared...",
        "There are some things I've always wanted to tell you, and today feels like the right time...",
        "When you read this letter, I hope you feel how much you mean to me...",
      ],
      caption: [
        "Some moments are too precious for words, but I'll try anyway.",
        "This is what love looks like in our family.",
        "A moment I want to remember forever.",
      ],
      voice_prompt: [
        "Tell me about a time when you felt truly proud of yourself.",
        "What's a family tradition you hope continues for generations?",
        "Describe your favorite childhood memory in detail.",
      ],
    };
    return defaults[type];
  }
}

// AI Assistant Component
const AIAssistant: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  context?: {
    type: 'letter' | 'caption' | 'voice' | 'general';
    existingContent?: string;
    recipient?: string;
  };
  onInsertText?: (text: string) => void;
}> = ({ isOpen, onClose, context, onInsertText }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ollamaService = useRef(new OllamaService());

  // Initialize with context-aware greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = getContextGreeting(context?.type);
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: greeting,
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, context]);

  const getContextGreeting = (type?: string): string => {
    switch (type) {
      case 'letter':
        return `I'm here to help you write a heartfelt letter. ✉️

Would you like me to:
• Suggest opening lines
• Help express a specific feeling
• Write a letter for a special occasion

Who is this letter for?`;
      case 'caption':
        return `Let's create a meaningful caption for your memory! 📸

I can help you:
• Express the emotion of the moment
• Tell the story behind the photo
• Create something poetic or personal

Tell me about this memory.`;
      case 'voice':
        return `I'll help you find the right words for your voice story. 🎙️

I can suggest:
• Prompts to get you started
• Questions to explore your memories
• Ways to structure your story

What topic would you like to talk about?`;
      default:
        return `Hello! I'm your Heirloom writing assistant. ✨

I can help you:
• Write letters to loved ones
• Create captions for memories
• Generate voice recording ideas
• Express your feelings

What would you like to create today?`;
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setStreamingContent('');

    // Build context-aware prompt
    let contextPrompt = '';
    if (context?.type === 'letter' && context.recipient) {
      contextPrompt = `The user is writing a letter to ${context.recipient}. `;
    }
    if (context?.existingContent) {
      contextPrompt += `They have already written: "${context.existingContent.slice(0, 200)}..." `;
    }

    const fullPrompt = contextPrompt + input;

    // Stream response
    let fullResponse = '';
    await ollamaService.current.streamGenerate(fullPrompt, (token) => {
      fullResponse += token;
      setStreamingContent(fullResponse);
    });

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: fullResponse,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMessage]);
    setStreamingContent('');
    setIsLoading(false);
  };

  const handleQuickAction = async (action: string) => {
    setInput(action);
    // Trigger send after a brief delay
    setTimeout(() => {
      const fakeEvent = { key: 'Enter' } as React.KeyboardEvent;
      handleKeyPress(fakeEvent);
    }, 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInsert = (text: string) => {
    if (onInsertText) {
      onInsertText(text);
      onClose();
    }
  };

  // Quick action buttons based on context
  const getQuickActions = () => {
    switch (context?.type) {
      case 'letter':
        return [
          { label: 'Opening lines', prompt: 'Suggest 3 heartfelt opening lines for my letter' },
          { label: 'Express gratitude', prompt: 'Help me express gratitude to someone I love' },
          { label: 'Share a memory', prompt: 'Help me describe a cherished memory' },
        ];
      case 'caption':
        return [
          { label: 'Emotional caption', prompt: 'Create an emotional caption for a family photo' },
          { label: 'Funny caption', prompt: 'Suggest a lighthearted, warm caption' },
          { label: 'Poetic caption', prompt: 'Write a poetic caption about love and time' },
        ];
      case 'voice':
        return [
          { label: 'Childhood stories', prompt: 'Give me prompts about childhood memories' },
          { label: 'Life lessons', prompt: 'Suggest prompts about wisdom and life lessons' },
          { label: 'Family traditions', prompt: 'Give me prompts about family traditions' },
        ];
      default:
        return [
          { label: 'Write a letter', prompt: 'Help me write a letter to my child' },
          { label: 'Photo caption', prompt: 'Create a caption for a precious memory' },
          { label: 'Voice ideas', prompt: 'Suggest topics for my voice recording' },
        ];
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-void-deep/80 backdrop-blur-sm z-50"
          />

          {/* Assistant Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-void-light border-l border-gold/20 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-gold/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-gold-dim flex items-center justify-center">
                  <span className="text-xl">✨</span>
                </div>
                <div>
                  <h3 className="text-paper font-display text-lg">Writing Assistant</h3>
                  <p className="text-paper/40 text-xs">Powered by local AI</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-paper/60 hover:text-paper transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Quick Actions */}
            <div className="p-3 border-b border-gold/10 flex gap-2 overflow-x-auto">
              {getQuickActions().map((action, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickAction(action.prompt)}
                  className="px-3 py-1.5 text-xs bg-gold/10 text-gold rounded-full whitespace-nowrap hover:bg-gold/20 transition-colors"
                >
                  {action.label}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-gold/20 text-paper'
                        : 'bg-void border border-gold/10 text-paper/90'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    
                    {/* Insert button for assistant messages */}
                    {message.role === 'assistant' && onInsertText && (
                      <button
                        onClick={() => handleInsert(message.content)}
                        className="mt-2 text-xs text-gold/70 hover:text-gold flex items-center gap-1"
                      >
                        <span>↗</span> Insert into editor
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Streaming response */}
              {streamingContent && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-void border border-gold/10 text-paper/90">
                    <p className="text-sm whitespace-pre-wrap">{streamingContent}</p>
                    <span className="inline-block w-2 h-4 bg-gold/50 animate-pulse ml-1" />
                  </div>
                </motion.div>
              )}

              {/* Loading indicator */}
              {isLoading && !streamingContent && (
                <div className="flex justify-start">
                  <div className="bg-void border border-gold/10 rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gold/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-gold/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-gold/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gold/20">
              <div className="flex gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  rows={2}
                  className="flex-1 bg-void border border-gold/20 rounded-xl px-4 py-3 text-paper placeholder-paper/30 resize-none focus:outline-none focus:border-gold/50 text-sm"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className={`px-4 rounded-xl transition-all ${
                    input.trim() && !isLoading
                      ? 'bg-gold text-void-deep hover:bg-gold-bright'
                      : 'bg-gold/20 text-paper/30'
                  }`}
                >
                  ↑
                </button>
              </div>
              <p className="text-xs text-paper/30 mt-2 text-center">
                AI runs locally on your device • Your data stays private
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Hook for using the AI assistant
export const useAIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [context, setContext] = useState<{
    type: 'letter' | 'caption' | 'voice' | 'general';
    existingContent?: string;
    recipient?: string;
  }>({ type: 'general' });

  const openAssistant = (ctx?: typeof context) => {
    if (ctx) setContext(ctx);
    setIsOpen(true);
  };

  const closeAssistant = () => {
    setIsOpen(false);
  };

  return {
    isOpen,
    context,
    openAssistant,
    closeAssistant,
    AIAssistant: (props: { onInsertText?: (text: string) => void }) => (
      <AIAssistant
        isOpen={isOpen}
        onClose={closeAssistant}
        context={context}
        onInsertText={props.onInsertText}
      />
    ),
  };
};

// Emotion classifier utility
export const classifyEmotion = async (text: string): Promise<EmotionAnalysis> => {
  const service = new OllamaService();
  return service.analyzeEmotion(text);
};

// Writing suggestions utility
export const getWritingSuggestions = async (
  type: 'letter' | 'caption' | 'voice_prompt',
  context?: string
): Promise<WritingSuggestion> => {
  const service = new OllamaService();
  return service.generateWritingSuggestions(type, context);
};

export default AIAssistant;

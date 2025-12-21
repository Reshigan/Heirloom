import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { lettersApi, aiApi } from '../services/api';

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

// AI Service using backend Cloudflare Workers AI
class AIService {
  async generateSuggestion(prompt: string, context?: { type?: string; existingContent?: string; recipientNames?: string }): Promise<string> {
    try {
      // Use the letters AI suggest endpoint for letter-related queries
      if (context?.type === 'letter' || prompt.toLowerCase().includes('letter') || prompt.toLowerCase().includes('write')) {
        const { data } = await lettersApi.aiSuggest({
          body: context?.existingContent,
          recipientNames: context?.recipientNames,
        });
        if (data.suggestion) {
          return data.suggestion;
        }
      }
      
      // For voice/prompt related queries, get AI-generated prompts
      if (prompt.toLowerCase().includes('voice') || prompt.toLowerCase().includes('prompt') || prompt.toLowerCase().includes('recording')) {
        const { data } = await aiApi.getPrompts(3);
        if (data.prompts && data.prompts.length > 0) {
          return `Here are some AI-generated prompts for you:\n\n${data.prompts.map((p: { prompt: string }, i: number) => `${i + 1}. "${p.prompt}"`).join('\n\n')}\n\nWould you like more prompts or something specific?`;
        }
      }
      
      // For general queries, get a single AI prompt
      const { data } = await aiApi.getPrompt();
      if (data.prompt) {
        return `Here's a thought to inspire you:\n\n"${data.prompt}"\n\nWould you like me to help with something specific?`;
      }
      
      return 'I\'m here to help you capture your memories and write heartfelt messages. What would you like to create today?';
    } catch (error) {
      // Return a helpful message when AI is unavailable
      return 'AI assistance is temporarily unavailable. Please try again in a moment.';
    }
  }

  async streamGenerate(
    prompt: string,
    onToken: (token: string) => void,
    context?: { type?: string; existingContent?: string; recipientNames?: string }
  ): Promise<void> {
    // Get the full response first, then stream it character by character for UX
    const response = await this.generateSuggestion(prompt, context);
    
    // Stream the response character by character for a typing effect
    for (const char of response) {
      onToken(char);
      await new Promise(resolve => setTimeout(resolve, 15));
    }
  }

  async analyzeEmotion(text: string): Promise<EmotionAnalysis> {
    try {
      // Use the letters AI suggest endpoint which includes emotion analysis
      const { data } = await lettersApi.aiSuggest({ body: text });
      
      if (data.emotion) {
        return {
          primary: data.emotion,
          secondary: 'Reflective',
          confidence: data.confidence || 0.8,
          sentiment: this.getSentimentFromEmotion(data.emotion),
          suggestedTags: this.getTagsFromEmotion(data.emotion),
        };
      }
    } catch (error) {
      // Emotion analysis unavailable
    }

    // Return neutral analysis when unavailable
    return {
      primary: 'Reflective',
      secondary: 'Thoughtful',
      confidence: 0.5,
      sentiment: 'neutral',
      suggestedTags: ['memory', 'reflection'],
    };
  }

  private getSentimentFromEmotion(emotion: string): 'positive' | 'neutral' | 'negative' {
    const positiveEmotions = ['joyful', 'grateful', 'loving', 'proud', 'hopeful', 'peaceful'];
    const negativeEmotions = ['sad', 'bittersweet'];
    
    if (positiveEmotions.includes(emotion.toLowerCase())) return 'positive';
    if (negativeEmotions.includes(emotion.toLowerCase())) return 'negative';
    return 'neutral';
  }

  private getTagsFromEmotion(emotion: string): string[] {
    const emotionTags: Record<string, string[]> = {
      joyful: ['happiness', 'celebration', 'joy'],
      nostalgic: ['memories', 'past', 'reflection'],
      grateful: ['gratitude', 'appreciation', 'thankful'],
      loving: ['love', 'family', 'connection'],
      bittersweet: ['memories', 'change', 'growth'],
      sad: ['comfort', 'support', 'healing'],
      reflective: ['wisdom', 'insight', 'growth'],
      proud: ['achievement', 'growth', 'success'],
      peaceful: ['calm', 'serenity', 'contentment'],
      hopeful: ['future', 'dreams', 'optimism'],
    };
    
    return emotionTags[emotion.toLowerCase()] || ['memory', 'reflection'];
  }

  async generateWritingSuggestions(
    type: 'letter' | 'caption' | 'voice_prompt',
    context?: string
  ): Promise<WritingSuggestion> {
    try {
      if (type === 'letter') {
        const { data } = await lettersApi.aiSuggest({ body: context });
        if (data.suggestion) {
          return {
            type,
            suggestions: [data.suggestion],
            tone: 'warm and personal',
          };
        }
      }
      
      if (type === 'voice_prompt') {
        const { data } = await aiApi.getPrompts(3);
        if (data.prompts && data.prompts.length > 0) {
          return {
            type,
            suggestions: data.prompts.map((p: { prompt: string }) => p.prompt),
            tone: 'warm and personal',
          };
        }
      }
      
      // For captions, use a single AI prompt
      const { data } = await aiApi.getPrompt();
      return {
        type,
        suggestions: data.prompt ? [data.prompt] : [],
        tone: 'warm and personal',
      };
    } catch (error) {
      return {
        type,
        suggestions: [],
        tone: 'warm and personal',
      };
    }
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
  const aiService = useRef(new AIService());

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
    await aiService.current.streamGenerate(fullPrompt, (token: string) => {
      fullResponse += token;
      setStreamingContent(fullResponse);
    }, { type: context?.type, existingContent: context?.existingContent });

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

    // Quick action buttons based on context - expanded with more options
    const getQuickActions = () => {
      switch (context?.type) {
        case 'letter':
          return [
            { label: 'Opening lines', prompt: 'Suggest 3 heartfelt opening lines for my letter' },
            { label: 'Express gratitude', prompt: 'Help me express gratitude to someone I love' },
            { label: 'Share a memory', prompt: 'Help me describe a cherished memory' },
            { label: 'Life advice', prompt: 'Help me share important life advice' },
            { label: 'Closing thoughts', prompt: 'Suggest 3 meaningful ways to close my letter' },
          ];
        case 'caption':
          return [
            { label: 'Emotional caption', prompt: 'Create 3 emotional captions for a family photo' },
            { label: 'Funny caption', prompt: 'Suggest 3 lighthearted, warm captions' },
            { label: 'Poetic caption', prompt: 'Write 3 poetic captions about love and time' },
            { label: 'Short & sweet', prompt: 'Give me 3 short but meaningful captions' },
          ];
        case 'voice':
          return [
            { label: 'Childhood stories', prompt: 'Give me 3 prompts about childhood memories' },
            { label: 'Life lessons', prompt: 'Suggest 3 prompts about wisdom and life lessons' },
            { label: 'Family traditions', prompt: 'Give me 3 prompts about family traditions' },
            { label: 'Future hopes', prompt: 'Suggest 3 prompts about hopes for the future' },
            { label: 'Favorite moments', prompt: 'Give me 3 prompts about favorite family moments' },
          ];
        default:
          return [
            { label: 'Write a letter', prompt: 'Help me write a letter to my child' },
            { label: 'Photo caption', prompt: 'Create 3 captions for a precious memory' },
            { label: 'Voice ideas', prompt: 'Suggest 3 topics for my voice recording' },
            { label: 'Express love', prompt: 'Help me express my love in 3 different ways' },
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
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-void-elevated border-l border-gold/20 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-gold/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-gold-dim flex items-center justify-center">
                  <span className="text-xl">✨</span>
                </div>
                <div>
                  <h3 className="text-paper font-display text-lg">Writing Assistant</h3>
                  <p className="text-paper/40 text-xs">Powered by Heirloom AI</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-paper/60 hover:text-paper transition-colors"
              >
                ✕
              </button>
            </div>

                        {/* Quick Actions - Try different suggestions */}
                        <div className="p-3 border-b border-gold/10">
                          <p className="text-xs text-paper/40 mb-2">Try a suggestion:</p>
                          <div className="flex flex-wrap gap-2">
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
                              Powered by Heirloom AI • Your data is encrypted
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
  const service = new AIService();
  return service.analyzeEmotion(text);
};

// Writing suggestions utility
export const getWritingSuggestions = async (
  type: 'letter' | 'caption' | 'voice_prompt',
  context?: string
): Promise<WritingSuggestion> => {
  const service = new AIService();
  return service.generateWritingSuggestions(type, context);
};

export default AIAssistant;

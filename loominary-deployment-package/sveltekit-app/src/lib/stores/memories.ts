import { writable, derived } from 'svelte/store';
import { api } from '$lib/api';

interface Memory {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'photo' | 'video' | 'audio';
  mediaUrl?: string;
  thumbnail?: string;
  duration?: number;
  tags: string[];
  isPublic: boolean;
  isShared: boolean;
  familyId?: string;
  authorId: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  aiStory?: {
    id: string;
    content: string;
    style: string;
    generatedAt: string;
  };
  aiInsights?: {
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
    themes: string[];
    suggestedTags: string[];
    similarMemories: string[];
  };
  metadata?: {
    location?: string;
    date?: string;
    camera?: string;
    weather?: string;
    mood?: string;
  };
  shareSettings?: {
    allowComments: boolean;
    allowSharing: boolean;
    allowDownload: boolean;
  };
}

interface MemoriesState {
  memories: Memory[];
  currentMemory: Memory | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    type?: string;
    tags?: string[];
    search?: string;
    startDate?: string;
    endDate?: string;
    familyId?: string;
  };
  analytics: {
    totalMemories: number;
    memoryTypes: Record<string, number>;
    monthlyStats: Array<{ month: string; count: number }>;
    topTags: Array<{ tag: string; count: number }>;
    engagementStats: {
      totalViews: number;
      totalLikes: number;
      totalComments: number;
      totalShares: number;
    };
  } | null;
}

const initialState: MemoriesState = {
  memories: [],
  currentMemory: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  },
  filters: {},
  analytics: null
};

function createMemoriesStore() {
  const { subscribe, set, update } = writable<MemoriesState>(initialState);

  return {
    subscribe,

    async loadMemories(params?: {
      page?: number;
      limit?: number;
      type?: string;
      tags?: string[];
      search?: string;
      startDate?: string;
      endDate?: string;
      familyId?: string;
    }) {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        const response = await api.getMemories(params);
        
        update(state => ({
          ...state,
          memories: response.memories,
          pagination: response.pagination,
          filters: params || {},
          loading: false
        }));

        return response;
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || 'Failed to load memories';
        update(state => ({
          ...state,
          loading: false,
          error: errorMessage
        }));
        throw error;
      }
    },

    async loadMoreMemories() {
      let currentState: MemoriesState;
      const unsubscribe = subscribe(state => {
        currentState = state;
        unsubscribe();
      });

      if (currentState!.pagination.page >= currentState!.pagination.totalPages) {
        return; // No more pages to load
      }

      const nextPage = currentState!.pagination.page + 1;
      
      try {
        const response = await api.getMemories({
          ...currentState!.filters,
          page: nextPage,
          limit: currentState!.pagination.limit
        });

        update(state => ({
          ...state,
          memories: [...state.memories, ...response.memories],
          pagination: response.pagination
        }));

        return response;
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || 'Failed to load more memories';
        update(state => ({
          ...state,
          error: errorMessage
        }));
        throw error;
      }
    },

    async getMemory(id: string, includeAI = false) {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        const memory = await api.getMemory(id, includeAI);
        
        update(state => ({
          ...state,
          currentMemory: memory,
          loading: false
        }));

        return memory;
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || 'Failed to load memory';
        update(state => ({
          ...state,
          loading: false,
          error: errorMessage
        }));
        throw error;
      }
    },

    async createMemory(memoryData: {
      title: string;
      content: string;
      type: 'text' | 'photo' | 'video' | 'audio';
      mediaUrl?: string;
      tags?: string[];
      isPublic?: boolean;
      familyId?: string;
      generateAIStory?: boolean;
      metadata?: any;
    }) {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        const memory = await api.createMemory(memoryData);
        
        update(state => ({
          ...state,
          memories: [memory, ...state.memories],
          loading: false
        }));

        return memory;
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || 'Failed to create memory';
        update(state => ({
          ...state,
          loading: false,
          error: errorMessage
        }));
        throw error;
      }
    },

    async updateMemory(id: string, updates: Partial<Memory>) {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        const updatedMemory = await api.updateMemory(id, updates);
        
        update(state => ({
          ...state,
          memories: state.memories.map(memory => 
            memory.id === id ? updatedMemory : memory
          ),
          currentMemory: state.currentMemory?.id === id ? updatedMemory : state.currentMemory,
          loading: false
        }));

        return updatedMemory;
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || 'Failed to update memory';
        update(state => ({
          ...state,
          loading: false,
          error: errorMessage
        }));
        throw error;
      }
    },

    async deleteMemory(id: string) {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        await api.deleteMemory(id);
        
        update(state => ({
          ...state,
          memories: state.memories.filter(memory => memory.id !== id),
          currentMemory: state.currentMemory?.id === id ? null : state.currentMemory,
          loading: false
        }));
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || 'Failed to delete memory';
        update(state => ({
          ...state,
          loading: false,
          error: errorMessage
        }));
        throw error;
      }
    },

    async searchMemories(query: string, filters?: any) {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        const response = await api.searchMemories(query, filters);
        
        update(state => ({
          ...state,
          memories: response.memories,
          pagination: response.pagination,
          filters: { search: query, ...filters },
          loading: false
        }));

        return response;
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || 'Search failed';
        update(state => ({
          ...state,
          loading: false,
          error: errorMessage
        }));
        throw error;
      }
    },

    async generateAIStory(memoryId: string, options: {
      style?: string;
      length?: string;
      customPrompt?: string;
    }) {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        const story = await api.generateAIStory(memoryId, options);
        
        update(state => ({
          ...state,
          memories: state.memories.map(memory => 
            memory.id === memoryId ? { ...memory, aiStory: story } : memory
          ),
          currentMemory: state.currentMemory?.id === memoryId 
            ? { ...state.currentMemory, aiStory: story }
            : state.currentMemory,
          loading: false
        }));

        return story;
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || 'AI story generation failed';
        update(state => ({
          ...state,
          loading: false,
          error: errorMessage
        }));
        throw error;
      }
    },

    async analyzeSentiment(memoryId: string) {
      try {
        const analysis = await api.analyzeSentiment(memoryId);
        
        update(state => ({
          ...state,
          memories: state.memories.map(memory => 
            memory.id === memoryId 
              ? { 
                  ...memory, 
                  aiInsights: { 
                    ...memory.aiInsights, 
                    sentiment: analysis.sentiment,
                    confidence: analysis.confidence
                  } 
                }
              : memory
          ),
          currentMemory: state.currentMemory?.id === memoryId 
            ? { 
                ...state.currentMemory, 
                aiInsights: { 
                  ...state.currentMemory.aiInsights, 
                  sentiment: analysis.sentiment,
                  confidence: analysis.confidence
                } 
              }
            : state.currentMemory
        }));

        return analysis;
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || 'Sentiment analysis failed';
        update(state => ({ ...state, error: errorMessage }));
        throw error;
      }
    },

    async suggestTags(memoryId: string) {
      try {
        const tags = await api.suggestTags(memoryId);
        
        update(state => ({
          ...state,
          memories: state.memories.map(memory => 
            memory.id === memoryId 
              ? { 
                  ...memory, 
                  aiInsights: { 
                    ...memory.aiInsights, 
                    suggestedTags: tags
                  } 
                }
              : memory
          ),
          currentMemory: state.currentMemory?.id === memoryId 
            ? { 
                ...state.currentMemory, 
                aiInsights: { 
                  ...state.currentMemory.aiInsights, 
                  suggestedTags: tags
                } 
              }
            : state.currentMemory
        }));

        return tags;
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || 'Tag suggestion failed';
        update(state => ({ ...state, error: errorMessage }));
        throw error;
      }
    },

    async findSimilarMemories(memoryId: string, limit = 5) {
      try {
        const similarMemories = await api.findSimilarMemories(memoryId, limit);
        
        update(state => ({
          ...state,
          memories: state.memories.map(memory => 
            memory.id === memoryId 
              ? { 
                  ...memory, 
                  aiInsights: { 
                    ...memory.aiInsights, 
                    similarMemories: similarMemories.map((m: any) => m.id)
                  } 
                }
              : memory
          ),
          currentMemory: state.currentMemory?.id === memoryId 
            ? { 
                ...state.currentMemory, 
                aiInsights: { 
                  ...state.currentMemory.aiInsights, 
                  similarMemories: similarMemories.map((m: any) => m.id)
                } 
              }
            : state.currentMemory
        }));

        return similarMemories;
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || 'Similar memories search failed';
        update(state => ({ ...state, error: errorMessage }));
        throw error;
      }
    },

    async loadAnalytics() {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        const analytics = await api.getMemoryAnalytics();
        
        update(state => ({
          ...state,
          analytics,
          loading: false
        }));

        return analytics;
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || 'Failed to load analytics';
        update(state => ({
          ...state,
          loading: false,
          error: errorMessage
        }));
        throw error;
      }
    },

    // Utility methods
    getMemoryById(id: string) {
      return derived(
        { subscribe },
        ($state) => $state.memories.find(memory => memory.id === id) || null
      );
    },

    getMemoriesByType(type: string) {
      return derived(
        { subscribe },
        ($state) => $state.memories.filter(memory => memory.type === type)
      );
    },

    getMemoriesByTag(tag: string) {
      return derived(
        { subscribe },
        ($state) => $state.memories.filter(memory => memory.tags.includes(tag))
      );
    },

    getRecentMemories(limit = 10) {
      return derived(
        { subscribe },
        ($state) => $state.memories
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, limit)
      );
    },

    getPopularMemories(limit = 10) {
      return derived(
        { subscribe },
        ($state) => $state.memories
          .sort((a, b) => (b.viewCount + b.likeCount) - (a.viewCount + a.likeCount))
          .slice(0, limit)
      );
    },

    clearError() {
      update(state => ({ ...state, error: null }));
    },

    reset() {
      set(initialState);
    }
  };
}

export const memoriesStore = createMemoriesStore();
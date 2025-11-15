const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface User {
  id: string
  email: string
  name: string
  family_id?: string
  family_name?: string
  created_at: string
}

export interface Memory {
  id: string
  title: string
  description: string
  date: string
  location: string
  type: 'photo' | 'video' | 'document' | 'audio' | 'story'
  significance: 'low' | 'medium' | 'high' | 'milestone'
  participants: string[]
  tags: string[]
  thumbnail?: string
  ai_enhanced: boolean
  is_vault: boolean
  family_id: string
  created_by: string
  created_at: string
}

export interface Comment {
  id: string
  memory_id: string
  user_id: string
  user_name: string
  content: string
  timestamp: string
  reactions: Array<{ type: string; user_id: string; user_name: string }>
  replies: Comment[]
}

export interface Story {
  id: string
  title: string
  transcript: string
  duration: number
  date: string
  location: string
  participants: string[]
  tags: string[]
  audio_url?: string
  family_id: string
  created_by: string
  created_at: string
}

export interface Highlight {
  id: string
  title: string
  description: string
  memory_ids: string[]
  unlock_date?: string
  is_time_capsule: boolean
  family_id: string
  created_at: string
}

class ApiClient {
  private token: string | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('heirloom:auth:token')
    }
  }

  setToken(token: string) {
    this.token = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('heirloom:auth:token', token)
    }
  }

  clearToken() {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('heirloom:auth:token')
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }))
      throw new Error(error.detail || `HTTP ${response.status}`)
    }

    return response.json()
  }

  async register(email: string, password: string, name: string, family_name: string): Promise<User> {
    return this.request<User>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, family_name }),
    })
  }

  async login(email: string, password: string): Promise<{ access_token: string; token_type: string; user: User }> {
    const response = await this.request<{ access_token: string; token_type: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    this.setToken(response.access_token)
    return response
  }

  async getMe(): Promise<User> {
    return this.request<User>('/api/auth/me')
  }

  async getMemories(): Promise<Memory[]> {
    return this.request<Memory[]>('/api/memories')
  }

  async createMemory(memory: Partial<Memory>): Promise<Memory> {
    return this.request<Memory>('/api/memories', {
      method: 'POST',
      body: JSON.stringify(memory),
    })
  }

  async getMemory(id: string): Promise<Memory> {
    return this.request<Memory>(`/api/memories/${id}`)
  }

  async updateMemory(id: string, memory: Partial<Memory>): Promise<Memory> {
    return this.request<Memory>(`/api/memories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(memory),
    })
  }

  async deleteMemory(id: string): Promise<void> {
    await this.request<void>(`/api/memories/${id}`, {
      method: 'DELETE',
    })
  }

  async getComments(memoryId: string): Promise<Comment[]> {
    return this.request<Comment[]>(`/api/memories/${memoryId}/comments`)
  }

  async createComment(memoryId: string, content: string, reply_to?: string): Promise<Comment> {
    return this.request<Comment>(`/api/memories/${memoryId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, reply_to }),
    })
  }

  async deleteComment(commentId: string): Promise<void> {
    await this.request<void>(`/api/comments/${commentId}`, {
      method: 'DELETE',
    })
  }

  async addReaction(commentId: string, type: string): Promise<void> {
    await this.request<void>(`/api/comments/${commentId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ type }),
    })
  }

  async getStories(): Promise<Story[]> {
    return this.request<Story[]>('/api/stories')
  }

  async createStory(story: Partial<Story>): Promise<Story> {
    return this.request<Story>('/api/stories', {
      method: 'POST',
      body: JSON.stringify(story),
    })
  }

  async getHighlights(): Promise<Highlight[]> {
    return this.request<Highlight[]>('/api/highlights')
  }

  async createHighlight(highlight: Partial<Highlight>): Promise<Highlight> {
    return this.request<Highlight>('/api/highlights', {
      method: 'POST',
      body: JSON.stringify(highlight),
    })
  }

  async search(query: string): Promise<{ results: Array<{ id: string; title: string; type: string; date: string }> }> {
    return this.request<{ results: Array<{ id: string; title: string; type: string; date: string }> }>(`/api/search?q=${encodeURIComponent(query)}`)
  }

  async presignUpload(filename: string, contentType: string): Promise<{ upload_id: string; url: string; method: string; fields: any }> {
    return this.request<{ upload_id: string; url: string; method: string; fields: any }>(`/api/uploads/presign?filename=${encodeURIComponent(filename)}&content_type=${encodeURIComponent(contentType)}`)
  }

  async uploadFile(uploadId: string, file: File): Promise<{ upload_id: string; filename: string; size: number; encrypted: boolean; url: string }> {
    const formData = new FormData()
    formData.append('file', file)

    const headers: HeadersInit = {}
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(`${API_BASE_URL}/api/uploads/${uploadId}`, {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Upload failed')
    }

    return response.json()
  }
}

export const apiClient = new ApiClient()

const RAW_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, '').replace(/\/api$/, '')

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

export interface TimeCapsule {
  id: string
  title: string
  message: string
  memory_ids: string[]
  unlock_date: string
  is_locked: boolean
  recipients: string[]
  family_id: string
  created_by: string
  created_at: string
}

export interface ImportJob {
  import_id: string
  total: number
  processed: number
  duplicates: number
  imported: number
  status: string
}

export interface DigestItem {
  id: string
  type: string
  title: string
  description: string
  timestamp: string
  icon: string
  color: string
}

export interface NotificationSettings {
  weekly_digest: boolean
  daily_reminders: boolean
  new_comments: boolean
  new_memories: boolean
  birthdays: boolean
  anniversaries: boolean
  story_prompts: boolean
  family_activity: boolean
  email_notifications: boolean
  push_notifications: boolean
}

export interface Subscription {
  plan: string
  status: string
  cancel_at?: string
  current_period_end?: string
}

export interface UserProfile {
  user: User
  subscription: Subscription
  notification_settings: NotificationSettings
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

  async getMe(): Promise<UserProfile> {
    return this.request<UserProfile>('/api/auth/me')
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

  async search(query: string, filters?: {
    people?: string[]
    locations?: string[]
    types?: string[]
    tags?: string[]
    date_start?: string
    date_end?: string
  }): Promise<{ results: Memory[] }> {
    const params = new URLSearchParams()
    if (query) params.append('q', query)
    if (filters?.people?.length) params.append('people', filters.people.join(','))
    if (filters?.locations?.length) params.append('locations', filters.locations.join(','))
    if (filters?.types?.length) params.append('types', filters.types.join(','))
    if (filters?.tags?.length) params.append('tags', filters.tags.join(','))
    if (filters?.date_start) params.append('date_start', filters.date_start)
    if (filters?.date_end) params.append('date_end', filters.date_end)
    
    return this.request<{ results: Memory[] }>(`/api/search?${params.toString()}`)
  }

  async getTimeCapsules(): Promise<TimeCapsule[]> {
    return this.request<TimeCapsule[]>('/api/time-capsules')
  }

  async createTimeCapsule(capsule: {
    title: string
    message: string
    memory_ids: string[]
    unlock_date: string
    recipients?: string[]
  }): Promise<TimeCapsule> {
    return this.request<TimeCapsule>('/api/time-capsules', {
      method: 'POST',
      body: JSON.stringify(capsule),
    })
  }

  async unlockTimeCapsule(capsuleId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/time-capsules/${capsuleId}/unlock`, {
      method: 'POST',
    })
  }

  async startImport(source: string, settings: any): Promise<{ import_id: string; status: string }> {
    return this.request<{ import_id: string; status: string }>('/api/imports/start', {
      method: 'POST',
      body: JSON.stringify({ source, settings }),
    })
  }

  async getImportStatus(importId: string): Promise<ImportJob> {
    return this.request<ImportJob>(`/api/imports/${importId}/status`)
  }

  async uploadImportFiles(importId: string, files: File[]): Promise<{ message: string }> {
    const formData = new FormData()
    files.forEach(file => formData.append('files', file))

    const headers: HeadersInit = {}
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(`${API_BASE_URL}/api/imports/${importId}/files`, {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Upload failed')
    }

    return response.json()
  }

  async getWeeklyDigest(): Promise<{ items: DigestItem[]; stats: any; period: string }> {
    return this.request<{ items: DigestItem[]; stats: any; period: string }>('/api/digest/weekly')
  }

  async getNotificationSettings(): Promise<NotificationSettings> {
    return this.request<NotificationSettings>('/api/user/notification-settings')
  }

  async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    return this.request<NotificationSettings>('/api/user/notification-settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    })
  }

  async getUserProfile(): Promise<UserProfile> {
    return this.request<UserProfile>('/api/user/profile')
  }

  async createCheckoutSession(plan: string): Promise<{ session_url: string; session_id: string }> {
    return this.request<{ session_url: string; session_id: string }>(`/api/billing/create-checkout-session?plan=${encodeURIComponent(plan)}`, {
      method: 'POST',
    })
  }

  async createPortalSession(): Promise<{ portal_url: string; session_id: string }> {
    return this.request<{ portal_url: string; session_id: string }>('/api/billing/create-portal-session', {
      method: 'POST',
    })
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

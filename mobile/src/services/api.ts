import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'https://api.heirloom.blue/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  signup: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    const response = await api.post('/auth/signup', data);
    return response.data;
  },
  
  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  
  updateProfile: async (data: Partial<{
    firstName: string;
    lastName: string;
    profilePicture: string;
  }>) => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },
  
  logout: async () => {
    await SecureStore.deleteItemAsync('authToken');
  },
};

// Memories API
export const memoriesApi = {
  getAll: async () => {
    const response = await api.get('/memories');
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/memories/${id}`);
    return response.data;
  },
  
  create: async (data: {
    title: string;
    description?: string;
    emotion?: string;
    tags?: string[];
  }) => {
    const response = await api.post('/memories', data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<{
    title: string;
    description: string;
    emotion: string;
    tags: string[];
  }>) => {
    const response = await api.put(`/memories/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/memories/${id}`);
    return response.data;
  },
  
  uploadImage: async (memoryId: string, imageUri: string) => {
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'memory.jpg',
    } as any);
    
    const response = await api.post(`/memories/${memoryId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// Voice Recordings API
export const voiceApi = {
  getAll: async () => {
    const response = await api.get('/voice');
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/voice/${id}`);
    return response.data;
  },
  
  create: async (data: {
    title: string;
    description?: string;
  }) => {
    const response = await api.post('/voice', data);
    return response.data;
  },
  
  uploadAudio: async (recordingId: string, audioUri: string) => {
    const formData = new FormData();
    formData.append('file', {
      uri: audioUri,
      type: 'audio/mp3',
      name: 'recording.mp3',
    } as any);
    
    const response = await api.post(`/voice/${recordingId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/voice/${id}`);
    return response.data;
  },
};

// Letters API
export const lettersApi = {
  getAll: async () => {
    const response = await api.get('/letters');
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/letters/${id}`);
    return response.data;
  },
  
  create: async (data: {
    title: string;
    body: string;
    recipientName?: string;
    recipientEmail?: string;
    deliveryDate?: string;
  }) => {
    const response = await api.post('/letters', data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<{
    title: string;
    body: string;
    recipientName: string;
    recipientEmail: string;
    deliveryDate: string;
  }>) => {
    const response = await api.put(`/letters/${id}`, data);
    return response.data;
  },
  
  seal: async (id: string) => {
    const response = await api.post(`/letters/${id}/seal`);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/letters/${id}`);
    return response.data;
  },
};

// Family API
export const familyApi = {
  getAll: async () => {
    const response = await api.get('/family');
    return response.data;
  },
  
  add: async (data: {
    name: string;
    relationship: string;
    email?: string;
  }) => {
    const response = await api.post('/family', data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<{
    name: string;
    relationship: string;
    email: string;
  }>) => {
    const response = await api.put(`/family/${id}`, data);
    return response.data;
  },
  
  remove: async (id: string) => {
    const response = await api.delete(`/family/${id}`);
    return response.data;
  },
};

// Legacy Score API
export const legacyApi = {
  getScore: async () => {
    const response = await api.get('/legacy/score');
    return response.data;
  },
};

export default api;

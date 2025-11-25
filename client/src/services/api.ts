import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (name: string, email: string, password: string) =>
    api.post('/auth/register', { name, email, password }),
  
  me: () => api.get('/auth/me'),
  
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
}

// Campaign API
export const campaignApi = {
  list: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
    api.get('/campaigns', { params }),
  
  get: (id: string) => api.get(`/campaigns/${id}`),
  
  create: (data: { title: string; description?: string; visibility?: string }) =>
    api.post('/campaigns', data),
  
  update: (id: string, data: Partial<{
    title: string;
    description: string;
    status: string;
    visibility: string;
    allowManagerViewRespondentDetails: boolean;
  }>) => api.patch(`/campaigns/${id}`, data),
  
  delete: (id: string) => api.delete(`/campaigns/${id}`),
  
  publish: (id: string) => api.post(`/campaigns/${id}/publish`),
  
  close: (id: string) => api.post(`/campaigns/${id}/close`),
  
  getPublic: (link: string) => api.get(`/campaigns/public/${link}`),
  
  analytics: (id: string) => api.get(`/campaigns/${id}/analytics`),
}

// Question API
export const questionApi = {
  list: (campaignId: string) => api.get(`/campaigns/${campaignId}/questions`),
  
  create: (campaignId: string, data: {
    questionText: string;
    type: string;
    options?: Record<string, unknown>;
    required?: boolean;
    order?: number;
  }) => api.post(`/campaigns/${campaignId}/questions`, data),
  
  update: (campaignId: string, questionId: string, data: Partial<{
    questionText: string;
    type: string;
    options: Record<string, unknown>;
    required: boolean;
    order: number;
  }>) => api.patch(`/campaigns/${campaignId}/questions/${questionId}`, data),
  
  delete: (campaignId: string, questionId: string) =>
    api.delete(`/campaigns/${campaignId}/questions/${questionId}`),
  
  reorder: (campaignId: string, orders: { id: string; order: number }[]) =>
    api.post(`/campaigns/${campaignId}/questions/reorder`, { orders }),
}

// Response API
export const responseApi = {
  list: (campaignId: string, params?: { page?: number; limit?: number; includeDetails?: boolean }) =>
    api.get(`/campaigns/${campaignId}/responses`, { params }),
  
  get: (campaignId: string, responseId: string) =>
    api.get(`/campaigns/${campaignId}/responses/${responseId}`),
  
  submit: (campaignId: string, data: {
    answers: { questionId: string; answer: unknown }[];
    identifiableFields?: { name?: string; email?: string; phone?: string };
    consentGiven?: boolean;
  }) => api.post(`/campaigns/${campaignId}/responses`, data),
  
  delete: (campaignId: string, responseId: string) =>
    api.delete(`/campaigns/${campaignId}/responses/${responseId}`),
}

// Manager API
export const managerApi = {
  list: (campaignId: string) => api.get(`/campaigns/${campaignId}/managers`),
  
  invite: (campaignId: string, data: { email: string; permissions: string[] }) =>
    api.post(`/campaigns/${campaignId}/managers`, data),
  
  update: (campaignId: string, managerId: string, data: { permissions: string[] }) =>
    api.patch(`/campaigns/${campaignId}/managers/${managerId}`, data),
  
  remove: (campaignId: string, managerId: string) =>
    api.delete(`/campaigns/${campaignId}/managers/${managerId}`),
  
  accept: (campaignId: string) =>
    api.post(`/campaigns/${campaignId}/managers/accept`),
  
  pendingInvitations: () => api.get('/users/invitations'),
}

// Export API
export const exportApi = {
  generate: (campaignId: string, format: 'csv' | 'json' = 'csv') =>
    api.post(`/campaigns/${campaignId}/exports`, null, { params: { format } }),
  
  list: (campaignId: string, params?: { page?: number; limit?: number }) =>
    api.get(`/campaigns/${campaignId}/exports`, { params }),
  
  get: (exportId: string) => api.get(`/exports/${exportId}`),
}

// AI API
export const aiApi = {
  generateQuestions: (data: { topic: string; numberOfQuestions?: number; questionTypes?: string[] }) =>
    api.post('/ai/generate-questions', data),
  
  generateDescription: (title: string) =>
    api.post('/ai/generate-description', { title }),
}

export default api

import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('auth_token');
    }
    console.error('API Error:', err.response?.data || err.message);
    return Promise.reject(err.response?.data || err);
  }
);

export const chatApi = {
  getChats: () => api.get('/chats'),
  getMessages: (chatId) => api.get(`/messages/${chatId}`),
  sendMessage: (chatId, content) => api.post('/messages', { chatId, content }),
  assignAgent: (chatId, agentId) => api.patch(`/chats/${chatId}/assign`, { agentId }),
};

export const contactApi = {
  getContacts: (params) => api.get('/contacts', { params }),
  getContact: (id) => api.get(`/contacts/${id}`),
  createContact: (data) => api.post('/contacts', data),
  updateContact: (id, data) => api.put(`/contacts/${id}`, data),
  deleteContact: (id) => api.delete(`/contacts/${id}`),
};

export const pipelineApi = {
  getDeals: (params) => api.get('/pipeline', { params }),
  getDeal: (id) => api.get(`/pipeline/${id}`),
  createDeal: (data) => api.post('/pipeline', data),
  updateDeal: (id, data) => api.put(`/pipeline/${id}`, data),
  deleteDeal: (id) => api.delete(`/pipeline/${id}`),
  getStats: () => api.get('/pipeline/stats'),
  getActivities: (params) => api.get('/pipeline/activities', { params }),
};

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
};

export const campaignApi = {
  getCampaigns: () => api.get('/campaigns'),
  createCampaign: (data) => api.post('/campaigns', data),
  scheduleCampaign: (id, date) => api.patch(`/campaigns/${id}/schedule`, { date }),
};

export const templateApi = {
  getTemplates: () => api.get('/templates'),
  createTemplate: (data) => api.post('/templates', data),
};

export default api;
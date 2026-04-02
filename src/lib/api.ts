import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('auth_token');
    }
    return Promise.reject(err);
  }
);

export const chatApi = {
  getChats: () => api.get('/chats'),
  getMessages: (chatId: string) => api.get(`/messages/${chatId}`),
  sendMessage: (chatId: string, content: string) => api.post('/messages', { chatId, content }),
  assignAgent: (chatId: string, agentId: string) => api.patch(`/chats/${chatId}/assign`, { agentId }),
};

export const contactApi = {
  getContacts: () => api.get('/contacts'),
  createContact: (data: any) => api.post('/contacts', data),
  updateContact: (id: string, data: any) => api.put(`/contacts/${id}`, data),
  deleteContact: (id: string) => api.delete(`/contacts/${id}`),
};

export const campaignApi = {
  getCampaigns: () => api.get('/campaigns'),
  createCampaign: (data: any) => api.post('/campaigns', data),
  scheduleCampaign: (id: string, date: string) => api.patch(`/campaigns/${id}/schedule`, { date }),
};

export const templateApi = {
  getTemplates: () => api.get('/templates'),
  createTemplate: (data: any) => api.post('/templates', data),
};

export default api;

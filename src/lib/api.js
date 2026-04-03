import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api` : 'http://localhost:5000/api';

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
  getChats: () => api.get('/conversations'),
  getMessages: (chatId) => api.get(`/messages/${chatId}`),
  sendMessage: (chatId, content) => api.post('/messages/send', { chatId, content }),
  assignAgent: (chatId, agentId) => api.patch(`/conversations/${chatId}/agent`, { agent: agentId }),
};

export const contactApi = {
  getContacts: (params) => api.get('/contacts', { params }),
  getContact: (id) => api.get(`/contacts/${id}`),
  createContact: (data) => api.post('/contacts', data),
  updateContact: (id, data) => api.put(`/contacts/${id}`, data),
  deleteContact: (id) => api.delete(`/contacts/${id}`),
};

export const pipelineApi = {
  getPipeline: (params) => api.get('/pipeline', { params }),
  getStages: () => api.get('/pipeline/stages'),
  createStage: (data) => api.post('/pipeline/stages', data),
  moveContact: (id, stage_id) => api.patch(`/pipeline/contacts/${id}/stage`, { stage_id }),
  updatePipelineStatus: (id, pipeline_status) => api.patch(`/pipeline/contacts/${id}/pipeline-status`, { pipeline_status }),
};

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
};

export const campaignApi = {
  getCampaigns: () => api.get('/campaigns'),
  createCampaign: (data) => api.post('/campaigns', data),
  updateCampaign: (id, data) => api.put(`/campaigns/${id}`, data),
  deleteCampaign: (id) => api.delete(`/campaigns/${id}`),
  sendCampaign: (id) => api.patch(`/campaigns/${id}/send`),
};

export const templateApi = {
  getTemplates: () => api.get('/templates'),
  createTemplate: (data) => api.post('/templates', data),
};

export default api;
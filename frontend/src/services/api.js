import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:8000' });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const login = (data) => API.post('/auth/login', data);
export const getMe = () => API.get('/auth/me');

// Tasks
export const getTasks = (params) => API.get('/tasks', { params });
export const createTask = (data) => API.post('/tasks', data);
export const updateTaskStatus = (id, data) => API.patch(`/tasks/${id}/status`, data);
export const deleteTask = (id) => API.delete(`/tasks/${id}`);

// Documents
export const getDocuments = () => API.get('/documents');
export const uploadDocument = (formData) =>
  API.post('/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteDocument = (id) => API.delete(`/documents/${id}`);

// Search
export const searchDocuments = (q, top_k = 5) => API.get('/search', { params: { q, top_k } });

// Analytics
export const getAnalytics = () => API.get('/analytics');

// Users
export const getUsers = () => API.get('/users');

export default API;

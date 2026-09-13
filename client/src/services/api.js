import axios from 'axios';

// In development, we allow fallback across common ports
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5002' // Fallback to dev port or configured port
    : '');

export const api = axios.create({
  baseURL: API_BASE_URL ? `${API_BASE_URL}/api` : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('devsync_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect if checking auth status on initial page load
      const isAuthCheck = error.config?.url?.includes('/auth/me');
      if (!isAuthCheck) {
        localStorage.removeItem('devsync_token');
        localStorage.removeItem('devsync_user');
      }
    }
    return Promise.reject(error);
  }
);

// Auth API Service methods
export const authService = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  checkHealth: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

// Room API Service methods
export const roomService = {
  createRoom: async (roomData = {}) => {
    const response = await api.post('/rooms/create', roomData);
    return response.data;
  },

  getRoom: async (roomId) => {
    const response = await api.get(`/rooms/${roomId}`);
    return response.data;
  },

  updateRoomProblem: async (roomId, problemDescription) => {
    const response = await api.put(`/rooms/${roomId}/problem`, { problemDescription });
    return response.data;
  },

  getMyRooms: async () => {
    const response = await api.get('/rooms/my/active');
    return response.data;
  },

  getPresets: async () => {
    const response = await api.get('/rooms/presets');
    return response.data;
  },

  updateRoomCode: async (roomId, data) => {
    const response = await api.put(`/rooms/${roomId}/code`, data);
    return response.data;
  },

  submitSolution: async (roomId, { code, language, isInterviewer }) => {
    const response = await api.post(`/rooms/${roomId}/submit`, {
      code,
      language,
      isInterviewer,
    });
    return response.data;
  },

  saveFeedback: async (roomId, feedbackData) => {
    const response = await api.put(`/rooms/${roomId}/feedback`, feedbackData);
    return response.data;
  },
};

// Code Execution Service methods
export const executeService = {
  runCode: async ({ code, language }) => {
    const response = await api.post('/execute', { code, language });
    return response.data;
  },
};

export default api;

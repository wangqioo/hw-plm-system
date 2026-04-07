import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

export const client = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

// Attach token to every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('plm_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('plm_token');
      localStorage.removeItem('plm_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;

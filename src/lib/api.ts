import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // FormData precisa de multipart/form-data com boundary; o default application/json quebra o upload.
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_auth_token');
      localStorage.removeItem('admin_auth_user');
      localStorage.removeItem('admin_impersonation_backup_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await useAuthStore.getState().refreshAccessToken();
        const { accessToken } = useAuthStore.getState();
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// API functions
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const dashboardApi = {
  getKpis: () => api.get('/dashboard/kpis'),
  getArAging: () => api.get('/dashboard/ar-aging'),
  getPaymentsTrend: () => api.get('/dashboard/payments-trend'),
  getRecentActivities: () => api.get('/dashboard/recent-activities'),
};

export const accountsApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/accounts', { params }),
  getById: (id: string) => api.get(`/accounts/${id}`),
  get360: (id: string) => api.get(`/accounts/${id}/360`),
  create: (data: Record<string, unknown>) => api.post('/accounts', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/accounts/${id}`, data),
  addNote: (id: string, data: Record<string, unknown>) => api.post(`/accounts/${id}/notes`, data),
};

export const invoicesApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/invoices', { params }),
  getById: (id: string) => api.get(`/invoices/${id}`),
};

export const paymentsApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/payments', { params }),
  create: (data: Record<string, unknown>) => api.post('/payments', data),
};

export const collectionsApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/collections', { params }),
  getById: (id: string) => api.get(`/collections/${id}`),
  updateStatus: (id: string, status: string) => api.put(`/collections/${id}/status`, { status }),
};

export const auditApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/audit-logs', { params }),
};

export const pricePlansApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/price-plans', { params }),
  getById: (id: string) => api.get(`/price-plans/${id}`),
  create: (data: Record<string, unknown>) => api.post('/price-plans', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/price-plans/${id}`, data),
  delete: (id: string) => api.delete(`/price-plans/${id}`),
  activate: (id: string) => api.post(`/price-plans/${id}/activate`),
  deactivate: (id: string) => api.post(`/price-plans/${id}/deactivate`),
};

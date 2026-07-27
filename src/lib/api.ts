import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/auth-store';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
});

// Inject JWT token into every request
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().auth.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 — auto logout
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().auth.reset();
      if (!window.location.pathname.includes('/sign-in')) {
        window.location.href = '/sign-in';
      }
    }
    return Promise.reject(error);
  },
);

// ─── Types ──────────────────────────────────────────────

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    username: string;
    role: string;
  };
}

export interface CreateCustomerRequest {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  lineUserId?: string;
  address?: string;
  referrerId?: string;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  phone: string;
  email: string | null;
  lineUserId: string | null;
  address: string | null;
  status: string;
  referrerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  _links: {
    self: string;
    next: string | null;
    prev: string | null;
  };
}

// ─── Auth ───────────────────────────────────────────────

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>('/api/auth/login', data);
  return res.data;
}

// ─── Customers ──────────────────────────────────────────

export async function createCustomer(data: CreateCustomerRequest): Promise<Customer> {
  const res = await api.post<Customer>('/api/customers', data);
  return res.data;
}

export async function getCustomers(page = 1, pageSize = 20): Promise<PaginatedResponse<Customer>> {
  const res = await api.get<PaginatedResponse<Customer>>('/api/customers', {
    params: { page, pageSize },
  });
  return res.data;
}

export async function searchCustomers(q: string, page = 1, pageSize = 20): Promise<PaginatedResponse<Customer>> {
  const res = await api.get<PaginatedResponse<Customer>>('/api/customers/search', {
    params: { q, page, pageSize },
  });
  return res.data;
}

export async function getCustomerById(id: string): Promise<Customer> {
  const res = await api.get<Customer>(`/api/customers/${id}`);
  return res.data;
}

export async function getCustomerByLineUserId(lineUserId: string): Promise<Customer> {
  const res = await api.get<Customer>(`/api/customers/line/${lineUserId}`);
  return res.data;
}

export async function updateCustomer(id: string, data: Partial<CreateCustomerRequest>): Promise<Customer> {
  const res = await api.patch<Customer>(`/api/customers/${id}`, data);
  return res.data;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
  const response = await api.post('/api/auth/change-password', { currentPassword, newPassword })
  return response.data
}

export default api;

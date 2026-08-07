import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/auth-store';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
})

// Request interceptor: inject JWT and let axios auto-set Content-Type
// (FormData payloads get multipart/form-data + boundary automatically).
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().auth.accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  return config
})

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
  plants?: string;
  referrerId?: string;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
}

export interface Customer {
  id: string;
  code: string | null;
  firstName: string;
  lastName: string;
  displayName?: string;
  phone: string;
  email: string | null;
  lineUserId: string | null;
  address: string | null;
  plants?: string | null;
  status: string;
  referrerId: string | null;
  bankName?: string | null;
  bankAccountName?: string | null;
  bankAccountNumber?: string | null;
  bankBookPath?: string | null;
  bankStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  bankRejectReason?: string | null;
  bankReviewedAt?: string | null;
  bankReviewedById?: string | null;
  bankReuploadToken?: string | null;
  bankReuploadTokenExpiresAt?: string | null;
  registeredAt: string;
  updatedAt: string;
}

export interface BankReviewResult {
  customer: Customer;
  linePushSent: boolean;
}

export interface ReuploadValidationResult {
  valid: boolean;
  message?: string;
  customer?: {
    id: string;
    bankName?: string | null;
    bankAccountName?: string | null;
    bankRejectReason?: string | null;
    bankStatus?: string;
  };
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

export type RegistrationPeriod = 'daily' | 'monthly' | 'yearly'

export interface RegistrationStats {
  period: RegistrationPeriod
  from: string
  to: string
  total: number
  data: { key: string; count: number }[]
}

export interface BankReuploadSendResult {
  sent: boolean
  message: string
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

export async function getCustomers(page = 1, pageSize = 20, bankStatus?: string): Promise<PaginatedResponse<Customer>> {
  const res = await api.get<PaginatedResponse<Customer>>('/api/customers', {
    params: { page, pageSize, ...(bankStatus ? { bankStatus } : {}) },
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

export async function deleteCustomer(id: string): Promise<Customer> {
  const res = await api.delete<Customer>(`/api/customers/${id}`);
  return res.data;
}

export async function sendBankReupload(id: string): Promise<BankReuploadSendResult> {
  const res = await api.post<BankReuploadSendResult>(`/api/customers/${id}/bank-reupload-send`);
  return res.data;
}

export async function getRegistrationStats(
  period: RegistrationPeriod = 'daily',
  from?: string,
  to?: string,
): Promise<RegistrationStats> {
  const res = await api.get<RegistrationStats>('/api/customers/stats/registrations', {
    params: { period, ...(from ? { from } : {}), ...(to ? { to } : {}) },
  });
  return res.data;
}

// ─── Bank Book (Validation Workflow) ───────────────────

export async function uploadBankBook(customerId: string, file: File): Promise<Customer> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await api.post<Customer>(`/api/customers/${customerId}/bank-book`, formData)
  return res.data
}

export async function getBankBookUrl(customerId: string): Promise<{ url: string }> {
  const res = await api.get<{ url: string }>(`/api/customers/${customerId}/bank-book-url`)
  return res.data
}

export async function reviewCustomerBank(
  customerId: string,
  action: 'approve' | 'reject',
  reason?: string,
): Promise<BankReviewResult> {
  const res = await api.post<BankReviewResult>(`/api/customers/${customerId}/bank-review`, {
    action,
    ...(action === 'reject' ? { reason } : {}),
  })
  return res.data
}

export async function validateReuploadToken(token: string): Promise<ReuploadValidationResult> {
  const res = await api.get<ReuploadValidationResult>('/api/bank-reupload/validate', {
    params: { token },
  })
  return res.data
}

export async function reuploadBankBook(token: string, file: File): Promise<Customer> {
  const formData = new FormData()
  formData.append('token', token)
  formData.append('file', file)
  const res = await api.post<Customer>('/api/bank-reupload', formData)
  return res.data
}

// ─── Registration Token ────────────────────────────────

export interface RegistrationTokenValidation {
  valid: boolean;
  lineUserId: string;
  alreadyRegistered: boolean;
}

export async function validateRegistrationToken(token: string): Promise<RegistrationTokenValidation> {
  const res = await api.get<RegistrationTokenValidation>(`/api/auth/registration-token/${token}`);
  return res.data;
}

export async function consumeRegistrationToken(token: string, customerId: string) {
  const res = await api.post(`/api/auth/registration-token/${token}/consume`, { customerId });
  return res.data;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
  const response = await api.post('/api/auth/change-password', { currentPassword, newPassword })
  return response.data
}

// ─── Admin Users (Superadmin only) ─────────────────────

export interface AdminUser {
  id: string
  username: string
  role: string
  createdAt: string
}

export interface CreateUserRequest {
  username: string
  password: string
  role: 'admin' | 'superadmin'
}

export async function getUsers(
  page = 1,
  pageSize = 20,
  q?: string,
): Promise<PaginatedResponse<AdminUser>> {
  const res = await api.get<PaginatedResponse<AdminUser>>('/api/users', {
    params: { page, pageSize, ...(q ? { q } : {}) },
  })
  return res.data
}

export async function createUser(
  data: CreateUserRequest,
): Promise<AdminUser> {
  const res = await api.post<AdminUser>('/api/users', data)
  return res.data
}

export async function updateUser(
  id: string,
  data: Partial<{ username: string; role: string; password: string }>,
): Promise<AdminUser> {
  const res = await api.patch<AdminUser>(`/api/users/${id}`, data)
  return res.data
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/api/users/${id}`)
}

export default api;

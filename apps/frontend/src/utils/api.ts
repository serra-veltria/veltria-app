import type { ApiResponse, AuthResponse, LoginRequest, SignupRequest, User } from '@veltria/shared';

const API_BASE = '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  return response.json();
}

export const api = {
  auth: {
    async login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
      return request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async signup(data: SignupRequest): Promise<ApiResponse<AuthResponse>> {
      return request<AuthResponse>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async logout(): Promise<ApiResponse> {
      return request('/auth/logout', { method: 'POST' });
    },

    async getMe(): Promise<ApiResponse<User>> {
      return request<User>('/auth/me');
    },
  },
};

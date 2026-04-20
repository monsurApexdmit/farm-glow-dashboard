import { apiClient } from './api';
import {
  User,
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  ChangePasswordPayload,
} from '@/types/auth';
import { API_ENDPOINTS } from '@/utils/constants';

class AuthService {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH_REGISTER,
      payload
    );
    if (response.token) {
      localStorage.setItem('auth_token', response.token);
    }
    return response;
  }

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH_LOGIN,
      payload
    );
    if (response.token) {
      localStorage.setItem('auth_token', response.token);
    }
    return response;
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH_LOGOUT);
    } finally {
      localStorage.removeItem('auth_token');
    }
  }

  async getMe(): Promise<User> {
    const response = await apiClient.get<any>(API_ENDPOINTS.AUTH_ME);
    // Backend might return { user: ... } or just the user object
    return response.user || response;
  }

  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    await apiClient.post(API_ENDPOINTS.AUTH_CHANGE_PASSWORD, payload);
  }

  async refreshToken(): Promise<string> {
    const response = await apiClient.post<{ token: string }>(
      API_ENDPOINTS.AUTH_REFRESH
    );
    localStorage.setItem('auth_token', response.token);
    return response.token;
  }

  getStoredToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  isAuthenticated(): boolean {
    return !!this.getStoredToken();
  }
}

export const authService = new AuthService();

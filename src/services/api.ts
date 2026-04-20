import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_BASE_URL } from '@/utils/constants';

interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing: boolean = false;
  private failedQueue: Array<{
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
  }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - Add JWT token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - Handle token refresh & errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<any>) => {
        const originalRequest = error.config as any;

        // Handle 401 - Token expired
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return this.client(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          this.isRefreshing = true;
          originalRequest._retry = true;

          return this.refreshToken()
            .then((newToken) => {
              this.isRefreshing = false;
              this.processQueue(null, newToken);
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.client(originalRequest);
            })
            .catch((err) => {
              this.processQueue(err, null);
              this.isRefreshing = false;
              localStorage.removeItem('auth_token');
              window.location.href = '/signin';
              return Promise.reject(err);
            });
        }

        return Promise.reject(this.formatError(error));
      }
    );
  }

  private processQueue(
    error: any,
    token: string | null
  ) {
    this.failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });
    this.failedQueue = [];
  }

  private async refreshToken(): Promise<string> {
    try {
      const response = await this.client.post('/api/v1/auth/refresh-token');
      // Handle both response formats
      const newToken = response.data.data?.token || response.data.token;
      localStorage.setItem('auth_token', newToken);
      return newToken;
    } catch (error) {
      throw error;
    }
  }

  private formatError(error: AxiosError<any>): ApiError {
    return {
      status: error.response?.status || 500,
      message:
        error.response?.data?.message ||
        error.message ||
        'An error occurred',
      errors: error.response?.data?.errors,
    };
  }

  async get<T>(url: string, config?: any): Promise<T> {
    const response = await this.client.get<any>(url, config);
    return this.extractData(response.data);
  }

  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.post<any>(url, data, config);
    return this.extractData(response.data);
  }

  async put<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.put<any>(url, data, config);
    return this.extractData(response.data);
  }

  async patch<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.patch<any>(url, data, config);
    return this.extractData(response.data);
  }

  async delete<T>(url: string, config?: any): Promise<T> {
    const response = await this.client.delete<any>(url, config);
    return this.extractData(response.data);
  }

  private extractData(response: any): any {
    // Backend returns data at top level for auth endpoints
    // or nested in 'data' property for other endpoints
    if (response.data !== undefined) {
      return response.data;
    }
    // Return the entire response if there's no nested data
    return response;
  }
}

export const apiClient = new ApiClient();
export type { ApiError };

import { apiClient } from './api';
import { API_ENDPOINTS } from '@/utils/constants';
import { PaginatedResponse } from '@/types/api';
import { buildQueryString, normalizePaginatedResponse } from '@/utils/paginated';

export interface BackendWorker {
  id: string;
  farm_id: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  employment_type?: 'full-time' | 'part-time' | 'contract' | 'seasonal';
  position?: string;
  start_date?: string;
  hire_date?: string;
  hiring_date?: string;
  hourly_rate?: number;
  monthly_rate?: number;
  salary?: number;
  is_active?: boolean;
  status?: 'active' | 'inactive' | 'on_leave';
  emergency_contact?: string;
  created_at: string;
  updated_at: string;
}

class WorkerService {
  async getWorkers(params?: {
    farmId?: string;
    page?: number;
    perPage?: number;
    search?: string;
    role?: string;
    status?: string;
  }): Promise<PaginatedResponse<BackendWorker>> {
    const query = buildQueryString({
      farm_id: params?.farmId,
      page: params?.page,
      per_page: params?.perPage,
      search: params?.search,
      role: params?.role,
      status: params?.status,
    });
    const res = await apiClient.get<any>(`${API_ENDPOINTS.WORKERS}${query}`);
    return normalizePaginatedResponse<BackendWorker>(res, params?.page, params?.perPage, ["workers"]);
  }

  async getWorker(id: string): Promise<BackendWorker> {
    const res = await apiClient.get<any>(`${API_ENDPOINTS.WORKERS}/${id}`);
    const worker = res.data || res.worker || res;
    return worker as BackendWorker;
  }

  async createWorker(data: Partial<BackendWorker>): Promise<BackendWorker> {
    const res = await apiClient.post<any>(API_ENDPOINTS.WORKERS, data);
    return (res?.data || res?.worker || res) as BackendWorker;
  }

  async updateWorker(id: string, data: Partial<BackendWorker>): Promise<BackendWorker> {
    const res = await apiClient.put<any>(`${API_ENDPOINTS.WORKERS}/${id}`, data);
    return (res?.data || res?.worker || res) as BackendWorker;
  }

  async deleteWorker(id: string): Promise<void> {
    await apiClient.delete(`${API_ENDPOINTS.WORKERS}/${id}`);
  }
}

export const workerService = new WorkerService();

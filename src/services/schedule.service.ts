import { apiClient } from './api';
import { API_ENDPOINTS } from '@/utils/constants';
import { PaginatedResponse } from '@/types/api';
import { buildQueryString, normalizePaginatedResponse } from '@/utils/paginated';

export interface BackendSchedule {
  id: string;
  worker_id: string;
  farm_id?: string;
  work_date?: string;
  task: string;
  scheduled_date: string;
  start_time?: string | null;
  end_time?: string | null;
  shift_type?: string | null;
  status?: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  worker?: {
    id: string;
    first_name?: string;
    last_name?: string;
    name?: string;
  };
}

class ScheduleService {
  async getSchedules(params?: {
    farmId?: string;
    page?: number;
    perPage?: number;
    search?: string;
    category?: string;
    status?: string;
    priority?: string;
    date?: string;
  }): Promise<PaginatedResponse<BackendSchedule>> {
    const query = buildQueryString({
      farm_id: params?.farmId,
      page: params?.page,
      per_page: params?.perPage,
      search: params?.search,
      category: params?.category,
      status: params?.status,
      priority: params?.priority,
      date: params?.date,
    });
    const res = await apiClient.get<any>(`${API_ENDPOINTS.SCHEDULES}${query}`);
    return normalizePaginatedResponse<BackendSchedule>(res, params?.page, params?.perPage, ["schedules"]);
  }

  async getSchedule(id: string): Promise<BackendSchedule> {
    const res = await apiClient.get<any>(`${API_ENDPOINTS.SCHEDULES}/${id}`);
    return (res?.data || res?.schedule || res) as BackendSchedule;
  }

  async createSchedule(data: Partial<BackendSchedule>): Promise<BackendSchedule> {
    const res = await apiClient.post<any>(API_ENDPOINTS.SCHEDULES, data);
    return (res?.data || res?.schedule || res) as BackendSchedule;
  }

  async updateSchedule(id: string, data: Partial<BackendSchedule>): Promise<BackendSchedule> {
    const res = await apiClient.put<any>(`${API_ENDPOINTS.SCHEDULES}/${id}`, data);
    return (res?.data || res?.schedule || res) as BackendSchedule;
  }

  async deleteSchedule(id: string): Promise<void> {
    await apiClient.delete(`${API_ENDPOINTS.SCHEDULES}/${id}`);
  }
}

export const scheduleService = new ScheduleService();

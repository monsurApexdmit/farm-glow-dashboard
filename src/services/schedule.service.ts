import { apiClient } from './api';
import { API_ENDPOINTS } from '@/utils/constants';

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
  async getSchedules(farmId?: string): Promise<BackendSchedule[]> {
    const url = farmId ? `${API_ENDPOINTS.SCHEDULES}?farm_id=${farmId}` : API_ENDPOINTS.SCHEDULES;
    const res = await apiClient.get<any>(url);
    return Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
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

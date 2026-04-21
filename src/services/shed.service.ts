import { apiClient } from './api';
import { LivestockShed } from '@/types/common';
import { API_ENDPOINTS } from '@/utils/constants';

class ShedService {
  async getSheds(farmId?: string): Promise<LivestockShed[]> {
    const url = farmId ? `${API_ENDPOINTS.SHEDS}?farm_id=${farmId}` : API_ENDPOINTS.SHEDS;
    const res = await apiClient.get<any>(url);
    const data = Array.isArray(res.data) ? res.data : (res.sheds || res.data || res || []);
    return Array.isArray(data) ? data : [];
  }

  async getShedItem(id: string): Promise<LivestockShed> {
    const res = await apiClient.get<any>(`${API_ENDPOINTS.SHEDS}/${id}`);
    const item = res.data || res.shed || res;
    return item as LivestockShed;
  }

  async createShed(data: Partial<LivestockShed>): Promise<LivestockShed> {
    const res = await apiClient.post<any>(API_ENDPOINTS.SHEDS, data);
    const item = res.shed || res.data || res;
    return { ...data, ...item } as LivestockShed;
  }

  async updateShed(id: string, data: Partial<LivestockShed>): Promise<LivestockShed> {
    const res = await apiClient.put<any>(`${API_ENDPOINTS.SHEDS}/${id}`, data);
    const item = res.shed || res.data || res;
    return { ...data, ...item } as LivestockShed;
  }

  async deleteShed(id: string): Promise<void> {
    await apiClient.delete(`${API_ENDPOINTS.SHEDS}/${id}`);
  }

  async recordCleaning(id: string): Promise<any> {
    return apiClient.post<any>(`${API_ENDPOINTS.SHEDS}/${id}/clean`, {});
  }

  async getShedGrid(id: string): Promise<any> {
    return apiClient.get<any>(`${API_ENDPOINTS.SHEDS}/${id}/grid`);
  }

  async getShedStats(id: string): Promise<any> {
    return apiClient.get<any>(`${API_ENDPOINTS.SHEDS}/${id}/stats`);
  }
}

export const shedService = new ShedService();

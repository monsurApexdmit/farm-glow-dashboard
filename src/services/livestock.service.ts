import { apiClient } from './api';
import { Livestock } from '@/types/common';
import { API_ENDPOINTS } from '@/utils/constants';

class LivestockService {
  async getLivestock(farmId?: string): Promise<Livestock[]> {
    const url = farmId ? `${API_ENDPOINTS.LIVESTOCK}?farm_id=${farmId}` : API_ENDPOINTS.LIVESTOCK;
    const res = await apiClient.get<any>(url);
    return Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
  }

  async getLivestockItem(id: string): Promise<Livestock> {
    const res = await apiClient.get<any>(`${API_ENDPOINTS.LIVESTOCK}/${id}`);
    const item = res.data || res.livestock || res;
    return item as Livestock;
  }

  async createLivestock(data: Partial<Livestock>): Promise<Livestock> {
    const res = await apiClient.post<any>(API_ENDPOINTS.LIVESTOCK, data);
    const item = res.livestock || res.data || res;
    return { ...data, ...item } as Livestock;
  }

  async updateLivestock(id: string, data: Partial<Livestock>): Promise<Livestock> {
    const res = await apiClient.put<any>(`${API_ENDPOINTS.LIVESTOCK}/${id}`, data);
    const item = res.livestock || res.data || res;
    return { ...data, ...item } as Livestock;
  }

  async deleteLivestock(id: string): Promise<void> {
    await apiClient.delete(`${API_ENDPOINTS.LIVESTOCK}/${id}`);
  }

  async logHealth(id: string, healthData: any): Promise<any> {
    return apiClient.post<any>(API_ENDPOINTS.LIVESTOCK_HEALTH(id), healthData);
  }

  async getInventorySummary(farmId?: string): Promise<any[]> {
    const url = farmId
      ? `${API_ENDPOINTS.LIVESTOCK_INVENTORY_SUMMARY}?farm_id=${farmId}`
      : API_ENDPOINTS.LIVESTOCK_INVENTORY_SUMMARY;
    const res = await apiClient.get<any>(url);
    return Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
  }
}

export const livestockService = new LivestockService();

import { apiClient } from './api';
import { Crop } from '@/types/common';
import { API_ENDPOINTS } from '@/utils/constants';

class CropService {
  async getCrops(fieldId?: string): Promise<Crop[]> {
    const url = fieldId ? `${API_ENDPOINTS.CROPS}?field_id=${fieldId}` : API_ENDPOINTS.CROPS;
    const res = await apiClient.get<any>(url);
    const data = Array.isArray(res.data) ? res.data : (res.crops || res.data || res || []);
    return Array.isArray(data) ? data : [];
  }

  async getCrop(id: string): Promise<Crop> {
    const res = await apiClient.get<any>(`${API_ENDPOINTS.CROPS}/${id}`);
    const crop = res.data || res.crop || res;
    return crop as Crop;
  }

  async createCrop(data: Partial<Crop>): Promise<Crop> {
    const res = await apiClient.post<any>(API_ENDPOINTS.CROPS, data);
    const crop = res.crop || res.data || res;
    return { ...data, ...crop } as Crop;
  }

  async updateCrop(id: string, data: Partial<Crop>): Promise<Crop> {
    const res = await apiClient.put<any>(`${API_ENDPOINTS.CROPS}/${id}`, data);
    const crop = res.crop || res.data || res;
    return { ...data, ...crop } as Crop;
  }

  async deleteCrop(id: string): Promise<void> {
    await apiClient.delete(`${API_ENDPOINTS.CROPS}/${id}`);
  }

  async logHealth(id: string, healthData: any): Promise<any> {
    return apiClient.post<any>(API_ENDPOINTS.CROPS_HEALTH(id), healthData);
  }

  async recordHarvest(id: string, harvestData: any): Promise<any> {
    return apiClient.post<any>(API_ENDPOINTS.CROPS_HARVEST(id), harvestData);
  }

  async recordYield(id: string, yieldData: any): Promise<any> {
    return apiClient.post<any>(API_ENDPOINTS.CROPS_YIELD(id), yieldData);
  }
}

export const cropService = new CropService();

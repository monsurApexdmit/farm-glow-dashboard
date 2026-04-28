import { apiClient } from './api';
import { Crop } from '@/types/common';
import { API_ENDPOINTS } from '@/utils/constants';
import { PaginatedResponse } from '@/types/api';
import { buildQueryString, normalizePaginatedResponse } from '@/utils/paginated';

class CropService {
  async getCrops(params?: {
    fieldId?: string;
    page?: number;
    perPage?: number;
    search?: string;
    status?: string;
  }): Promise<PaginatedResponse<Crop>> {
    const query = buildQueryString({
      field_id: params?.fieldId,
      page: params?.page,
      per_page: params?.perPage,
      search: params?.search,
      status: params?.status,
    });
    const res = await apiClient.get<any>(`${API_ENDPOINTS.CROPS}${query}`);
    return normalizePaginatedResponse<Crop>(res, params?.page, params?.perPage, ["crops"]);
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

import { apiClient } from './api';
import { Farm, Field } from '@/types/common';
import { API_ENDPOINTS } from '@/utils/constants';

class FarmService {
  // Farms
  async getFarms(): Promise<Farm[]> {
    const res = await apiClient.get<any>(API_ENDPOINTS.FARMS);
    // Handle nested data.data or direct data array
    const data = Array.isArray(res.data) ? res.data : (res.farms || res.data || res || []);
    return Array.isArray(data) ? data : [];
  }

  async getFarm(id: string): Promise<Farm> {
    const res = await apiClient.get<any>(`${API_ENDPOINTS.FARMS}/${id}`);
    // Response is wrapped in { message, data: { farm } }
    const farm = res.data || res.farm || res;
    return farm as Farm;
  }

  async createFarm(data: Partial<Farm>): Promise<Farm> {
    const res = await apiClient.post<any>(API_ENDPOINTS.FARMS, data);
    const farm = res.farm || res.data || res;
    // Merge sent data with response to preserve farm_type, soil_type, climate_zone
    return { ...data, ...farm } as Farm;
  }

  async updateFarm(id: string, data: Partial<Farm>): Promise<Farm> {
    const res = await apiClient.put<any>(`${API_ENDPOINTS.FARMS}/${id}`, data);
    const farm = res.farm || res.data || res;
    // Merge sent data with response to preserve farm_type, soil_type, climate_zone
    return { ...data, ...farm } as Farm;
  }

  async deleteFarm(id: string): Promise<void> {
    await apiClient.delete(`${API_ENDPOINTS.FARMS}/${id}`);
  }

  async getFarmSummary(id: string): Promise<any> {
    return apiClient.get<any>(API_ENDPOINTS.FARMS_SUMMARY(id));
  }

  // Fields
  async getFields(farmId?: string): Promise<Field[]> {
    const url = farmId ? `${API_ENDPOINTS.FIELDS}?farm_id=${farmId}` : API_ENDPOINTS.FIELDS;
    const res = await apiClient.get<any>(url);
    // Handle nested data.data or direct data array
    const data = Array.isArray(res.data) ? res.data : (res.fields || res.data || res || []);
    return Array.isArray(data) ? data : [];
  }

  async createField(data: Partial<Field>): Promise<Field> {
    const res = await apiClient.post<any>(API_ENDPOINTS.FIELDS, data);
    const field = res.field || res.data || res;
    // Merge sent data with response to preserve unit, status
    return { ...data, ...field } as Field;
  }

  async getField(id: string): Promise<Field> {
    const res = await apiClient.get<any>(`${API_ENDPOINTS.FIELDS}/${id}`);
    const field = res.data || res.field || res;
    return field as Field;
  }

  async getFieldMap(id: string): Promise<any> {
    return apiClient.get<any>(API_ENDPOINTS.FIELDS_MAP(id));
  }

  async updateField(id: string, data: Partial<Field>): Promise<Field> {
    const res = await apiClient.put<any>(`${API_ENDPOINTS.FIELDS}/${id}`, data);
    const field = res.field || res.data || res;
    // Merge sent data with response to preserve unit, status
    return { ...data, ...field } as Field;
  }

  async deleteField(id: string): Promise<void> {
    await apiClient.delete(`${API_ENDPOINTS.FIELDS}/${id}`);
  }
}

export const farmService = new FarmService();

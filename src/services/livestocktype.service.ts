import { apiClient } from './api';
import { API_ENDPOINTS } from '@/utils/constants';

interface LivestockType {
  id: number;
  name: string;
}

class LivestockTypeService {
  async getTypes(): Promise<LivestockType[]> {
    try {
      const res = await apiClient.get<any>('/api/v1/livestock-types');
      const data = Array.isArray(res.data) ? res.data : (res.livestock_types || res.data || res || []);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Failed to fetch livestock types:', error);
      return [];
    }
  }
}

export const livestockTypeService = new LivestockTypeService();

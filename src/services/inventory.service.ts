import { apiClient } from './api';
import { API_ENDPOINTS } from '@/utils/constants';

export interface BackendInventoryItem {
  id: string;
  farm_id: string;
  category_id: string;
  supplier_id?: string;
  name: string;
  sku: string;
  description?: string;
  unit: string;
  quantity: number;
  min_quantity?: number;
  max_quantity?: number;
  cost_per_unit: number;
  total_value?: number;
  expiry_date?: string;
  location?: string;
  status: string;
  is_active: boolean;
  created_at: string;
  category?: { id: string; name: string; icon?: string; color?: string };
  supplier?: { id: string; name: string };
  reorder_point?: { reorder_point: number; reorder_quantity: number };
}

export interface BackendCategory {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

export interface BackendSupplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  city?: string;
  country?: string;
}

class InventoryService {
  private list<T>(res: any): T[] {
    return Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
  }

  async getItems(farmId?: string): Promise<BackendInventoryItem[]> {
    const url = farmId ? `${API_ENDPOINTS.INVENTORY}?farm_id=${farmId}` : API_ENDPOINTS.INVENTORY;
    return this.list<BackendInventoryItem>(await apiClient.get<any>(url));
  }

  async getItem(id: string): Promise<BackendInventoryItem> {
    const res = await apiClient.get<any>(`${API_ENDPOINTS.INVENTORY}/${id}`);
    return res?.data ?? res;
  }

  async createItem(data: Partial<BackendInventoryItem>): Promise<BackendInventoryItem> {
    const res = await apiClient.post<any>(API_ENDPOINTS.INVENTORY, data);
    return res?.data ?? res;
  }

  async updateItem(id: string, data: Partial<BackendInventoryItem>): Promise<BackendInventoryItem> {
    const res = await apiClient.put<any>(`${API_ENDPOINTS.INVENTORY}/${id}`, data);
    return res?.data ?? res;
  }

  async deleteItem(id: string): Promise<void> {
    await apiClient.delete(`${API_ENDPOINTS.INVENTORY}/${id}`);
  }

  async getCategories(): Promise<BackendCategory[]> {
    return this.list<BackendCategory>(await apiClient.get<any>(API_ENDPOINTS.INVENTORY_CATEGORIES));
  }

  async createCategory(data: Partial<BackendCategory>): Promise<BackendCategory> {
    const res = await apiClient.post<any>(API_ENDPOINTS.INVENTORY_CATEGORIES, data);
    return res?.data ?? res;
  }

  async getSuppliers(): Promise<BackendSupplier[]> {
    return this.list<BackendSupplier>(await apiClient.get<any>(API_ENDPOINTS.SUPPLIERS));
  }

  async createSupplier(data: Partial<BackendSupplier>): Promise<BackendSupplier> {
    const res = await apiClient.post<any>(API_ENDPOINTS.SUPPLIERS, data);
    return res?.data ?? res;
  }

  async getLowStock(): Promise<BackendInventoryItem[]> {
    return this.list<BackendInventoryItem>(await apiClient.get<any>(API_ENDPOINTS.INVENTORY_LOW_STOCK));
  }

  async getExpired(): Promise<BackendInventoryItem[]> {
    return this.list<BackendInventoryItem>(await apiClient.get<any>(API_ENDPOINTS.INVENTORY_EXPIRED));
  }

  async getTotalValue(): Promise<number> {
    const res = await apiClient.get<any>(API_ENDPOINTS.INVENTORY_VALUE);
    const data: Record<string, number> = res?.data ?? res ?? {};
    return Object.values(data).reduce((sum, v) => sum + Number(v), 0);
  }

  async recordUse(itemId: string, quantity: number, notes?: string): Promise<void> {
    await apiClient.post<any>(API_ENDPOINTS.INVENTORY_USE, {
      inventory_item_id: itemId,
      quantity,
      notes,
      transaction_date: new Date().toISOString().split('T')[0],
    });
  }

  async recordRestock(itemId: string, quantity: number, costPerUnit?: number, notes?: string): Promise<void> {
    await apiClient.post<any>(API_ENDPOINTS.INVENTORY_RESTOCK, {
      inventory_item_id: itemId,
      quantity,
      cost_per_unit: costPerUnit,
      notes,
      transaction_date: new Date().toISOString().split('T')[0],
    });
  }

  async getTransactions(farmId?: string): Promise<any[]> {
    const url = farmId ? `${API_ENDPOINTS.INVENTORY_TRANSACTIONS}?farm_id=${farmId}` : API_ENDPOINTS.INVENTORY_TRANSACTIONS;
    return this.list<any>(await apiClient.get<any>(url));
  }

  async getItemTransactions(itemId: string): Promise<any[]> {
    return this.list<any>(await apiClient.get<any>(`${API_ENDPOINTS.INVENTORY_TRANSACTIONS}/${itemId}`));
  }
}

export const inventoryService = new InventoryService();

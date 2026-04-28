import { apiClient } from './api';
import { API_ENDPOINTS } from '@/utils/constants';
import { PaginatedResponse } from '@/types/api';

export interface BackendNotification {
  id: string;
  title: string;
  message: string;
  type?: 'alert' | 'reminder' | 'info' | 'warning';
  is_read?: boolean;
  read_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface NotificationSettings {
  notifications_enabled: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
}

class NotificationService {
  private buildQuery(params: Record<string, string | number | undefined>) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        query.set(key, String(value));
      }
    });
    const value = query.toString();
    return value ? `?${value}` : '';
  }

  private list<T>(res: any): T[] {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.notifications)) return res.notifications;
    if (Array.isArray(res?.items)) return res.items;
    return [];
  }

  private normalizeSettings(res: any): NotificationSettings {
    const settings = res?.data || res?.settings || res || {};
    return {
      notifications_enabled: settings.notifications_enabled !== false,
      email_notifications: Boolean(settings.email_notifications),
      sms_notifications: Boolean(settings.sms_notifications),
      push_notifications: settings.push_notifications !== false,
    };
  }

  async getNotifications(
    page = 1,
    perPage = 10
  ): Promise<PaginatedResponse<BackendNotification>> {
    const query = this.buildQuery({ page, per_page: perPage });
    const res = await apiClient.get<any>(`${API_ENDPOINTS.NOTIFICATIONS}${query}`);
    const data = this.list<BackendNotification>(res);
    const meta = res?.meta || res?.pagination || {};

    return {
      data,
      meta: {
        current_page: Number(meta.current_page || meta.page || page),
        from: Number(meta.from || (data.length ? (page - 1) * perPage + 1 : 0)),
        to: Number(meta.to || ((page - 1) * perPage + data.length)),
        total: Number(meta.total || data.length),
        per_page: Number(meta.per_page || meta.limit || perPage),
        last_page: Number(
          meta.last_page ||
            meta.total_pages ||
            Math.max(1, Math.ceil(Number(meta.total || data.length) / Number(meta.per_page || meta.limit || perPage)))
        ),
      },
    };
  }

  async markAsRead(id: string): Promise<void> {
    await apiClient.post<any>(API_ENDPOINTS.NOTIFICATIONS_READ(id), {});
  }

  async markAllAsRead(ids: string[]): Promise<void> {
    await Promise.all(ids.map((id) => this.markAsRead(id)));
  }

  async deleteNotification(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.NOTIFICATIONS_READ(id).replace('/read', ''));
  }

  async getSettings(): Promise<NotificationSettings> {
    const res = await apiClient.get<any>(API_ENDPOINTS.NOTIFICATIONS_SETTINGS);
    return this.normalizeSettings(res);
  }

  async updateSettings(settings: NotificationSettings): Promise<NotificationSettings> {
    const res = await apiClient.put<any>(API_ENDPOINTS.NOTIFICATIONS_SETTINGS, settings);
    return this.normalizeSettings(res);
  }
}

export const notificationService = new NotificationService();

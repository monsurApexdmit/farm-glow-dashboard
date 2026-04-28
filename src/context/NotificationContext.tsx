import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  BackendNotification,
  NotificationSettings,
  notificationService,
} from "@/services/notification.service";
import { useAuth } from "@/hooks/useAuth";
import { PaginatedResponse } from "@/types/api";

interface NotificationContextValue {
  notifications: BackendNotification[];
  pagination: PaginatedResponse<BackendNotification>["meta"];
  settings: NotificationSettings | null;
  unreadCount: number;
  isLoading: boolean;
  isSettingsLoading: boolean;
  refreshNotifications: (page?: number) => Promise<void>;
  refreshSettings: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  saveSettings: (settings: NotificationSettings) => Promise<NotificationSettings>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [notifications, setNotifications] = useState<BackendNotification[]>([]);
  const [pagination, setPagination] = useState<PaginatedResponse<BackendNotification>["meta"]>({
    current_page: 1,
    from: 0,
    to: 0,
    total: 0,
    per_page: 10,
    last_page: 1,
  });
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);

  const refreshNotifications = async (page = pagination.current_page || 1) => {
    if (!isAuthenticated) {
      setNotifications([]);
      setPagination((current) => ({ ...current, total: 0, from: 0, to: 0, last_page: 1 }));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await notificationService.getNotifications(page, pagination.per_page || 10);
      setNotifications(Array.isArray(response.data) ? response.data : []);
      setPagination(response.meta);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSettings = async () => {
    if (!isAuthenticated) {
      setSettings(null);
      setIsSettingsLoading(false);
      return;
    }

    setIsSettingsLoading(true);
    try {
      const data = await notificationService.getSettings();
      setSettings(data);
    } finally {
      setIsSettingsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (!isAuthenticated) {
      setNotifications([]);
      setSettings(null);
      setPagination({
        current_page: 1,
        from: 0,
        to: 0,
        total: 0,
        per_page: 10,
        last_page: 1,
      });
      setIsLoading(false);
      setIsSettingsLoading(false);
      return;
    }

    void refreshNotifications();
    void refreshSettings();
  }, [isAuthenticated, isAuthLoading]);

  const markAsRead = async (id: string) => {
    const target = notifications.find((notification) => String(notification.id) === id);
    if (!target || target.is_read || target.read_at) return;

    setNotifications((current) =>
      current.map((notification) =>
        String(notification.id) === id
          ? {
              ...notification,
              is_read: true,
              read_at: notification.read_at || new Date().toISOString(),
            }
          : notification
      )
    );

    try {
      await notificationService.markAsRead(id);
    } catch (error) {
      await refreshNotifications();
      throw error;
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications
      .filter((notification) => !notification.is_read && !notification.read_at)
      .map((notification) => String(notification.id));

    if (!unreadIds.length) return;

    const readAt = new Date().toISOString();
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        is_read: true,
        read_at: notification.read_at || readAt,
      }))
    );

    try {
      await notificationService.markAllAsRead(unreadIds);
    } catch (error) {
      await refreshNotifications();
      throw error;
    }
  };

  const deleteNotification = async (id: string) => {
    const previous = notifications;
    setNotifications((current) =>
      current.filter((notification) => String(notification.id) !== id)
    );

    try {
      await notificationService.deleteNotification(id);
      setPagination((current) => ({
        ...current,
        total: Math.max(0, current.total - 1),
        to: Math.max(0, current.to - 1),
      }));
    } catch (error) {
      setNotifications(previous);
      throw error;
    }
  };

  const saveSettings = async (nextSettings: NotificationSettings) => {
    const previous = settings;
    setSettings(nextSettings);

    try {
      const saved = await notificationService.updateSettings(nextSettings);
      setSettings(saved);
      return saved;
    } catch (error) {
      setSettings(previous);
      throw error;
    }
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read && !notification.read_at
  ).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        pagination,
        settings,
        unreadCount,
        isLoading,
        isSettingsLoading,
        refreshNotifications,
        refreshSettings,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        saveSettings,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
}

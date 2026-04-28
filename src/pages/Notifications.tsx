import { useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, CloudRain, AlertTriangle, CheckCircle, Package, Clock, X, Loader, RefreshCcw, Mail, Smartphone, Settings2 } from "lucide-react";
import { BackendNotification, NotificationSettings } from "@/services/notification.service";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useNotifications } from "@/context/NotificationContext";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "weather" | "inventory" | "task" | "system";
  severity: "info" | "warning" | "critical";
  time: string;
  read: boolean;
}

const typeIcons = {
  weather: CloudRain,
  inventory: Package,
  task: Clock,
  system: CheckCircle,
};

const severityStyles = {
  critical: "bg-destructive/10 border-destructive/30 text-destructive",
  warning: "bg-accent/10 border-accent/30 text-accent-foreground",
  info: "bg-primary/10 border-primary/30 text-primary",
};

const relativeTime = (value?: string) => {
  if (!value) return "Just now";
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
};

const mapBackendNotification = (notification: BackendNotification): Notification => {
  const title = notification.title || "Notification";
  const message = notification.message || "";
  const rawType = notification.type || "info";
  const text = `${title} ${message}`.toLowerCase();
  let type: Notification["type"] = "system";
  if (text.includes("rain") || text.includes("storm") || text.includes("frost") || text.includes("weather")) type = "weather";
  else if (text.includes("stock") || text.includes("inventory") || text.includes("feed") || text.includes("seed")) type = "inventory";
  else if (text.includes("task") || text.includes("schedule") || text.includes("maintenance") || text.includes("harvest")) type = "task";

  let severity: Notification["severity"] = "info";
  if (rawType === "warning" || rawType === "reminder") severity = "warning";
  if (rawType === "alert" || text.includes("critical") || text.includes("warning")) severity = "critical";

  return {
    id: String(notification.id),
    title,
    message,
    type,
    severity,
    time: relativeTime(notification.created_at),
    read: Boolean(notification.is_read || notification.read_at),
  };
};

const Notifications = () => {
  const { toast } = useToast();
  const {
    notifications: backendNotifications,
    pagination,
    settings,
    unreadCount,
    isLoading,
    isSettingsLoading,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    saveSettings,
  } = useNotifications();
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [localSettings, setLocalSettings] = useState<NotificationSettings | null>(null);

  const notifications = useMemo(
    () => backendNotifications.map(mapBackendNotification),
    [backendNotifications]
  );
  const currentPage = pagination.current_page || 1;
  const totalPages = Math.max(1, pagination.last_page || 1);

  const effectiveSettings = localSettings || settings;

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleRefresh = async (page = currentPage) => {
    try {
      await refreshNotifications(page);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load notifications",
        variant: "destructive",
      });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to mark notifications as read",
        variant: "destructive",
      });
    }
  };

  const dismiss = async (id: string) => {
    try {
      await deleteNotification(id);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete notification",
        variant: "destructive",
      });
    }
  };

  const markRead = async (id: string) => {
    try {
      await markAsRead(id);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to mark notification as read",
        variant: "destructive",
      });
    }
  };

  const handleSettingsChange = (key: keyof NotificationSettings, value: boolean) => {
    setLocalSettings((current) => ({
      notifications_enabled: current?.notifications_enabled ?? settings?.notifications_enabled ?? true,
      email_notifications: current?.email_notifications ?? settings?.email_notifications ?? false,
      sms_notifications: current?.sms_notifications ?? settings?.sms_notifications ?? false,
      push_notifications: current?.push_notifications ?? settings?.push_notifications ?? true,
      ...current,
      [key]: value,
    }));
  };

  const handleSettingsSave = async () => {
    if (!effectiveSettings) return;

    setIsSavingSettings(true);
    try {
      const saved = await saveSettings(effectiveSettings);
      setLocalSettings(saved);
      toast({
        title: "Success",
        description: "Notification settings updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update notification settings",
        variant: "destructive",
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const filterByType = (type: string) =>
    type === "all" ? notifications : notifications.filter((notification) => notification.type === type);

  const visiblePages = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages = new Set<number>([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
    return Array.from(pages)
      .filter((page) => page >= 1 && page <= totalPages)
      .sort((a, b) => a - b);
  }, [currentPage, totalPages]);

  const renderNotification = (notification: Notification) => {
    const Icon = typeIcons[notification.type];
    return (
      <div
        key={notification.id}
        onClick={() => markRead(notification.id)}
        className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
          notification.read ? "bg-card border-border opacity-75" : `${severityStyles[notification.severity]} border`
        }`}
      >
        <div className={`p-2 rounded-lg flex-shrink-0 ${notification.read ? "bg-muted" : severityStyles[notification.severity]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`text-sm font-semibold ${notification.read ? "text-foreground" : ""}`}>{notification.title}</p>
            {!notification.read && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{notification.message}</p>
          <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
        </div>
        <Button variant="ghost" size="icon" className="flex-shrink-0 h-7 w-7" onClick={(e) => { e.stopPropagation(); dismiss(notification.id); }}>
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    );
  };

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold font-display">Notifications</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount} new</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void handleRefresh()}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" disabled={unreadCount === 0} onClick={() => void handleMarkAllRead()}>
            Mark All Read
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="mt-1 text-3xl font-semibold">{notifications.length}</p>
            </div>
            <Bell className="h-8 w-8 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Unread</p>
              <p className="mt-1 text-3xl font-semibold">{unreadCount}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Read</p>
              <p className="mt-1 text-3xl font-semibold">{notifications.length - unreadCount}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-primary" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_360px]">
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="flex w-full flex-wrap justify-start">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="weather">Weather</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="task">Tasks</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          {["all", "weather", "inventory", "task", "system"].map((type) => (
            <TabsContent key={type} value={type}>
              <Card>
                <CardContent className="p-4 space-y-3">
                  {filterByType(type).length > 0 ? (
                    <>
                      {filterByType(type).map(renderNotification)}
                      {type === "all" && totalPages > 1 && (
                        <div className="pt-2">
                          <div className="mb-3 text-xs text-muted-foreground">
                            Showing {pagination.from}-{pagination.to} of {pagination.total}
                          </div>
                          <Pagination>
                            <PaginationContent>
                              <PaginationItem>
                                <PaginationPrevious
                                  href="#"
                                  aria-disabled={currentPage === 1}
                                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                                  onClick={(event) => {
                                    event.preventDefault();
                                    if (currentPage > 1) {
                                      void handleRefresh(currentPage - 1);
                                    }
                                  }}
                                />
                              </PaginationItem>
                              {visiblePages.map((page, index) => {
                                const prev = visiblePages[index - 1];
                                const showEllipsis = prev && page - prev > 1;

                                return (
                                  <React.Fragment key={page}>
                                    {showEllipsis && (
                                      <PaginationItem>
                                        <PaginationEllipsis />
                                      </PaginationItem>
                                    )}
                                    <PaginationItem>
                                      <PaginationLink
                                        href="#"
                                        isActive={page === currentPage}
                                        onClick={(event) => {
                                          event.preventDefault();
                                          if (page !== currentPage) {
                                            void handleRefresh(page);
                                          }
                                        }}
                                      >
                                        {page}
                                      </PaginationLink>
                                    </PaginationItem>
                                  </React.Fragment>
                                );
                              })}
                              <PaginationItem>
                                <PaginationNext
                                  href="#"
                                  aria-disabled={currentPage === totalPages}
                                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                                  onClick={(event) => {
                                    event.preventDefault();
                                    if (currentPage < totalPages) {
                                      void handleRefresh(currentPage + 1);
                                    }
                                  }}
                                />
                              </PaginationItem>
                            </PaginationContent>
                          </Pagination>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bell className="w-10 h-10 mx-auto mb-3 opacity-40" />
                      <p className="text-sm">No notifications</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        <Card className="h-fit">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              <CardTitle>Notification Settings</CardTitle>
            </div>
            <CardDescription>Manage how alerts reach you across the platform.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {isSettingsLoading || !effectiveSettings ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3 rounded-lg border p-4">
                  <div>
                    <Label htmlFor="notifications_enabled">All Notifications</Label>
                    <p className="text-sm text-muted-foreground">Master switch for in-app alerts.</p>
                  </div>
                  <Switch
                    id="notifications_enabled"
                    checked={effectiveSettings.notifications_enabled}
                    onCheckedChange={(value) => handleSettingsChange("notifications_enabled", value)}
                  />
                </div>
                <div className="flex items-center justify-between gap-3 rounded-lg border p-4">
                  <div className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <Label htmlFor="email_notifications">Email Alerts</Label>
                      <p className="text-sm text-muted-foreground">Receive activity updates by email.</p>
                    </div>
                  </div>
                  <Switch
                    id="email_notifications"
                    checked={effectiveSettings.email_notifications}
                    onCheckedChange={(value) => handleSettingsChange("email_notifications", value)}
                  />
                </div>
                <div className="flex items-center justify-between gap-3 rounded-lg border p-4">
                  <div className="flex items-start gap-3">
                    <Smartphone className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <Label htmlFor="sms_notifications">SMS Alerts</Label>
                      <p className="text-sm text-muted-foreground">Send critical reminders to your phone.</p>
                    </div>
                  </div>
                  <Switch
                    id="sms_notifications"
                    checked={effectiveSettings.sms_notifications}
                    onCheckedChange={(value) => handleSettingsChange("sms_notifications", value)}
                  />
                </div>
                <div className="flex items-center justify-between gap-3 rounded-lg border p-4">
                  <div>
                    <Label htmlFor="push_notifications">Push Alerts</Label>
                    <p className="text-sm text-muted-foreground">Keep browser or device notifications enabled.</p>
                  </div>
                  <Switch
                    id="push_notifications"
                    checked={effectiveSettings.push_notifications}
                    onCheckedChange={(value) => handleSettingsChange("push_notifications", value)}
                  />
                </div>
                <Button className="w-full" disabled={isSavingSettings} onClick={() => void handleSettingsSave()}>
                  {isSavingSettings ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Notification Settings"
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
};

export default Notifications;

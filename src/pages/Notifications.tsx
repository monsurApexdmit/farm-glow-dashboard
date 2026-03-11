import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, CloudRain, AlertTriangle, CheckCircle, Package, Clock, X } from "lucide-react";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: "weather" | "inventory" | "task" | "system";
  severity: "info" | "warning" | "critical";
  time: string;
  read: boolean;
}

const initialNotifications: Notification[] = [
  { id: 1, title: "Storm Warning", message: "Heavy rain expected in the next 6 hours. Consider covering sensitive crops.", type: "weather", severity: "critical", time: "10 min ago", read: false },
  { id: 2, title: "Low Fertilizer Stock", message: "Fertilizer inventory has dropped below 20%. Reorder recommended.", type: "inventory", severity: "warning", time: "1 hour ago", read: false },
  { id: 3, title: "Harvest Task Due", message: "Corn harvest in East Paddock is scheduled for tomorrow.", type: "task", severity: "info", time: "2 hours ago", read: false },
  { id: 4, title: "Equipment Maintenance", message: "Tractor #3 is due for scheduled maintenance this week.", type: "task", severity: "warning", time: "3 hours ago", read: false },
  { id: 5, title: "Frost Alert", message: "Temperature expected to drop below 2°C tonight. Protect seedlings.", type: "weather", severity: "critical", time: "5 hours ago", read: true },
  { id: 6, title: "Seed Delivery Confirmed", message: "Your order of 500kg wheat seeds will arrive on March 15.", type: "system", severity: "info", time: "Yesterday", read: true },
  { id: 7, title: "Feed Stock Low", message: "Animal feed supplies at 15%. Place order soon.", type: "inventory", severity: "warning", time: "Yesterday", read: true },
  { id: 8, title: "Worker Schedule Updated", message: "3 workers reassigned to North Field for irrigation work.", type: "system", severity: "info", time: "2 days ago", read: true },
];

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

const Notifications = () => {
  const [notifications, setNotifications] = useState(initialNotifications);

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const dismiss = (id: number) => setNotifications((prev) => prev.filter((n) => n.id !== id));
  const markRead = (id: number) => setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filterByType = (type: string) =>
    type === "all" ? notifications : notifications.filter((n) => n.type === type);

  const renderNotification = (n: Notification) => {
    const Icon = typeIcons[n.type];
    return (
      <div
        key={n.id}
        onClick={() => markRead(n.id)}
        className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
          n.read ? "bg-card border-border opacity-75" : `${severityStyles[n.severity]} border`
        }`}
      >
        <div className={`p-2 rounded-lg flex-shrink-0 ${n.read ? "bg-muted" : severityStyles[n.severity]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`text-sm font-semibold ${n.read ? "text-foreground" : ""}`}>{n.title}</p>
            {!n.read && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
          <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
        </div>
        <Button variant="ghost" size="icon" className="flex-shrink-0 h-7 w-7" onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}>
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 p-6 overflow-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold font-display">Notifications</h1>
              {unreadCount > 0 && (
                <Badge variant="destructive">{unreadCount} new</Badge>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={markAllRead}>Mark All Read</Button>
          </div>

          <Tabs defaultValue="all">
            <TabsList>
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
                      filterByType(type).map(renderNotification)
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
        </main>
      </div>
    </div>
  );
};

export default Notifications;

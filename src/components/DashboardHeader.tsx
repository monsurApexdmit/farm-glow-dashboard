import { useMemo, useState } from "react";
import {
  Moon,
  Sun,
  Bell,
  Search,
  User,
  Settings,
  LogOut,
  CreditCard,
  Loader,
  CheckCircle,
  CloudRain,
  Package,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useNotifications } from "@/context/NotificationContext";
import { BackendNotification } from "@/services/notification.service";

interface HeaderNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  icon: typeof Bell;
}

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

const mapNotification = (notification: BackendNotification): HeaderNotification => {
  const text = `${notification.title || ""} ${notification.message || ""}`.toLowerCase();
  let icon = CheckCircle;

  if (text.includes("rain") || text.includes("storm") || text.includes("frost") || text.includes("weather")) {
    icon = CloudRain;
  } else if (text.includes("stock") || text.includes("inventory") || text.includes("feed") || text.includes("seed")) {
    icon = Package;
  } else if (text.includes("task") || text.includes("schedule") || text.includes("maintenance") || text.includes("harvest")) {
    icon = Clock;
  } else if (notification.type === "alert" || notification.type === "warning") {
    icon = AlertTriangle;
  }

  return {
    id: String(notification.id),
    title: notification.title || "Notification",
    message: notification.message || "",
    time: relativeTime(notification.created_at),
    unread: !notification.is_read && !notification.read_at,
    icon,
  };
};

const profileMenuItems = [
  { icon: User, label: "My Profile", path: "/settings" },
  { icon: Settings, label: "Settings", path: "/settings" },
  { icon: CreditCard, label: "Billing", path: "/finances" },
];

export function DashboardHeader() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications();
  const [profileOpen, setProfileOpen] = useState(false);

  const recentNotifications = useMemo(
    () => notifications.slice(0, 5).map(mapNotification),
    [notifications]
  );

  const getInitials = () => {
    if (!user) return "U";
    return `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase() || "U";
  };

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
    navigate("/signin");
  };

  return (
    <>
      <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold font-display">Dashboard</h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-9 pr-4 py-2 text-sm bg-muted border-none rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            />
          </div>

          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
                <Bell className="w-5 h-5 text-muted-foreground" />
                {unreadCount > 0 && (
                  <>
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
                    <span className="absolute -top-1 -right-1 min-w-4 rounded-full bg-destructive px-1 text-[10px] font-semibold leading-4 text-destructive-foreground">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  </>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h4 className="text-sm font-semibold">Notifications</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={unreadCount === 0}
                  className="text-xs text-muted-foreground h-auto p-0 hover:text-foreground"
                  onClick={() => void markAllAsRead()}
                >
                  Mark all read
                </Button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : recentNotifications.length ? (
                  recentNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors border-b border-border last:border-0 ${notification.unread ? "bg-primary/5" : ""}`}
                      onClick={async () => {
                        if (notification.unread) {
                          await markAsRead(notification.id);
                        }
                        navigate("/notifications");
                      }}
                    >
                      <div className="mt-0.5 rounded-md bg-muted p-2">
                        <notification.icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{notification.title}</p>
                          {notification.unread && <div className="h-2 w-2 rounded-full bg-primary" />}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{notification.time}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No notifications yet.
                  </div>
                )}
              </div>
              <div className="border-t border-border p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-sm"
                  onClick={() => navigate("/notifications")}
                >
                  View all notifications
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <Moon className="w-5 h-5 text-muted-foreground" />
            ) : (
              <Sun className="w-5 h-5 text-muted-foreground" />
            )}
          </button>

          {/* Avatar - opens profile drawer */}
          <button
            onClick={() => setProfileOpen(true)}
            className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            {getInitials()}
          </button>
        </div>
      </header>

      {/* Profile Drawer */}
      <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
        <SheetContent className="w-80 sm:w-96">
          <SheetHeader className="items-center text-center pb-4">
            <Avatar className="w-20 h-20 mb-2">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">{getInitials()}</AvatarFallback>
            </Avatar>
            <SheetTitle>{user ? `${user.first_name} ${user.last_name}` : "User"}</SheetTitle>
            <SheetDescription>{user?.email}</SheetDescription>
          </SheetHeader>

          <Separator />

          <div className="py-4 space-y-1">
            {profileMenuItems.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setProfileOpen(false);
                  navigate(item.path);
                }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm hover:bg-muted transition-colors text-foreground"
              >
                <item.icon className="w-4 h-4 text-muted-foreground" />
                {item.label}
              </button>
            ))}
          </div>

          <Separator />

          <div className="py-4">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm hover:bg-destructive/10 transition-colors text-destructive"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          </div>

          <Separator />

          <div className="py-4">
            <p className="text-xs text-muted-foreground text-center">Green Valley Farm</p>
            <p className="text-xs text-muted-foreground text-center mt-1">AgriFarm v1.0</p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

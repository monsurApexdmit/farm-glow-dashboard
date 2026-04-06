import { useState } from "react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Sprout,
  Warehouse,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Leaf,
  Calendar,
  Bug,
  DollarSign,
  Map,
  Bell,
  Home,
  BarChart4,
  LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Crops", url: "/crops", icon: Sprout },
  { title: "Livestock", url: "/livestock", icon: Bug },
  { title: "Livestock Sheds", url: "/livestock-sheds", icon: Home },
  { title: "Livestock Inventory", url: "/livestock-inventory", icon: BarChart4 },
  { title: "Inventory", url: "/inventory", icon: Warehouse },
  { title: "Field Map", url: "/field-map", icon: Map },
  { title: "Schedule", url: "/schedule", icon: Calendar },
  { title: "Workers", url: "/workers", icon: Users },
  { title: "Finances", url: "/finances", icon: DollarSign },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside
      className={`${
        collapsed ? "w-16" : "w-64"
      } bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col transition-all duration-300 min-h-screen`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
          <Leaf className="w-5 h-5 text-sidebar-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="font-display font-bold text-lg tracking-tight">
            AgriFarm
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.url;
          return (
            <NavLink
              key={item.url}
              to={item.url}
              end
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? ""
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
              activeClassName="bg-sidebar-accent text-sidebar-primary"
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <button
        onClick={() => navigate("/signin")}
        className="flex items-center gap-3 mx-2 mb-2 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10 transition-colors"
      >
        <LogOut className="w-5 h-5 flex-shrink-0" />
        {!collapsed && <span>Logout</span>}
      </button>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-12 border-t border-sidebar-border text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}

import { Sprout, Droplets, AlertTriangle, CheckCircle2 } from "lucide-react";

const activities = [
  {
    icon: Sprout,
    title: "Wheat field B3 planted",
    time: "2 hours ago",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Droplets,
    title: "Irrigation completed — Zone A",
    time: "4 hours ago",
    color: "text-chart-blue",
    bg: "bg-chart-blue/10",
  },
  {
    icon: AlertTriangle,
    title: "Pest alert in corn field C1",
    time: "6 hours ago",
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    icon: CheckCircle2,
    title: "Harvest completed — Rice D2",
    time: "Yesterday",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Droplets,
    title: "Fertilizer applied — Field A2",
    time: "Yesterday",
    color: "text-chart-brown",
    bg: "bg-chart-brown/10",
  },
];

export function RecentActivity() {
  return (
    <div className="bg-card border border-border rounded-xl p-5 animate-fade-in" style={{ animationDelay: "500ms" }}>
      <h3 className="font-display font-semibold text-base mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.map((activity, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-lg ${activity.bg} flex items-center justify-center flex-shrink-0`}>
              <activity.icon className={`w-4 h-4 ${activity.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{activity.title}</p>
              <p className="text-xs text-muted-foreground">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { PageShell } from "@/components/PageShell";
import { StatCard } from "@/components/StatCard";
import { CropYieldChart, RevenueChart } from "@/components/DashboardCharts";
import { WeatherWidget } from "@/components/WeatherWidget";
import { RecentActivity } from "@/components/RecentActivity";
import { Sprout, TrendingUp, Users, Warehouse } from "lucide-react";

const Index = () => {
  return (
    <PageShell>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Total Crops"
              value="24"
              change="↑ 3 new this season"
              changeType="positive"
              icon={Sprout}
              delay={0}
            />
            <StatCard
              title="Revenue"
              value="$128,400"
              change="↑ 12.5% from last month"
              changeType="positive"
              icon={TrendingUp}
              delay={50}
            />
            <StatCard
              title="Workers"
              value="48"
              change="2 on leave"
              changeType="neutral"
              icon={Users}
              delay={100}
            />
            <StatCard
              title="Storage Used"
              value="72%"
              change="↑ 8% this week"
              changeType="negative"
              icon={Warehouse}
              delay={150}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <CropYieldChart />
            <RevenueChart />
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <WeatherWidget />
            <div className="lg:col-span-2">
              <RecentActivity />
            </div>
          </div>
    </PageShell>
  );
};

export default Index;

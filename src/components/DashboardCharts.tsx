import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

const yieldData = [
  { month: "Jan", wheat: 40, corn: 24, rice: 30 },
  { month: "Feb", wheat: 30, corn: 28, rice: 35 },
  { month: "Mar", wheat: 45, corn: 35, rice: 28 },
  { month: "Apr", wheat: 50, corn: 40, rice: 42 },
  { month: "May", wheat: 55, corn: 48, rice: 45 },
  { month: "Jun", wheat: 60, corn: 52, rice: 50 },
];

const revenueData = [
  { month: "Jan", revenue: 12000 },
  { month: "Feb", revenue: 15000 },
  { month: "Mar", revenue: 18000 },
  { month: "Apr", revenue: 22000 },
  { month: "May", revenue: 28000 },
  { month: "Jun", revenue: 32000 },
];

export function CropYieldChart() {
  return (
    <div className="bg-card border border-border rounded-xl p-5 animate-fade-in" style={{ animationDelay: "200ms" }}>
      <h3 className="font-display font-semibold text-base mb-4">Crop Yield (tons)</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={yieldData} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Bar dataKey="wheat" fill="hsl(var(--chart-green))" radius={[4, 4, 0, 0]} />
          <Bar dataKey="corn" fill="hsl(var(--chart-gold))" radius={[4, 4, 0, 0]} />
          <Bar dataKey="rice" fill="hsl(var(--chart-brown))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RevenueChart() {
  return (
    <div className="bg-card border border-border rounded-xl p-5 animate-fade-in" style={{ animationDelay: "300ms" }}>
      <h3 className="font-display font-semibold text-base mb-4">Revenue Trend</h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={revenueData}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#revenueGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

import { useState } from "react";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, TrendingUp, DollarSign, Sprout, Bug } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// --- Mock Data ---
const monthlyRevenue = [
  { month: "Jan", revenue: 12400, expenses: 8200 },
  { month: "Feb", revenue: 15200, expenses: 9100 },
  { month: "Mar", revenue: 18300, expenses: 10500 },
  { month: "Apr", revenue: 22100, expenses: 11800 },
  { month: "May", revenue: 19800, expenses: 10200 },
  { month: "Jun", revenue: 25600, expenses: 12400 },
  { month: "Jul", revenue: 28900, expenses: 13100 },
  { month: "Aug", revenue: 31200, expenses: 14200 },
  { month: "Sep", revenue: 27400, expenses: 12800 },
  { month: "Oct", revenue: 23100, expenses: 11500 },
  { month: "Nov", revenue: 20500, expenses: 10800 },
  { month: "Dec", revenue: 18200, expenses: 9600 },
];

const cropYieldData = [
  { crop: "Wheat", yield: 4200, target: 4500 },
  { crop: "Corn", yield: 5800, target: 5500 },
  { crop: "Rice", yield: 3100, target: 3800 },
  { crop: "Barley", yield: 2900, target: 3000 },
  { crop: "Soybeans", yield: 3600, target: 3200 },
  { crop: "Oats", yield: 2100, target: 2400 },
];

const livestockDistribution = [
  { name: "Cattle", value: 120, color: "hsl(var(--chart-green))" },
  { name: "Poultry", value: 350, color: "hsl(var(--chart-gold))" },
  { name: "Sheep", value: 85, color: "hsl(var(--chart-blue))" },
  { name: "Goats", value: 65, color: "hsl(var(--chart-brown))" },
  { name: "Pigs", value: 45, color: "hsl(var(--chart-red))" },
];

const inventoryTrend = [
  { month: "Jan", seeds: 82, fertilizer: 75, equipment: 90, feed: 68 },
  { month: "Feb", seeds: 78, fertilizer: 70, equipment: 88, feed: 72 },
  { month: "Mar", seeds: 45, fertilizer: 60, equipment: 85, feed: 65 },
  { month: "Apr", seeds: 30, fertilizer: 45, equipment: 82, feed: 55 },
  { month: "May", seeds: 65, fertilizer: 80, equipment: 80, feed: 78 },
  { month: "Jun", seeds: 90, fertilizer: 85, equipment: 78, feed: 82 },
];

const workerProductivity = [
  { month: "Jan", tasks: 142, hours: 1680 },
  { month: "Feb", tasks: 158, hours: 1520 },
  { month: "Mar", tasks: 175, hours: 1840 },
  { month: "Apr", tasks: 192, hours: 1920 },
  { month: "May", tasks: 168, hours: 1760 },
  { month: "Jun", tasks: 205, hours: 2000 },
];

const revenueConfig = {
  revenue: { label: "Revenue", color: "hsl(var(--chart-green))" },
  expenses: { label: "Expenses", color: "hsl(var(--chart-red))" },
};

const cropConfig = {
  yield: { label: "Actual Yield", color: "hsl(var(--chart-green))" },
  target: { label: "Target", color: "hsl(var(--chart-gold))" },
};

const inventoryConfig = {
  seeds: { label: "Seeds", color: "hsl(var(--chart-green))" },
  fertilizer: { label: "Fertilizer", color: "hsl(var(--chart-gold))" },
  equipment: { label: "Equipment", color: "hsl(var(--chart-blue))" },
  feed: { label: "Feed", color: "hsl(var(--chart-brown))" },
};

const productivityConfig = {
  tasks: { label: "Tasks Completed", color: "hsl(var(--chart-green))" },
  hours: { label: "Hours Worked", color: "hsl(var(--chart-blue))" },
};

const Reports = () => {
  const [period, setPeriod] = useState("yearly");
  const { toast } = useToast();

  const totalRevenue = monthlyRevenue.reduce((s, m) => s + m.revenue, 0);
  const totalExpenses = monthlyRevenue.reduce((s, m) => s + m.expenses, 0);
  const totalYield = cropYieldData.reduce((s, c) => s + c.yield, 0);
  const totalAnimals = livestockDistribution.reduce((s, l) => s + l.value, 0);

  const handleExport = () => {
    toast({ title: "Report exported", description: "Your report has been downloaded." });
  };

  return (
    <PageShell>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card><CardContent className="p-4 flex items-center gap-3"><DollarSign className="w-8 h-8 text-primary" /><div><p className="text-sm text-muted-foreground">Total Revenue</p><p className="text-2xl font-bold">${(totalRevenue / 1000).toFixed(0)}K</p></div></CardContent></Card>
            <Card><CardContent className="p-4 flex items-center gap-3"><TrendingUp className="w-8 h-8 text-primary" /><div><p className="text-sm text-muted-foreground">Net Profit</p><p className="text-2xl font-bold">${((totalRevenue - totalExpenses) / 1000).toFixed(0)}K</p></div></CardContent></Card>
            <Card><CardContent className="p-4 flex items-center gap-3"><Sprout className="w-8 h-8 text-accent" /><div><p className="text-sm text-muted-foreground">Total Yield</p><p className="text-2xl font-bold">{(totalYield / 1000).toFixed(1)}K kg</p></div></CardContent></Card>
            <Card><CardContent className="p-4 flex items-center gap-3"><Bug className="w-8 h-8 text-accent" /><div><p className="text-sm text-muted-foreground">Total Livestock</p><p className="text-2xl font-bold">{totalAnimals}</p></div></CardContent></Card>
          </div>

          {/* Controls */}
          <div className="flex gap-3 mb-6">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleExport}><Download className="w-4 h-4 mr-1" />Export Report</Button>
          </div>

          <Tabs defaultValue="financial" className="space-y-4">
            <TabsList>
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="crops">Crops</TabsTrigger>
              <TabsTrigger value="livestock">Livestock</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="workers">Workers</TabsTrigger>
            </TabsList>

            {/* Financial Tab */}
            <TabsContent value="financial">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue vs Expenses</CardTitle>
                  <CardDescription>Monthly financial overview for the current year</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={revenueConfig} className="h-[350px] w-full">
                    <BarChart data={monthlyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000}K`} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Crops Tab */}
            <TabsContent value="crops">
              <Card>
                <CardHeader>
                  <CardTitle>Crop Yield vs Target</CardTitle>
                  <CardDescription>Actual yield compared to seasonal targets (kg)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={cropConfig} className="h-[350px] w-full">
                    <BarChart data={cropYieldData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tickLine={false} axisLine={false} />
                      <YAxis dataKey="crop" type="category" tickLine={false} axisLine={false} width={80} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="yield" fill="var(--color-yield)" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="target" fill="var(--color-target)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Livestock Tab */}
            <TabsContent value="livestock">
              <Card>
                <CardHeader>
                  <CardTitle>Livestock Distribution</CardTitle>
                  <CardDescription>Current animal population by type</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col lg:flex-row items-center gap-8">
                  <div className="w-full lg:w-1/2 h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={livestockDistribution} cx="50%" cy="50%" outerRadius={110} innerRadius={60} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {livestockDistribution.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-3 w-full lg:w-1/2">
                    {livestockDistribution.map((item) => (
                      <div key={item.name} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm font-medium">{item.name}</span>
                        <span className="ml-auto font-bold">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Inventory Tab */}
            <TabsContent value="inventory">
              <Card>
                <CardHeader>
                  <CardTitle>Inventory Stock Levels</CardTitle>
                  <CardDescription>Stock level trends over the past 6 months (%)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={inventoryConfig} className="h-[350px] w-full">
                    <AreaChart data={inventoryTrend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area type="monotone" dataKey="seeds" stroke="var(--color-seeds)" fill="var(--color-seeds)" fillOpacity={0.15} />
                      <Area type="monotone" dataKey="fertilizer" stroke="var(--color-fertilizer)" fill="var(--color-fertilizer)" fillOpacity={0.15} />
                      <Area type="monotone" dataKey="equipment" stroke="var(--color-equipment)" fill="var(--color-equipment)" fillOpacity={0.15} />
                      <Area type="monotone" dataKey="feed" stroke="var(--color-feed)" fill="var(--color-feed)" fillOpacity={0.15} />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Workers Tab */}
            <TabsContent value="workers">
              <Card>
                <CardHeader>
                  <CardTitle>Worker Productivity</CardTitle>
                  <CardDescription>Tasks completed and hours worked per month</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={productivityConfig} className="h-[350px] w-full">
                    <LineChart data={workerProductivity}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} />
                      <YAxis yAxisId="left" tickLine={false} axisLine={false} />
                      <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line yAxisId="left" type="monotone" dataKey="tasks" stroke="var(--color-tasks)" strokeWidth={2} dot={{ r: 4 }} />
                      <Line yAxisId="right" type="monotone" dataKey="hours" stroke="var(--color-hours)" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
    </PageShell>
  );
};

export default Reports;

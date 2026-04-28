import { useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, TrendingUp, DollarSign, Sprout, Bug, Loader } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { financeService } from "@/services/finance.service";
import { cropService } from "@/services/crop.service";
import { livestockService } from "@/services/livestock.service";
import { inventoryService } from "@/services/inventory.service";
import { workerService } from "@/services/worker.service";
import { scheduleService } from "@/services/schedule.service";
import { Crop } from "@/types/common";

const revenueConfig = {
  revenue: { label: "Revenue", color: "hsl(var(--chart-green))" },
  expenses: { label: "Expenses", color: "hsl(var(--chart-red))" },
};

const cropConfig = {
  yield: { label: "Actual Yield", color: "hsl(var(--chart-green))" },
  target: { label: "Target", color: "hsl(var(--chart-gold))" },
};

const inventoryConfig = {
  quantity: { label: "Quantity", color: "hsl(var(--chart-green))" },
  value: { label: "Value", color: "hsl(var(--chart-blue))" },
};

const productivityConfig = {
  tasks: { label: "Tasks Completed", color: "hsl(var(--chart-green))" },
  hours: { label: "Hours Worked", color: "hsl(var(--chart-blue))" },
};

const pieColors = [
  "hsl(var(--chart-green))",
  "hsl(var(--chart-gold))",
  "hsl(var(--chart-blue))",
  "hsl(var(--chart-brown))",
  "hsl(var(--chart-red))",
  "hsl(var(--primary))",
];

const Reports = () => {
  const [period, setPeriod] = useState("yearly");
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [livestockSummary, setLivestockSummary] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [transactionsData, cropsData, livestockData, inventoryData, workersData, schedulesData] = await Promise.all([
        financeService.getTransactions(),
        cropService.getCrops(),
        livestockService.getInventorySummary(),
        inventoryService.getItems(),
        workerService.getWorkers(),
        scheduleService.getSchedules(),
      ]);
      setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
      setCrops(Array.isArray(cropsData) ? cropsData : []);
      setLivestockSummary(Array.isArray(livestockData) ? livestockData : []);
      setInventoryItems(Array.isArray(inventoryData) ? inventoryData : []);
      setWorkers(Array.isArray(workersData) ? workersData : []);
      setSchedules(Array.isArray(schedulesData) ? schedulesData : []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load reports data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const periodMonths = period === "monthly" ? 1 : period === "quarterly" ? 3 : 12;

  const filteredTransactions = useMemo(() => {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - (periodMonths - 1));
    cutoff.setDate(1);
    return transactions.filter((transaction) => {
      const date = transaction.transaction_date ? new Date(transaction.transaction_date) : null;
      return date && date >= cutoff;
    });
  }, [transactions, periodMonths]);

  const monthlyRevenue = useMemo(() => {
    const months = new Map<string, { month: string; revenue: number; expenses: number; sortKey: string }>();
    filteredTransactions.forEach((transaction) => {
      const date = (transaction.transaction_date || "").split("T")[0];
      if (!date) return;
      const key = date.slice(0, 7);
      const month = new Date(date).toLocaleDateString(undefined, { month: "short" });
      const row = months.get(key) || { month, revenue: 0, expenses: 0, sortKey: key };
      const amount = Number(transaction.amount) || 0;
      const isRevenue = transaction.account?.type === "revenue" || amount > 0;
      if (isRevenue) row.revenue += Math.abs(amount);
      else row.expenses += Math.abs(amount);
      months.set(key, row);
    });
    return [...months.values()].sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [filteredTransactions]);

  const cropYieldData = useMemo(
    () =>
      crops.slice(0, 8).map((crop) => ({
        crop: crop.name,
        yield: Number(crop.actual_yield ?? crop.estimated_yield ?? crop.target_yield ?? 0),
        target: Number(crop.target_yield ?? crop.estimated_yield ?? 0),
      })),
    [crops]
  );

  const livestockDistribution = useMemo(() => {
    const grouped = livestockSummary.reduce<Record<string, number>>((acc, entry) => {
      const key = entry.label || entry.type || entry.name || "Livestock";
      const value = Number(entry.count ?? entry.total ?? entry.quantity ?? 0);
      acc[key] = (acc[key] || 0) + value;
      return acc;
    }, {});
    return Object.entries(grouped).map(([name, value], index) => ({
      name,
      value,
      color: pieColors[index % pieColors.length],
    }));
  }, [livestockSummary]);

  const inventorySnapshot = useMemo(() => {
    const grouped = inventoryItems.reduce<Record<string, { quantity: number; value: number }>>((acc, item) => {
      const key = item.category?.name || item.name || "Inventory";
      acc[key] = acc[key] || { quantity: 0, value: 0 };
      acc[key].quantity += Number(item.quantity || 0);
      acc[key].value += Number(item.total_value || item.quantity * item.cost_per_unit || 0);
      return acc;
    }, {});
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, quantity: value.quantity, value: value.value }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 6);
  }, [inventoryItems]);

  const workerProductivity = useMemo(() => {
    const months = new Map<string, { month: string; tasks: number; hours: number; sortKey: string }>();
    schedules.forEach((schedule) => {
      const date = (schedule.work_date || schedule.scheduled_date || "").split("T")[0];
      if (!date) return;
      const key = date.slice(0, 7);
      const row = months.get(key) || {
        month: new Date(date).toLocaleDateString(undefined, { month: "short" }),
        tasks: 0,
        hours: 0,
        sortKey: key,
      };
      row.tasks += schedule.status === "completed" ? 1 : 0;
      if (schedule.start_time && schedule.end_time) {
        const [sh, sm] = schedule.start_time.split(":").map(Number);
        const [eh, em] = schedule.end_time.split(":").map(Number);
        const hours = ((eh * 60 + em) - (sh * 60 + sm)) / 60;
        row.hours += Math.max(hours, 0);
      }
      months.set(key, row);
    });
    return [...months.values()].sort((a, b) => a.sortKey.localeCompare(b.sortKey)).slice(-6);
  }, [schedules]);

  const totalRevenue = monthlyRevenue.reduce((sum, entry) => sum + entry.revenue, 0);
  const totalExpenses = monthlyRevenue.reduce((sum, entry) => sum + entry.expenses, 0);
  const totalYield = cropYieldData.reduce((sum, entry) => sum + entry.yield, 0);
  const totalAnimals = livestockDistribution.reduce((sum, entry) => sum + entry.value, 0);

  const handleExport = () => {
    const headers = ["Metric", "Value"];
    const rows = [
      ["Total Revenue", totalRevenue],
      ["Net Profit", totalRevenue - totalExpenses],
      ["Total Yield", totalYield],
      ["Total Livestock", totalAnimals],
      ["Workers", workers.length],
      ["Schedules", schedules.length],
    ];
    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reports-${period}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "Report exported", description: "Your report has been downloaded." });
  };

  if (loading) {
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="p-4 flex items-center gap-3"><DollarSign className="w-8 h-8 text-primary" /><div><p className="text-sm text-muted-foreground">Total Revenue</p><p className="text-2xl font-bold">${(totalRevenue / 1000).toFixed(0)}K</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><TrendingUp className="w-8 h-8 text-primary" /><div><p className="text-sm text-muted-foreground">Net Profit</p><p className="text-2xl font-bold">${((totalRevenue - totalExpenses) / 1000).toFixed(0)}K</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><Sprout className="w-8 h-8 text-accent" /><div><p className="text-sm text-muted-foreground">Total Yield</p><p className="text-2xl font-bold">{(totalYield / 1000).toFixed(1)}K kg</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><Bug className="w-8 h-8 text-accent" /><div><p className="text-sm text-muted-foreground">Total Livestock</p><p className="text-2xl font-bold">{totalAnimals}</p></div></CardContent></Card>
      </div>

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

        <TabsContent value="financial">
          <Card>
            <CardHeader>
              <CardTitle>Revenue vs Expenses</CardTitle>
              <CardDescription>Aggregated from recorded financial transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={revenueConfig} className="h-[350px] w-full">
                <BarChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `$${value / 1000}K`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="crops">
          <Card>
            <CardHeader>
              <CardTitle>Crop Yield vs Target</CardTitle>
              <CardDescription>Actual yield compared to crop targets</CardDescription>
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
                      {livestockDistribution.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
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

        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Snapshot</CardTitle>
              <CardDescription>Current inventory quantities and estimated value by category</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={inventoryConfig} className="h-[350px] w-full">
                <AreaChart data={inventorySnapshot}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="quantity" stroke="var(--color-quantity)" fill="var(--color-quantity)" fillOpacity={0.15} />
                  <Area type="monotone" dataKey="value" stroke="var(--color-value)" fill="var(--color-value)" fillOpacity={0.15} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workers">
          <Card>
            <CardHeader>
              <CardTitle>Worker Productivity</CardTitle>
              <CardDescription>Completed scheduled tasks and hours worked per month</CardDescription>
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

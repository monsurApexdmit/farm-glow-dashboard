import { useState } from "react";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const monthlyFinance = [
  { month: "Jan", income: 18200, expenses: 12400 },
  { month: "Feb", income: 21500, expenses: 14200 },
  { month: "Mar", income: 24800, expenses: 15600 },
  { month: "Apr", income: 19300, expenses: 13800 },
  { month: "May", income: 27600, expenses: 16200 },
  { month: "Jun", income: 31200, expenses: 18400 },
];

const expenseBreakdown = [
  { name: "Labor", value: 35, color: "hsl(var(--chart-green))" },
  { name: "Seeds & Feed", value: 22, color: "hsl(var(--chart-gold))" },
  { name: "Equipment", value: 18, color: "hsl(var(--chart-blue))" },
  { name: "Utilities", value: 12, color: "hsl(var(--chart-brown))" },
  { name: "Other", value: 13, color: "hsl(var(--chart-red))" },
];

const transactions = [
  { id: 1, desc: "Wheat sale – Buyer Co.", amount: 8500, type: "income", date: "Mar 10" },
  { id: 2, desc: "Fertilizer purchase", amount: -2200, type: "expense", date: "Mar 9" },
  { id: 3, desc: "Equipment maintenance", amount: -850, type: "expense", date: "Mar 8" },
  { id: 4, desc: "Corn sale – Local Market", amount: 4200, type: "income", date: "Mar 7" },
  { id: 5, desc: "Worker wages – March", amount: -12600, type: "expense", date: "Mar 6" },
  { id: 6, desc: "Livestock sale – 5 cattle", amount: 15000, type: "income", date: "Mar 5" },
  { id: 7, desc: "Irrigation repair", amount: -1400, type: "expense", date: "Mar 4" },
  { id: 8, desc: "Organic cert. fee", amount: -600, type: "expense", date: "Mar 3" },
];

const financeConfig = {
  income: { label: "Income", color: "hsl(var(--chart-green))" },
  expenses: { label: "Expenses", color: "hsl(var(--chart-red))" },
};

const Finances = () => {
  const { toast } = useToast();
  const totalIncome = monthlyFinance.reduce((s, m) => s + m.income, 0);
  const totalExpenses = monthlyFinance.reduce((s, m) => s + m.expenses, 0);
  const netProfit = totalIncome - totalExpenses;

  return (
    <PageShell>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold font-display">Finances</h1>
            <Button size="sm" onClick={() => toast({ title: "Coming soon", description: "Transaction form will be available with Cloud enabled." })}>
              <Plus className="w-4 h-4 mr-1" /> Add Transaction
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10"><DollarSign className="w-6 h-6 text-primary" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Income</p>
                  <p className="text-2xl font-bold">${(totalIncome / 1000).toFixed(1)}K</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-primary ml-auto" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10"><TrendingDown className="w-6 h-6 text-destructive" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                  <p className="text-2xl font-bold">${(totalExpenses / 1000).toFixed(1)}K</p>
                </div>
                <ArrowDownRight className="w-4 h-4 text-destructive ml-auto" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10"><TrendingUp className="w-6 h-6 text-accent" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Net Profit</p>
                  <p className="text-2xl font-bold">${(netProfit / 1000).toFixed(1)}K</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Income vs Expenses Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Income vs Expenses</CardTitle>
                <CardDescription>Monthly comparison (6 months)</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={financeConfig} className="h-[300px] w-full">
                  <BarChart data={monthlyFinance}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000}K`} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Expense Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Expense Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={expenseBreakdown} cx="50%" cy="50%" outerRadius={80} innerRadius={45} dataKey="value">
                        {expenseBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <ChartTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-2">
                  {expenseBreakdown.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-medium">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-md ${t.type === "income" ? "bg-primary/10" : "bg-destructive/10"}`}>
                        {t.type === "income" ? <ArrowUpRight className="w-4 h-4 text-primary" /> : <ArrowDownRight className="w-4 h-4 text-destructive" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{t.desc}</p>
                        <p className="text-xs text-muted-foreground">{t.date}</p>
                      </div>
                    </div>
                    <span className={`font-semibold ${t.type === "income" ? "text-primary" : "text-destructive"}`}>
                      {t.type === "income" ? "+" : ""}${Math.abs(t.amount).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
    </PageShell>
  );
};

export default Finances;

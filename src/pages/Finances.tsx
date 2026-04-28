import { useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Plus, Loader } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Farm } from "@/types/common";
import { farmService } from "@/services/farm.service";
import { BackendAccount, BackendTransaction, financeService } from "@/services/finance.service";

interface TransactionForm {
  account_id: string;
  farm_id: string;
  category: string;
  description: string;
  amount: string;
  transaction_date: string;
  notes: string;
}

const emptyForm = (accounts: BackendAccount[], farms: Farm[]): TransactionForm => ({
  account_id: accounts[0]?.id || "",
  farm_id: farms[0]?.id || "",
  category: "",
  description: "",
  amount: "",
  transaction_date: new Date().toISOString().split("T")[0],
  notes: "",
});

const monthLabel = (dateString: string) =>
  new Date(dateString).toLocaleDateString(undefined, { month: "short" });

const financeConfig = {
  income: { label: "Income", color: "hsl(var(--chart-green))" },
  expenses: { label: "Expenses", color: "hsl(var(--chart-red))" },
};

const expenseColors = [
  "hsl(var(--chart-green))",
  "hsl(var(--chart-gold))",
  "hsl(var(--chart-blue))",
  "hsl(var(--chart-brown))",
  "hsl(var(--chart-red))",
  "hsl(var(--primary))",
];

const Finances = () => {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<BackendTransaction[]>([]);
  const [accounts, setAccounts] = useState<BackendAccount[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<TransactionForm>(emptyForm([], []));

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [transactionsData, accountsData, farmsData] = await Promise.all([
        financeService.getTransactions(),
        financeService.getAccounts(),
        farmService.getFarms(),
      ]);
      const safeTransactions = Array.isArray(transactionsData) ? transactionsData : [];
      const safeAccounts = Array.isArray(accountsData) ? accountsData : [];
      const safeFarms = Array.isArray(farmsData) ? farmsData : [];
      setTransactions(safeTransactions);
      setAccounts(safeAccounts);
      setFarms(safeFarms);
      setForm((current) => ({
        ...current,
        account_id: current.account_id || safeAccounts[0]?.id || "",
        farm_id: current.farm_id || safeFarms[0]?.id || "",
      }));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load finances",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const normalizedTransactions = useMemo(
    () =>
      [...transactions]
        .map((transaction) => {
          const account = accounts.find((item) => item.id === transaction.account_id) || transaction.account;
          const type = account?.type === "revenue" || Number(transaction.amount) > 0 ? "income" : "expense";
          return {
            ...transaction,
            displayAmount: Math.abs(Number(transaction.amount) || 0),
            type,
          };
        })
        .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()),
    [transactions, accounts]
  );

  const monthlyFinance = useMemo(() => {
    const monthMap = new Map<string, { month: string; income: number; expenses: number; sortKey: string }>();
    normalizedTransactions.forEach((transaction) => {
      const date = transaction.transaction_date?.split("T")[0];
      if (!date) return;
      const key = date.slice(0, 7);
      const current = monthMap.get(key) || { month: monthLabel(date), income: 0, expenses: 0, sortKey: key };
      if (transaction.type === "income") current.income += Number(transaction.displayAmount);
      else current.expenses += Number(transaction.displayAmount);
      monthMap.set(key, current);
    });
    return [...monthMap.values()].sort((a, b) => a.sortKey.localeCompare(b.sortKey)).slice(-6);
  }, [normalizedTransactions]);

  const expenseBreakdown = useMemo(() => {
    const grouped = normalizedTransactions
      .filter((transaction) => transaction.type === "expense")
      .reduce<Record<string, number>>((acc, transaction) => {
        const key = transaction.category || "Other";
        acc[key] = (acc[key] || 0) + Number(transaction.displayAmount);
        return acc;
      }, {});
    const total = Object.values(grouped).reduce((sum, value) => sum + value, 0);
    return Object.entries(grouped)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value], index) => ({
        name,
        rawValue: value,
        value: total > 0 ? Number(((value / total) * 100).toFixed(1)) : 0,
        color: expenseColors[index % expenseColors.length],
      }));
  }, [normalizedTransactions]);

  const totalIncome = normalizedTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + transaction.displayAmount, 0);
  const totalExpenses = normalizedTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + transaction.displayAmount, 0);
  const netProfit = totalIncome - totalExpenses;

  const handleOpenAdd = () => {
    setForm(emptyForm(accounts, farms));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.account_id || !form.farm_id || !form.description.trim() || !form.category.trim() || !form.amount) {
      toast({
        title: "Missing fields",
        description: "Account, farm, description, category, and amount are required.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await financeService.createTransaction({
        account_id: form.account_id,
        farm_id: form.farm_id,
        category: form.category.trim(),
        description: form.description.trim(),
        amount: Number(form.amount),
        transaction_date: form.transaction_date,
        notes: form.notes || undefined,
      });
      toast({ title: "Transaction added" });
      setDialogOpen(false);
      await loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save transaction",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-display">Finances</h1>
        <Button size="sm" onClick={handleOpenAdd}>
          <Plus className="w-4 h-4 mr-1" /> Add Transaction
        </Button>
      </div>

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
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Income vs Expenses</CardTitle>
            <CardDescription>Monthly comparison from recorded transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={financeConfig} className="h-[300px] w-full">
              <BarChart data={monthlyFinance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `$${value / 1000}K`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expenseBreakdown} cx="50%" cy="50%" outerRadius={80} innerRadius={45} dataKey="rawValue">
                    {expenseBreakdown.map((entry, index) => <Cell key={index} fill={entry.color} />)}
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {normalizedTransactions.slice(0, 8).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-md ${transaction.type === "income" ? "bg-primary/10" : "bg-destructive/10"}`}>
                    {transaction.type === "income" ? <ArrowUpRight className="w-4 h-4 text-primary" /> : <ArrowDownRight className="w-4 h-4 text-destructive" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{transaction.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(transaction.transaction_date).toLocaleDateString()} · {transaction.category}
                    </p>
                  </div>
                </div>
                <span className={`font-semibold ${transaction.type === "income" ? "text-primary" : "text-destructive"}`}>
                  {transaction.type === "income" ? "+" : "-"}${transaction.displayAmount.toLocaleString()}
                </span>
              </div>
            ))}
            {normalizedTransactions.length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">No transactions found.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
            <DialogDescription>Create a financial transaction using the backend accounts and farms.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Account</Label>
                <Select value={form.account_id} onValueChange={(value) => setForm({ ...form, account_id: value })}>
                  <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Farm</Label>
                <Select value={form.farm_id} onValueChange={(value) => setForm({ ...form, farm_id: value })}>
                  <SelectTrigger><SelectValue placeholder="Select farm" /></SelectTrigger>
                  <SelectContent>
                    {farms.map((farm) => <SelectItem key={farm.id} value={farm.id}>{farm.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
              <div><Label>Amount</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
            </div>
            <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div><Label>Date</Label><Input type="date" value={form.transaction_date} onChange={(e) => setForm({ ...form, transaction_date: e.target.value })} /></div>
            <div><Label>Notes</Label><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Add Transaction"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
};

export default Finances;

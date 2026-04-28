import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Warehouse, Package, AlertTriangle, RefreshCw, TrendingDown, TrendingUp, History } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { PageHeader } from "@/components/PageHeader";
import { StatCards } from "@/components/StatCards";
import { SearchFilterBar } from "@/components/SearchFilterBar";
import { FormModal } from "@/components/FormModal";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { TableActions } from "@/components/TableActions";
import { useToast } from "@/hooks/use-toast";
import { inventoryService, BackendInventoryItem, BackendCategory, BackendSupplier } from "@/services/inventory.service";
import { farmService } from "@/services/farm.service";
import { Farm } from "@/types/common";

type StockStatus = "in-stock" | "low-stock" | "out-of-stock";

const stockBadgeMap: Record<StockStatus, { label: string; className: string }> = {
  "in-stock":     { label: "In Stock",     className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  "low-stock":    { label: "Low Stock",    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  "out-of-stock": { label: "Out of Stock", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};

const units = ["kg", "liters", "bags", "pieces", "boxes", "tons", "bottles", "sets", "rolls", "packs"];

function getStockStatus(item: BackendInventoryItem): StockStatus {
  const qty = Number(item.quantity);
  const min = Number(item.min_quantity ?? item.reorder_point?.reorder_point ?? 0);
  if (qty === 0) return "out-of-stock";
  if (qty <= min) return "low-stock";
  return "in-stock";
}

function fmt(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const emptyForm = () => ({
  name: "", sku: "", category_id: "", supplier_id: "", unit: "kg",
  quantity: 0, min_quantity: 0, max_quantity: 0, cost_per_unit: 0,
  location: "", description: "", expiry_date: "", farm_id: "",
});

export default function Inventory() {
  const { toast } = useToast();

  // Data
  const [items, setItems]       = useState<BackendInventoryItem[]>([]);
  const [categories, setCategories] = useState<BackendCategory[]>([]);
  const [suppliers, setSuppliers]   = useState<BackendSupplier[]>([]);
  const [farms, setFarms]           = useState<Farm[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);

  // Filters
  const [search, setSearch]               = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStock, setFilterStock]       = useState("all");

  // Dialogs
  const [dialogOpen, setDialogOpen]   = useState(false);
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [form, setForm]               = useState(emptyForm());
  const [deleteId, setDeleteId]       = useState<string | null>(null);

  // Use / Restock quick dialog
  const [txDialog, setTxDialog]   = useState<{ type: "use" | "restock"; item: BackendInventoryItem } | null>(null);
  const [txQty, setTxQty]         = useState("");
  const [txNotes, setTxNotes]     = useState("");
  const [txCost, setTxCost]       = useState("");

  // Transaction history dialog
  const [historyItem, setHistoryItem]     = useState<BackendInventoryItem | null>(null);
  const [historyData, setHistoryData]     = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [itemsData, catsData, supsData, farmsData, value] = await Promise.all([
        inventoryService.getItems(),
        inventoryService.getCategories(),
        inventoryService.getSuppliers(),
        farmService.getFarms(),
        inventoryService.getTotalValue(),
      ]);
      setItems(itemsData);
      setCategories(catsData);
      setSuppliers(supsData);
      setFarms(Array.isArray(farmsData) ? farmsData : []);
      setTotalValue(value);
    } catch {
      toast({ title: "Failed to load inventory", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filtered = useMemo(() =>
    items.filter((item) => {
      const catName = item.category?.name ?? "";
      const supName = item.supplier?.name ?? "";
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
        supName.toLowerCase().includes(search.toLowerCase()) ||
        item.sku.toLowerCase().includes(search.toLowerCase());
      const matchCat   = filterCategory === "all" || item.category_id === filterCategory;
      const matchStock = filterStock === "all" || getStockStatus(item) === filterStock;
      return matchSearch && matchCat && matchStock;
    }), [items, search, filterCategory, filterStock]);

  const stats = useMemo(() => ({
    total:      items.length,
    lowStock:   items.filter(i => getStockStatus(i) === "low-stock").length,
    outOfStock: items.filter(i => getStockStatus(i) === "out-of-stock").length,
  }), [items]);

  // ── Add / Edit ─────────────────────────────────────────────────
  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm(), farm_id: farms[0]?.id ?? "" });
    setDialogOpen(true);
  };

  const openEdit = (item: BackendInventoryItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name, sku: item.sku,
      category_id: item.category_id, supplier_id: item.supplier_id ?? "",
      unit: item.unit, quantity: Number(item.quantity),
      min_quantity: Number(item.min_quantity ?? 0),
      max_quantity: Number(item.max_quantity ?? 0),
      cost_per_unit: Number(item.cost_per_unit),
      location: item.location ?? "", description: item.description ?? "",
      expiry_date: item.expiry_date?.split("T")[0] ?? "",
      farm_id: item.farm_id,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.category_id || !form.farm_id) {
      toast({ title: "Name, category and farm are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        ...form,
        supplier_id: form.supplier_id || undefined,
        expiry_date: form.expiry_date || undefined,
        description: form.description || undefined,
      };
      if (editingId) {
        await inventoryService.updateItem(editingId, payload);
        toast({ title: "Item updated" });
      } else {
        await inventoryService.createItem(payload);
        toast({ title: "Item added" });
      }
      setDialogOpen(false);
      await loadData();
    } catch (err: any) {
      toast({ title: "Failed to save item", description: err?.response?.data?.message ?? err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await inventoryService.deleteItem(deleteId);
      toast({ title: "Item deleted" });
      await loadData();
    } catch {
      toast({ title: "Failed to delete item", variant: "destructive" });
    } finally {
      setDeleteId(null);
    }
  };

  // ── Use / Restock ──────────────────────────────────────────────
  const openTx = (type: "use" | "restock", item: BackendInventoryItem) => {
    setTxDialog({ type, item });
    setTxQty(""); setTxNotes(""); setTxCost(String(item.cost_per_unit));
  };

  const handleTx = async () => {
    if (!txDialog || !txQty || Number(txQty) <= 0) {
      toast({ title: "Enter a valid quantity", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (txDialog.type === "use") {
        await inventoryService.recordUse(txDialog.item.id, Number(txQty), txNotes || undefined);
        toast({ title: "Usage recorded" });
      } else {
        await inventoryService.recordRestock(txDialog.item.id, Number(txQty), txCost ? Number(txCost) : undefined, txNotes || undefined);
        toast({ title: "Restock recorded" });
      }
      setTxDialog(null);
      await loadData();
    } catch (err: any) {
      toast({ title: "Failed to record transaction", description: err?.response?.data?.error ?? err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ── Transaction History ────────────────────────────────────────
  const openHistory = async (item: BackendInventoryItem) => {
    setHistoryItem(item);
    setHistoryLoading(true);
    try {
      const txs = await inventoryService.getItemTransactions(item.id);
      setHistoryData(txs);
    } catch {
      setHistoryData([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // ── CSV Export ─────────────────────────────────────────────────
  const exportCSV = () => {
    const headers = ["Name", "SKU", "Category", "Quantity", "Unit", "Min Stock", "Cost/Unit", "Total Value", "Supplier", "Location", "Status"];
    const rows = filtered.map(i => [
      i.name, i.sku, i.category?.name ?? "", i.quantity, i.unit,
      i.min_quantity ?? "", i.cost_per_unit, i.total_value ?? "",
      i.supplier?.name ?? "", i.location ?? "", getStockStatus(i),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "inventory.csv"; a.click();
  };

  const categoryOptions = [
    { value: "all", label: "All Categories" },
    ...categories.map(c => ({ value: c.id, label: `${c.icon ?? ""} ${c.name}`.trim() })),
  ];

  const txTypeColors: Record<string, string> = {
    use: "text-red-600", restock: "text-green-600",
    adjustment: "text-blue-600", loss: "text-orange-600",
  };

  return (
    <PageShell>
      <PageHeader
        title="Inventory Management"
        description="Track farm supplies, equipment, and stock levels"
        extra={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Warehouse className="w-7 h-7 text-primary" />
          </div>
        }
        addLabel="Add Item"
        onAdd={openAdd}
        onExport={exportCSV}
      />

      <StatCards columns="grid-cols-2 md:grid-cols-4" stats={[
        { label: "Total Items",   value: stats.total },
        { label: "Total Value",   value: `$${fmt(totalValue)}` },
        { label: "Low Stock",     value: stats.lowStock,   color: "text-yellow-600", icon: <AlertTriangle className="w-4 h-4 text-yellow-500" /> },
        { label: "Out of Stock",  value: stats.outOfStock, color: "text-destructive" },
      ]} />

      <SearchFilterBar
        search={search} onSearch={setSearch} searchPlaceholder="Search by name, SKU or supplier..."
        filters={[
          { value: filterCategory, onChange: setFilterCategory, placeholder: "Category", width: "w-[180px]", options: categoryOptions },
          { value: filterStock,    onChange: setFilterStock,    placeholder: "Stock",    width: "w-[160px]",
            options: [{ value: "all", label: "All Status" }, { value: "in-stock", label: "In Stock" }, { value: "low-stock", label: "Low Stock" }, { value: "out-of-stock", label: "Out of Stock" }] },
        ]}
      />

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cost/Unit</TableHead>
                <TableHead>Total Value</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 10 }).map((_, j) => (
                      <TableCell key={j}><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No items found
                  </TableCell>
                </TableRow>
              ) : filtered.map((item) => {
                const status = getStockStatus(item);
                const badge  = stockBadgeMap[status];
                const expiringSoon = item.expiry_date && new Date(item.expiry_date) < new Date(Date.now() + 30 * 864e5);
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <div>{item.name}</div>
                      {expiringSoon && (
                        <span className="text-xs text-orange-500">⚠ Expires {item.expiry_date?.split("T")[0]}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.sku}</TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {item.category?.icon} {item.category?.name ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={Number(item.quantity) === 0 ? "text-destructive font-semibold" : ""}>
                        {item.quantity} {item.unit}
                      </span>
                      {item.min_quantity != null && (
                        <div className="text-xs text-muted-foreground">min: {item.min_quantity}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={badge.className}>{badge.label}</Badge>
                    </TableCell>
                    <TableCell>${fmt(Number(item.cost_per_unit))}</TableCell>
                    <TableCell>${fmt(Number(item.total_value ?? 0))}</TableCell>
                    <TableCell className="text-sm">{item.supplier?.name ?? "—"}</TableCell>
                    <TableCell className="text-sm">{item.location ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:text-green-700" title="Restock" onClick={() => openTx("restock", item)}>
                          <TrendingUp className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-orange-500 hover:text-orange-600" title="Record Use" onClick={() => openTx("use", item)}>
                          <TrendingDown className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-500 hover:text-blue-600" title="History" onClick={() => openHistory(item)}>
                          <History className="w-3.5 h-3.5" />
                        </Button>
                        <TableActions onEdit={() => openEdit(item)} onDelete={() => setDeleteId(item.id)} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Add / Edit Modal ──────────────────────────────────── */}
      <FormModal
        open={dialogOpen} onOpenChange={setDialogOpen}
        title={editingId ? "Edit Item" : "Add New Item"}
        onSave={handleSave}
        saveLabel={saving ? "Saving..." : editingId ? "Save Changes" : "Add Item"}
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Corn Seeds" />
          </div>
          <div className="space-y-1.5">
            <Label>SKU *</Label>
            <Input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="e.g. SEED-001" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Category *</Label>
            <Select value={form.category_id} onValueChange={v => setForm({ ...form, category_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Supplier</Label>
            <Select value={form.supplier_id || "none"} onValueChange={v => setForm({ ...form, supplier_id: v === "none" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Supplier</SelectItem>
                {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Farm *</Label>
            <Select value={form.farm_id} onValueChange={v => setForm({ ...form, farm_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select farm" /></SelectTrigger>
              <SelectContent>
                {farms.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Unit *</Label>
            <Select value={form.unit} onValueChange={v => setForm({ ...form, unit: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>Quantity</Label>
            <Input type="number" min="0" value={form.quantity} onChange={e => setForm({ ...form, quantity: +e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Min Stock</Label>
            <Input type="number" min="0" value={form.min_quantity} onChange={e => setForm({ ...form, min_quantity: +e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Max Stock</Label>
            <Input type="number" min="0" value={form.max_quantity} onChange={e => setForm({ ...form, max_quantity: +e.target.value })} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Cost per Unit ($)</Label>
            <Input type="number" min="0" step="0.01" value={form.cost_per_unit} onChange={e => setForm({ ...form, cost_per_unit: +e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Expiry Date</Label>
            <Input type="date" value={form.expiry_date} onChange={e => setForm({ ...form, expiry_date: e.target.value })} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Location</Label>
          <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Warehouse A" />
        </div>

        <div className="space-y-1.5">
          <Label>Description</Label>
          <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional notes..." />
        </div>
      </FormModal>

      {/* ── Use / Restock Dialog ──────────────────────────────── */}
      <Dialog open={!!txDialog} onOpenChange={open => !open && setTxDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {txDialog?.type === "use"
                ? <><TrendingDown className="w-4 h-4 text-orange-500" /> Record Usage</>
                : <><TrendingUp className="w-4 h-4 text-green-600" /> Restock</>}
            </DialogTitle>
            <DialogDescription>{txDialog?.item.name} — current: {txDialog?.item.quantity} {txDialog?.item.unit}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Quantity ({txDialog?.item.unit})</Label>
              <Input type="number" min="0.001" step="0.001" value={txQty} onChange={e => setTxQty(e.target.value)} placeholder="0" autoFocus />
            </div>
            {txDialog?.type === "restock" && (
              <div className="space-y-1.5">
                <Label>Cost per Unit ($)</Label>
                <Input type="number" min="0" step="0.01" value={txCost} onChange={e => setTxCost(e.target.value)} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input value={txNotes} onChange={e => setTxNotes(e.target.value)} placeholder="Optional..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTxDialog(null)}>Cancel</Button>
            <Button onClick={handleTx} disabled={saving}>
              {saving ? "Saving..." : txDialog?.type === "use" ? "Record Use" : "Restock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Transaction History Dialog ────────────────────────── */}
      <Dialog open={!!historyItem} onOpenChange={open => !open && setHistoryItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-4 h-4" /> Transaction History
            </DialogTitle>
            <DialogDescription>{historyItem?.name}</DialogDescription>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto">
            {historyLoading ? (
              <div className="py-8 text-center text-muted-foreground text-sm">Loading...</div>
            ) : historyData.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">No transactions yet</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Before → After</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyData.map((tx: any) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-xs">{tx.transaction_date}</TableCell>
                      <TableCell>
                        <span className={`text-xs font-semibold capitalize ${txTypeColors[tx.type] ?? ""}`}>{tx.type}</span>
                      </TableCell>
                      <TableCell className="text-sm">{tx.quantity}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{tx.quantity_before} → {tx.quantity_after}</TableCell>
                      <TableCell className="text-xs">{tx.notes ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}
        onConfirm={handleDelete} title="Delete Item"
        description="Are you sure? This action cannot be undone."
      />
    </PageShell>
  );
}

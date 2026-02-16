import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Warehouse, Plus, Search, Download, Pencil, Trash2, Package, AlertTriangle,
} from "lucide-react";

type ItemCategory = "Seeds" | "Fertilizer" | "Equipment" | "Feed" | "Medicine" | "Tools" | "Other";
type StockStatus = "in-stock" | "low-stock" | "out-of-stock";

interface InventoryItem {
  id: string;
  name: string;
  category: ItemCategory;
  quantity: number;
  unit: string;
  minStock: number;
  costPerUnit: number;
  supplier: string;
  location: string;
  lastRestocked: string;
}

const categories: ItemCategory[] = ["Seeds", "Fertilizer", "Equipment", "Feed", "Medicine", "Tools", "Other"];
const units = ["kg", "liters", "bags", "pieces", "boxes", "tons", "bottles"];

const getStockStatus = (item: InventoryItem): StockStatus => {
  if (item.quantity === 0) return "out-of-stock";
  if (item.quantity <= item.minStock) return "low-stock";
  return "in-stock";
};

const stockBadge = (status: StockStatus) => {
  const map: Record<StockStatus, { label: string; className: string }> = {
    "in-stock": { label: "In Stock", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
    "low-stock": { label: "Low Stock", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
    "out-of-stock": { label: "Out of Stock", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  };
  const { label, className } = map[status];
  return <Badge variant="outline" className={className}>{label}</Badge>;
};

const initialItems: InventoryItem[] = [
  { id: "1", name: "Corn Seeds", category: "Seeds", quantity: 50, unit: "bags", minStock: 10, costPerUnit: 25, supplier: "AgriSupply Co", location: "Warehouse A", lastRestocked: "2026-01-15" },
  { id: "2", name: "NPK Fertilizer", category: "Fertilizer", quantity: 8, unit: "bags", minStock: 15, costPerUnit: 40, supplier: "FarmChem Ltd", location: "Warehouse B", lastRestocked: "2026-01-20" },
  { id: "3", name: "Tractor Fuel", category: "Other", quantity: 200, unit: "liters", minStock: 50, costPerUnit: 1.5, supplier: "PetroFarm", location: "Fuel Depot", lastRestocked: "2026-02-01" },
  { id: "4", name: "Cattle Feed", category: "Feed", quantity: 0, unit: "kg", minStock: 100, costPerUnit: 0.8, supplier: "FeedMaster", location: "Barn Storage", lastRestocked: "2026-01-10" },
  { id: "5", name: "Veterinary Vaccine", category: "Medicine", quantity: 30, unit: "bottles", minStock: 10, costPerUnit: 15, supplier: "VetPharm", location: "Cold Storage", lastRestocked: "2026-02-05" },
  { id: "6", name: "Irrigation Hose", category: "Equipment", quantity: 5, unit: "pieces", minStock: 3, costPerUnit: 120, supplier: "IrriTech", location: "Warehouse A", lastRestocked: "2025-12-20" },
];

const emptyForm = (): Omit<InventoryItem, "id"> => ({
  name: "", category: "Seeds", quantity: 0, unit: "kg", minStock: 0, costPerUnit: 0, supplier: "", location: "", lastRestocked: new Date().toISOString().split("T")[0],
});

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStock, setFilterStock] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState<Omit<InventoryItem, "id">>(emptyForm());

  const filtered = items.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.supplier.toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory === "all" || item.category === filterCategory;
    const matchStock = filterStock === "all" || getStockStatus(item) === filterStock;
    return matchSearch && matchCategory && matchStock;
  });

  const openAdd = () => { setEditingItem(null); setForm(emptyForm()); setDialogOpen(true); };
  const openEdit = (item: InventoryItem) => { setEditingItem(item); const { id, ...rest } = item; setForm(rest); setDialogOpen(true); };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editingItem) {
      setItems((prev) => prev.map((i) => (i.id === editingItem.id ? { ...i, ...form } : i)));
    } else {
      setItems((prev) => [...prev, { ...form, id: crypto.randomUUID() }]);
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteId) setItems((prev) => prev.filter((i) => i.id !== deleteId));
    setDeleteId(null);
  };

  const exportCSV = () => {
    const headers = ["Name", "Category", "Quantity", "Unit", "Min Stock", "Cost/Unit", "Supplier", "Location", "Last Restocked", "Status"];
    const rows = filtered.map((i) => [i.name, i.category, i.quantity, i.unit, i.minStock, i.costPerUnit, i.supplier, i.location, i.lastRestocked, getStockStatus(i)]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "inventory.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const totalValue = items.reduce((sum, i) => sum + i.quantity * i.costPerUnit, 0);
  const lowStockCount = items.filter((i) => getStockStatus(i) === "low-stock").length;
  const outOfStockCount = items.filter((i) => getStockStatus(i) === "out-of-stock").length;

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
              <Warehouse className="w-8 h-8 text-primary" /> Inventory Management
            </h1>
            <p className="text-muted-foreground mt-1">Track farm supplies, equipment, and stock levels</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCSV}><Download className="w-4 h-4 mr-1" />Export</Button>
            <Button onClick={openAdd}><Plus className="w-4 h-4 mr-1" />Add Item</Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Items</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-foreground">{items.length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-foreground">${totalValue.toLocaleString()}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1"><AlertTriangle className="w-4 h-4 text-yellow-500" />Low Stock</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-yellow-600">{lowStockCount}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Out of Stock</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">{outOfStockCount}</div></CardContent></Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search items..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterStock} onValueChange={setFilterStock}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Stock" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="in-stock">In Stock</SelectItem>
                  <SelectItem value="low-stock">Low Stock</SelectItem>
                  <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cost/Unit</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground"><Package className="w-8 h-8 mx-auto mb-2 opacity-50" />No items found</TableCell></TableRow>
                ) : filtered.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.quantity} {item.unit}</TableCell>
                    <TableCell>{stockBadge(getStockStatus(item))}</TableCell>
                    <TableCell>${item.costPerUnit}</TableCell>
                    <TableCell>{item.supplier}</TableCell>
                    <TableCell>{item.location}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(item.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editingItem ? "Edit Item" : "Add New Item"}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as ItemCategory })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label>Quantity</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: +e.target.value })} /></div>
                <div><Label>Unit</Label>
                  <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{units.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Min Stock</Label><Input type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: +e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Cost per Unit ($)</Label><Input type="number" step="0.01" value={form.costPerUnit} onChange={(e) => setForm({ ...form, costPerUnit: +e.target.value })} /></div>
                <div><Label>Last Restocked</Label><Input type="date" value={form.lastRestocked} onChange={(e) => setForm({ ...form, lastRestocked: e.target.value })} /></div>
              </div>
              <div><Label>Supplier</Label><Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} /></div>
              <div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editingItem ? "Save Changes" : "Add Item"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Item</AlertDialogTitle>
              <AlertDialogDescription>Are you sure? This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}

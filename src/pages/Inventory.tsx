import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Warehouse, Package, AlertTriangle } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { PageHeader } from "@/components/PageHeader";
import { StatCards } from "@/components/StatCards";
import { SearchFilterBar } from "@/components/SearchFilterBar";
import { FormModal } from "@/components/FormModal";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { TableActions } from "@/components/TableActions";

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

const stockBadgeMap: Record<StockStatus, { label: string; className: string }> = {
  "in-stock":     { label: "In Stock",     className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  "low-stock":    { label: "Low Stock",    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  "out-of-stock": { label: "Out of Stock", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};

const initialItems: InventoryItem[] = [
  { id: "1", name: "Corn Seeds",          category: "Seeds",      quantity: 50,  unit: "bags",    minStock: 10,  costPerUnit: 25,   supplier: "AgriSupply Co", location: "Warehouse A",  lastRestocked: "2026-01-15" },
  { id: "2", name: "NPK Fertilizer",      category: "Fertilizer", quantity: 8,   unit: "bags",    minStock: 15,  costPerUnit: 40,   supplier: "FarmChem Ltd",  location: "Warehouse B",  lastRestocked: "2026-01-20" },
  { id: "3", name: "Tractor Fuel",        category: "Other",      quantity: 200, unit: "liters",  minStock: 50,  costPerUnit: 1.5,  supplier: "PetroFarm",     location: "Fuel Depot",   lastRestocked: "2026-02-01" },
  { id: "4", name: "Cattle Feed",         category: "Feed",       quantity: 0,   unit: "kg",      minStock: 100, costPerUnit: 0.8,  supplier: "FeedMaster",    location: "Barn Storage", lastRestocked: "2026-01-10" },
  { id: "5", name: "Veterinary Vaccine",  category: "Medicine",   quantity: 30,  unit: "bottles", minStock: 10,  costPerUnit: 15,   supplier: "VetPharm",      location: "Cold Storage", lastRestocked: "2026-02-05" },
  { id: "6", name: "Irrigation Hose",     category: "Equipment",  quantity: 5,   unit: "pieces",  minStock: 3,   costPerUnit: 120,  supplier: "IrriTech",      location: "Warehouse A",  lastRestocked: "2025-12-20" },
];

const emptyForm = (): Omit<InventoryItem, "id"> => ({
  name: "", category: "Seeds", quantity: 0, unit: "kg", minStock: 0,
  costPerUnit: 0, supplier: "", location: "", lastRestocked: new Date().toISOString().split("T")[0],
});

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStock, setFilterStock] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState<Omit<InventoryItem, "id">>(emptyForm());

  const filtered = items.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.supplier.toLowerCase().includes(search.toLowerCase());
    return matchSearch &&
      (filterCategory === "all" || item.category === filterCategory) &&
      (filterStock === "all" || getStockStatus(item) === filterStock);
  });

  const openAdd = () => { setEditingItem(null); setForm(emptyForm()); setDialogOpen(true); };
  const openEdit = (item: InventoryItem) => { setEditingItem(item); const { id, ...rest } = item; setForm(rest); setDialogOpen(true); };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editingItem) {
      setItems((prev) => prev.map((i) => i.id === editingItem.id ? { ...i, ...form } : i));
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

  const totalValue    = items.reduce((sum, i) => sum + i.quantity * i.costPerUnit, 0);
  const lowStockCount = items.filter((i) => getStockStatus(i) === "low-stock").length;
  const outOfStock    = items.filter((i) => getStockStatus(i) === "out-of-stock").length;

  return (
    <PageShell>
      <PageHeader title="Inventory Management" description="Track farm supplies, equipment, and stock levels"
        extra={<Warehouse className="w-7 h-7 text-primary" />} addLabel="Add Item" onAdd={openAdd} onExport={exportCSV} />

      <StatCards columns="grid-cols-2 md:grid-cols-4" stats={[
        { label: "Total Items",   value: items.length },
        { label: "Total Value",   value: `$${totalValue.toLocaleString()}` },
        { label: "Low Stock",     value: lowStockCount, color: "text-yellow-600", icon: <AlertTriangle className="w-4 h-4 text-yellow-500" /> },
        { label: "Out of Stock",  value: outOfStock,    color: "text-destructive" },
      ]} />

      <SearchFilterBar
        search={search} onSearch={setSearch} searchPlaceholder="Search items..."
        filters={[
          { value: filterCategory, onChange: setFilterCategory, placeholder: "Category", width: "w-[160px]",
            options: [{ value: "all", label: "All Categories" }, ...categories.map((c) => ({ value: c, label: c }))] },
          { value: filterStock, onChange: setFilterStock, placeholder: "Stock", width: "w-[160px]",
            options: [{ value: "all", label: "All Status" }, { value: "in-stock", label: "In Stock" }, { value: "low-stock", label: "Low Stock" }, { value: "out-of-stock", label: "Out of Stock" }] },
        ]}
      />

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
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />No items found
                </TableCell></TableRow>
              ) : filtered.map((item) => {
                const status = getStockStatus(item);
                const badge = stockBadgeMap[status];
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.quantity} {item.unit}</TableCell>
                    <TableCell><Badge variant="outline" className={badge.className}>{badge.label}</Badge></TableCell>
                    <TableCell>${item.costPerUnit}</TableCell>
                    <TableCell>{item.supplier}</TableCell>
                    <TableCell>{item.location}</TableCell>
                    <TableCell className="text-right"><TableActions onEdit={() => openEdit(item)} onDelete={() => setDeleteId(item.id)} /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <FormModal open={dialogOpen} onOpenChange={setDialogOpen} title={editingItem ? "Edit Item" : "Add New Item"}
        onSave={handleSave} saveLabel={editingItem ? "Save Changes" : "Add Item"}>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-sm font-medium">Name</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="text-sm font-medium">Category</label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as ItemCategory })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div><label className="text-sm font-medium">Quantity</label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: +e.target.value })} /></div>
          <div><label className="text-sm font-medium">Unit</label>
            <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{units.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><label className="text-sm font-medium">Min Stock</label><Input type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: +e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-sm font-medium">Cost per Unit ($)</label><Input type="number" step="0.01" value={form.costPerUnit} onChange={(e) => setForm({ ...form, costPerUnit: +e.target.value })} /></div>
          <div><label className="text-sm font-medium">Last Restocked</label><Input type="date" value={form.lastRestocked} onChange={(e) => setForm({ ...form, lastRestocked: e.target.value })} /></div>
        </div>
        <div><label className="text-sm font-medium">Supplier</label><Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} /></div>
        <div><label className="text-sm font-medium">Location</label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
      </FormModal>

      <DeleteConfirmDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete} title="Delete Item" description="Are you sure? This action cannot be undone." />
    </PageShell>
  );
}

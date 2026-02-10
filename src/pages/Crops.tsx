import { useState, useMemo } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Download, Pencil, Trash2, Sprout } from "lucide-react";
import { toast } from "sonner";

export type CropStatus = "planted" | "growing" | "harvesting" | "harvested";
export type Season = "spring" | "summer" | "fall" | "winter";

export interface Crop {
  id: string;
  name: string;
  variety: string;
  fieldArea: string;
  plantedDate: string;
  expectedHarvest: string;
  status: CropStatus;
  season: Season;
  yieldEstimate: string;
  notes: string;
}

const initialCrops: Crop[] = [
  { id: "1", name: "Wheat", variety: "Hard Red", fieldArea: "Field A - 12 acres", plantedDate: "2025-10-15", expectedHarvest: "2026-06-20", status: "growing", season: "fall", yieldEstimate: "45 bu/acre", notes: "Winter wheat, good condition" },
  { id: "2", name: "Corn", variety: "Sweet Corn", fieldArea: "Field B - 8 acres", plantedDate: "2026-03-20", expectedHarvest: "2026-08-15", status: "planted", season: "spring", yieldEstimate: "180 bu/acre", notes: "Planted with new hybrid seeds" },
  { id: "3", name: "Soybeans", variety: "Roundup Ready", fieldArea: "Field C - 15 acres", plantedDate: "2026-01-10", expectedHarvest: "2026-05-30", status: "harvesting", season: "winter", yieldEstimate: "50 bu/acre", notes: "Ready for first harvest pass" },
  { id: "4", name: "Rice", variety: "Jasmine", fieldArea: "Field D - 10 acres", plantedDate: "2025-06-01", expectedHarvest: "2025-11-15", status: "harvested", season: "summer", yieldEstimate: "7,500 lbs/acre", notes: "Excellent yield this year" },
  { id: "5", name: "Tomatoes", variety: "Roma", fieldArea: "Field E - 3 acres", plantedDate: "2026-02-01", expectedHarvest: "2026-06-01", status: "growing", season: "spring", yieldEstimate: "25 tons/acre", notes: "Greenhouse start, transplanted" },
  { id: "6", name: "Potatoes", variety: "Russet", fieldArea: "Field F - 6 acres", plantedDate: "2026-01-20", expectedHarvest: "2026-05-20", status: "growing", season: "winter", yieldEstimate: "400 cwt/acre", notes: "Irrigated field" },
];

const statusConfig: Record<CropStatus, { label: string; className: string }> = {
  planted: { label: "Planted", className: "bg-chart-blue/15 text-chart-blue border-chart-blue/30" },
  growing: { label: "Growing", className: "bg-primary/15 text-primary border-primary/30" },
  harvesting: { label: "Harvesting", className: "bg-accent/15 text-accent border-accent/30" },
  harvested: { label: "Harvested", className: "bg-chart-brown/15 text-chart-brown border-chart-brown/30" },
};

const emptyForm: Omit<Crop, "id"> = {
  name: "", variety: "", fieldArea: "", plantedDate: "", expectedHarvest: "",
  status: "planted", season: "spring", yieldEstimate: "", notes: "",
};

const Crops = () => {
  const [crops, setCrops] = useState<Crop[]>(initialCrops);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [seasonFilter, setSeasonFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCrop, setEditingCrop] = useState<Crop | null>(null);
  const [deletingCrop, setDeletingCrop] = useState<Crop | null>(null);
  const [form, setForm] = useState<Omit<Crop, "id">>(emptyForm);

  const filtered = useMemo(() => {
    return crops.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.variety.toLowerCase().includes(search.toLowerCase()) ||
        c.fieldArea.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      const matchSeason = seasonFilter === "all" || c.season === seasonFilter;
      return matchSearch && matchStatus && matchSeason;
    });
  }, [crops, search, statusFilter, seasonFilter]);

  const openAdd = () => {
    setEditingCrop(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (crop: Crop) => {
    setEditingCrop(crop);
    setForm({ name: crop.name, variety: crop.variety, fieldArea: crop.fieldArea, plantedDate: crop.plantedDate, expectedHarvest: crop.expectedHarvest, status: crop.status, season: crop.season, yieldEstimate: crop.yieldEstimate, notes: crop.notes });
    setDialogOpen(true);
  };

  const openDelete = (crop: Crop) => {
    setDeletingCrop(crop);
    setDeleteDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.variety || !form.fieldArea) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (editingCrop) {
      setCrops((prev) => prev.map((c) => (c.id === editingCrop.id ? { ...c, ...form } : c)));
      toast.success(`${form.name} updated successfully`);
    } else {
      const newCrop: Crop = { ...form, id: Date.now().toString() };
      setCrops((prev) => [...prev, newCrop]);
      toast.success(`${form.name} added successfully`);
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deletingCrop) {
      setCrops((prev) => prev.filter((c) => c.id !== deletingCrop.id));
      toast.success(`${deletingCrop.name} deleted`);
    }
    setDeleteDialogOpen(false);
    setDeletingCrop(null);
  };

  const exportCSV = () => {
    const headers = ["Name", "Variety", "Field/Area", "Planted Date", "Expected Harvest", "Status", "Season", "Yield Estimate", "Notes"];
    const rows = filtered.map((c) => [c.name, c.variety, c.fieldArea, c.plantedDate, c.expectedHarvest, c.status, c.season, c.yieldEstimate, c.notes]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "crops_export.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported to CSV");
  };

  const updateStatus = (crop: Crop, newStatus: CropStatus) => {
    setCrops((prev) => prev.map((c) => (c.id === crop.id ? { ...c, status: newStatus } : c)));
    toast.success(`${crop.name} status updated to ${statusConfig[newStatus].label}`);
  };

  const counts = {
    total: crops.length,
    planted: crops.filter((c) => c.status === "planted").length,
    growing: crops.filter((c) => c.status === "growing").length,
    harvesting: crops.filter((c) => c.status === "harvesting").length,
    harvested: crops.filter((c) => c.status === "harvested").length,
  };

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 p-6 overflow-auto space-y-6">
          {/* Title */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold">Crop Management</h1>
              <p className="text-muted-foreground text-sm">Track and manage all your crops across fields</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download className="w-4 h-4 mr-1" /> Export
              </Button>
              <Button size="sm" onClick={openAdd}>
                <Plus className="w-4 h-4 mr-1" /> Add Crop
              </Button>
            </div>
          </div>

          {/* Status cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Total Crops", value: counts.total, color: "text-foreground" },
              { label: "Planted", value: counts.planted, color: "text-chart-blue" },
              { label: "Growing", value: counts.growing, color: "text-primary" },
              { label: "Harvesting", value: counts.harvesting, color: "text-accent" },
              { label: "Harvested", value: counts.harvested, color: "text-chart-brown" },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search crops..."
                      className="pl-9"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="planted">Planted</SelectItem>
                    <SelectItem value="growing">Growing</SelectItem>
                    <SelectItem value="harvesting">Harvesting</SelectItem>
                    <SelectItem value="harvested">Harvested</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={seasonFilter} onValueChange={setSeasonFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Season" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Seasons</SelectItem>
                    <SelectItem value="spring">Spring</SelectItem>
                    <SelectItem value="summer">Summer</SelectItem>
                    <SelectItem value="fall">Fall</SelectItem>
                    <SelectItem value="winter">Winter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Crop</TableHead>
                    <TableHead>Field / Area</TableHead>
                    <TableHead>Planted</TableHead>
                    <TableHead>Expected Harvest</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Yield Est.</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        <Sprout className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        No crops found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((crop) => (
                      <TableRow key={crop.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{crop.name}</p>
                            <p className="text-xs text-muted-foreground">{crop.variety}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{crop.fieldArea}</TableCell>
                        <TableCell className="text-sm">{crop.plantedDate}</TableCell>
                        <TableCell className="text-sm">{crop.expectedHarvest}</TableCell>
                        <TableCell>
                          <Select
                            value={crop.status}
                            onValueChange={(v) => updateStatus(crop, v as CropStatus)}
                          >
                            <SelectTrigger className="h-7 w-[120px] border-0 p-0">
                              <Badge variant="outline" className={statusConfig[crop.status].className}>
                                {statusConfig[crop.status].label}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="planted">Planted</SelectItem>
                              <SelectItem value="growing">Growing</SelectItem>
                              <SelectItem value="harvesting">Harvesting</SelectItem>
                              <SelectItem value="harvested">Harvested</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-sm">{crop.yieldEstimate}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(crop)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => openDelete(crop)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCrop ? "Edit Crop" : "Add New Crop"}</DialogTitle>
            <DialogDescription>{editingCrop ? "Update crop details below." : "Fill in the details for the new crop."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="crop-name">Crop Name *</Label>
                <Input id="crop-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Wheat" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="variety">Variety *</Label>
                <Input id="variety" value={form.variety} onChange={(e) => setForm({ ...form, variety: e.target.value })} placeholder="e.g. Hard Red" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="field">Field / Area *</Label>
              <Input id="field" value={form.fieldArea} onChange={(e) => setForm({ ...form, fieldArea: e.target.value })} placeholder="e.g. Field A - 12 acres" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="planted">Planted Date</Label>
                <Input id="planted" type="date" value={form.plantedDate} onChange={(e) => setForm({ ...form, plantedDate: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="harvest">Expected Harvest</Label>
                <Input id="harvest" type="date" value={form.expectedHarvest} onChange={(e) => setForm({ ...form, expectedHarvest: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as CropStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planted">Planted</SelectItem>
                    <SelectItem value="growing">Growing</SelectItem>
                    <SelectItem value="harvesting">Harvesting</SelectItem>
                    <SelectItem value="harvested">Harvested</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Season</Label>
                <Select value={form.season} onValueChange={(v) => setForm({ ...form, season: v as Season })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spring">Spring</SelectItem>
                    <SelectItem value="summer">Summer</SelectItem>
                    <SelectItem value="fall">Fall</SelectItem>
                    <SelectItem value="winter">Winter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="yield">Yield Estimate</Label>
              <Input id="yield" value={form.yieldEstimate} onChange={(e) => setForm({ ...form, yieldEstimate: e.target.value })} placeholder="e.g. 45 bu/acre" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingCrop ? "Save Changes" : "Add Crop"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deletingCrop?.name}?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. This crop record will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Crops;

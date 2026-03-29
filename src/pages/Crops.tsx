import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sprout } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { PageHeader } from "@/components/PageHeader";
import { StatCards } from "@/components/StatCards";
import { SearchFilterBar } from "@/components/SearchFilterBar";
import { FormModal } from "@/components/FormModal";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { TableActions, StatusSelect, StatusOption } from "@/components/TableActions";

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

const statusOptions: StatusOption[] = [
  { value: "planted",   label: "Planted",   className: "bg-chart-blue/15 text-chart-blue border-chart-blue/30" },
  { value: "growing",   label: "Growing",   className: "bg-primary/15 text-primary border-primary/30" },
  { value: "harvesting",label: "Harvesting",className: "bg-accent/15 text-accent border-accent/30" },
  { value: "harvested", label: "Harvested", className: "bg-chart-brown/15 text-chart-brown border-chart-brown/30" },
];

const seasonFilterOptions = [
  { value: "all", label: "All Seasons" },
  { value: "spring", label: "Spring" },
  { value: "summer", label: "Summer" },
  { value: "fall", label: "Fall" },
  { value: "winter", label: "Winter" },
];

const emptyForm: Omit<Crop, "id"> = {
  name: "", variety: "", fieldArea: "", plantedDate: "", expectedHarvest: "",
  status: "planted", season: "spring", yieldEstimate: "", notes: "",
};

const Crops = () => {
  const [crops, setCrops] = useState<Crop[]>(initialCrops);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [seasonFilter, setSeasonFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCrop, setEditingCrop] = useState<Crop | null>(null);
  const [deletingCrop, setDeletingCrop] = useState<Crop | null>(null);
  const [form, setForm] = useState<Omit<Crop, "id">>(emptyForm);

  const filtered = useMemo(() => crops.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.variety.toLowerCase().includes(search.toLowerCase()) ||
      c.fieldArea.toLowerCase().includes(search.toLowerCase());
    return matchSearch &&
      (statusFilter === "all" || c.status === statusFilter) &&
      (seasonFilter === "all" || c.season === seasonFilter);
  }), [crops, search, statusFilter, seasonFilter]);

  const counts = {
    total:      crops.length,
    planted:    crops.filter((c) => c.status === "planted").length,
    growing:    crops.filter((c) => c.status === "growing").length,
    harvesting: crops.filter((c) => c.status === "harvesting").length,
    harvested:  crops.filter((c) => c.status === "harvested").length,
  };

  const openAdd = () => { setEditingCrop(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (c: Crop) => { setEditingCrop(c); setForm({ name: c.name, variety: c.variety, fieldArea: c.fieldArea, plantedDate: c.plantedDate, expectedHarvest: c.expectedHarvest, status: c.status, season: c.season, yieldEstimate: c.yieldEstimate, notes: c.notes }); setDialogOpen(true); };
  const openDelete = (c: Crop) => { setDeletingCrop(c); setDeleteDialogOpen(true); };

  const handleSave = () => {
    if (!form.name || !form.variety || !form.fieldArea) { toast.error("Please fill in all required fields"); return; }
    if (editingCrop) {
      setCrops((prev) => prev.map((c) => c.id === editingCrop.id ? { ...c, ...form } : c));
      toast.success(`${form.name} updated successfully`);
    } else {
      setCrops((prev) => [...prev, { ...form, id: Date.now().toString() }]);
      toast.success(`${form.name} added successfully`);
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deletingCrop) { setCrops((prev) => prev.filter((c) => c.id !== deletingCrop.id)); toast.success(`${deletingCrop.name} deleted`); }
    setDeleteDialogOpen(false); setDeletingCrop(null);
  };

  const exportCSV = () => {
    const headers = ["Name", "Variety", "Field/Area", "Planted Date", "Expected Harvest", "Status", "Season", "Yield Estimate", "Notes"];
    const rows = filtered.map((c) => [c.name, c.variety, c.fieldArea, c.plantedDate, c.expectedHarvest, c.status, c.season, c.yieldEstimate, c.notes]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "crops_export.csv"; a.click();
    URL.revokeObjectURL(url); toast.success("Exported to CSV");
  };

  return (
    <PageShell>
      <PageHeader title="Crop Management" description="Track and manage all your crops across fields" addLabel="Add Crop" onAdd={openAdd} onExport={exportCSV} />

      <StatCards stats={[
        { label: "Total Crops",  value: counts.total,      color: "text-foreground" },
        { label: "Planted",      value: counts.planted,    color: "text-chart-blue" },
        { label: "Growing",      value: counts.growing,    color: "text-primary" },
        { label: "Harvesting",   value: counts.harvesting, color: "text-accent" },
        { label: "Harvested",    value: counts.harvested,  color: "text-chart-brown" },
      ]} />

      <SearchFilterBar
        search={search} onSearch={setSearch} searchPlaceholder="Search crops..."
        filters={[
          { value: statusFilter, onChange: setStatusFilter, placeholder: "Status",
            options: [{ value: "all", label: "All Status" }, ...statusOptions.map((s) => ({ value: s.value, label: s.label }))] },
          { value: seasonFilter, onChange: setSeasonFilter, placeholder: "Season", options: seasonFilterOptions },
        ]}
      />

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
                    <Sprout className="w-10 h-10 mx-auto mb-2 opacity-30" />No crops found
                  </TableCell>
                </TableRow>
              ) : filtered.map((crop) => (
                <TableRow key={crop.id}>
                  <TableCell><p className="font-medium">{crop.name}</p><p className="text-xs text-muted-foreground">{crop.variety}</p></TableCell>
                  <TableCell className="text-sm">{crop.fieldArea}</TableCell>
                  <TableCell className="text-sm">{crop.plantedDate}</TableCell>
                  <TableCell className="text-sm">{crop.expectedHarvest}</TableCell>
                  <TableCell>
                    <StatusSelect value={crop.status} options={statusOptions} width="w-[120px]"
                      onChange={(v) => { setCrops((prev) => prev.map((c) => c.id === crop.id ? { ...c, status: v as CropStatus } : c)); toast.success(`${crop.name} status updated`); }} />
                  </TableCell>
                  <TableCell className="text-sm">{crop.yieldEstimate}</TableCell>
                  <TableCell className="text-right"><TableActions onEdit={() => openEdit(crop)} onDelete={() => openDelete(crop)} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <FormModal open={dialogOpen} onOpenChange={setDialogOpen} title={editingCrop ? "Edit Crop" : "Add New Crop"}
        description={editingCrop ? "Update crop details below." : "Fill in the details for the new crop."}
        onSave={handleSave} saveLabel={editingCrop ? "Save Changes" : "Add Crop"}>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Crop Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Wheat" /></div>
          <div className="space-y-1.5"><Label>Variety *</Label><Input value={form.variety} onChange={(e) => setForm({ ...form, variety: e.target.value })} placeholder="e.g. Hard Red" /></div>
        </div>
        <div className="space-y-1.5"><Label>Field / Area *</Label><Input value={form.fieldArea} onChange={(e) => setForm({ ...form, fieldArea: e.target.value })} placeholder="e.g. Field A - 12 acres" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Planted Date</Label><Input type="date" value={form.plantedDate} onChange={(e) => setForm({ ...form, plantedDate: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Expected Harvest</Label><Input type="date" value={form.expectedHarvest} onChange={(e) => setForm({ ...form, expectedHarvest: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as CropStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{statusOptions.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Season</Label>
            <Select value={form.season} onValueChange={(v) => setForm({ ...form, season: v as Season })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{seasonFilterOptions.filter(s => s.value !== "all").map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5"><Label>Yield Estimate</Label><Input value={form.yieldEstimate} onChange={(e) => setForm({ ...form, yieldEstimate: e.target.value })} placeholder="e.g. 45 bu/acre" /></div>
        <div className="space-y-1.5"><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes..." /></div>
      </FormModal>

      <DeleteConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={handleDelete}
        title={`Delete ${deletingCrop?.name}?`} description="This action cannot be undone. This crop record will be permanently removed." />
    </PageShell>
  );
};

export default Crops;

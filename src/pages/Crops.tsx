import { useState, useEffect } from "react";
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
import { Plus, Search, Download, Pencil, Trash2, Sprout, Loader } from "lucide-react";
import { toast } from "sonner";
import { cropService } from "@/services/crop.service";
import { farmService } from "@/services/farm.service";
import { Crop as BackendCrop, Field } from "@/types/common";
import { PaginatedResponse } from "@/types/api";
import { ListPagination } from "@/components/ListPagination";

export type CropStatus = "planning" | "growing" | "harvested";
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

const mapBackendToCrop = (c: BackendCrop): Crop => ({
  id: c.id,
  name: c.name,
  variety: c.type,
  fieldArea: c.field_id,
  plantedDate: c.planting_date?.split('T')[0] || "",
  expectedHarvest: c.expected_harvest_date?.split('T')[0] || "",
  status: c.status as CropStatus,
  season: "spring",
  yieldEstimate: `${c.estimated_yield || c.target_yield || 0}`,
  notes: "",
});

const mapCropToBackend = (c: Omit<Crop, "id">): Partial<BackendCrop> => ({
  name: c.name,
  type: c.variety,
  field_id: c.fieldArea,
  planting_date: c.plantedDate,
  expected_harvest_date: c.expectedHarvest,
  quantity_planted: 0,
  estimated_yield: Number(c.yieldEstimate) || 0,
  status: c.status,
});

const statusConfig: Record<CropStatus, { label: string; className: string }> = {
  planning: { label: "Planning", className: "bg-chart-blue/15 text-chart-blue border-chart-blue/30" },
  growing: { label: "Growing", className: "bg-primary/15 text-primary border-primary/30" },
  harvested: { label: "Harvested", className: "bg-chart-brown/15 text-chart-brown border-chart-brown/30" },
};

const emptyForm: Omit<Crop, "id"> = {
  name: "", variety: "", fieldArea: "", plantedDate: "", expectedHarvest: "",
  status: "planning", season: "spring", yieldEstimate: "", notes: "",
};

const Crops = () => {
  const perPage = 10;
  const [crops, setCrops] = useState<Crop[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [pagination, setPagination] = useState<PaginatedResponse<Crop>["meta"]>({
    current_page: 1,
    from: 0,
    to: 0,
    total: 0,
    per_page: perPage,
    last_page: 1,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCrop, setEditingCrop] = useState<Crop | null>(null);
  const [deletingCrop, setDeletingCrop] = useState<Crop | null>(null);
  const [form, setForm] = useState<Omit<Crop, "id">>(emptyForm);

  useEffect(() => {
    loadData(1);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadData(1);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [search, statusFilter]);

  const loadData = async (page = pagination.current_page) => {
    setLoading(true);
    try {
      const [cropsResponse, fieldsData] = await Promise.all([
        cropService.getCrops({
          page,
          perPage,
          search,
          status: statusFilter,
        }),
        farmService.getFields(),
      ]);
      const formattedCrops = (Array.isArray(cropsResponse?.data) ? cropsResponse.data : []).map(mapBackendToCrop);
      setCrops(formattedCrops);
      setPagination(cropsResponse.meta);
      const parsedFields = Array.isArray(fieldsData) ? fieldsData : [];
      setFields(parsedFields);
    } catch (error: any) {
      console.error("Failed to load data:", error);
      toast.error(error.message || "Failed to load data");
      setLoading(false);
      return;
    }
    setLoading(false);
  };

  const loadCrops = async (page = pagination.current_page) => {
    try {
      const response = await cropService.getCrops({
        page,
        perPage,
        search,
        status: statusFilter,
      });
      const formattedCrops = (Array.isArray(response?.data) ? response.data : []).map(mapBackendToCrop);
      setCrops(formattedCrops);
      setPagination(response.meta);
    } catch (error: any) {
      toast.error(error.message || "Failed to load crops");
    }
  };

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

  const getFieldName = (fieldId: string) => {
    const field = fields.find(f => f.id === fieldId);
    return field?.name || fieldId;
  };

  const openDelete = (crop: Crop) => {
    setDeletingCrop(crop);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.variety || !form.fieldArea) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      const backendData = mapCropToBackend(form);
      if (editingCrop) {
        await cropService.updateCrop(editingCrop.id, backendData);
        toast.success(`${form.name} updated successfully`);
      } else {
        await cropService.createCrop(backendData);
        toast.success(`${form.name} added successfully`);
      }
      setDialogOpen(false);
      await loadCrops(pagination.current_page);
    } catch (error: any) {
      toast.error(error.message || "Failed to save crop");
    }
  };

  const handleDelete = async () => {
    if (deletingCrop) {
      try {
        await cropService.deleteCrop(deletingCrop.id);
        toast.success(`${deletingCrop.name} deleted`);
        const nextPage = crops.length === 1 && pagination.current_page > 1 ? pagination.current_page - 1 : pagination.current_page;
        await loadCrops(nextPage);
      } catch (error: any) {
        toast.error(error.message || "Failed to delete crop");
      }
    }
    setDeleteDialogOpen(false);
    setDeletingCrop(null);
  };

  const exportCSV = () => {
    const headers = ["Name", "Variety", "Field/Area", "Planted Date", "Expected Harvest", "Status", "Season", "Yield Estimate", "Notes"];
    const rows = crops.map((c) => [c.name, c.variety, c.fieldArea, c.plantedDate, c.expectedHarvest, c.status, c.season, c.yieldEstimate, c.notes]);
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

  const updateStatus = async (crop: Crop, newStatus: CropStatus) => {
    try {
      const backendData = mapCropToBackend({ ...crop, status: newStatus });
      await cropService.updateCrop(crop.id, backendData);
      toast.success(`${crop.name} status updated to ${statusConfig[newStatus].label}`);
      await loadCrops(pagination.current_page);
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    }
  };

  const counts = {
    total: pagination.total,
    planning: crops.filter((c) => c.status === "planning").length,
    growing: crops.filter((c) => c.status === "growing").length,
    harvested: crops.filter((c) => c.status === "harvested").length,
  };

  if (loading) {
    return (
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Crops", value: counts.total, color: "text-foreground" },
              { label: "Planning", value: counts.planning, color: "text-chart-blue" },
              { label: "Growing", value: counts.growing, color: "text-primary" },
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
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="growing">Growing</SelectItem>
                    <SelectItem value="harvested">Harvested</SelectItem>
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
                  {crops.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        <Sprout className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        No crops found
                      </TableCell>
                    </TableRow>
                  ) : (
                    crops.map((crop) => (
                      <TableRow key={crop.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{crop.name}</p>
                            <p className="text-xs text-muted-foreground">{crop.variety}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{getFieldName(crop.fieldArea)}</TableCell>
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
                              <SelectItem value="planning">Planning</SelectItem>
                              <SelectItem value="growing">Growing</SelectItem>
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
              <div className="px-4 pb-4">
                <ListPagination meta={pagination} onPageChange={(page) => void loadData(page)} />
              </div>
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
              {fields.length > 0 ? (
                <Select value={form.fieldArea} onValueChange={(value) => setForm({ ...form, fieldArea: value })}>
                  <SelectTrigger id="field">
                    <SelectValue placeholder="Select a field" />
                  </SelectTrigger>
                  <SelectContent>
                    {fields.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input id="field" disabled placeholder="No fields available" />
              )}
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
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="growing">Growing</SelectItem>
                    <SelectItem value="harvested">Harvested</SelectItem>
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

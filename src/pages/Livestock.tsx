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
import { Plus, Search, Download, Pencil, Trash2, Loader } from "lucide-react";
import { toast } from "sonner";
import { livestockTypeService } from "@/services/livestocktype.service";
import { livestockService } from "@/services/livestock.service";
import { farmService } from "@/services/farm.service";
import { shedService } from "@/services/shed.service";
import { Livestock as BackendLivestock, Farm, LivestockShed } from "@/types/common";
import { PaginatedResponse } from "@/types/api";
import { ListPagination } from "@/components/ListPagination";

export type LivestockStatus = "active" | "inactive" | "sold" | "deceased";

export interface Livestock {
  id: string;
  name: string;
  breed: string;
  tag_number: string;
  date_of_birth: string;
  weight: number;
  gender: string;
  status: LivestockStatus;
  farm_id: string;
  shed_id: string;
  livestock_type_id: number;
  farmName?: string;
  shedName?: string;
}

const statusConfig: Record<LivestockStatus, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-green-100 text-green-800 border-green-300" },
  inactive: { label: "Inactive", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  sold: { label: "Sold", className: "bg-orange-100 text-orange-800 border-orange-300" },
  deceased: { label: "Deceased", className: "bg-red-100 text-red-800 border-red-300" },
};

interface LivestockType {
  id: number;
  name: string;
}

const genders = ["male", "female"];

const emptyForm: Omit<Livestock, "id"> = {
  name: "",
  breed: "",
  tag_number: "",
  date_of_birth: "",
  weight: 0,
  gender: "male",
  status: "active",
  farm_id: "",
  shed_id: "",
  livestock_type_id: 0,
};

const mapBackendToLivestock = (l: BackendLivestock): Livestock => ({
  id: l.id,
  name: l.name || (l as any).tag_number || `Animal #${l.id}`,
  breed: l.breed || "",
  tag_number: l.tag_number,
  date_of_birth: l.date_of_birth ? (l.date_of_birth.split('T')[0] || l.date_of_birth.split(' ')[0]) : "",
  weight: l.weight,
  gender: l.gender || "male",
  status: l.status as LivestockStatus,
  farm_id: l.farm_id,
  shed_id: l.shed_id || "",
  livestock_type_id: l.livestock_type_id || 0,
});

const mapLivestockToBackend = (l: Omit<Livestock, "id">): Partial<BackendLivestock> => ({
  name: l.name,
  breed: l.breed,
  tag_number: l.tag_number,
  date_of_birth: l.date_of_birth,
  weight: l.weight,
  gender: l.gender,
  status: l.status,
  farm_id: l.farm_id,
  shed_id: l.shed_id || undefined,
  livestock_type_id: l.livestock_type_id,
});

const Livestock = () => {
  const perPage = 10;
  const [livestock, setLivestock] = useState<Livestock[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [sheds, setSheds] = useState<LivestockShed[]>([]);
  const [livestockTypes, setLivestockTypes] = useState<LivestockType[]>([]);
  const [pagination, setPagination] = useState<PaginatedResponse<Livestock>["meta"]>({
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
  const [editingItem, setEditingItem] = useState<Livestock | null>(null);
  const [deletingItem, setDeletingItem] = useState<Livestock | null>(null);
  const [form, setForm] = useState<Omit<Livestock, "id">>(emptyForm);

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
      const [livestockResponse, farmsData, typesData, shedsData] = await Promise.all([
        livestockService.getLivestock({
          page,
          perPage,
          search,
          status: statusFilter,
        }),
        farmService.getFarms(),
        livestockTypeService.getTypes(),
        shedService.getSheds(),
      ]);
      const livestockData = Array.isArray(livestockResponse?.data) ? livestockResponse.data : [];
      const farmsArr = Array.isArray(farmsData) ? farmsData : [];
      const shedsArr = Array.isArray(shedsData) ? shedsData : [];
      const formattedLivestock = livestockData.map(l => {
        const farm = farmsArr.find(f => f.id === l.farm_id);
        const shed = shedsArr.find(s => s.id === l.shed_id);
        return {
          ...mapBackendToLivestock(l),
          farmName: farm?.name,
          shedName: shed?.name,
        };
      });
      setLivestock(formattedLivestock);
      setPagination(livestockResponse.meta);
      setFarms(farmsArr);
      setSheds(shedsArr);
      setLivestockTypes(Array.isArray(typesData) ? typesData : []);
    } catch (error: any) {
      console.error("Failed to load data:", error);
      toast.error(error.message || "Failed to load livestock");
      setLoading(false);
      return;
    }
    setLoading(false);
  };

  const openAdd = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (item: Livestock) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      breed: item.breed,
      tag_number: item.tag_number,
      date_of_birth: item.date_of_birth,
      weight: item.weight,
      gender: item.gender,
      status: item.status,
      farm_id: item.farm_id,
      shed_id: item.shed_id || "",
      livestock_type_id: item.livestock_type_id,
    });
    setDialogOpen(true);
  };

  const openDelete = (item: Livestock) => {
    setDeletingItem(item);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.breed || !form.tag_number || !form.farm_id || !form.date_of_birth || !form.livestock_type_id || !form.gender) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      const backendData = mapLivestockToBackend(form);
      backendData.gender = form.gender;
      backendData.livestock_type_id = form.livestock_type_id;
      
      if (editingItem) {
        await livestockService.updateLivestock(editingItem.id, backendData);
        toast.success(`${form.name} updated successfully`);
      } else {
        await livestockService.createLivestock(backendData);
        toast.success(`${form.name} added successfully`);
      }
      setDialogOpen(false);
      await loadData(pagination.current_page);
    } catch (error: any) {
      toast.error(error.message || "Failed to save livestock");
    }
  };

  const handleDelete = async () => {
    if (deletingItem) {
      try {
        await livestockService.deleteLivestock(deletingItem.id);
        toast.success(`${deletingItem.name} deleted`);
        const nextPage = livestock.length === 1 && pagination.current_page > 1 ? pagination.current_page - 1 : pagination.current_page;
        await loadData(nextPage);
      } catch (error: any) {
        toast.error(error.message || "Failed to delete livestock");
      }
    }
    setDeleteDialogOpen(false);
    setDeletingItem(null);
  };

  const exportCSV = () => {
    const headers = ["Name", "Type", "Breed", "Tag Number", "Birth Date", "Weight", "Gender", "Status", "Farm"];
    const rows = livestock.map((l) => [l.name, l.livestock_type_id, l.breed, l.tag_number, l.date_of_birth, l.weight, l.gender, l.status, l.farmName || ""]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "livestock_export.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported to CSV");
  };

  const updateStatus = async (item: Livestock, newStatus: LivestockStatus) => {
    try {
      const backendData = mapLivestockToBackend({ ...item, status: newStatus });
      backendData.gender = item.gender;
      backendData.livestock_type_id = item.livestock_type_id;
      await livestockService.updateLivestock(item.id, backendData);
      toast.success(`${item.name} status updated to ${statusConfig[newStatus].label}`);
      await loadData(pagination.current_page);
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    }
  };

  const counts = {
    total: pagination.total,
    active: livestock.filter((l) => l.status === "active").length,
    inactive: livestock.filter((l) => l.status === "inactive").length,
    sold: livestock.filter((l) => l.status === "sold").length,
    deceased: livestock.filter((l) => l.status === "deceased").length,
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
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold">Livestock Management</h1>
              <p className="text-muted-foreground text-sm">Track and manage all livestock across your farm</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download className="w-4 h-4 mr-1" /> Export
              </Button>
              <Button size="sm" onClick={openAdd}>
                <Plus className="w-4 h-4 mr-1" /> Add Livestock
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Total", value: counts.total, color: "text-foreground" },
              { label: "Active", value: counts.active, color: "text-green-600" },
              { label: "Inactive", value: counts.inactive, color: "text-yellow-600" },
              { label: "Sold", value: counts.sold, color: "text-orange-600" },
              { label: "Deceased", value: counts.deceased, color: "text-red-600" },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search livestock..."
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
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                    <SelectItem value="deceased">Deceased</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Breed</TableHead>
                    <TableHead>Tag Number</TableHead>
                    <TableHead>Birth Date</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Farm</TableHead>
                    <TableHead>Shed</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {livestock.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-12 text-muted-foreground">
                        No livestock found
                      </TableCell>
                    </TableRow>
                  ) : (
                    livestock.map((item) => {
                      const status = (item.status as LivestockStatus) || "active";
                      const config = statusConfig[status] || statusConfig.active;
                      const typeName = livestockTypes.find(t => t.id === item.livestock_type_id)?.name || "Unknown";
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="text-sm">{typeName}</TableCell>
                          <TableCell className="text-sm">{item.breed}</TableCell>
                          <TableCell className="text-sm">{item.tag_number}</TableCell>
                          <TableCell className="text-sm">{item.date_of_birth}</TableCell>
                          <TableCell className="text-sm">{item.weight} kg</TableCell>
                          <TableCell className="text-sm capitalize">{item.gender}</TableCell>
                          <TableCell className="text-sm">{item.farmName}</TableCell>
                          <TableCell className="text-sm">{item.shedName || <span className="text-muted-foreground">—</span>}</TableCell>
                          <TableCell>
                            <Select
                              value={status}
                              onValueChange={(v) => updateStatus(item, v as LivestockStatus)}
                            >
                              <SelectTrigger className="h-7 w-[120px] border-0 p-0">
                                <Badge variant="outline" className={config.className}>
                                  {config.label}
                                </Badge>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                <SelectItem value="sold">Sold</SelectItem>
                                <SelectItem value="deceased">Deceased</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => openDelete(item)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      );
                    })
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Livestock" : "Add New Livestock"}</DialogTitle>
            <DialogDescription>{editingItem ? "Update livestock details below." : "Fill in the details for the new livestock."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Bessie" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="type">Type *</Label>
                <Select value={String(form.livestock_type_id)} onValueChange={(value) => setForm({ ...form, livestock_type_id: Number(value) })}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {livestockTypes.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="breed">Breed *</Label>
                <Input id="breed" value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} placeholder="e.g. Holstein" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tag">Tag Number *</Label>
                <Input id="tag" value={form.tag_number} onChange={(e) => setForm({ ...form, tag_number: e.target.value })} placeholder="e.g. FARM-001" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="birth">Birth Date *</Label>
                <Input id="birth" type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="weight">Weight (kg) *</Label>
                <Input id="weight" type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })} placeholder="e.g. 500" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="gender">Gender *</Label>
                <Select value={form.gender} onValueChange={(value) => setForm({ ...form, gender: value })}>
                  <SelectTrigger id="gender">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {genders.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="farm">Farm *</Label>
                <Select value={form.farm_id} onValueChange={(value) => setForm({ ...form, farm_id: value, shed_id: "" })}>
                  <SelectTrigger id="farm">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {farms.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as LivestockStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                    <SelectItem value="deceased">Deceased</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shed">Shed</Label>
              <Select
                value={form.shed_id || "none"}
                onValueChange={(value) => setForm({ ...form, shed_id: value === "none" ? "" : value })}
              >
                <SelectTrigger id="shed">
                  <SelectValue placeholder="Select shed (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Shed</SelectItem>
                  {sheds
                    .filter(s => !form.farm_id || s.farm_id === form.farm_id)
                    .map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingItem ? "Save Changes" : "Add Livestock"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deletingItem?.name}?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. This livestock record will be permanently removed.</AlertDialogDescription>
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

export default Livestock;

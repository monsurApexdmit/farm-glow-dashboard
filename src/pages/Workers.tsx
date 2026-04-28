import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, UserCheck, UserX, Clock, Loader } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageShell } from "@/components/PageShell";
import { PageHeader } from "@/components/PageHeader";
import { StatCards } from "@/components/StatCards";
import { SearchFilterBar } from "@/components/SearchFilterBar";
import { FormModal } from "@/components/FormModal";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { TableActions, StatusSelect, StatusOption } from "@/components/TableActions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { farmService } from "@/services/farm.service";
import { BackendWorker, workerService } from "@/services/worker.service";
import { Farm } from "@/types/common";

type WorkerStatus = "active" | "on-leave" | "inactive";
type WorkerRole = "Farm Manager" | "Field Worker" | "Equipment Operator" | "Veterinarian" | "Irrigation Specialist" | "Harvester";
type EmploymentType = "full-time" | "part-time" | "contract" | "seasonal";

interface WorkerRow {
  id: string;
  farmId: string;
  name: string;
  firstName: string;
  lastName: string;
  role: WorkerRole;
  phone: string;
  email: string;
  status: WorkerStatus;
  hireDate: string;
  dailyWage: number;
  assignedArea: string;
  employmentType: EmploymentType;
  address: string;
  emergencyContact: string;
}

interface WorkerForm {
  farmId: string;
  name: string;
  role: WorkerRole;
  phone: string;
  email: string;
  status: WorkerStatus;
  hireDate: string;
  dailyWage: number;
  assignedArea: string;
  employmentType: EmploymentType;
  emergencyContact: string;
}

const roles: WorkerRole[] = ["Farm Manager", "Field Worker", "Equipment Operator", "Veterinarian", "Irrigation Specialist", "Harvester"];
const employmentTypes: EmploymentType[] = ["full-time", "part-time", "contract", "seasonal"];

const statusOptions: StatusOption[] = [
  { value: "active", label: "Active", className: "bg-primary/15 text-primary border-primary/30" },
  { value: "on-leave", label: "On Leave", className: "bg-accent/15 text-accent border-accent/30" },
  { value: "inactive", label: "Inactive", className: "bg-destructive/15 text-destructive border-destructive/30" },
];

const normalizeWorkerStatus = (worker: BackendWorker): WorkerStatus => {
  const raw = worker.status || (worker.is_active === false ? "inactive" : "active");
  if (raw === "on_leave") return "on-leave";
  if (raw === "inactive") return "inactive";
  return "active";
};

const toTitleCase = (value: string) =>
  value
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const splitName = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" ") || parts[0] || "",
  };
};

const buildDisplayName = (worker: BackendWorker) => {
  if (worker.name?.trim()) return worker.name.trim();
  return `${worker.first_name || ""} ${worker.last_name || ""}`.trim();
};

const mapBackendToWorker = (worker: BackendWorker, farmsById: Record<string, Farm>): WorkerRow => {
  const name = buildDisplayName(worker);
  const names = splitName(name);
  const farmName = farmsById[String(worker.farm_id)]?.name || "";
  const role = roles.includes((worker.position || "") as WorkerRole)
    ? (worker.position as WorkerRole)
    : "Field Worker";

  return {
    id: String(worker.id),
    farmId: String(worker.farm_id || ""),
    name,
    firstName: worker.first_name || names.firstName,
    lastName: worker.last_name || names.lastName,
    role,
    phone: worker.phone || "",
    email: worker.email || "",
    status: normalizeWorkerStatus(worker),
    hireDate: (worker.start_date || worker.hiring_date || worker.hire_date || "").split("T")[0],
    dailyWage: Number(worker.hourly_rate ?? worker.salary ?? 0),
    assignedArea: farmName || worker.address || "",
    employmentType: worker.employment_type || "full-time",
    address: worker.address || farmName || "",
    emergencyContact: worker.emergency_contact || "",
  };
};

const mapFormToBackend = (form: WorkerForm): Partial<BackendWorker> => {
  const { firstName, lastName } = splitName(form.name);
  return {
    farm_id: form.farmId,
    first_name: firstName,
    last_name: lastName,
    email: form.email,
    phone: form.phone,
    address: form.assignedArea,
    employment_type: form.employmentType,
    position: form.role,
    start_date: form.hireDate,
    hire_date: form.hireDate,
    hiring_date: form.hireDate,
    hourly_rate: Number(form.dailyWage) || 0,
    salary: Number(form.dailyWage) || 0,
    is_active: form.status === "active",
    status: form.status === "on-leave" ? "on_leave" : form.status,
    emergency_contact: form.emergencyContact,
  };
};

const emptyWorker = (farmId = ""): WorkerForm => ({
  farmId,
  name: "",
  role: "Field Worker",
  phone: "",
  email: "",
  status: "active",
  hireDate: new Date().toISOString().split("T")[0],
  dailyWage: 45,
  assignedArea: "",
  employmentType: "full-time",
  emergencyContact: "",
});

const Workers = () => {
  const [workers, setWorkers] = useState<WorkerRow[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<WorkerRow | null>(null);
  const [deletingWorker, setDeletingWorker] = useState<WorkerRow | null>(null);
  const [form, setForm] = useState<WorkerForm>(emptyWorker());
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const farmsById = useMemo(
    () =>
      farms.reduce<Record<string, Farm>>((acc, farm) => {
        acc[String(farm.id)] = farm;
        return acc;
      }, {}),
    [farms]
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [workersData, farmsData] = await Promise.all([
        workerService.getWorkers(),
        farmService.getFarms(),
      ]);
      const safeFarms = Array.isArray(farmsData) ? farmsData : [];
      const farmMap = safeFarms.reduce<Record<string, Farm>>((acc, farm) => {
        acc[String(farm.id)] = farm;
        return acc;
      }, {});
      const safeWorkers = Array.isArray(workersData) ? workersData : [];
      setFarms(safeFarms);
      setWorkers(safeWorkers.map((worker) => mapBackendToWorker(worker, farmMap)));
      if (!form.farmId && safeFarms[0]?.id) {
        setForm((current) => ({ ...current, farmId: String(safeFarms[0].id) }));
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load workers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(
    () =>
      workers.filter((worker) => {
        const matchSearch =
          worker.name.toLowerCase().includes(search.toLowerCase()) ||
          worker.role.toLowerCase().includes(search.toLowerCase()) ||
          worker.assignedArea.toLowerCase().includes(search.toLowerCase());
        return (
          matchSearch &&
          (roleFilter === "all" || worker.role === roleFilter) &&
          (statusFilter === "all" || worker.status === statusFilter)
        );
      }),
    [workers, search, roleFilter, statusFilter]
  );

  const counts = useMemo(
    () => ({
      total: workers.length,
      active: workers.filter((worker) => worker.status === "active").length,
      onLeave: workers.filter((worker) => worker.status === "on-leave").length,
      inactive: workers.filter((worker) => worker.status === "inactive").length,
    }),
    [workers]
  );

  const openAdd = () => {
    setEditingWorker(null);
    setForm(emptyWorker(String(farms[0]?.id || "")));
    setDialogOpen(true);
  };

  const openEdit = (worker: WorkerRow) => {
    setEditingWorker(worker);
    setForm({
      farmId: worker.farmId,
      name: worker.name,
      role: worker.role,
      phone: worker.phone,
      email: worker.email,
      status: worker.status,
      hireDate: worker.hireDate,
      dailyWage: worker.dailyWage,
      assignedArea: worker.assignedArea,
      employmentType: worker.employmentType,
      emergencyContact: worker.emergencyContact,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.farmId) {
      toast({
        title: "Missing fields",
        description: "Name, phone, and farm are required.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = mapFormToBackend(form);
      if (editingWorker) {
        await workerService.updateWorker(editingWorker.id, payload);
        toast({ title: "Worker updated" });
      } else {
        await workerService.createWorker(payload);
        toast({ title: "Worker added" });
      }
      setDialogOpen(false);
      setEditingWorker(null);
      setForm(emptyWorker(String(farms[0]?.id || "")));
      await loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save worker",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingWorker) return;
    try {
      await workerService.deleteWorker(deletingWorker.id);
      toast({ title: "Worker removed" });
      setDeletingWorker(null);
      await loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete worker",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (workerId: string, status: WorkerStatus) => {
    const worker = workers.find((item) => item.id === workerId);
    if (!worker) return;

    setWorkers((prev) => prev.map((item) => (item.id === workerId ? { ...item, status } : item)));

    try {
      await workerService.updateWorker(workerId, {
        is_active: status === "active",
        status: status === "on-leave" ? "on_leave" : status,
      });
      toast({ title: "Worker status updated" });
      await loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update worker status",
        variant: "destructive",
      });
      await loadData();
    }
  };

  const handleExport = () => {
    const headers = ["Name", "Role", "Phone", "Email", "Status", "Hire Date", "Daily Wage", "Assigned Area"];
    const rows = filtered.map((worker) => [
      worker.name,
      worker.role,
      worker.phone,
      worker.email,
      worker.status,
      worker.hireDate,
      worker.dailyWage,
      worker.assignedArea,
    ].join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workers.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported workers data" });
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
      <PageHeader
        title="Workers"
        description="Manage farm staff and their assignments"
        addLabel="Add Worker"
        onAdd={openAdd}
        onExport={handleExport}
      />

      <StatCards columns="grid-cols-2 sm:grid-cols-4" stats={[
        { label: "Total Workers", value: counts.total, icon: <Users className="w-6 h-6 text-primary" /> },
        { label: "Active", value: counts.active, icon: <UserCheck className="w-6 h-6 text-primary" /> },
        { label: "On Leave", value: counts.onLeave, icon: <Clock className="w-6 h-6 text-accent" />, color: "text-accent" },
        { label: "Inactive", value: counts.inactive, icon: <UserX className="w-6 h-6 text-destructive" />, color: "text-destructive" },
      ]} />

      <SearchFilterBar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search workers..."
        filters={[
          {
            value: roleFilter,
            onChange: setRoleFilter,
            placeholder: "Role",
            width: "w-[180px]",
            options: [{ value: "all", label: "All Roles" }, ...roles.map((role) => ({ value: role, label: role }))],
          },
          {
            value: statusFilter,
            onChange: setStatusFilter,
            placeholder: "Status",
            options: [{ value: "all", label: "All Status" }, ...statusOptions.map((status) => ({ value: status.value, label: status.label }))],
          },
        ]}
      />

      <Card>
        <CardHeader><CardTitle>Workers ({filtered.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Daily Wage</TableHead>
                <TableHead>Assigned Area</TableHead>
                <TableHead>Hire Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((worker) => (
                <TableRow key={worker.id}>
                  <TableCell className="font-medium">{worker.name}</TableCell>
                  <TableCell>{worker.role}</TableCell>
                  <TableCell>{worker.phone}</TableCell>
                  <TableCell>
                    <StatusSelect
                      value={worker.status}
                      options={statusOptions}
                      width="w-[120px]"
                      onChange={(value) => handleStatusChange(worker.id, value as WorkerStatus)}
                    />
                  </TableCell>
                  <TableCell>${worker.dailyWage}</TableCell>
                  <TableCell>{worker.assignedArea}</TableCell>
                  <TableCell>{worker.hireDate}</TableCell>
                  <TableCell className="text-right">
                    <TableActions onEdit={() => openEdit(worker)} onDelete={() => setDeletingWorker(worker)} />
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No workers found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <FormModal
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingWorker(null);
            setForm(emptyWorker(String(farms[0]?.id || "")));
          }
        }}
        title={editingWorker ? "Edit Worker" : "Add Worker"}
        onSave={handleSave}
        saveLabel={saving ? "Saving..." : editingWorker ? "Update Worker" : "Add Worker"}
      >
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-sm font-medium">Name *</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="text-sm font-medium">Role</label>
            <Select value={form.role} onValueChange={(value) => setForm({ ...form, role: value as WorkerRole })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{roles.map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-sm font-medium">Farm *</label>
            <Select value={form.farmId} onValueChange={(value) => setForm({ ...form, farmId: value })}>
              <SelectTrigger><SelectValue placeholder="Select farm" /></SelectTrigger>
              <SelectContent>{farms.map((farm) => <SelectItem key={farm.id} value={String(farm.id)}>{farm.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><label className="text-sm font-medium">Employment Type</label>
            <Select value={form.employmentType} onValueChange={(value) => setForm({ ...form, employmentType: value as EmploymentType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{employmentTypes.map((type) => <SelectItem key={type} value={type}>{toTitleCase(type.replace("-", " "))}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-sm font-medium">Phone *</label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><label className="text-sm font-medium">Email</label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="text-sm font-medium">Status</label>
            <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value as WorkerStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{statusOptions.map((status) => <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><label className="text-sm font-medium">Daily Wage ($)</label><Input type="number" value={form.dailyWage} onChange={(e) => setForm({ ...form, dailyWage: Number(e.target.value) })} /></div>
          <div><label className="text-sm font-medium">Hire Date</label><Input type="date" value={form.hireDate} onChange={(e) => setForm({ ...form, hireDate: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-sm font-medium">Assigned Area</label><Input value={form.assignedArea} onChange={(e) => setForm({ ...form, assignedArea: e.target.value })} /></div>
          <div><label className="text-sm font-medium">Emergency Contact</label><Input value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} /></div>
        </div>
      </FormModal>

      <DeleteConfirmDialog
        open={deletingWorker !== null}
        onOpenChange={(open) => !open && setDeletingWorker(null)}
        onConfirm={handleDelete}
        title={`Delete ${deletingWorker?.name}?`}
        description="This action cannot be undone."
      />
    </PageShell>
  );
};

export default Workers;

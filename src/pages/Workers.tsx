import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, UserCheck, UserX, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageShell } from "@/components/PageShell";
import { PageHeader } from "@/components/PageHeader";
import { StatCards } from "@/components/StatCards";
import { SearchFilterBar } from "@/components/SearchFilterBar";
import { FormModal } from "@/components/FormModal";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { TableActions, StatusSelect, StatusOption } from "@/components/TableActions";

type WorkerStatus = "active" | "on-leave" | "inactive";
type WorkerRole = "Farm Manager" | "Field Worker" | "Equipment Operator" | "Veterinarian" | "Irrigation Specialist" | "Harvester";

interface Worker {
  id: string;
  name: string;
  role: WorkerRole;
  phone: string;
  email: string;
  status: WorkerStatus;
  hireDate: string;
  dailyWage: number;
  assignedArea: string;
}

const roles: WorkerRole[] = ["Farm Manager", "Field Worker", "Equipment Operator", "Veterinarian", "Irrigation Specialist", "Harvester"];

const statusOptions: StatusOption[] = [
  { value: "active",   label: "Active",   className: "bg-primary/15 text-primary border-primary/30" },
  { value: "on-leave", label: "On Leave", className: "bg-accent/15 text-accent border-accent/30" },
  { value: "inactive", label: "Inactive", className: "bg-destructive/15 text-destructive border-destructive/30" },
];

const initialWorkers: Worker[] = [
  { id: "1", name: "John Mwangi",    role: "Farm Manager",          phone: "+254 712 345 678", email: "john@farm.com",   status: "active",   hireDate: "2022-03-15", dailyWage: 85, assignedArea: "All Fields" },
  { id: "2", name: "Sarah Wanjiku",  role: "Field Worker",          phone: "+254 723 456 789", email: "sarah@farm.com",  status: "active",   hireDate: "2023-01-10", dailyWage: 45, assignedArea: "Field A" },
  { id: "3", name: "James Otieno",   role: "Equipment Operator",    phone: "+254 734 567 890", email: "james@farm.com",  status: "on-leave", hireDate: "2022-08-20", dailyWage: 60, assignedArea: "Field B" },
  { id: "4", name: "Mary Akinyi",    role: "Veterinarian",          phone: "+254 745 678 901", email: "mary@farm.com",   status: "active",   hireDate: "2023-06-01", dailyWage: 95, assignedArea: "Livestock Area" },
  { id: "5", name: "Peter Kamau",    role: "Irrigation Specialist", phone: "+254 756 789 012", email: "peter@farm.com",  status: "active",   hireDate: "2023-03-22", dailyWage: 55, assignedArea: "Field C" },
  { id: "6", name: "Grace Njeri",    role: "Harvester",             phone: "+254 767 890 123", email: "grace@farm.com",  status: "inactive", hireDate: "2022-11-05", dailyWage: 40, assignedArea: "Field A" },
  { id: "7", name: "Daniel Kiprop",  role: "Field Worker",          phone: "+254 778 901 234", email: "daniel@farm.com", status: "active",   hireDate: "2024-01-15", dailyWage: 45, assignedArea: "Field D" },
];

const emptyWorker = (): Omit<Worker, "id"> => ({
  name: "", role: "Field Worker", phone: "", email: "", status: "active",
  hireDate: new Date().toISOString().split("T")[0], dailyWage: 45, assignedArea: "",
});

const Workers = () => {
  const [workers, setWorkers] = useState<Worker[]>(initialWorkers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [deletingWorker, setDeletingWorker] = useState<Worker | null>(null);
  const [form, setForm] = useState<Omit<Worker, "id">>(emptyWorker());
  const { toast } = useToast();

  const filtered = workers.filter((w) => {
    const matchSearch = w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.role.toLowerCase().includes(search.toLowerCase()) ||
      w.assignedArea.toLowerCase().includes(search.toLowerCase());
    return matchSearch &&
      (roleFilter === "all" || w.role === roleFilter) &&
      (statusFilter === "all" || w.status === statusFilter);
  });

  const counts = {
    total:    workers.length,
    active:   workers.filter((w) => w.status === "active").length,
    onLeave:  workers.filter((w) => w.status === "on-leave").length,
    inactive: workers.filter((w) => w.status === "inactive").length,
  };

  const openAdd = () => { setEditingWorker(null); setForm(emptyWorker()); setDialogOpen(true); };
  const openEdit = (w: Worker) => { setEditingWorker(w); const { id, ...rest } = w; setForm(rest); setDialogOpen(true); };

  const handleSave = () => {
    if (!form.name || !form.phone || !form.assignedArea) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" }); return;
    }
    if (editingWorker) {
      setWorkers((prev) => prev.map((w) => w.id === editingWorker.id ? { ...w, ...form } : w));
      toast({ title: "Worker updated" });
    } else {
      setWorkers((prev) => [...prev, { ...form, id: Date.now().toString() }]);
      toast({ title: "Worker added" });
    }
    setDialogOpen(false); setEditingWorker(null); setForm(emptyWorker());
  };

  const handleDelete = () => {
    if (deletingWorker) { setWorkers((prev) => prev.filter((w) => w.id !== deletingWorker.id)); toast({ title: "Worker removed" }); }
    setDeletingWorker(null);
  };

  const handleExport = () => {
    const headers = ["Name", "Role", "Phone", "Email", "Status", "Hire Date", "Daily Wage", "Assigned Area"];
    const rows = filtered.map((w) => [w.name, w.role, w.phone, w.email, w.status, w.hireDate, w.dailyWage, w.assignedArea].join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "workers.csv"; a.click();
    URL.revokeObjectURL(url); toast({ title: "Exported workers data" });
  };

  return (
    <PageShell>
      <PageHeader title="Workers" description="Manage farm staff and their assignments"
        addLabel="Add Worker" onAdd={openAdd} onExport={handleExport} />

      <StatCards columns="grid-cols-2 sm:grid-cols-4" stats={[
        { label: "Total Workers", value: counts.total,    icon: <Users    className="w-6 h-6 text-primary" /> },
        { label: "Active",        value: counts.active,   icon: <UserCheck className="w-6 h-6 text-primary" /> },
        { label: "On Leave",      value: counts.onLeave,  icon: <Clock    className="w-6 h-6 text-accent" />,      color: "text-accent" },
        { label: "Inactive",      value: counts.inactive, icon: <UserX    className="w-6 h-6 text-destructive" />, color: "text-destructive" },
      ]} />

      <SearchFilterBar
        search={search} onSearch={setSearch} searchPlaceholder="Search workers..."
        filters={[
          { value: roleFilter, onChange: setRoleFilter, placeholder: "Role", width: "w-[180px]",
            options: [{ value: "all", label: "All Roles" }, ...roles.map((r) => ({ value: r, label: r }))] },
          { value: statusFilter, onChange: setStatusFilter, placeholder: "Status",
            options: [{ value: "all", label: "All Status" }, ...statusOptions.map((s) => ({ value: s.value, label: s.label }))] },
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
              {filtered.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="font-medium">{w.name}</TableCell>
                  <TableCell>{w.role}</TableCell>
                  <TableCell>{w.phone}</TableCell>
                  <TableCell>
                    <StatusSelect value={w.status} options={statusOptions} width="w-[120px]"
                      onChange={(v) => setWorkers((prev) => prev.map((x) => x.id === w.id ? { ...x, status: v as WorkerStatus } : x))} />
                  </TableCell>
                  <TableCell>${w.dailyWage}</TableCell>
                  <TableCell>{w.assignedArea}</TableCell>
                  <TableCell>{w.hireDate}</TableCell>
                  <TableCell className="text-right"><TableActions onEdit={() => openEdit(w)} onDelete={() => setDeletingWorker(w)} /></TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No workers found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <FormModal open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingWorker(null); setForm(emptyWorker()); } }}
        title={editingWorker ? "Edit Worker" : "Add Worker"} onSave={handleSave} saveLabel={editingWorker ? "Update Worker" : "Add Worker"}>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-sm font-medium">Name *</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="text-sm font-medium">Role</label>
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as WorkerRole })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{roles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-sm font-medium">Phone *</label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><label className="text-sm font-medium">Email</label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="text-sm font-medium">Status</label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as WorkerStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{statusOptions.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><label className="text-sm font-medium">Daily Wage ($)</label><Input type="number" value={form.dailyWage} onChange={(e) => setForm({ ...form, dailyWage: Number(e.target.value) })} /></div>
          <div><label className="text-sm font-medium">Hire Date</label><Input type="date" value={form.hireDate} onChange={(e) => setForm({ ...form, hireDate: e.target.value })} /></div>
        </div>
        <div><label className="text-sm font-medium">Assigned Area *</label><Input value={form.assignedArea} onChange={(e) => setForm({ ...form, assignedArea: e.target.value })} /></div>
      </FormModal>

      <DeleteConfirmDialog open={deletingWorker !== null} onOpenChange={(open) => !open && setDeletingWorker(null)}
        onConfirm={handleDelete} title={`Delete ${deletingWorker?.name}?`} description="This action cannot be undone." />
    </PageShell>
  );
};

export default Workers;

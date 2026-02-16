import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Download, Edit, Trash2, Users, UserCheck, UserX, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
const statuses: WorkerStatus[] = ["active", "on-leave", "inactive"];

const initialWorkers: Worker[] = [
  { id: "1", name: "John Mwangi", role: "Farm Manager", phone: "+254 712 345 678", email: "john@farm.com", status: "active", hireDate: "2022-03-15", dailyWage: 85, assignedArea: "All Fields" },
  { id: "2", name: "Sarah Wanjiku", role: "Field Worker", phone: "+254 723 456 789", email: "sarah@farm.com", status: "active", hireDate: "2023-01-10", dailyWage: 45, assignedArea: "Field A" },
  { id: "3", name: "James Otieno", role: "Equipment Operator", phone: "+254 734 567 890", email: "james@farm.com", status: "on-leave", hireDate: "2022-08-20", dailyWage: 60, assignedArea: "Field B" },
  { id: "4", name: "Mary Akinyi", role: "Veterinarian", phone: "+254 745 678 901", email: "mary@farm.com", status: "active", hireDate: "2023-06-01", dailyWage: 95, assignedArea: "Livestock Area" },
  { id: "5", name: "Peter Kamau", role: "Irrigation Specialist", phone: "+254 756 789 012", email: "peter@farm.com", status: "active", hireDate: "2023-03-22", dailyWage: 55, assignedArea: "Field C" },
  { id: "6", name: "Grace Njeri", role: "Harvester", phone: "+254 767 890 123", email: "grace@farm.com", status: "inactive", hireDate: "2022-11-05", dailyWage: 40, assignedArea: "Field A" },
  { id: "7", name: "Daniel Kiprop", role: "Field Worker", phone: "+254 778 901 234", email: "daniel@farm.com", status: "active", hireDate: "2024-01-15", dailyWage: 45, assignedArea: "Field D" },
];

const statusConfig: Record<WorkerStatus, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-primary/15 text-primary border-primary/30" },
  "on-leave": { label: "On Leave", className: "bg-accent/15 text-accent border-accent/30" },
  inactive: { label: "Inactive", className: "bg-destructive/15 text-destructive border-destructive/30" },
};

const emptyWorker = (): Omit<Worker, "id"> => ({
  name: "", role: "Field Worker", phone: "", email: "", status: "active", hireDate: new Date().toISOString().split("T")[0], dailyWage: 45, assignedArea: "",
});

const Workers = () => {
  const [workers, setWorkers] = useState<Worker[]>(initialWorkers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [form, setForm] = useState<Omit<Worker, "id">>(emptyWorker());
  const { toast } = useToast();

  const filtered = workers.filter((w) => {
    const matchesSearch = w.name.toLowerCase().includes(search.toLowerCase()) || w.role.toLowerCase().includes(search.toLowerCase()) || w.assignedArea.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || w.role === roleFilter;
    const matchesStatus = statusFilter === "all" || w.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const counts = {
    total: workers.length,
    active: workers.filter((w) => w.status === "active").length,
    onLeave: workers.filter((w) => w.status === "on-leave").length,
    inactive: workers.filter((w) => w.status === "inactive").length,
  };

  const handleSave = () => {
    if (!form.name || !form.phone || !form.assignedArea) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    if (editingWorker) {
      setWorkers((prev) => prev.map((w) => (w.id === editingWorker.id ? { ...w, ...form } : w)));
      toast({ title: "Worker updated" });
    } else {
      setWorkers((prev) => [...prev, { ...form, id: Date.now().toString() }]);
      toast({ title: "Worker added" });
    }
    setDialogOpen(false);
    setEditingWorker(null);
    setForm(emptyWorker());
  };

  const handleEdit = (worker: Worker) => {
    setEditingWorker(worker);
    const { id, ...rest } = worker;
    setForm(rest);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setWorkers((prev) => prev.filter((w) => w.id !== id));
    toast({ title: "Worker removed" });
  };

  const handleExport = () => {
    const headers = ["Name", "Role", "Phone", "Email", "Status", "Hire Date", "Daily Wage", "Assigned Area"];
    const rows = filtered.map((w) => [w.name, w.role, w.phone, w.email, w.status, w.hireDate, w.dailyWage, w.assignedArea].join(","));
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

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 p-6 overflow-auto">
          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card><CardContent className="p-4 flex items-center gap-3"><Users className="w-8 h-8 text-primary" /><div><p className="text-sm text-muted-foreground">Total Workers</p><p className="text-2xl font-bold">{counts.total}</p></div></CardContent></Card>
            <Card><CardContent className="p-4 flex items-center gap-3"><UserCheck className="w-8 h-8 text-primary" /><div><p className="text-sm text-muted-foreground">Active</p><p className="text-2xl font-bold">{counts.active}</p></div></CardContent></Card>
            <Card><CardContent className="p-4 flex items-center gap-3"><Clock className="w-8 h-8 text-accent" /><div><p className="text-sm text-muted-foreground">On Leave</p><p className="text-2xl font-bold">{counts.onLeave}</p></div></CardContent></Card>
            <Card><CardContent className="p-4 flex items-center gap-3"><UserX className="w-8 h-8 text-destructive" /><div><p className="text-sm text-muted-foreground">Inactive</p><p className="text-2xl font-bold">{counts.inactive}</p></div></CardContent></Card>
          </div>

          {/* Toolbar */}
          <Card className="mb-6">
            <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search workers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {statuses.map((s) => <SelectItem key={s} value={s}>{statusConfig[s].label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleExport}><Download className="w-4 h-4 mr-1" />Export</Button>
              <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingWorker(null); setForm(emptyWorker()); } }}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="w-4 h-4 mr-1" />Add Worker</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>{editingWorker ? "Edit Worker" : "Add Worker"}</DialogTitle></DialogHeader>
                  <div className="grid gap-4 py-4">
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
                          <SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{statusConfig[s].label}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div><label className="text-sm font-medium">Daily Wage ($)</label><Input type="number" value={form.dailyWage} onChange={(e) => setForm({ ...form, dailyWage: Number(e.target.value) })} /></div>
                      <div><label className="text-sm font-medium">Hire Date</label><Input type="date" value={form.hireDate} onChange={(e) => setForm({ ...form, hireDate: e.target.value })} /></div>
                    </div>
                    <div><label className="text-sm font-medium">Assigned Area *</label><Input value={form.assignedArea} onChange={(e) => setForm({ ...form, assignedArea: e.target.value })} /></div>
                  </div>
                  <Button onClick={handleSave}>{editingWorker ? "Update" : "Add"} Worker</Button>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Table */}
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
                        <Select value={w.status} onValueChange={(v) => setWorkers((prev) => prev.map((x) => x.id === w.id ? { ...x, status: v as WorkerStatus } : x))}>
                          <SelectTrigger className="w-[120px] h-7 text-xs border-0 p-0">
                            <Badge className={statusConfig[w.status].className}>{statusConfig[w.status].label}</Badge>
                          </SelectTrigger>
                          <SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{statusConfig[s].label}</SelectItem>)}</SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>${w.dailyWage}</TableCell>
                      <TableCell>{w.assignedArea}</TableCell>
                      <TableCell>{w.hireDate}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(w)}><Edit className="w-4 h-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="w-4 h-4 text-destructive" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Delete {w.name}?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(w.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
        </main>
      </div>
    </div>
  );
};

export default Workers;

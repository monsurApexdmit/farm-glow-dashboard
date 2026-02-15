import { useState, useMemo } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Download, Pencil, Trash2, Bug } from "lucide-react";
import { toast } from "sonner";

export type AnimalType = "cattle" | "poultry" | "sheep" | "goat" | "pig" | "horse" | "other";
export type HealthStatus = "healthy" | "sick" | "treatment" | "quarantine";

export interface Animal {
  id: string;
  name: string;
  type: AnimalType;
  breed: string;
  tagId: string;
  dateOfBirth: string;
  weight: string;
  healthStatus: HealthStatus;
  location: string;
  notes: string;
}

const typeLabels: Record<AnimalType, string> = {
  cattle: "Cattle", poultry: "Poultry", sheep: "Sheep",
  goat: "Goat", pig: "Pig", horse: "Horse", other: "Other",
};

const healthConfig: Record<HealthStatus, { label: string; className: string }> = {
  healthy: { label: "Healthy", className: "bg-primary/15 text-primary border-primary/30" },
  sick: { label: "Sick", className: "bg-destructive/15 text-destructive border-destructive/30" },
  treatment: { label: "In Treatment", className: "bg-accent/15 text-accent border-accent/30" },
  quarantine: { label: "Quarantine", className: "bg-chart-brown/15 text-chart-brown border-chart-brown/30" },
};

const initialAnimals: Animal[] = [
  { id: "1", name: "Bessie", type: "cattle", breed: "Holstein", tagId: "COW-001", dateOfBirth: "2022-03-15", weight: "680 kg", healthStatus: "healthy", location: "Barn A - Pen 1", notes: "Dairy cow, high yield" },
  { id: "2", name: "Duke", type: "horse", breed: "Quarter Horse", tagId: "HRS-001", dateOfBirth: "2020-06-10", weight: "520 kg", healthStatus: "healthy", location: "Stable B", notes: "Working horse" },
  { id: "3", name: "Woolly", type: "sheep", breed: "Merino", tagId: "SHP-012", dateOfBirth: "2023-01-20", weight: "75 kg", healthStatus: "treatment", location: "Pasture C", notes: "Shearing due next month" },
  { id: "4", name: "Clucky", type: "poultry", breed: "Rhode Island Red", tagId: "CHK-045", dateOfBirth: "2024-09-01", weight: "3.2 kg", healthStatus: "healthy", location: "Coop 2", notes: "Laying hen, 5 eggs/week avg" },
  { id: "5", name: "Porky", type: "pig", breed: "Berkshire", tagId: "PIG-007", dateOfBirth: "2025-02-14", weight: "110 kg", healthStatus: "sick", location: "Barn C - Pen 3", notes: "Reduced appetite, vet scheduled" },
  { id: "6", name: "Nanny", type: "goat", breed: "Boer", tagId: "GOT-003", dateOfBirth: "2023-11-05", weight: "65 kg", healthStatus: "quarantine", location: "Isolation Pen", notes: "New arrival, observation period" },
];

const emptyForm: Omit<Animal, "id"> = {
  name: "", type: "cattle", breed: "", tagId: "", dateOfBirth: "",
  weight: "", healthStatus: "healthy", location: "", notes: "",
};

const Livestock = () => {
  const [animals, setAnimals] = useState<Animal[]>(initialAnimals);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [healthFilter, setHealthFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState<Animal | null>(null);
  const [deletingAnimal, setDeletingAnimal] = useState<Animal | null>(null);
  const [form, setForm] = useState<Omit<Animal, "id">>(emptyForm);

  const filtered = useMemo(() => {
    return animals.filter((a) => {
      const matchSearch =
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.breed.toLowerCase().includes(search.toLowerCase()) ||
        a.tagId.toLowerCase().includes(search.toLowerCase()) ||
        a.location.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === "all" || a.type === typeFilter;
      const matchHealth = healthFilter === "all" || a.healthStatus === healthFilter;
      return matchSearch && matchType && matchHealth;
    });
  }, [animals, search, typeFilter, healthFilter]);

  const openAdd = () => { setEditingAnimal(null); setForm(emptyForm); setDialogOpen(true); };

  const openEdit = (animal: Animal) => {
    setEditingAnimal(animal);
    setForm({ name: animal.name, type: animal.type, breed: animal.breed, tagId: animal.tagId, dateOfBirth: animal.dateOfBirth, weight: animal.weight, healthStatus: animal.healthStatus, location: animal.location, notes: animal.notes });
    setDialogOpen(true);
  };

  const openDelete = (animal: Animal) => { setDeletingAnimal(animal); setDeleteDialogOpen(true); };

  const handleSave = () => {
    if (!form.name || !form.breed || !form.tagId) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (editingAnimal) {
      setAnimals((prev) => prev.map((a) => (a.id === editingAnimal.id ? { ...a, ...form } : a)));
      toast.success(`${form.name} updated successfully`);
    } else {
      setAnimals((prev) => [...prev, { ...form, id: Date.now().toString() }]);
      toast.success(`${form.name} added successfully`);
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deletingAnimal) {
      setAnimals((prev) => prev.filter((a) => a.id !== deletingAnimal.id));
      toast.success(`${deletingAnimal.name} removed`);
    }
    setDeleteDialogOpen(false);
    setDeletingAnimal(null);
  };

  const exportCSV = () => {
    const headers = ["Name", "Type", "Breed", "Tag ID", "Date of Birth", "Weight", "Health Status", "Location", "Notes"];
    const rows = filtered.map((a) => [a.name, typeLabels[a.type], a.breed, a.tagId, a.dateOfBirth, a.weight, a.healthStatus, a.location, a.notes]);
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

  const updateHealth = (animal: Animal, status: HealthStatus) => {
    setAnimals((prev) => prev.map((a) => (a.id === animal.id ? { ...a, healthStatus: status } : a)));
    toast.success(`${animal.name} status updated to ${healthConfig[status].label}`);
  };

  const counts = {
    total: animals.length,
    healthy: animals.filter((a) => a.healthStatus === "healthy").length,
    sick: animals.filter((a) => a.healthStatus === "sick").length,
    treatment: animals.filter((a) => a.healthStatus === "treatment").length,
    quarantine: animals.filter((a) => a.healthStatus === "quarantine").length,
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
              <h1 className="text-2xl font-bold">Livestock Management</h1>
              <p className="text-muted-foreground text-sm">Track and manage all your animals and herds</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download className="w-4 h-4 mr-1" /> Export
              </Button>
              <Button size="sm" onClick={openAdd}>
                <Plus className="w-4 h-4 mr-1" /> Add Animal
              </Button>
            </div>
          </div>

          {/* Status cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Total Animals", value: counts.total, color: "text-foreground" },
              { label: "Healthy", value: counts.healthy, color: "text-primary" },
              { label: "Sick", value: counts.sick, color: "text-destructive" },
              { label: "In Treatment", value: counts.treatment, color: "text-accent" },
              { label: "Quarantine", value: counts.quarantine, color: "text-chart-brown" },
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
                    <Input placeholder="Search animals..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
                  </div>
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[150px]"><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="cattle">Cattle</SelectItem>
                    <SelectItem value="poultry">Poultry</SelectItem>
                    <SelectItem value="sheep">Sheep</SelectItem>
                    <SelectItem value="goat">Goat</SelectItem>
                    <SelectItem value="pig">Pig</SelectItem>
                    <SelectItem value="horse">Horse</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={healthFilter} onValueChange={setHealthFilter}>
                  <SelectTrigger className="w-[150px]"><SelectValue placeholder="Health" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Health</SelectItem>
                    <SelectItem value="healthy">Healthy</SelectItem>
                    <SelectItem value="sick">Sick</SelectItem>
                    <SelectItem value="treatment">In Treatment</SelectItem>
                    <SelectItem value="quarantine">Quarantine</SelectItem>
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
                    <TableHead>Animal</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Tag ID</TableHead>
                    <TableHead>DOB</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Health</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                        <Bug className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        No animals found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((animal) => (
                      <TableRow key={animal.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{animal.name}</p>
                            <p className="text-xs text-muted-foreground">{animal.breed}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{typeLabels[animal.type]}</TableCell>
                        <TableCell className="text-sm font-mono">{animal.tagId}</TableCell>
                        <TableCell className="text-sm">{animal.dateOfBirth}</TableCell>
                        <TableCell className="text-sm">{animal.weight}</TableCell>
                        <TableCell>
                          <Select value={animal.healthStatus} onValueChange={(v) => updateHealth(animal, v as HealthStatus)}>
                            <SelectTrigger className="h-7 w-[130px] border-0 p-0">
                              <Badge variant="outline" className={healthConfig[animal.healthStatus].className}>
                                {healthConfig[animal.healthStatus].label}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="healthy">Healthy</SelectItem>
                              <SelectItem value="sick">Sick</SelectItem>
                              <SelectItem value="treatment">In Treatment</SelectItem>
                              <SelectItem value="quarantine">Quarantine</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-sm">{animal.location}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(animal)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => openDelete(animal)}>
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
            <DialogTitle>{editingAnimal ? "Edit Animal" : "Add New Animal"}</DialogTitle>
            <DialogDescription>{editingAnimal ? "Update animal details below." : "Fill in the details for the new animal."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="animal-name">Name *</Label>
                <Input id="animal-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Bessie" />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as AnimalType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cattle">Cattle</SelectItem>
                    <SelectItem value="poultry">Poultry</SelectItem>
                    <SelectItem value="sheep">Sheep</SelectItem>
                    <SelectItem value="goat">Goat</SelectItem>
                    <SelectItem value="pig">Pig</SelectItem>
                    <SelectItem value="horse">Horse</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
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
                <Label htmlFor="tagId">Tag ID *</Label>
                <Input id="tagId" value={form.tagId} onChange={(e) => setForm({ ...form, tagId: e.target.value })} placeholder="e.g. COW-001" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input id="dob" type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="weight">Weight</Label>
                <Input id="weight" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="e.g. 680 kg" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Health Status</Label>
                <Select value={form.healthStatus} onValueChange={(v) => setForm({ ...form, healthStatus: v as HealthStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="healthy">Healthy</SelectItem>
                    <SelectItem value="sick">Sick</SelectItem>
                    <SelectItem value="treatment">In Treatment</SelectItem>
                    <SelectItem value="quarantine">Quarantine</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="location">Location</Label>
                <Input id="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Barn A - Pen 1" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingAnimal ? "Save Changes" : "Add Animal"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deletingAnimal?.name}?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. This animal record will be permanently removed.</AlertDialogDescription>
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

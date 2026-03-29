import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bug } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { PageHeader } from "@/components/PageHeader";
import { StatCards } from "@/components/StatCards";
import { SearchFilterBar } from "@/components/SearchFilterBar";
import { FormModal } from "@/components/FormModal";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { TableActions, StatusSelect, StatusOption } from "@/components/TableActions";
import { AnimalProfileDrawer, DailyRecord } from "@/components/AnimalProfileDrawer";

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

const healthOptions: StatusOption[] = [
  { value: "healthy",    label: "Healthy",      className: "bg-primary/15 text-primary border-primary/30" },
  { value: "sick",       label: "Sick",         className: "bg-destructive/15 text-destructive border-destructive/30" },
  { value: "treatment",  label: "In Treatment", className: "bg-accent/15 text-accent border-accent/30" },
  { value: "quarantine", label: "Quarantine",   className: "bg-chart-brown/15 text-chart-brown border-chart-brown/30" },
];

const animalTypeFilterOptions = [
  { value: "all", label: "All Types" },
  ...Object.entries(typeLabels).map(([v, l]) => ({ value: v, label: l })),
];

const initialAnimals: Animal[] = [
  { id: "1", name: "Bessie",  type: "cattle",  breed: "Holstein",         tagId: "COW-001", dateOfBirth: "2022-03-15", weight: "680 kg", healthStatus: "healthy",    location: "Barn A - Pen 1",  notes: "Dairy cow, high yield" },
  { id: "2", name: "Duke",    type: "horse",   breed: "Quarter Horse",    tagId: "HRS-001", dateOfBirth: "2020-06-10", weight: "520 kg", healthStatus: "healthy",    location: "Stable B",        notes: "Working horse" },
  { id: "3", name: "Woolly",  type: "sheep",   breed: "Merino",           tagId: "SHP-012", dateOfBirth: "2023-01-20", weight: "75 kg",  healthStatus: "treatment",  location: "Pasture C",       notes: "Shearing due next month" },
  { id: "4", name: "Clucky",  type: "poultry", breed: "Rhode Island Red", tagId: "CHK-045", dateOfBirth: "2024-09-01", weight: "3.2 kg", healthStatus: "healthy",    location: "Coop 2",          notes: "Laying hen, 5 eggs/week avg" },
  { id: "5", name: "Porky",   type: "pig",     breed: "Berkshire",        tagId: "PIG-007", dateOfBirth: "2025-02-14", weight: "110 kg", healthStatus: "sick",       location: "Barn C - Pen 3",  notes: "Reduced appetite, vet scheduled" },
  { id: "6", name: "Nanny",   type: "goat",    breed: "Boer",             tagId: "GOT-003", dateOfBirth: "2023-11-05", weight: "65 kg",  healthStatus: "quarantine", location: "Isolation Pen",   notes: "New arrival, observation period" },
];

const emptyForm: Omit<Animal, "id"> = {
  name: "", type: "cattle", breed: "", tagId: "", dateOfBirth: "",
  weight: "", healthStatus: "healthy", location: "", notes: "",
};

const Livestock = () => {
  const [animals, setAnimals] = useState<Animal[]>(initialAnimals);
  // Daily records keyed by animal id
  const [recordsMap, setRecordsMap] = useState<Record<string, DailyRecord[]>>({});

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [healthFilter, setHealthFilter] = useState("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState<Animal | null>(null);
  const [deletingAnimal, setDeletingAnimal] = useState<Animal | null>(null);
  const [form, setForm] = useState<Omit<Animal, "id">>(emptyForm);

  // Profile drawer
  const [profileAnimal, setProfileAnimal] = useState<Animal | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filtered = useMemo(() => animals.filter((a) => {
    const matchSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.breed.toLowerCase().includes(search.toLowerCase()) ||
      a.tagId.toLowerCase().includes(search.toLowerCase()) ||
      a.location.toLowerCase().includes(search.toLowerCase());
    return matchSearch &&
      (typeFilter === "all" || a.type === typeFilter) &&
      (healthFilter === "all" || a.healthStatus === healthFilter);
  }), [animals, search, typeFilter, healthFilter]);

  const counts = {
    total:      animals.length,
    healthy:    animals.filter((a) => a.healthStatus === "healthy").length,
    sick:       animals.filter((a) => a.healthStatus === "sick").length,
    treatment:  animals.filter((a) => a.healthStatus === "treatment").length,
    quarantine: animals.filter((a) => a.healthStatus === "quarantine").length,
  };

  const openAdd = () => { setEditingAnimal(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (a: Animal) => {
    setEditingAnimal(a);
    setForm({ name: a.name, type: a.type, breed: a.breed, tagId: a.tagId, dateOfBirth: a.dateOfBirth, weight: a.weight, healthStatus: a.healthStatus, location: a.location, notes: a.notes });
    setDialogOpen(true);
  };
  const openDelete = (a: Animal) => { setDeletingAnimal(a); setDeleteDialogOpen(true); };

  const openProfile = (a: Animal) => { setProfileAnimal(a); setDrawerOpen(true); };

  const handleSave = () => {
    if (!form.name || !form.breed || !form.tagId) { toast.error("Please fill in all required fields"); return; }
    if (editingAnimal) {
      setAnimals((prev) => prev.map((a) => a.id === editingAnimal.id ? { ...a, ...form } : a));
      // Keep profile in sync if drawer is open for this animal
      if (profileAnimal?.id === editingAnimal.id) setProfileAnimal({ ...editingAnimal, ...form });
      toast.success(`${form.name} updated successfully`);
    } else {
      const newAnimal: Animal = { ...form, id: Date.now().toString() };
      setAnimals((prev) => [...prev, newAnimal]);
      toast.success(`${form.name} added successfully`);
      // Auto-open profile for the new animal
      setProfileAnimal(newAnimal);
      setDrawerOpen(true);
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deletingAnimal) {
      setAnimals((prev) => prev.filter((a) => a.id !== deletingAnimal.id));
      if (profileAnimal?.id === deletingAnimal.id) setDrawerOpen(false);
      toast.success(`${deletingAnimal.name} removed`);
    }
    setDeleteDialogOpen(false); setDeletingAnimal(null);
  };

  const handleAddRecord = (animalId: string, rec: Omit<DailyRecord, "id" | "createdAt">) => {
    const newRecord: DailyRecord = {
      ...rec,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setRecordsMap((prev) => ({
      ...prev,
      [animalId]: [...(prev[animalId] ?? []), newRecord],
    }));
    toast.success("Daily record saved");
  };

  const exportCSV = () => {
    const headers = ["Name", "Type", "Breed", "Tag ID", "Date of Birth", "Weight", "Health Status", "Location", "Notes"];
    const rows = filtered.map((a) => [a.name, typeLabels[a.type], a.breed, a.tagId, a.dateOfBirth, a.weight, a.healthStatus, a.location, a.notes]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "livestock_export.csv"; a.click();
    URL.revokeObjectURL(url); toast.success("Exported to CSV");
  };

  return (
    <PageShell>
      <PageHeader
        title="Livestock Management"
        description="Track and manage all your animals and herds"
        addLabel="Add Animal"
        onAdd={openAdd}
        onExport={exportCSV}
      />

      <StatCards stats={[
        { label: "Total Animals", value: counts.total,      color: "text-foreground" },
        { label: "Healthy",       value: counts.healthy,    color: "text-primary" },
        { label: "Sick",          value: counts.sick,       color: "text-destructive" },
        { label: "In Treatment",  value: counts.treatment,  color: "text-accent" },
        { label: "Quarantine",    value: counts.quarantine, color: "text-chart-brown" },
      ]} />

      <SearchFilterBar
        search={search} onSearch={setSearch} searchPlaceholder="Search animals..."
        filters={[
          { value: typeFilter,   onChange: setTypeFilter,   placeholder: "Type",   options: animalTypeFilterOptions },
          { value: healthFilter, onChange: setHealthFilter, placeholder: "Health",
            options: [{ value: "all", label: "All Health" }, ...healthOptions.map((o) => ({ value: o.value, label: o.label }))] },
        ]}
      />

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
                    <Bug className="w-10 h-10 mx-auto mb-2 opacity-30" />No animals found
                  </TableCell>
                </TableRow>
              ) : filtered.map((animal) => (
                <TableRow key={animal.id}>
                  <TableCell>
                    <button
                      className="text-left hover:underline focus:outline-none"
                      onClick={() => openProfile(animal)}
                    >
                      <p className="font-medium text-primary">{animal.name}</p>
                      <p className="text-xs text-muted-foreground">{animal.breed}</p>
                    </button>
                  </TableCell>
                  <TableCell className="text-sm">{typeLabels[animal.type]}</TableCell>
                  <TableCell className="text-sm font-mono">{animal.tagId}</TableCell>
                  <TableCell className="text-sm">{animal.dateOfBirth}</TableCell>
                  <TableCell className="text-sm">{animal.weight}</TableCell>
                  <TableCell>
                    <StatusSelect
                      value={animal.healthStatus}
                      options={healthOptions}
                      onChange={(v) => {
                        setAnimals((prev) => prev.map((a) => a.id === animal.id ? { ...a, healthStatus: v as HealthStatus } : a));
                        if (profileAnimal?.id === animal.id) setProfileAnimal((p) => p ? { ...p, healthStatus: v as HealthStatus } : p);
                        toast.success(`${animal.name} status updated`);
                      }}
                    />
                  </TableCell>
                  <TableCell className="text-sm">{animal.location}</TableCell>
                  <TableCell className="text-right">
                    <TableActions onEdit={() => openEdit(animal)} onDelete={() => openDelete(animal)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add / Edit modal */}
      <FormModal
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingAnimal ? "Edit Animal" : "Add New Animal"}
        description={editingAnimal ? "Update animal details below." : "Fill in the details for the new animal."}
        onSave={handleSave}
        saveLabel={editingAnimal ? "Save Changes" : "Add Animal"}
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Bessie" /></div>
          <div className="space-y-1.5"><Label>Type</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as AnimalType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{animalTypeFilterOptions.filter(o => o.value !== "all").map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Breed *</Label><Input value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} placeholder="e.g. Holstein" /></div>
          <div className="space-y-1.5"><Label>Tag ID *</Label><Input value={form.tagId} onChange={(e) => setForm({ ...form, tagId: e.target.value })} placeholder="e.g. COW-001" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Date of Birth</Label><Input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Weight</Label><Input value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="e.g. 680 kg" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Health Status</Label>
            <Select value={form.healthStatus} onValueChange={(v) => setForm({ ...form, healthStatus: v as HealthStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{healthOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Barn A - Pen 1" /></div>
        </div>
        <div className="space-y-1.5"><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes..." /></div>
      </FormModal>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title={`Remove ${deletingAnimal?.name}?`}
        description="This action cannot be undone. This animal record will be permanently removed."
      />

      {/* Animal profile + daily records drawer */}
      <AnimalProfileDrawer
        animal={profileAnimal}
        records={profileAnimal ? (recordsMap[profileAnimal.id] ?? []) : []}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onAddRecord={handleAddRecord}
      />
    </PageShell>
  );
};

export default Livestock;

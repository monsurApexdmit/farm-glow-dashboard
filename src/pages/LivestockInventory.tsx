import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertCircle, Pencil } from "lucide-react";
import { LivestockTypeCard, LivestockTypeData, AnimalDetail } from "@/components/LivestockTypeCard";
import { FormModal } from "@/components/FormModal";
import { PageShell } from "@/components/PageShell";
import { StatCards } from "@/components/StatCards";
import { SearchFilterBar } from "@/components/SearchFilterBar";

type AnimalType = "cow" | "sheep" | "chicken";
type HealthStatus = "healthy" | "sick" | "treatment" | "quarantine";

const initialLivestock: LivestockTypeData[] = [
  {
    type: "cow", label: "Dairy Cows", icon: "🐄",
    healthyCount: 30, sickCount: 5, treatmentCount: 4, quarantineCount: 1,
    capacityUsed: 70, totalCapacity: 80, avgAge: "4.2 years", avgWeight: "680 kg", productionRate: "420L/day",
  },
  {
    type: "sheep", label: "Wool Sheep", icon: "🐑",
    healthyCount: 32, sickCount: 6, treatmentCount: 8, quarantineCount: 4,
    capacityUsed: 50, totalCapacity: 60, avgAge: "3.1 years", avgWeight: "72 kg", productionRate: "12kg wool/year",
  },
  {
    type: "chicken", label: "Laying Hens", icon: "🐔",
    healthyCount: 160, sickCount: 20, treatmentCount: 15, quarantineCount: 5,
    capacityUsed: 200, totalCapacity: 240, avgAge: "2.3 years", avgWeight: "3.1 kg", productionRate: "170 eggs/day",
  },
];

const animalIcons: Record<string, string> = { cow: "🐄", sheep: "🐑", chicken: "🐔" };

const statusStyle: Record<HealthStatus, {
  badge: string; label: string; panel: string;
  title: string; body: string; icon: string; heading: string; msg: string;
}> = {
  healthy:    { badge: "bg-green-100 text-green-700 border border-green-300",    label: "🟢 Healthy",    panel: "bg-green-50 border-green-200",   title: "text-green-900",  body: "text-green-800",  icon: "✅", heading: "Status Good",       msg: "Animal is in excellent condition. Keep monitoring and maintain regular feeding schedule." },
  sick:       { badge: "bg-red-100 text-red-700 border border-red-300",          label: "🔴 Sick",       panel: "bg-red-50 border-red-200",       title: "text-red-900",    body: "text-red-800",    icon: "⚠️", heading: "Health Alert",      msg: "This animal requires medical attention. Contact veterinarian immediately." },
  treatment:  { badge: "bg-orange-100 text-orange-700 border border-orange-300", label: "🟠 Treatment",  panel: "bg-orange-50 border-orange-200", title: "text-orange-900", body: "text-orange-800", icon: "💊", heading: "Under Treatment",   msg: "Animal is currently receiving treatment. Monitor closely and follow veterinarian instructions." },
  quarantine: { badge: "bg-yellow-100 text-yellow-700 border border-yellow-300", label: "🟡 Quarantine", panel: "bg-yellow-50 border-yellow-200", title: "text-yellow-900", body: "text-yellow-800", icon: "🚫", heading: "Quarantined",       msg: "Animal is in quarantine. Keep isolated and maintain strict hygiene protocols." },
};

const healthOptions: { value: HealthStatus; label: string }[] = [
  { value: "healthy",    label: "Healthy" },
  { value: "sick",       label: "Sick" },
  { value: "treatment",  label: "In Treatment" },
  { value: "quarantine", label: "Quarantine" },
];

// Each AnimalDetail stored so edits persist per session
interface AnimalRecord extends AnimalDetail {
  notes: string;
}

const LivestockInventory = () => {
  const [livestock] = useState<LivestockTypeData[]>(initialLivestock);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<AnimalType | "all">("all");

  // Selected animal for the view dialog
  const [viewAnimal, setViewAnimal] = useState<AnimalRecord | null>(null);
  // Edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<AnimalRecord | null>(null);
  // Local overrides: key = `${type}-${id}`
  const [overrides, setOverrides] = useState<Record<string, Partial<AnimalRecord>>>({});

  const filtered = useMemo(() =>
    livestock.filter((item) => {
      const matchSearch = item.label.toLowerCase().includes(search.toLowerCase());
      const matchType = selectedType === "all" || item.type === selectedType;
      return matchSearch && matchType;
    }),
    [livestock, search, selectedType]
  );

  const stats = {
    totalAnimals:    livestock.reduce((s, i) => s + i.healthyCount + i.sickCount + i.treatmentCount + i.quarantineCount, 0),
    totalHealthy:    livestock.reduce((s, i) => s + i.healthyCount, 0),
    totalSick:       livestock.reduce((s, i) => s + i.sickCount, 0),
    totalTreatment:  livestock.reduce((s, i) => s + i.treatmentCount, 0),
    totalQuarantine: livestock.reduce((s, i) => s + i.quarantineCount, 0),
    totalCapacity:   livestock.reduce((s, i) => s + i.totalCapacity, 0),
    totalUsed:       livestock.reduce((s, i) => s + i.capacityUsed, 0),
  };

  // Merge base animal with any saved overrides
  const resolveAnimal = (base: AnimalDetail): AnimalRecord => {
    const key = `${base.type}-${base.id}`;
    return { ...base, notes: "", ...overrides[key] } as AnimalRecord;
  };

  const handleAnimalClick = (base: AnimalDetail) => {
    setViewAnimal(resolveAnimal(base));
  };

  const openEdit = () => {
    if (!viewAnimal) return;
    setEditForm({ ...viewAnimal });
    setEditOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editForm) return;
    const key = `${editForm.type}-${editForm.id}`;
    setOverrides((prev) => ({ ...prev, [key]: editForm }));
    setViewAnimal(editForm);
    setEditOpen(false);
  };

  const animalStatus = viewAnimal ? statusStyle[viewAnimal.status] : null;

  return (
    <PageShell>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-display">Livestock Inventory</h1>
        <p className="text-muted-foreground">Visual stock overview by animal type</p>
      </div>

      {/* Overview Stats */}
      <StatCards
        columns="grid-cols-2 md:grid-cols-6"
        stats={[
          { label: "Total Animals", value: stats.totalAnimals },
          { label: "Healthy",       value: stats.totalHealthy,    color: "text-green-600" },
          { label: "Sick",          value: stats.totalSick,       color: "text-red-600" },
          { label: "Treatment",     value: stats.totalTreatment,  color: "text-orange-600" },
          { label: "Quarantine",    value: stats.totalQuarantine, color: "text-yellow-600" },
          { label: "Capacity",      value: `${Math.round((stats.totalUsed / stats.totalCapacity) * 100)}%` },
        ]}
      />

      {/* Filters */}
      <SearchFilterBar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search livestock..."
        filters={[
          {
            value: selectedType,
            onChange: (v) => setSelectedType(v as AnimalType | "all"),
            placeholder: "Type",
            options: [
              { value: "all", label: "All Types" },
              { value: "cow", label: "Cows" },
              { value: "sheep", label: "Sheep" },
              { value: "chicken", label: "Chickens" },
            ],
          },
        ]}
      />

      {/* Livestock Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((item) => (
          <LivestockTypeCard key={item.type} item={item} onAnimalClick={handleAnimalClick} />
        ))}
      </div>

      {filtered.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No livestock found</p>
          </CardContent>
        </Card>
      )}

      {/* ── View Detail Dialog ─────────────────────────────────────── */}
      <Dialog open={!!viewAnimal && !editOpen} onOpenChange={(open) => !open && setViewAnimal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{viewAnimal ? animalIcons[viewAnimal.type] : ""}</span>
              <div>
                <DialogTitle>{viewAnimal?.animalTypeName} #{viewAnimal?.id}</DialogTitle>
                <DialogDescription>Individual animal details</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {viewAnimal && animalStatus && (
            <div className="space-y-4 py-2">
              {/* Status badge + condition */}
              <div className="flex items-center gap-3">
                <Badge className={`text-sm px-3 py-1 ${animalStatus.badge}`}>{animalStatus.label}</Badge>
                <span className="text-sm text-muted-foreground">{viewAnimal.condition}</span>
              </div>

              {/* Detail grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/40">
                  <p className="text-xs text-muted-foreground">Animal ID</p>
                  <p className="text-lg font-semibold">#{viewAnimal.id}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/40">
                  <p className="text-xs text-muted-foreground">Age</p>
                  <p className="text-lg font-semibold">{viewAnimal.age}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/40">
                  <p className="text-xs text-muted-foreground">Weight</p>
                  <p className="text-lg font-semibold">{viewAnimal.weight}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/40">
                  <p className="text-xs text-muted-foreground">Last Checkup</p>
                  <p className="text-sm font-semibold">{viewAnimal.lastCheckup}</p>
                </div>
              </div>

              {/* Health panel */}
              <div className={`p-3 rounded-lg border ${animalStatus.panel}`}>
                <div className="flex items-start gap-2">
                  <span className="text-xl">{animalStatus.icon}</span>
                  <div>
                    <p className={`font-semibold ${animalStatus.title}`}>{animalStatus.heading}</p>
                    <p className={`text-sm mt-1 ${animalStatus.body}`}>{animalStatus.msg}</p>
                  </div>
                </div>
              </div>

              {/* Notes (if any) */}
              {viewAnimal.notes && (
                <div className="p-3 rounded-lg bg-muted/40">
                  <p className="text-xs text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm">{viewAnimal.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" className="flex-1" onClick={openEdit}>
                  <Pencil className="w-3.5 h-3.5 mr-1" /> Edit Info
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Edit Modal (uses FormModal) ────────────────────────────── */}
      {editForm && (
        <FormModal
          open={editOpen}
          onOpenChange={(open) => { setEditOpen(open); }}
          title={`Edit ${editForm.animalTypeName} #${editForm.id}`}
          description="Update this animal's health status and notes."
          onSave={handleSaveEdit}
          saveLabel="Save Changes"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Age</Label>
              <Input value={editForm.age} onChange={(e) => setEditForm({ ...editForm, age: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Weight</Label>
              <Input value={editForm.weight} onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Health Status</Label>
            <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v as HealthStatus, condition: statusStyle[v as HealthStatus].heading })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {healthOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Last Checkup</Label>
            <Input value={editForm.lastCheckup} onChange={(e) => setEditForm({ ...editForm, lastCheckup: e.target.value })} placeholder="e.g. 1 week ago" />
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Input value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} placeholder="Additional observations..." />
          </div>
        </FormModal>
      )}
    </PageShell>
  );
};

export default LivestockInventory;

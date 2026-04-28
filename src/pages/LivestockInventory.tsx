import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertCircle, Pencil, RefreshCw } from "lucide-react";
import { LivestockTypeCard, LivestockTypeData, AnimalDetail } from "@/components/LivestockTypeCard";
import { FormModal } from "@/components/FormModal";
import { PageShell } from "@/components/PageShell";
import { StatCards } from "@/components/StatCards";
import { SearchFilterBar } from "@/components/SearchFilterBar";
import { livestockService } from "@/services/livestock.service";
import { useToast } from "@/hooks/use-toast";

type HealthStatus = "healthy" | "sick" | "treatment" | "quarantine";

const animalIcons: Record<string, string> = {
  cow: "🐄", cattle: "🐄", sheep: "🐑", chicken: "🐔",
  pig: "🐷", goat: "🐐", duck: "🦆", horse: "🐴",
};

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

interface AnimalRecord extends AnimalDetail {
  backendId: number;
  notes: string;
  breed?: string;
  gender?: string;
}

const LivestockInventory = () => {
  const { toast } = useToast();
  const [livestock, setLivestock] = useState<LivestockTypeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");

  const [viewAnimal, setViewAnimal] = useState<AnimalRecord | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<AnimalRecord | null>(null);
  const [saving, setSaving] = useState(false);

  // Raw animal data keyed by backendId for edit lookups
  const [animalMap, setAnimalMap] = useState<Record<number, any>>({});

  const loadData = async () => {
    setLoading(true);
    try {
      const summary = await livestockService.getInventorySummary();
      // Build animalMap for detail lookups
      const map: Record<number, any> = {};
      for (const group of summary) {
        for (const a of (group.animals ?? [])) {
          map[a.id] = { ...a, groupType: group.type, groupLabel: group.label, icon: group.icon };
        }
      }
      setAnimalMap(map);
      setLivestock(summary);
    } catch {
      toast({ title: "Failed to load livestock inventory", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const typeOptions = useMemo(() => {
    const types = [...new Set(livestock.map(l => l.type))];
    return [
      { value: "all", label: "All Types" },
      ...types.map(t => ({ value: t, label: livestock.find(l => l.type === t)?.label ?? t })),
    ];
  }, [livestock]);

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

  const handleAnimalClick = (base: AnimalDetail) => {
    const raw = animalMap[(base as any).backendId ?? base.id];
    const record: AnimalRecord = {
      ...base,
      backendId: raw?.id ?? base.id,
      notes: raw?.notes ?? "",
      breed: raw?.breed,
      gender: raw?.gender,
    };
    setViewAnimal(record);
  };

  const openEdit = () => {
    if (!viewAnimal) return;
    setEditForm({ ...viewAnimal });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editForm) return;
    setSaving(true);
    try {
      await livestockService.logHealth(String(editForm.backendId), {
        health_status: editForm.status,
        observations: editForm.notes || undefined,
        weight: parseFloat(editForm.weight) || undefined,
        weight_unit: "kg",
      });
      toast({ title: "Health record saved", description: `${editForm.animalTypeName} #${editForm.backendId} updated.` });
      setViewAnimal(editForm);
      setEditOpen(false);
      await loadData();
    } catch {
      toast({ title: "Failed to save health record", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const animalStatus = viewAnimal ? statusStyle[viewAnimal.status] : null;
  const icon = viewAnimal ? (animalIcons[viewAnimal.type] ?? "🐾") : "";

  return (
    <PageShell>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display">Livestock Inventory</h1>
          <p className="text-muted-foreground">Visual stock overview by animal type</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
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
          { label: "Capacity",      value: stats.totalCapacity > 0 ? `${Math.round((stats.totalUsed / stats.totalCapacity) * 100)}%` : "—" },
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
            onChange: setSelectedType,
            placeholder: "Type",
            options: typeOptions,
          },
        ]}
      />

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6 h-64 bg-muted/30 rounded-lg" />
            </Card>
          ))}
        </div>
      )}

      {/* Livestock Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <LivestockTypeCard key={item.type} item={item} onAnimalClick={handleAnimalClick} />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No livestock found</p>
          </CardContent>
        </Card>
      )}

      {/* View Detail Dialog */}
      <Dialog open={!!viewAnimal && !editOpen} onOpenChange={(open) => !open && setViewAnimal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{icon}</span>
              <div>
                <DialogTitle>{viewAnimal?.animalTypeName} #{viewAnimal?.backendId}</DialogTitle>
                <DialogDescription>Individual animal details</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {viewAnimal && animalStatus && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3">
                <Badge className={`text-sm px-3 py-1 ${animalStatus.badge}`}>{animalStatus.label}</Badge>
                <span className="text-sm text-muted-foreground">{viewAnimal.condition}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/40">
                  <p className="text-xs text-muted-foreground">Tag / ID</p>
                  <p className="text-lg font-semibold">#{viewAnimal.backendId}</p>
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
                {viewAnimal.breed && (
                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">Breed</p>
                    <p className="text-sm font-semibold">{viewAnimal.breed}</p>
                  </div>
                )}
                {viewAnimal.gender && (
                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">Gender</p>
                    <p className="text-sm font-semibold capitalize">{viewAnimal.gender}</p>
                  </div>
                )}
              </div>

              <div className={`p-3 rounded-lg border ${animalStatus.panel}`}>
                <div className="flex items-start gap-2">
                  <span className="text-xl">{animalStatus.icon}</span>
                  <div>
                    <p className={`font-semibold ${animalStatus.title}`}>{animalStatus.heading}</p>
                    <p className={`text-sm mt-1 ${animalStatus.body}`}>{animalStatus.msg}</p>
                  </div>
                </div>
              </div>

              {viewAnimal.notes && (
                <div className="p-3 rounded-lg bg-muted/40">
                  <p className="text-xs text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm">{viewAnimal.notes}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" className="flex-1" onClick={openEdit}>
                  <Pencil className="w-3.5 h-3.5 mr-1" /> Edit Info
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      {editForm && (
        <FormModal
          open={editOpen}
          onOpenChange={(open) => { setEditOpen(open); }}
          title={`Edit ${editForm.animalTypeName} #${editForm.backendId}`}
          description="Update this animal's health status and notes."
          onSave={handleSaveEdit}
          saveLabel={saving ? "Saving..." : "Save Changes"}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Age</Label>
              <Input value={editForm.age} onChange={(e) => setEditForm({ ...editForm, age: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Weight (kg)</Label>
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

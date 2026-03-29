import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  MapPin, Tag, Scale, CalendarDays, Stethoscope, FileText,
  Plus, Droplets, Syringe, Sparkles, AlertTriangle, Utensils, Clock,
} from "lucide-react";

export type RecordType = "feeding" | "vaccination" | "treatment" | "cleaning" | "health-check" | "other";

export interface DailyRecord {
  id: string;
  date: string;
  type: RecordType;
  details: string;
  createdAt: string;
}

export interface AnimalProfile {
  id: string;
  name: string;
  type: string;
  breed: string;
  tagId: string;
  dateOfBirth: string;
  weight: string;
  healthStatus: string;
  location: string;
  notes: string;
}

const healthBadge: Record<string, string> = {
  healthy:    "bg-primary/15 text-primary border-primary/30",
  sick:       "bg-destructive/15 text-destructive border-destructive/30",
  treatment:  "bg-accent/15 text-accent border-accent/30",
  quarantine: "bg-chart-brown/15 text-chart-brown border-chart-brown/30",
};

const healthLabel: Record<string, string> = {
  healthy: "Healthy", sick: "Sick", treatment: "In Treatment", quarantine: "Quarantine",
};

const typeIcon: Record<string, string> = {
  cattle: "🐄", horse: "🐴", sheep: "🐑", goat: "🐐", pig: "🐷", poultry: "🐔", other: "🐾",
};

const recordTypeConfig: Record<RecordType, { label: string; icon: React.ReactNode; color: string }> = {
  feeding:      { label: "Feeding",      icon: <Utensils    className="w-3.5 h-3.5" />, color: "text-blue-600 bg-blue-50 border-blue-200" },
  vaccination:  { label: "Vaccination",  icon: <Syringe     className="w-3.5 h-3.5" />, color: "text-purple-600 bg-purple-50 border-purple-200" },
  treatment:    { label: "Treatment",    icon: <Stethoscope className="w-3.5 h-3.5" />, color: "text-orange-600 bg-orange-50 border-orange-200" },
  cleaning:     { label: "Cleaning",     icon: <Sparkles    className="w-3.5 h-3.5" />, color: "text-teal-600 bg-teal-50 border-teal-200" },
  "health-check":{ label: "Health Check",icon: <Droplets    className="w-3.5 h-3.5" />, color: "text-green-600 bg-green-50 border-green-200" },
  other:        { label: "Other",        icon: <FileText    className="w-3.5 h-3.5" />, color: "text-muted-foreground bg-muted border-muted-foreground/20" },
};

const emptyRecord = (): Omit<DailyRecord, "id" | "createdAt"> => ({
  date: new Date().toISOString().split("T")[0],
  type: "feeding",
  details: "",
});

interface AnimalProfileDrawerProps {
  animal: AnimalProfile | null;
  records: DailyRecord[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddRecord: (animalId: string, record: Omit<DailyRecord, "id" | "createdAt">) => void;
}

export function AnimalProfileDrawer({
  animal,
  records,
  open,
  onOpenChange,
  onAddRecord,
}: AnimalProfileDrawerProps) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyRecord());

  if (!animal) return null;

  const handleSubmit = () => {
    if (!form.details.trim()) return;
    onAddRecord(animal.id, form);
    setForm(emptyRecord());
    setShowForm(false);
  };

  const sortedRecords = [...records].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{typeIcon[animal.type] ?? "🐾"}</span>
            <div>
              <SheetTitle className="text-xl">{animal.name}</SheetTitle>
              <SheetDescription>{animal.breed} · {animal.tagId}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* ── Profile ─────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={healthBadge[animal.healthStatus] ?? ""}>
              {healthLabel[animal.healthStatus] ?? animal.healthStatus}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <Tag className="w-4 h-4" />,          label: "Tag ID",    value: animal.tagId },
              { icon: <Scale className="w-4 h-4" />,        label: "Weight",    value: animal.weight },
              { icon: <CalendarDays className="w-4 h-4" />, label: "Born",      value: animal.dateOfBirth || "—" },
              { icon: <MapPin className="w-4 h-4" />,       label: "Location",  value: animal.location },
            ].map((f) => (
              <div key={f.label} className="p-3 rounded-lg bg-muted/40 space-y-0.5">
                <p className="text-xs text-muted-foreground flex items-center gap-1">{f.icon}{f.label}</p>
                <p className="text-sm font-semibold">{f.value}</p>
              </div>
            ))}
          </div>

          {animal.notes && (
            <div className="p-3 rounded-lg bg-muted/40">
              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                <FileText className="w-3.5 h-3.5" /> Notes
              </p>
              <p className="text-sm">{animal.notes}</p>
            </div>
          )}

          <Separator />

          {/* ── Daily Records ────────────────────── */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Daily Records</h3>
            <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => setShowForm((v) => !v)}>
              <Plus className="w-3.5 h-3.5" /> Add Record
            </Button>
          </div>

          {/* Add record form */}
          {showForm && (
            <div className="p-3 rounded-lg border space-y-3 bg-muted/20">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Date</Label>
                  <Input type="date" className="h-8 text-sm" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as RecordType })}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(recordTypeConfig) as RecordType[]).map((t) => (
                        <SelectItem key={t} value={t}>{recordTypeConfig[t].label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Details *</Label>
                <Input className="h-8 text-sm" placeholder="Describe the activity or observation..." value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 h-7 text-xs" onClick={handleSubmit}>Save Record</Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setShowForm(false); setForm(emptyRecord()); }}>Cancel</Button>
              </div>
            </div>
          )}

          {/* Records list */}
          {sortedRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No records yet</p>
              <p className="text-xs">Add the first daily record above</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedRecords.map((rec) => {
                const cfg = recordTypeConfig[rec.type];
                return (
                  <div key={rec.id} className={`p-3 rounded-lg border text-sm ${cfg.color}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center gap-1.5 font-medium text-xs">
                        {cfg.icon} {cfg.label}
                      </span>
                      <span className="text-xs opacity-70">{rec.date}</span>
                    </div>
                    <p className="text-sm opacity-90">{rec.details}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

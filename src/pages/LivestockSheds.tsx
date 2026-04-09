import { useState } from "react";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Home, Plus, Pencil, Trash2, GripVertical, AlertCircle, Droplets, Clock, Heart, Sparkles, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FarmGridMap } from "@/components/FarmGridMap";

type ShedStatus = "active" | "maintenance" | "inactive";
type AnimalType = "cow" | "sheep" | "chicken";
type RecordType = "feeding" | "vaccination" | "treatment" | "cleaning" | "mortality";

interface DailyRecord {
  id: string;
  shedId: string;
  type: RecordType;
  date: string;
  details: string;
  createdAt: string;
}

interface Shed {
  id: string;
  name: string;
  animalType: AnimalType;
  totalAnimals: number;
  capacity: number;
  status: ShedStatus;
  feedSchedule: string;
  healthStatus: string;
  cleaningStatus: string;
  productionData: string;
  assignedWorker: string;
  notes: string;
  // Grid positioning
  row: number;
  col: number;
  rowSpan: number;
  colSpan: number;
}

type ShedStatus_Type = "active" | "maintenance" | "inactive";

const statusOptions: { value: ShedStatus_Type; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "maintenance", label: "Maintenance" },
  { value: "inactive", label: "Inactive" },
];

const animalTypeOptions: { value: AnimalType; label: string }[] = [
  { value: "cow", label: "Cows" },
  { value: "sheep", label: "Sheep" },
  { value: "chicken", label: "Chickens" },
];

const animalTypeIcons: Record<AnimalType, React.ReactNode> = {
  cow: <span className="text-2xl">🐄</span>,
  sheep: <span className="text-2xl">🐑</span>,
  chicken: <span className="text-2xl">🐔</span>,
};

const animalTypeColors: Record<AnimalType, { bg: string; border: string; text: string }> = {
  cow: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-900",
  },
  sheep: {
    bg: "bg-slate-100",
    border: "border-slate-300",
    text: "text-slate-900",
  },
  chicken: {
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    text: "text-yellow-900",
  },
};

const recordTypeOptions: { value: RecordType; label: string }[] = [
  { value: "feeding", label: "Feeding" },
  { value: "vaccination", label: "Vaccination" },
  { value: "treatment", label: "Treatment" },
  { value: "cleaning", label: "Cleaning" },
  { value: "mortality", label: "Mortality" },
];

const statusColors: Record<ShedStatus_Type, string> = {
  active: "bg-primary/15 text-primary border-primary/30",
  maintenance: "bg-accent/15 text-accent-foreground border-accent/30",
  inactive: "bg-muted text-muted-foreground border-muted-foreground/20",
};

const statusBgColors: Record<ShedStatus_Type, string> = {
  active: "hsla(142, 45%, 42%, 0.12)",
  maintenance: "hsla(38, 80%, 55%, 0.12)",
  inactive: "hsl(var(--muted))",
};

const recordTypeIcons: Record<RecordType, React.ReactNode> = {
  feeding: <Droplets className="w-3 h-3" />,
  vaccination: <Heart className="w-3 h-3" />,
  treatment: <Zap className="w-3 h-3" />,
  cleaning: <Sparkles className="w-3 h-3" />,
  mortality: <AlertCircle className="w-3 h-3" />,
};

const initialSheds: Shed[] = [
  {
    id: "S1",
    name: "Main Cow Barn",
    animalType: "cow",
    totalAnimals: 45,
    capacity: 50,
    status: "active",
    feedSchedule: "6am, 12pm, 6pm",
    healthStatus: "All healthy",
    cleaningStatus: "Clean - Last 2 days ago",
    productionData: "450L milk/day avg",
    assignedWorker: "John Smith",
    notes: "High-yield dairy herd",
    row: 0,
    col: 0,
    rowSpan: 2,
    colSpan: 2,
  },
  {
    id: "S2",
    name: "Sheep Pen A",
    animalType: "sheep",
    totalAnimals: 28,
    capacity: 30,
    status: "active",
    feedSchedule: "8am, 4pm",
    healthStatus: "2 under observation",
    cleaningStatus: "Clean - Today",
    productionData: "Wool production on track",
    assignedWorker: "Mary Johnson",
    notes: "Merino breed for wool",
    row: 0,
    col: 2,
    rowSpan: 1,
    colSpan: 2,
  },
  {
    id: "S3",
    name: "Chicken Coop 1",
    animalType: "chicken",
    totalAnimals: 120,
    capacity: 120,
    status: "active",
    feedSchedule: "7am, 5pm",
    healthStatus: "Healthy",
    cleaningStatus: "Due - 1 day",
    productionData: "95 eggs/day avg",
    assignedWorker: "Sarah Lee",
    notes: "Laying hens, peak production",
    row: 2,
    col: 0,
    rowSpan: 1,
    colSpan: 1,
  },
  {
    id: "S4",
    name: "Sheep Pen B",
    animalType: "sheep",
    totalAnimals: 22,
    capacity: 30,
    status: "maintenance",
    feedSchedule: "8am, 4pm",
    healthStatus: "Healthy",
    cleaningStatus: "Maintenance mode",
    productionData: "Awaiting repair",
    assignedWorker: "Pending",
    notes: "Under fence repair",
    row: 2,
    col: 1,
    rowSpan: 1,
    colSpan: 2,
  },
  {
    id: "S5",
    name: "Chicken Coop 2",
    animalType: "chicken",
    totalAnimals: 85,
    capacity: 120,
    status: "active",
    feedSchedule: "7am, 5pm",
    healthStatus: "Healthy",
    cleaningStatus: "Clean - 3 days ago",
    productionData: "72 eggs/day avg",
    assignedWorker: "Tom Wilson",
    notes: "Growing flock, younger birds",
    row: 1,
    col: 2,
    rowSpan: 2,
    colSpan: 2,
  },
];

const GRID_COLS = 6;
const GRID_ROWS = 6;

const emptyShed = (): Omit<Shed, "id"> => ({
  name: "",
  animalType: "cow",
  totalAnimals: 0,
  capacity: 50,
  status: "active",
  feedSchedule: "",
  healthStatus: "Healthy",
  cleaningStatus: "Clean",
  productionData: "",
  assignedWorker: "",
  notes: "",
  row: 0,
  col: 0,
  rowSpan: 1,
  colSpan: 1,
});

const LivestockSheds = () => {
  const [sheds, setSheds] = useState<Shed[]>(initialSheds);
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [selected, setSelected] = useState<Shed | null>(null);
  const [editDialog, setEditDialog] = useState(false);
  const [addDialog, setAddDialog] = useState(false);
  const [recordDialog, setRecordDialog] = useState(false);
  const [editForm, setEditForm] = useState<Shed | null>(null);
  const [addForm, setAddForm] = useState<Omit<Shed, "id">>(emptyShed());
  const [recordForm, setRecordForm] = useState<Omit<DailyRecord, "id" | "createdAt">>({
    shedId: "",
    type: "feeding",
    date: new Date().toISOString().split("T")[0],
    details: "",
  });
  const [deleteConfirm, setDeleteConfirm] = useState<Shed | null>(null);
  const { toast } = useToast();

  const nextId = () => {
    const existing = sheds.map((s) => s.id);
    for (let n = 1; n <= 99; n++) {
      const id = `S${n}`;
      if (!existing.includes(id)) return id;
    }
    return `S${sheds.length + 1}`;
  };

  // --- Add ---
  const handleAdd = () => {
    if (!addForm.name.trim()) {
      toast({ title: "Name required", description: "Please enter a shed name.", variant: "destructive" });
      return;
    }
    const newShed: Shed = { ...addForm, id: nextId() };
    setSheds((prev) => [...prev, newShed]);
    setAddDialog(false);
    setAddForm(emptyShed());
    toast({ title: "Shed added", description: `${newShed.name} has been added to the layout.` });
  };

  // --- Edit ---
  const openEdit = (shed: Shed) => {
    setEditForm({ ...shed });
    setEditDialog(true);
  };
  const handleEdit = () => {
    if (!editForm) return;
    setSheds((prev) => prev.map((s) => (s.id === editForm.id ? editForm : s)));
    setSelected(editForm);
    setEditDialog(false);
    toast({ title: "Shed updated", description: `${editForm.name} has been updated.` });
  };

  // --- Delete ---
  const handleDelete = (id: string) => {
    setSheds((prev) => prev.filter((s) => s.id !== id));
    if (selected?.id === id) setSelected(null);
    setDeleteConfirm(null);
    toast({ title: "Shed removed", description: "The shed has been deleted." });
  };

  // --- Move (from FarmGridMap drag-drop) ---
  const handleMove = (id: string, row: number, col: number) => {
    setSheds((prev) => prev.map((s) => (s.id === id ? { ...s, row, col } : s)));
    setSelected((prev) => (prev?.id === id ? { ...prev, row, col } : prev));
    toast({ title: "Shed moved", description: "Shed position updated on the layout." });
  };

  // --- Daily Records ---
  const openRecordDialog = (shed: Shed) => {
    setRecordForm({
      shedId: shed.id,
      type: "feeding",
      date: new Date().toISOString().split("T")[0],
      details: "",
    });
    setRecordDialog(true);
  };

  const handleAddRecord = () => {
    if (!recordForm.details.trim()) {
      toast({ title: "Details required", description: "Please enter record details.", variant: "destructive" });
      return;
    }
    const newRecord: DailyRecord = {
      ...recordForm,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setRecords((prev) => [...prev, newRecord]);
    setRecordDialog(false);
    setRecordForm({
      shedId: "",
      type: "feeding",
      date: new Date().toISOString().split("T")[0],
      details: "",
    });
    toast({ title: "Record added", description: "Daily record has been logged." });
  };

  // Quick Stats
  const totalSheds = sheds.length;
  const totalAnimals = sheds.reduce((sum, s) => sum + s.totalAnimals, 0);
  const fullSheds = sheds.filter((s) => s.totalAnimals >= s.capacity).length;
  const sickAnimals = sheds.filter((s) => s.healthStatus.toLowerCase().includes("sick")).length;
  const feedLowAlerts = sheds.filter((s) => s.status === "active" && s.totalAnimals > s.capacity * 0.9).length;
  const cleaningDue = sheds.filter((s) => s.cleaningStatus.toLowerCase().includes("due")).length;

  const shedRecords = selected ? records.filter((r) => r.shedId === selected.id) : [];

  return (
    <PageShell>
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h1 className="text-3xl font-bold font-display">Livestock Shed Management</h1>
            <div className="flex items-center gap-2 flex-wrap">
              {animalTypeOptions.map((t) => (
                <Badge key={t.value} variant="outline">
                  {t.label}
                </Badge>
              ))}
              <Button size="sm" onClick={() => { setAddForm(emptyShed()); setAddDialog(true); }} className="gap-1">
                <Plus className="w-4 h-4" /> Add Shed
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map Grid */}
            <div className="lg:col-span-2">
              <FarmGridMap
                title={<><Home className="w-5 h-5" /> Farm Layout</>}
                items={sheds}
                onMove={handleMove}
                selectedId={selected?.id}
                gridCols={GRID_COLS}
                gridRows={GRID_ROWS}
                renderTile={(shed, isDragging, isSelected) => {
                  const colors = animalTypeColors[shed.animalType];
                  const isFull = shed.totalAnimals >= shed.capacity;
                  return (
                    <div
                      onClick={() => setSelected(shed)}
                      className={`relative rounded-lg border-2 p-3 text-left transition-all cursor-grab active:cursor-grabbing hover:shadow-lg group h-full w-full flex flex-col ${
                        isSelected
                          ? "border-primary ring-2 ring-primary/30 shadow-md"
                          : "border-border hover:border-primary/40"
                      } ${isDragging ? "opacity-50 scale-95" : ""} ${colors.bg}`}
                    >
                      <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEdit(shed); }}
                          className="p-1 rounded bg-background/80 hover:bg-background border border-border/50 transition-colors"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirm(shed); }}
                          className="p-1 rounded bg-background/80 hover:bg-destructive/10 border border-border/50 transition-colors"
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </button>
                      </div>
                      <div className="absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-60 transition-opacity">
                        <GripVertical className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 flex items-center justify-center mb-2">
                        {animalTypeIcons[shed.animalType]}
                      </div>
                      <p className="text-xs font-bold text-muted-foreground">{shed.id}</p>
                      <p className="text-sm font-semibold truncate">{shed.name}</p>
                      <div className="mt-2 space-y-1">
                        <div className="h-1.5 rounded-full bg-black/10 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${isFull ? "bg-destructive" : "bg-primary"}`}
                            style={{ width: `${Math.min((shed.totalAnimals / shed.capacity) * 100, 100)}%` }}
                          />
                        </div>
                        <p className="text-[10px] font-medium">
                          <span className={colors.text}>{shed.totalAnimals}/{shed.capacity}</span>
                        </p>
                      </div>
                      <Badge variant="outline" className={`${statusColors[shed.status]} text-[10px] px-1.5 py-0 mt-1 border w-fit`}>
                        {shed.status}
                      </Badge>
                    </div>
                  );
                }}
              />
            </div>

            {/* Detail Panel */}
            <div className="space-y-4">
              {selected ? (
                <>
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-3xl">{animalTypeIcons[selected.animalType]}</span>
                            <div>
                              <CardTitle className="text-lg">{selected.name}</CardTitle>
                              <CardDescription>Shed {selected.id}</CardDescription>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(selected)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteConfirm(selected)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Badge className={statusColors[selected.status]}>{selected.status}</Badge>

                      <div className="space-y-2 pt-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Animals:</span>
                          <span className="font-medium">{selected.totalAnimals}/{selected.capacity}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(selected.totalAnimals / selected.capacity) * 100}%` }} />
                        </div>

                        <div className="pt-2 flex items-center justify-between">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Feed Schedule
                          </span>
                          <span className="font-medium text-xs">{selected.feedSchedule}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Heart className="w-3.5 h-3.5" /> Health
                          </span>
                          <span className="font-medium text-xs">{selected.healthStatus}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" /> Cleaning
                          </span>
                          <span className="font-medium text-xs">{selected.cleaningStatus}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Production:</span>
                          <span className="font-medium text-xs">{selected.productionData}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Worker:</span>
                          <span className="font-medium text-xs">{selected.assignedWorker}</span>
                        </div>
                      </div>

                      {selected.notes && (
                        <div className="text-xs text-muted-foreground pt-2 border-t">
                          {selected.notes}
                        </div>
                      )}

                      <Button size="sm" className="w-full mt-2" onClick={() => openRecordDialog(selected)}>
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add Daily Record
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Daily Records */}
                  {shedRecords.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Recent Records</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {shedRecords.slice(-5).reverse().map((record) => (
                          <div key={record.id} className="flex items-start gap-2 p-2 rounded border text-xs">
                            <span className="text-muted-foreground mt-0.5">{recordTypeIcons[record.type]}</span>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium capitalize">{record.type}</div>
                              <div className="text-muted-foreground truncate">{record.details}</div>
                              <div className="text-[10px] text-muted-foreground">{record.date}</div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <Home className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">Select a shed to view details</p>
                    <p className="text-xs mt-1">Drag sheds to reposition them</p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Quick Stats & Alerts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Total Sheds</p>
                      <p className="text-xl font-bold">{totalSheds}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Total Animals</p>
                      <p className="text-xl font-bold">{totalAnimals}</p>
                    </div>
                  </div>

                  {fullSheds > 0 && (
                    <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                      <p className="text-xs font-medium flex items-center gap-1 text-accent-foreground">
                        <AlertCircle className="w-3.5 h-3.5" /> {fullSheds} full sheds
                      </p>
                    </div>
                  )}

                  {sickAnimals > 0 && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <p className="text-xs font-medium flex items-center gap-1 text-destructive">
                        <AlertCircle className="w-3.5 h-3.5" /> {sickAnimals} sheds with sick animals
                      </p>
                    </div>
                  )}

                  {feedLowAlerts > 0 && (
                    <div className="p-3 rounded-lg bg-orange-100/50 border border-orange-200">
                      <p className="text-xs font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {feedLowAlerts} feed alerts
                      </p>
                    </div>
                  )}

                  {cleaningDue > 0 && (
                    <div className="p-3 rounded-lg bg-blue-100/50 border border-blue-200">
                      <p className="text-xs font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {cleaningDue} cleaning due
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                    <div className="text-center">
                      <p className="text-muted-foreground">Capacity</p>
                      <p className="font-semibold">{Math.round((totalAnimals / sheds.reduce((s, sh) => s + sh.capacity, 0)) * 100)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground">Active Sheds</p>
                      <p className="font-semibold">{sheds.filter((s) => s.status === "active").length}/{totalSheds}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Shed {editForm?.id}</DialogTitle>
            <DialogDescription>Update the shed details and position on the grid.</DialogDescription>
          </DialogHeader>
          {editForm && (
            <div className="space-y-4 py-2">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Name</Label>
                      <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Animal Type</Label>
                      <Select value={editForm.animalType} onValueChange={(v) => setEditForm({ ...editForm, animalType: v as AnimalType })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {animalTypeOptions.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Total Animals</Label>
                      <Input type="number" min={0} value={editForm.totalAnimals} onChange={(e) => setEditForm({ ...editForm, totalAnimals: +e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Capacity</Label>
                      <Input type="number" min={1} value={editForm.capacity} onChange={(e) => setEditForm({ ...editForm, capacity: +e.target.value })} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v as ShedStatus_Type })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Feed Schedule</Label>
                    <Input value={editForm.feedSchedule} onChange={(e) => setEditForm({ ...editForm, feedSchedule: e.target.value })} placeholder="e.g. 6am, 12pm, 6pm" />
                  </div>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Health Status</Label>
                    <Input value={editForm.healthStatus} onChange={(e) => setEditForm({ ...editForm, healthStatus: e.target.value })} />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Cleaning Status</Label>
                    <Input value={editForm.cleaningStatus} onChange={(e) => setEditForm({ ...editForm, cleaningStatus: e.target.value })} />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Production Data</Label>
                    <Input value={editForm.productionData} onChange={(e) => setEditForm({ ...editForm, productionData: e.target.value })} />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Assigned Worker</Label>
                    <Input value={editForm.assignedWorker} onChange={(e) => setEditForm({ ...editForm, assignedWorker: e.target.value })} />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Notes</Label>
                    <Textarea value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} rows={3} />
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-3">Grid Position & Size</p>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Row</Label>
                        <Input type="number" min={0} max={GRID_ROWS - 1} value={editForm.row} onChange={(e) => setEditForm({ ...editForm, row: +e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Column</Label>
                        <Input type="number" min={0} max={GRID_COLS - 1} value={editForm.col} onChange={(e) => setEditForm({ ...editForm, col: +e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Width</Label>
                        <Input type="number" min={1} max={GRID_COLS} value={editForm.colSpan} onChange={(e) => setEditForm({ ...editForm, colSpan: +e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Height</Label>
                        <Input type="number" min={1} max={GRID_ROWS} value={editForm.rowSpan} onChange={(e) => setEditForm({ ...editForm, rowSpan: +e.target.value })} />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>Cancel</Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Shed</DialogTitle>
            <DialogDescription>Create a new livestock shed and place it on the layout.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Name</Label>
                    <Input placeholder="e.g. Main Cow Barn" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Animal Type</Label>
                    <Select value={addForm.animalType} onValueChange={(v) => setAddForm({ ...addForm, animalType: v as AnimalType })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {animalTypeOptions.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Total Animals</Label>
                    <Input type="number" min={0} value={addForm.totalAnimals} onChange={(e) => setAddForm({ ...addForm, totalAnimals: +e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Capacity</Label>
                    <Input type="number" min={1} value={addForm.capacity} onChange={(e) => setAddForm({ ...addForm, capacity: +e.target.value })} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Feed Schedule</Label>
                  <Input value={addForm.feedSchedule} onChange={(e) => setAddForm({ ...addForm, feedSchedule: e.target.value })} placeholder="e.g. 6am, 12pm, 6pm" />
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Health Status</Label>
                  <Input value={addForm.healthStatus} onChange={(e) => setAddForm({ ...addForm, healthStatus: e.target.value })} placeholder="e.g. Healthy" />
                </div>

                <div className="space-y-1.5">
                  <Label>Cleaning Status</Label>
                  <Input value={addForm.cleaningStatus} onChange={(e) => setAddForm({ ...addForm, cleaningStatus: e.target.value })} placeholder="e.g. Clean" />
                </div>

                <div className="space-y-1.5">
                  <Label>Production Data</Label>
                  <Input value={addForm.productionData} onChange={(e) => setAddForm({ ...addForm, productionData: e.target.value })} placeholder="e.g. 450L milk/day" />
                </div>

                <div className="space-y-1.5">
                  <Label>Assigned Worker</Label>
                  <Input value={addForm.assignedWorker} onChange={(e) => setAddForm({ ...addForm, assignedWorker: e.target.value })} placeholder="e.g. John Smith" />
                </div>

                <div className="space-y-1.5">
                  <Label>Notes</Label>
                  <Textarea value={addForm.notes} onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })} placeholder="Additional notes..." rows={3} />
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-3">Grid Position & Size</p>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Row</Label>
                      <Input type="number" min={0} max={GRID_ROWS - 1} value={addForm.row} onChange={(e) => setAddForm({ ...addForm, row: +e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Column</Label>
                      <Input type="number" min={0} max={GRID_COLS - 1} value={addForm.col} onChange={(e) => setAddForm({ ...addForm, col: +e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Width</Label>
                      <Input type="number" min={1} max={GRID_COLS} value={addForm.colSpan} onChange={(e) => setAddForm({ ...addForm, colSpan: +e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Height</Label>
                      <Input type="number" min={1} max={GRID_ROWS} value={addForm.rowSpan} onChange={(e) => setAddForm({ ...addForm, rowSpan: +e.target.value })} />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Add Shed</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Daily Record Dialog */}
      <Dialog open={recordDialog} onOpenChange={setRecordDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add Daily Record</DialogTitle>
            <DialogDescription>Log a daily operation for {selected?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Record Type</Label>
              <Select value={recordForm.type} onValueChange={(v) => setRecordForm({ ...recordForm, type: v as RecordType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {recordTypeOptions.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={recordForm.date} onChange={(e) => setRecordForm({ ...recordForm, date: e.target.value })} />
            </div>

            <div className="space-y-1.5">
              <Label>Details</Label>
              <Textarea
                value={recordForm.details}
                onChange={(e) => setRecordForm({ ...recordForm, details: e.target.value })}
                placeholder="Describe the activity or observation..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecordDialog(false)}>Cancel</Button>
            <Button onClick={handleAddRecord}>Add Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirm !== null} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteConfirm?.name}?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. The shed and its records will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirm && handleDelete(deleteConfirm.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
};

export default LivestockSheds;

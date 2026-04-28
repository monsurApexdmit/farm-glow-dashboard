import { useState, useEffect } from "react";
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
import { shedService } from "@/services/shed.service";
import { farmService } from "@/services/farm.service";
import { livestockService } from "@/services/livestock.service";
import { Farm, Livestock as BackendLivestock } from "@/types/common";

type ShedStatus = "operational" | "maintenance" | "inactive";
type AnimalType = "cow" | "sheep" | "chicken" | "cattle" | "poultry" | "pig" | "horse" | "mixed";
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
  // grid positioning
  row: number;
  col: number;
  rowSpan: number;
  colSpan: number;
  // backend fields
  farm_id: string;
  length: number;
  width: number;
  height: number;
  area: number;
  temperature_min: number;
  temperature_max: number;
  humidity_level: number;
  description: string;
}

const statusOptions: { value: ShedStatus; label: string }[] = [
  { value: "operational", label: "Operational" },
  { value: "maintenance", label: "Maintenance" },
  { value: "inactive", label: "Inactive" },
];

const animalTypeOptions: { value: AnimalType; label: string }[] = [
  { value: "cow", label: "Cows" },
  { value: "cattle", label: "Cattle" },
  { value: "sheep", label: "Sheep" },
  { value: "chicken", label: "Chickens" },
  { value: "poultry", label: "Poultry" },
  { value: "pig", label: "Pigs" },
  { value: "horse", label: "Horses" },
  { value: "mixed", label: "Mixed" },
];

const animalTypeIcons: Record<string, React.ReactNode> = {
  cow: <span className="text-2xl">🐄</span>,
  cattle: <span className="text-2xl">🐄</span>,
  sheep: <span className="text-2xl">🐑</span>,
  chicken: <span className="text-2xl">🐔</span>,
  poultry: <span className="text-2xl">🐔</span>,
  pig: <span className="text-2xl">🐷</span>,
  horse: <span className="text-2xl">🐴</span>,
  mixed: <span className="text-2xl">🐾</span>,
};

const animalTypeColors: Record<string, { bg: string; border: string; text: string }> = {
  cow:     { bg: "bg-amber-50",   border: "border-amber-200",  text: "text-amber-900" },
  cattle:  { bg: "bg-amber-50",   border: "border-amber-200",  text: "text-amber-900" },
  sheep:   { bg: "bg-slate-100",  border: "border-slate-300",  text: "text-slate-900" },
  chicken: { bg: "bg-yellow-50",  border: "border-yellow-200", text: "text-yellow-900" },
  poultry: { bg: "bg-yellow-50",  border: "border-yellow-200", text: "text-yellow-900" },
  pig:     { bg: "bg-pink-50",    border: "border-pink-200",   text: "text-pink-900" },
  horse:   { bg: "bg-brown-50",   border: "border-stone-300",  text: "text-stone-900" },
  mixed:   { bg: "bg-green-50",   border: "border-green-200",  text: "text-green-900" },
};

const recordTypeOptions: { value: RecordType; label: string }[] = [
  { value: "feeding",     label: "Feeding" },
  { value: "vaccination", label: "Vaccination" },
  { value: "treatment",   label: "Treatment" },
  { value: "cleaning",    label: "Cleaning" },
  { value: "mortality",   label: "Mortality" },
];

const statusColors: Record<ShedStatus, string> = {
  operational: "bg-green-100 text-green-800 border-green-300",
  maintenance: "bg-amber-100 text-amber-800 border-amber-300",
  inactive:    "bg-gray-100 text-gray-600 border-gray-300",
};

const recordTypeIcons: Record<RecordType, React.ReactNode> = {
  feeding:     <Droplets   className="w-3 h-3" />,
  vaccination: <Heart      className="w-3 h-3" />,
  treatment:   <Zap        className="w-3 h-3" />,
  cleaning:    <Sparkles   className="w-3 h-3" />,
  mortality:   <AlertCircle className="w-3 h-3" />,
};

const GRID_COLS = 6;
const GRID_ROWS = 6;

const mapBackendToShed = (s: any, occupancy = 0, position = { row: 0, col: 0, rowSpan: 1, colSpan: 1 }): Shed => {
  const lastCleaned = s.last_cleaned_at
    ? `Clean - ${new Date(s.last_cleaned_at).toLocaleDateString()}`
    : "Clean";
  return {
    id:             s.id,
    farm_id:        s.farm_id,
    name:           s.name,
    animalType:     (s.shed_type || s.type || "mixed") as AnimalType,
    totalAnimals:   occupancy,
    capacity:       Number(s.capacity) || 10,
    status:         (s.status ?? "operational") as ShedStatus,
    feedSchedule:   s.feed_schedule ?? "",
    healthStatus:   "Healthy",
    cleaningStatus: lastCleaned,
    productionData: "",
    assignedWorker: "",
    notes:          s.description ?? "",
    length:          Number(s.length) || 0,
    width:           Number(s.width) || 0,
    height:          Number(s.height) || 0,
    area:            Number(s.area) || 0,
    temperature_min: Number(s.temperature_min) || 0,
    temperature_max: Number(s.temperature_max) || 0,
    humidity_level:  Number(s.humidity_level) || 0,
    description:     s.description ?? "",
    ...position,
  };
};

const emptyShed = (): Omit<Shed, "id"> => ({
  farm_id:        "",
  name:           "",
  animalType:     "cow",
  totalAnimals:   0,
  capacity:       50,
  status:         "operational",
  feedSchedule:   "",
  healthStatus:   "Healthy",
  cleaningStatus: "Clean",
  productionData: "",
  assignedWorker: "",
  notes:          "",
  description:    "",
  row:            0,
  col:            0,
  rowSpan:        1,
  colSpan:        1,
  length:          10,
  width:           5,
  height:          3,
  area:            0,
  temperature_min: 0,
  temperature_max: 0,
  humidity_level:  0,
});

const RECORDS_KEY = "shed_daily_records";

const loadStoredRecords = (): DailyRecord[] => {
  try {
    return JSON.parse(localStorage.getItem(RECORDS_KEY) || "[]");
  } catch { return []; }
};

const saveRecords = (records: DailyRecord[]) => {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
};

const LivestockSheds = () => {
  const [sheds, setSheds] = useState<Shed[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [records, setRecords] = useState<DailyRecord[]>(loadStoredRecords);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Shed | null>(null);
  const [editDialog, setEditDialog] = useState(false);
  const [addDialog, setAddDialog] = useState(false);
  const [recordDialog, setRecordDialog] = useState(false);
  const [editForm, setEditForm] = useState<Shed | null>(null);
  const [addForm, setAddForm] = useState<Omit<Shed, "id">>(emptyShed());
  const [recordForm, setRecordForm] = useState<Omit<DailyRecord, "id" | "createdAt">>({
    shedId:  "",
    type:    "feeding",
    date:    new Date().toISOString().split("T")[0],
    details: "",
  });
  const [deleteConfirm, setDeleteConfirm] = useState<Shed | null>(null);
  const { toast } = useToast();

  // keep a stable position map so drag positions survive re-fetches
  const [positions, setPositions] = useState<Record<string, { row: number; col: number; rowSpan: number; colSpan: number }>>({});

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [shedsData, farmsData, livestockData] = await Promise.all([
        shedService.getSheds(),
        farmService.getFarms(),
        livestockService.getLivestock(),
      ]);

      const liveArr: BackendLivestock[] = Array.isArray(livestockData) ? livestockData : [];
      const shedsArr = Array.isArray(shedsData) ? shedsData : [];

      // auto-assign grid positions for new sheds that have no saved position
      let nextCol = 0;
      let nextRow = 0;

      const newPositions: Record<string, { row: number; col: number; rowSpan: number; colSpan: number }> = {};

      const mapped: Shed[] = shedsArr.map((s: any) => {
        const occupancy = liveArr.filter(l => l.shed_id === s.id).length;
        const pos = (s.grid_row != null && s.grid_col != null)
          ? { row: s.grid_row, col: s.grid_col, rowSpan: s.grid_row_span ?? 1, colSpan: s.grid_col_span ?? 1 }
          : (() => {
              const p = { row: nextRow, col: nextCol, rowSpan: 1, colSpan: 1 };
              nextCol++;
              if (nextCol >= GRID_COLS) { nextCol = 0; nextRow++; }
              return p;
            })();
        newPositions[s.id] = pos;
        return mapBackendToShed(s, occupancy, pos);
      });

      setPositions(newPositions);

      setSheds(mapped);
      setFarms(Array.isArray(farmsData) ? farmsData : []);
    } catch (err: any) {
      toast({ title: "Failed to load sheds", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // --- Add ---
  const handleAdd = async () => {
    if (!addForm.name.trim()) {
      toast({ title: "Name required", description: "Please enter a shed name.", variant: "destructive" });
      return;
    }
    if (!addForm.farm_id) {
      toast({ title: "Farm required", description: "Please select a farm.", variant: "destructive" });
      return;
    }
    try {
      const payload = {
        farm_id:         addForm.farm_id,
        name:            addForm.name,
        shed_type:       addForm.animalType,
        capacity:        addForm.capacity,
        length:          addForm.length,
        width:           addForm.width,
        height:          addForm.height,
        area:            addForm.area || undefined,
        temperature_min: addForm.temperature_min || undefined,
        temperature_max: addForm.temperature_max || undefined,
        humidity_level:  addForm.humidity_level || undefined,
        description:     addForm.notes,
        status:          addForm.status,
        feed_schedule:   addForm.feedSchedule || undefined,
      };
      const created = await shedService.createShed(payload);
      // save position for the new shed
      setPositions(prev => ({
        ...prev,
        [created.id]: { row: addForm.row, col: addForm.col, rowSpan: addForm.rowSpan, colSpan: addForm.colSpan },
      }));
      setAddDialog(false);
      setAddForm(emptyShed());
      toast({ title: "Shed added", description: `${addForm.name} has been added.` });
      await loadData();
    } catch (err: any) {
      toast({ title: "Failed to add shed", description: err.message, variant: "destructive" });
    }
  };

  // --- Edit ---
  const openEdit = (shed: Shed) => {
    setEditForm({ ...shed });
    setEditDialog(true);
  };

  const handleEdit = async () => {
    if (!editForm) return;
    try {
      const payload = {
        farm_id:         editForm.farm_id,
        name:            editForm.name,
        shed_type:       editForm.animalType,
        capacity:        editForm.capacity,
        length:          editForm.length,
        width:           editForm.width,
        height:          editForm.height,
        area:            editForm.area || undefined,
        temperature_min: editForm.temperature_min || undefined,
        temperature_max: editForm.temperature_max || undefined,
        humidity_level:  editForm.humidity_level || undefined,
        description:     editForm.notes,
        status:          editForm.status,
        feed_schedule:   editForm.feedSchedule || undefined,
      };
      await shedService.updateShed(editForm.id, payload);
      // persist grid position
      setPositions(prev => ({
        ...prev,
        [editForm.id]: { row: editForm.row, col: editForm.col, rowSpan: editForm.rowSpan, colSpan: editForm.colSpan },
      }));
      setSelected(editForm);
      setEditDialog(false);
      toast({ title: "Shed updated", description: `${editForm.name} has been updated.` });
      await loadData();
    } catch (err: any) {
      toast({ title: "Failed to update shed", description: err.message, variant: "destructive" });
    }
  };

  // --- Delete ---
  const handleDelete = async (id: string) => {
    try {
      await shedService.deleteShed(id);
      if (selected?.id === id) setSelected(null);
      setDeleteConfirm(null);
      toast({ title: "Shed removed", description: "The shed has been deleted." });
      await loadData();
    } catch (err: any) {
      toast({ title: "Failed to delete shed", description: err.message, variant: "destructive" });
    }
  };

  // --- Move (FarmGridMap drag-drop) ---
  const handleMove = async (id: string, row: number, col: number) => {
    const rowSpan = positions[id]?.rowSpan ?? 1;
    const colSpan = positions[id]?.colSpan ?? 1;
    setPositions(prev => ({ ...prev, [id]: { ...prev[id], row, col, rowSpan, colSpan } }));
    setSheds(prev => prev.map(s => s.id === id ? { ...s, row, col } : s));
    setSelected(prev => prev?.id === id ? { ...prev, row, col } : prev);
    try {
      await shedService.updateShed(id, { grid_row: row, grid_col: col, grid_row_span: rowSpan, grid_col_span: colSpan });
      toast({ title: "Shed moved", description: "Shed position saved." });
    } catch {
      toast({ title: "Failed to save position", description: "Position reverted.", variant: "destructive" });
      await loadData();
    }
  };

  // --- Daily Records (local only — no backend endpoint yet) ---
  const openRecordDialog = (shed: Shed) => {
    setRecordForm({
      shedId: shed.id,
      type: "feeding",
      date: new Date().toISOString().split("T")[0],
      details: "",
    });
    setRecordDialog(true);
  };

  const closeRecordDialog = () => {
    setRecordDialog(false);
    setRecordForm({ shedId: "", type: "feeding", date: new Date().toISOString().split("T")[0], details: "" });
  };

  const handleAddRecord = async () => {
    if (!recordForm.details.trim()) {
      toast({ title: "Details required", description: "Please enter record details.", variant: "destructive" });
      return;
    }
    if (!recordForm.shedId) {
      toast({ title: "Error", description: "No shed selected.", variant: "destructive" });
      return;
    }
    try {
      if (recordForm.type === "cleaning") {
        await shedService.recordCleaning(recordForm.shedId);
        const today = new Date().toLocaleDateString();
        setSheds(prev => prev.map(s =>
          s.id === recordForm.shedId ? { ...s, cleaningStatus: `Clean - ${today}` } : s
        ));
        setSelected(prev =>
          prev?.id === recordForm.shedId ? { ...prev, cleaningStatus: `Clean - ${today}` } : prev
        );
      }
      const newRecord: DailyRecord = {
        shedId:    recordForm.shedId,
        type:      recordForm.type,
        date:      recordForm.date,
        details:   recordForm.details,
        id:        Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      setRecords(prev => {
        const updated = [...prev, newRecord];
        saveRecords(updated);
        return updated;
      });
      closeRecordDialog();
      toast({ title: "Record added", description: "Daily record has been logged." });
    } catch (err: any) {
      toast({ title: "Failed to save record", description: err.message, variant: "destructive" });
    }
  };

  // Quick Stats
  const totalSheds    = sheds.length;
  const totalAnimals  = sheds.reduce((sum, s) => sum + s.totalAnimals, 0);
  const fullSheds     = sheds.filter(s => s.totalAnimals >= s.capacity).length;
  const sickAnimals   = sheds.filter(s => s.healthStatus.toLowerCase().includes("sick")).length;
  const feedLowAlerts = sheds.filter(s => s.status === "operational" && s.totalAnimals > s.capacity * 0.9).length;
  const cleaningDue   = sheds.filter(s => s.cleaningStatus.toLowerCase().includes("due")).length;
  const totalCapacity = sheds.reduce((s, sh) => s + sh.capacity, 0);

  const shedRecords = selected ? records.filter(r => r.shedId === selected.id) : [];

  if (loading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center text-muted-foreground">Loading sheds...</div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold font-display">Livestock Shed Management</h1>
        <div className="flex items-center gap-2 flex-wrap">
          {animalTypeOptions.slice(0, 3).map(t => (
            <Badge key={t.value} variant="outline">{t.label}</Badge>
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
              const colors = animalTypeColors[shed.animalType] ?? animalTypeColors["mixed"];
              const isFull = shed.totalAnimals >= shed.capacity;
              return (
                <div
                  onClick={() => setSelected(shed)}
                  className={`relative rounded-lg border-2 p-3 text-left transition-all cursor-grab active:cursor-grabbing hover:shadow-lg group h-full w-full flex flex-col ${
                    isSelected ? "border-primary ring-2 ring-primary/30 shadow-md" : "border-border hover:border-primary/40"
                  } ${isDragging ? "opacity-50 scale-95" : ""} ${colors.bg}`}
                >
                  <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                    <button
                      onClick={e => { e.stopPropagation(); openEdit(shed); }}
                      className="p-1 rounded bg-background/80 hover:bg-background border border-border/50 transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setDeleteConfirm(shed); }}
                      className="p-1 rounded bg-background/80 hover:bg-destructive/10 border border-border/50 transition-colors"
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </button>
                  </div>
                  <div className="absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-60 transition-opacity">
                    <GripVertical className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 flex items-center justify-center mb-2">
                    {animalTypeIcons[shed.animalType] ?? animalTypeIcons["mixed"]}
                  </div>
                  <p className="text-xs font-bold text-muted-foreground">{shed.id}</p>
                  <p className="text-sm font-semibold truncate">{shed.name}</p>
                  <div className="mt-2 space-y-1">
                    <p className={`text-xs font-semibold ${isFull ? "text-destructive" : colors.text}`}>
                      {shed.totalAnimals}/{shed.capacity}
                    </p>
                    <div className="h-2 rounded-full bg-black/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isFull ? "bg-destructive" : "bg-green-500"}`}
                        style={{ width: `${Math.min((shed.totalAnimals / shed.capacity) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <Badge variant="outline" className={`${statusColors[shed.status]} text-[10px] px-1.5 py-0 mt-1 border w-fit`}>
                    {shed.status}
                  </Badge>
                </div>
              );
            }}
          />
        </div>

        {/* Detail Panel + Stats */}
        <div className="space-y-4">
          {selected ? (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-3xl">{animalTypeIcons[selected.animalType] ?? animalTypeIcons["mixed"]}</span>
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
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min((selected.totalAnimals / selected.capacity) * 100, 100)}%` }} />
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Feed Schedule
                      </span>
                      <span className="font-medium text-xs">{selected.feedSchedule || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5" /> Health
                      </span>
                      <span className="font-medium text-xs">{selected.healthStatus || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> Cleaning
                      </span>
                      <span className="font-medium text-xs">{selected.cleaningStatus || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Production:</span>
                      <span className="font-medium text-xs">{selected.productionData || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Worker:</span>
                      <span className="font-medium text-xs">{selected.assignedWorker || "—"}</span>
                    </div>
                  </div>

                  {selected.notes && (
                    <div className="text-xs text-muted-foreground pt-2 border-t">{selected.notes}</div>
                  )}

                  <Button size="sm" className="w-full mt-2" onClick={() => openRecordDialog(selected)}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Daily Record
                  </Button>
                </CardContent>
              </Card>

              {shedRecords.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Recent Records</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {shedRecords.slice(-5).reverse().map(record => (
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
                  <p className="font-semibold">{totalCapacity > 0 ? Math.round((totalAnimals / totalCapacity) * 100) : 0}%</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground">Active Sheds</p>
                  <p className="font-semibold">{sheds.filter(s => s.status === "operational").length}/{totalSheds}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Shed Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Home className="w-5 h-5" /> All Sheds
          </CardTitle>
          <CardDescription>Overview of all livestock sheds and their feed schedules</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Animals</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Capacity</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Feed Schedule</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cleaning</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sheds.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No sheds found. Add a shed to get started.</td>
                  </tr>
                ) : (
                  sheds.map(shed => (
                    <tr
                      key={shed.id}
                      className={`border-b transition-colors hover:bg-muted/30 cursor-pointer ${selected?.id === shed.id ? "bg-primary/5" : ""}`}
                      onClick={() => setSelected(shed)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span>{animalTypeIcons[shed.animalType] ?? animalTypeIcons["mixed"]}</span>
                          <span className="font-medium">{shed.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 capitalize text-muted-foreground">{shed.animalType}</td>
                      <td className="px-4 py-3">
                        <span className={shed.totalAnimals >= shed.capacity ? "text-destructive font-medium" : ""}>{shed.totalAnimals}/{shed.capacity}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full ${shed.totalAnimals >= shed.capacity ? "bg-destructive" : "bg-green-500"}`}
                              style={{ width: `${Math.min((shed.totalAnimals / shed.capacity) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{shed.capacity > 0 ? Math.round((shed.totalAnimals / shed.capacity) * 100) : 0}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          {shed.feedSchedule ? (
                            <span>{shed.feedSchedule}</span>
                          ) : (
                            <span className="text-muted-foreground italic text-xs">Not set</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{shed.cleaningStatus}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`${statusColors[shed.status]} text-[10px] px-1.5 py-0 border`}>
                          {shed.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); openEdit(shed); }}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); openRecordDialog(shed); }}>
                            <Plus className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); setDeleteConfirm(shed); }}>
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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
                      <Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Animal Type</Label>
                      <Select value={editForm.animalType} onValueChange={v => setEditForm({ ...editForm, animalType: v as AnimalType })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {animalTypeOptions.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Farm</Label>
                    <Select value={editForm.farm_id} onValueChange={v => setEditForm({ ...editForm, farm_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select farm" /></SelectTrigger>
                      <SelectContent>
                        {farms.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Capacity</Label>
                    <Input type="number" min={1} value={editForm.capacity} onChange={e => setEditForm({ ...editForm, capacity: +e.target.value })} />
                  </div>


                  <div className="space-y-1.5">
                    <Label>Feed Schedule</Label>
                    <Input value={editForm.feedSchedule} onChange={e => setEditForm({ ...editForm, feedSchedule: e.target.value })} placeholder="e.g. 6am, 12pm, 6pm" />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Select value={editForm.status} onValueChange={v => setEditForm({ ...editForm, status: v as ShedStatus })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Description</Label>
                    <Textarea value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} rows={3} />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label>Length (m)</Label>
                      <Input type="number" step="0.1" value={editForm.length} onChange={e => setEditForm({ ...editForm, length: +e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Width (m)</Label>
                      <Input type="number" step="0.1" value={editForm.width} onChange={e => setEditForm({ ...editForm, width: +e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Height (m)</Label>
                      <Input type="number" step="0.1" value={editForm.height} onChange={e => setEditForm({ ...editForm, height: +e.target.value })} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Area (m²)</Label>
                    <Input type="number" step="0.1" min={0} value={editForm.area} onChange={e => setEditForm({ ...editForm, area: +e.target.value })} placeholder="e.g. 50" />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label>Min Temp (°C)</Label>
                      <Input type="number" step="0.1" value={editForm.temperature_min} onChange={e => setEditForm({ ...editForm, temperature_min: +e.target.value })} placeholder="e.g. 10" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Max Temp (°C)</Label>
                      <Input type="number" step="0.1" value={editForm.temperature_max} onChange={e => setEditForm({ ...editForm, temperature_max: +e.target.value })} placeholder="e.g. 30" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Humidity (%)</Label>
                      <Input type="number" step="1" min={0} max={100} value={editForm.humidity_level} onChange={e => setEditForm({ ...editForm, humidity_level: +e.target.value })} placeholder="e.g. 60" />
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-3">Grid Position & Size</p>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Row</Label>
                        <Input type="number" min={0} max={GRID_ROWS - 1} value={editForm.row} onChange={e => setEditForm({ ...editForm, row: +e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Column</Label>
                        <Input type="number" min={0} max={GRID_COLS - 1} value={editForm.col} onChange={e => setEditForm({ ...editForm, col: +e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Width</Label>
                        <Input type="number" min={1} max={GRID_COLS} value={editForm.colSpan} onChange={e => setEditForm({ ...editForm, colSpan: +e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Height</Label>
                        <Input type="number" min={1} max={GRID_ROWS} value={editForm.rowSpan} onChange={e => setEditForm({ ...editForm, rowSpan: +e.target.value })} />
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
                    <Input placeholder="e.g. Main Cow Barn" value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Animal Type</Label>
                    <Select value={addForm.animalType} onValueChange={v => setAddForm({ ...addForm, animalType: v as AnimalType })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {animalTypeOptions.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Farm *</Label>
                  <Select value={addForm.farm_id} onValueChange={v => setAddForm({ ...addForm, farm_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select farm" /></SelectTrigger>
                    <SelectContent>
                      {farms.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Capacity</Label>
                  <Input type="number" min={1} value={addForm.capacity} onChange={e => setAddForm({ ...addForm, capacity: +e.target.value })} />
                </div>

                <div className="space-y-1.5">
                  <Label>Feed Schedule</Label>
                  <Input value={addForm.feedSchedule} onChange={e => setAddForm({ ...addForm, feedSchedule: e.target.value })} placeholder="e.g. 6am, 12pm, 6pm" />
                </div>

                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={addForm.status} onValueChange={v => setAddForm({ ...addForm, status: v as ShedStatus })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea value={addForm.notes} onChange={e => setAddForm({ ...addForm, notes: e.target.value })} placeholder="Additional notes..." rows={3} />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label>Length (m)</Label>
                    <Input type="number" step="0.1" value={addForm.length} onChange={e => setAddForm({ ...addForm, length: +e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Width (m)</Label>
                    <Input type="number" step="0.1" value={addForm.width} onChange={e => setAddForm({ ...addForm, width: +e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Height (m)</Label>
                    <Input type="number" step="0.1" value={addForm.height} onChange={e => setAddForm({ ...addForm, height: +e.target.value })} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Area (m²)</Label>
                  <Input type="number" step="0.1" min={0} value={addForm.area} onChange={e => setAddForm({ ...addForm, area: +e.target.value })} placeholder="e.g. 50" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label>Min Temp (°C)</Label>
                    <Input type="number" step="0.1" value={addForm.temperature_min} onChange={e => setAddForm({ ...addForm, temperature_min: +e.target.value })} placeholder="e.g. 10" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Max Temp (°C)</Label>
                    <Input type="number" step="0.1" value={addForm.temperature_max} onChange={e => setAddForm({ ...addForm, temperature_max: +e.target.value })} placeholder="e.g. 30" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Humidity (%)</Label>
                    <Input type="number" step="1" min={0} max={100} value={addForm.humidity_level} onChange={e => setAddForm({ ...addForm, humidity_level: +e.target.value })} placeholder="e.g. 60" />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-3">Grid Position & Size</p>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Row</Label>
                      <Input type="number" min={0} max={GRID_ROWS - 1} value={addForm.row} onChange={e => setAddForm({ ...addForm, row: +e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Column</Label>
                      <Input type="number" min={0} max={GRID_COLS - 1} value={addForm.col} onChange={e => setAddForm({ ...addForm, col: +e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Width</Label>
                      <Input type="number" min={1} max={GRID_COLS} value={addForm.colSpan} onChange={e => setAddForm({ ...addForm, colSpan: +e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Height</Label>
                      <Input type="number" min={1} max={GRID_ROWS} value={addForm.rowSpan} onChange={e => setAddForm({ ...addForm, rowSpan: +e.target.value })} />
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
      <Dialog open={recordDialog} onOpenChange={open => !open && closeRecordDialog()}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add Daily Record</DialogTitle>
            <DialogDescription>Log a daily operation for {sheds.find(s => s.id === recordForm.shedId)?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Record Type</Label>
              <Select value={recordForm.type} onValueChange={v => setRecordForm({ ...recordForm, type: v as RecordType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {recordTypeOptions.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={recordForm.date} onChange={e => setRecordForm({ ...recordForm, date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Details</Label>
              <Textarea
                value={recordForm.details}
                onChange={e => setRecordForm({ ...recordForm, details: e.target.value })}
                placeholder="Describe the activity or observation..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeRecordDialog}>Cancel</Button>
            <Button onClick={handleAddRecord}>Add Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirm !== null} onOpenChange={open => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteConfirm?.name}?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. The shed and its records will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
};

export default LivestockSheds;

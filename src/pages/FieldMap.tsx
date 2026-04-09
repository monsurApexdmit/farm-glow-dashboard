import { useState } from "react";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Sprout, Droplets, Thermometer, MapPin, Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FarmGridMap } from "@/components/FarmGridMap";

type PlotStatus = "growing" | "harvest-ready" | "fallow" | "planted";

interface FieldPlot {
  id: string;
  name: string;
  crop: string;
  area: string;
  status: PlotStatus;
  soilMoisture: number;
  temperature: number;
  // Grid-cell positioning
  row: number;
  col: number;
  rowSpan: number;
  colSpan: number;
}

const statusOptions: { value: PlotStatus; label: string }[] = [
  { value: "growing", label: "Growing" },
  { value: "harvest-ready", label: "Harvest Ready" },
  { value: "planted", label: "Planted" },
  { value: "fallow", label: "Fallow" },
];

const cropOptions = ["Wheat", "Corn", "Rice", "Barley", "Soybeans", "Oats", "Potatoes", "Cotton", "—"];

const statusColors: Record<PlotStatus, string> = {
  growing: "bg-primary/15 text-primary border-primary/30",
  "harvest-ready": "bg-accent/15 text-accent-foreground border-accent/30",
  fallow: "bg-muted text-muted-foreground border-muted-foreground/20",
  planted: "bg-secondary text-secondary-foreground border-secondary-foreground/20",
};

const statusBgColors: Record<PlotStatus, string> = {
  growing: "hsla(142, 45%, 42%, 0.12)",
  "harvest-ready": "hsla(38, 80%, 55%, 0.12)",
  fallow: "hsl(var(--muted))",
  planted: "hsla(142, 45%, 55%, 0.10)",
};

const initialPlots: FieldPlot[] = [
  { id: "A1", name: "North Field", crop: "Wheat", area: "12", status: "growing", soilMoisture: 68, temperature: 24, row: 0, col: 0, rowSpan: 2, colSpan: 2 },
  { id: "A2", name: "East Paddock", crop: "Corn", area: "8", status: "harvest-ready", soilMoisture: 55, temperature: 26, row: 0, col: 2, rowSpan: 1, colSpan: 2 },
  { id: "B1", name: "South Valley", crop: "Rice", area: "15", status: "growing", soilMoisture: 85, temperature: 28, row: 2, col: 0, rowSpan: 2, colSpan: 1 },
  { id: "B2", name: "West Hills", crop: "Barley", area: "6", status: "planted", soilMoisture: 72, temperature: 22, row: 2, col: 1, rowSpan: 1, colSpan: 2 },
  { id: "B3", name: "Creek Side", crop: "Soybeans", area: "10", status: "growing", soilMoisture: 78, temperature: 25, row: 1, col: 2, rowSpan: 2, colSpan: 2 },
  { id: "C1", name: "Hilltop", crop: "—", area: "4", status: "fallow", soilMoisture: 40, temperature: 23, row: 3, col: 1, rowSpan: 1, colSpan: 2 },
  { id: "C2", name: "Orchard Edge", crop: "Oats", area: "5", status: "planted", soilMoisture: 65, temperature: 21, row: 3, col: 3, rowSpan: 1, colSpan: 1 },
];

const GRID_COLS = 6;
const GRID_ROWS = 6;

const emptyPlot = (): Omit<FieldPlot, "id"> => ({
  name: "",
  crop: "—",
  area: "5",
  status: "fallow",
  soilMoisture: 50,
  temperature: 22,
  row: 0,
  col: 0,
  rowSpan: 1,
  colSpan: 1,
});

const FieldMap = () => {
  const [plots, setPlots] = useState<FieldPlot[]>(initialPlots);
  const [selected, setSelected] = useState<FieldPlot | null>(null);
  const [editDialog, setEditDialog] = useState(false);
  const [addDialog, setAddDialog] = useState(false);
  const [editForm, setEditForm] = useState<FieldPlot | null>(null);
  const [addForm, setAddForm] = useState<Omit<FieldPlot, "id">>(emptyPlot());
  const { toast } = useToast();

  const nextId = () => {
    const letters = "ABCDEFGHIJ";
    const existing = plots.map((p) => p.id);
    for (let l = 0; l < letters.length; l++) {
      for (let n = 1; n <= 9; n++) {
        const id = `${letters[l]}${n}`;
        if (!existing.includes(id)) return id;
      }
    }
    return `P${plots.length + 1}`;
  };

  // --- Add ---
  const handleAdd = () => {
    if (!addForm.name.trim()) {
      toast({ title: "Name required", description: "Please enter a plot name.", variant: "destructive" });
      return;
    }
    const newPlot: FieldPlot = { ...addForm, id: nextId() };
    setPlots((prev) => [...prev, newPlot]);
    setAddDialog(false);
    setAddForm(emptyPlot());
    toast({ title: "Plot added", description: `${newPlot.name} has been added to the map.` });
  };

  // --- Edit ---
  const openEdit = (plot: FieldPlot) => {
    setEditForm({ ...plot });
    setEditDialog(true);
  };
  const handleEdit = () => {
    if (!editForm) return;
    setPlots((prev) => prev.map((p) => (p.id === editForm.id ? editForm : p)));
    setSelected(editForm);
    setEditDialog(false);
    toast({ title: "Plot updated", description: `${editForm.name} has been updated.` });
  };

  // --- Delete ---
  const handleDelete = (id: string) => {
    setPlots((prev) => prev.filter((p) => p.id !== id));
    if (selected?.id === id) setSelected(null);
    toast({ title: "Plot removed", description: "The plot has been deleted from the map." });
  };

  // --- Move (from FarmGridMap drag-drop) ---
  const handleMove = (id: string, row: number, col: number) => {
    setPlots((prev) => prev.map((p) => (p.id === id ? { ...p, row, col } : p)));
    setSelected((prev) => (prev?.id === id ? { ...prev, row, col } : prev));
    toast({ title: "Plot moved", description: "Plot position updated on the map." });
  };

  const totalArea = plots.reduce((s, p) => s + parseFloat(p.area || "0"), 0);

  return (
    <PageShell>
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h1 className="text-3xl font-bold font-display">Field Map</h1>
            <div className="flex items-center gap-2 flex-wrap">
              {statusOptions.map((s) => (
                <Badge key={s.value} variant="outline" className={statusColors[s.value]}>
                  {s.label}
                </Badge>
              ))}
              <Button size="sm" onClick={() => { setAddForm(emptyPlot()); setAddDialog(true); }} className="gap-1">
                <Plus className="w-4 h-4" /> Add Plot
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map Grid */}
            <div className="lg:col-span-2">
              <FarmGridMap
                title={<><MapPin className="w-5 h-5" /> Farm Layout</>}
                items={plots}
                onMove={handleMove}
                selectedId={selected?.id}
                gridCols={GRID_COLS}
                gridRows={GRID_ROWS}
                renderTile={(plot, isDragging, isSelected) => (
                  <div
                    onClick={() => setSelected(plot)}
                    className={`relative rounded-lg border-2 p-3 text-left transition-all cursor-grab active:cursor-grabbing hover:shadow-lg group h-full w-full ${
                      isSelected
                        ? "border-primary ring-2 ring-primary/30 shadow-md"
                        : "border-border hover:border-primary/40"
                    } ${isDragging ? "opacity-50 scale-95" : ""}`}
                    style={{ backgroundColor: statusBgColors[plot.status] }}
                  >
                    <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEdit(plot); }}
                        className="p-1 rounded bg-background/80 hover:bg-background border border-border/50 transition-colors"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(plot.id); }}
                        className="p-1 rounded bg-background/80 hover:bg-destructive/10 border border-border/50 transition-colors"
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </button>
                    </div>
                    <div className="absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-60 transition-opacity">
                      <GripVertical className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-xs font-bold text-muted-foreground">{plot.id}</p>
                    <p className="text-sm font-semibold truncate">{plot.name}</p>
                    {plot.crop !== "—" && <p className="text-xs text-muted-foreground">{plot.crop}</p>}
                    {(plot.rowSpan > 1 || plot.colSpan > 1) && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">{plot.area} acres</p>
                    )}
                    <Badge variant="outline" className={`${statusColors[plot.status]} text-[10px] px-1.5 py-0 mt-1 border`}>
                      {plot.status.replace("-", " ")}
                    </Badge>
                  </div>
                )}
              />
            </div>

            {/* Detail Panel */}
            <div className="space-y-4">
              {selected ? (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{selected.name}</CardTitle>
                        <CardDescription>Plot {selected.id} · {selected.area} acres</CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(selected)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(selected.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Sprout className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Crop:</span>
                      <span className="text-sm">{selected.crop}</span>
                    </div>
                    <Badge className={statusColors[selected.status]}>{selected.status.replace("-", " ")}</Badge>
                    <div className="space-y-3 pt-2">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="flex items-center gap-1"><Droplets className="w-3.5 h-3.5" /> Soil Moisture</span>
                          <span className="font-medium">{selected.soilMoisture}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${selected.soilMoisture}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="flex items-center gap-1"><Thermometer className="w-3.5 h-3.5" /> Temperature</span>
                          <span className="font-medium">{selected.temperature}°C</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(selected.temperature / 40) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground pt-2">
                      Position: Row {selected.row + 1}, Col {selected.col + 1} · Size: {selected.colSpan}×{selected.rowSpan}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <MapPin className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">Select a plot on the map to view details</p>
                    <p className="text-xs mt-1">Drag plots to reposition them</p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Plots</span>
                    <span className="font-medium">{plots.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Area</span>
                    <span className="font-medium">{totalArea} acres</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Active Crops</span>
                    <span className="font-medium">{plots.filter((p) => p.status !== "fallow").length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Harvest Ready</span>
                    <span className="font-medium">{plots.filter((p) => p.status === "harvest-ready").length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Fallow</span>
                    <span className="font-medium">{plots.filter((p) => p.status === "fallow").length}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Edit Plot {editForm?.id}</DialogTitle>
            <DialogDescription>Update the plot details, position, and size on the grid.</DialogDescription>
          </DialogHeader>
          {editForm && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Area (acres)</Label>
                  <Input type="number" value={editForm.area} onChange={(e) => setEditForm({ ...editForm, area: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Crop</Label>
                  <Select value={editForm.crop} onValueChange={(v) => setEditForm({ ...editForm, crop: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {cropOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v as PlotStatus })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Soil Moisture: {editForm.soilMoisture}%</Label>
                <Slider value={[editForm.soilMoisture]} onValueChange={([v]) => setEditForm({ ...editForm, soilMoisture: v })} max={100} step={1} />
              </div>
              <div className="space-y-1.5">
                <Label>Temperature: {editForm.temperature}°C</Label>
                <Slider value={[editForm.temperature]} onValueChange={([v]) => setEditForm({ ...editForm, temperature: v })} max={45} step={1} />
              </div>
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
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>Cancel</Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Add New Plot</DialogTitle>
            <DialogDescription>Create a new field plot and place it on the grid.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input placeholder="e.g. River Bend" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Area (acres)</Label>
                <Input type="number" value={addForm.area} onChange={(e) => setAddForm({ ...addForm, area: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Crop</Label>
                <Select value={addForm.crop} onValueChange={(v) => setAddForm({ ...addForm, crop: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {cropOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={addForm.status} onValueChange={(v) => setAddForm({ ...addForm, status: v as PlotStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Soil Moisture: {addForm.soilMoisture}%</Label>
              <Slider value={[addForm.soilMoisture]} onValueChange={([v]) => setAddForm({ ...addForm, soilMoisture: v })} max={100} step={1} />
            </div>
            <div className="space-y-1.5">
              <Label>Temperature: {addForm.temperature}°C</Label>
              <Slider value={[addForm.temperature]} onValueChange={([v]) => setAddForm({ ...addForm, temperature: v })} max={45} step={1} />
            </div>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Add Plot</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
};

export default FieldMap;

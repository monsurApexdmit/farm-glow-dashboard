import { useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Sprout, Droplets, Thermometer, MapPin, Plus, Pencil, Trash2, GripVertical, Loader } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FarmGridMap } from "@/components/FarmGridMap";
import { cropService } from "@/services/crop.service";
import { farmService } from "@/services/farm.service";
import { Crop, Farm, Field } from "@/types/common";

type PlotStatus =
  | "growing"
  | "harvest-ready"
  | "fallow"
  | "planted"
  | "available"
  | "in_use"
  | "preparation"
  | "planning"
  | "harvested";

interface PlotLayout {
  row: number;
  col: number;
  rowSpan: number;
  colSpan: number;
  soilMoisture: number;
  temperature: number;
}

interface FieldPlot extends PlotLayout {
  id: string;
  farm_id: string;
  farmName: string;
  name: string;
  crop: string;
  area: number;
  unit: string;
  soil_type: string;
  status: PlotStatus;
  latitude: number;
  longitude: number;
  activeCropId?: string;
}

interface PlotForm extends PlotLayout {
  farm_id: string;
  name: string;
  crop: string;
  area: string;
  unit: string;
  soil_type: string;
  status: PlotStatus;
}

interface FieldMapMeta {
  row?: number;
  col?: number;
  rowSpan?: number;
  colSpan?: number;
  grid_row?: number;
  grid_col?: number;
  grid_row_span?: number;
  grid_col_span?: number;
  soilMoisture?: number;
  soil_moisture?: number;
  temperature?: number;
  field?: Partial<Field>;
}

const GRID_COLS = 6;
const GRID_ROWS = 6;
const LAYOUT_STORAGE_KEY = "field-map-layout:v1";

const statusOptions: { value: PlotStatus; label: string }[] = [
  { value: "growing", label: "Growing" },
  { value: "harvest-ready", label: "Harvest Ready" },
  { value: "planted", label: "Planted" },
  { value: "fallow", label: "Fallow" },
  { value: "available", label: "Available" },
  { value: "in_use", label: "In Use" },
  { value: "preparation", label: "Preparation" },
  { value: "planning", label: "Planning" },
  { value: "harvested", label: "Harvested" },
];

const cropOptions = ["Wheat", "Corn", "Rice", "Barley", "Soybeans", "Oats", "Potatoes", "Cotton", "—"];
const soilOptions = ["clay", "sandy", "loam", "silt", "peat", "chalk"];
const unitOptions = ["hectares", "acres", "square_meters"];

const statusColors: Record<PlotStatus, string> = {
  growing: "bg-primary/15 text-primary border-primary/30",
  "harvest-ready": "bg-accent/15 text-accent-foreground border-accent/30",
  fallow: "bg-muted text-muted-foreground border-muted-foreground/20",
  planted: "bg-secondary text-secondary-foreground border-secondary-foreground/20",
  available: "bg-sky-500/10 text-sky-700 border-sky-500/25",
  in_use: "bg-emerald-500/10 text-emerald-700 border-emerald-500/25",
  preparation: "bg-orange-500/10 text-orange-700 border-orange-500/25",
  planning: "bg-violet-500/10 text-violet-700 border-violet-500/25",
  harvested: "bg-amber-500/10 text-amber-700 border-amber-500/25",
};

const statusBgColors: Record<PlotStatus, string> = {
  growing: "hsla(142, 45%, 42%, 0.12)",
  "harvest-ready": "hsla(38, 80%, 55%, 0.12)",
  fallow: "hsl(var(--muted))",
  planted: "hsla(142, 45%, 55%, 0.10)",
  available: "hsla(204, 94%, 94%, 1)",
  in_use: "hsla(151, 55%, 92%, 1)",
  preparation: "hsla(33, 100%, 94%, 1)",
  planning: "hsla(262, 83%, 95%, 1)",
  harvested: "hsla(48, 96%, 89%, 1)",
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const readLayoutPrefs = (): Record<string, PlotLayout> => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const writeLayoutPrefs = (layouts: Record<string, PlotLayout>) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layouts));
};

const defaultLayout = (index: number, area: number): PlotLayout => {
  const rowSpan = area >= 12 ? 2 : 1;
  const colSpan = area >= 8 ? 2 : 1;
  return {
    row: Math.floor(index / GRID_COLS) % GRID_ROWS,
    col: index % GRID_COLS,
    rowSpan,
    colSpan,
    soilMoisture: 50,
    temperature: 22,
  };
};

const normalizeStatus = (fieldStatus?: string, cropStatus?: string): PlotStatus => {
  const value = `${cropStatus || fieldStatus || "fallow"}`.toLowerCase();
  if (value === "in_use") return "in_use";
  if (value === "available") return "available";
  if (value === "preparation") return "preparation";
  if (value === "planning") return "planning";
  if (value === "harvested") return "harvested";
  if (value === "growing") return "growing";
  if (value === "harvest-ready") return "harvest-ready";
  if (value === "planted") return "planted";
  return "fallow";
};

const mapPlotStatusToFieldStatus = (status: PlotStatus): string => {
  if (status === "fallow") return "fallow";
  if (status === "available") return "available";
  if (status === "preparation" || status === "planning") return "preparation";
  if (status === "harvested") return "available";
  return "in_use";
};

const mapPlotStatusToCropStatus = (status: PlotStatus): Crop["status"] => {
  if (status === "planning" || status === "preparation" || status === "available") return "planning";
  if (status === "harvested" || status === "harvest-ready") return "harvested";
  return "growing";
};

const formatStatusLabel = (status: string) =>
  status
    .split("-")
    .join(" ")
    .split("_")
    .join(" ");

const extractFieldMapMeta = (value: unknown): FieldMapMeta | null => {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (raw.map && typeof raw.map === "object") return raw.map as FieldMapMeta;
  if (raw.field_map && typeof raw.field_map === "object") return raw.field_map as FieldMapMeta;
  return raw as FieldMapMeta;
};

const createEmptyForm = (farmId = ""): PlotForm => ({
  farm_id: farmId,
  name: "",
  crop: "—",
  area: "5",
  unit: "hectares",
  soil_type: "loam",
  status: "fallow",
  soilMoisture: 50,
  temperature: 22,
  row: 0,
  col: 0,
  rowSpan: 1,
  colSpan: 1,
});

const buildPlots = (
  fields: Field[],
  farms: Farm[],
  crops: Crop[],
  layouts: Record<string, PlotLayout>,
  mapMeta: Record<string, FieldMapMeta | null>
): FieldPlot[] => {
  const activeCropByField = new Map<string, Crop>();
  const cropsByField = new Map<string, Crop[]>();

  crops.forEach((crop) => {
    const list = cropsByField.get(crop.field_id) || [];
    list.push(crop);
    cropsByField.set(crop.field_id, list);
  });

  cropsByField.forEach((fieldCrops, fieldId) => {
    const preferred =
      fieldCrops.find((crop) => crop.status !== "harvested") ||
      [...fieldCrops].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
    if (preferred) activeCropByField.set(fieldId, preferred);
  });

  return fields.map((field, index) => {
    const map = mapMeta[field.id];
    const fallback = defaultLayout(index, Number(field.area) || 0);
    const stored = layouts[field.id];
    const crop = activeCropByField.get(field.id);

    const layout: PlotLayout = {
      row: clamp(
        Number(stored?.row ?? map?.row ?? map?.grid_row ?? fallback.row) || 0,
        0,
        GRID_ROWS - 1
      ),
      col: clamp(
        Number(stored?.col ?? map?.col ?? map?.grid_col ?? fallback.col) || 0,
        0,
        GRID_COLS - 1
      ),
      rowSpan: clamp(
        Number(stored?.rowSpan ?? map?.rowSpan ?? map?.grid_row_span ?? fallback.rowSpan) || 1,
        1,
        GRID_ROWS
      ),
      colSpan: clamp(
        Number(stored?.colSpan ?? map?.colSpan ?? map?.grid_col_span ?? fallback.colSpan) || 1,
        1,
        GRID_COLS
      ),
      soilMoisture: clamp(
        Number(stored?.soilMoisture ?? map?.soilMoisture ?? map?.soil_moisture ?? fallback.soilMoisture) || 0,
        0,
        100
      ),
      temperature: clamp(
        Number(stored?.temperature ?? map?.temperature ?? fallback.temperature) || 0,
        0,
        45
      ),
    };

    return {
      id: field.id,
      farm_id: field.farm_id,
      farmName: farms.find((farm) => farm.id === field.farm_id)?.name || "Unknown Farm",
      name: field.name,
      crop: crop?.name || "—",
      area: Number(field.area) || 0,
      unit: field.unit || "hectares",
      soil_type: field.soil_type,
      status: normalizeStatus(field.status, crop?.status),
      latitude: Number(field.latitude) || 0,
      longitude: Number(field.longitude) || 0,
      activeCropId: crop?.id,
      ...layout,
    };
  });
};

const FieldMap = () => {
  const { toast } = useToast();
  const [plots, setPlots] = useState<FieldPlot[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editDialog, setEditDialog] = useState(false);
  const [addDialog, setAddDialog] = useState(false);
  const [editForm, setEditForm] = useState<(PlotForm & { id: string; activeCropId?: string }) | null>(null);
  const [addForm, setAddForm] = useState<PlotForm>(createEmptyForm());
  const [layoutPrefs, setLayoutPrefs] = useState<Record<string, PlotLayout>>(() => readLayoutPrefs());

  const selected = useMemo(
    () => plots.find((plot) => plot.id === selectedId) || null,
    [plots, selectedId]
  );

  useEffect(() => {
    loadData();
  }, []);

  const persistLayout = (nextLayouts: Record<string, PlotLayout>) => {
    setLayoutPrefs(nextLayouts);
    writeLayoutPrefs(nextLayouts);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [farmsData, fieldsData, cropsData] = await Promise.all([
        farmService.getFarms(),
        farmService.getFields(),
        cropService.getCrops({ page: 1, perPage: 1000 }),
      ]);

      const safeFarms = Array.isArray(farmsData) ? farmsData : [];
      const safeFields = Array.isArray(fieldsData) ? fieldsData : [];
      const safeCrops = Array.isArray(cropsData?.data) ? cropsData.data : [];

      const mapResponses = await Promise.allSettled(
        safeFields.map(async (field) => [field.id, extractFieldMapMeta(await farmService.getFieldMap(field.id))] as const)
      );

      const mapMeta: Record<string, FieldMapMeta | null> = {};
      mapResponses.forEach((result) => {
        if (result.status === "fulfilled") {
          mapMeta[result.value[0]] = result.value[1];
        }
      });

      const layouts = readLayoutPrefs();
      const nextPlots = buildPlots(safeFields, safeFarms, safeCrops, layouts, mapMeta);

      setFarms(safeFarms);
      setPlots(nextPlots);
      setSelectedId((current) => (current && nextPlots.some((plot) => plot.id === current) ? current : nextPlots[0]?.id || null));
      if (!addForm.farm_id && safeFarms[0]?.id) {
        setAddForm((current) => ({ ...current, farm_id: safeFarms[0].id }));
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load field map data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const syncFieldCrop = async (fieldId: string, cropName: string, status: PlotStatus, activeCropId?: string) => {
    if (cropName === "—") {
      if (activeCropId) {
        await cropService.updateCrop(activeCropId, { status: "harvested" });
      }
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const expectedHarvest = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const payload: Partial<Crop> = {
      field_id: fieldId,
      name: cropName,
      type: cropName,
      planting_date: today,
      expected_harvest_date: expectedHarvest,
      quantity_planted: 0,
      target_yield: 0,
      estimated_yield: 0,
      status: mapPlotStatusToCropStatus(status),
    };

    if (activeCropId) {
      await cropService.updateCrop(activeCropId, payload);
      return;
    }

    await cropService.createCrop(payload);
  };

  const openAdd = () => {
    setAddForm(createEmptyForm(farms[0]?.id || ""));
    setAddDialog(true);
  };

  const openEdit = (plot: FieldPlot) => {
    setEditForm({
      id: plot.id,
      activeCropId: plot.activeCropId,
      farm_id: plot.farm_id,
      name: plot.name,
      crop: plot.crop,
      area: String(plot.area),
      unit: plot.unit,
      soil_type: plot.soil_type,
      status: plot.status,
      soilMoisture: plot.soilMoisture,
      temperature: plot.temperature,
      row: plot.row,
      col: plot.col,
      rowSpan: plot.rowSpan,
      colSpan: plot.colSpan,
    });
    setEditDialog(true);
  };

  const handleAdd = async () => {
    if (!addForm.name.trim() || !addForm.farm_id) {
      toast({
        title: "Missing fields",
        description: "Farm and plot name are required.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const created = await farmService.createField({
        farm_id: addForm.farm_id,
        name: addForm.name.trim(),
        area: Number(addForm.area) || 0,
        unit: addForm.unit,
        soil_type: addForm.soil_type,
        status: mapPlotStatusToFieldStatus(addForm.status),
        latitude: 0,
        longitude: 0,
      });

      await syncFieldCrop(created.id, addForm.crop, addForm.status);

      persistLayout({
        ...layoutPrefs,
        [created.id]: {
          row: addForm.row,
          col: addForm.col,
          rowSpan: addForm.rowSpan,
          colSpan: addForm.colSpan,
          soilMoisture: addForm.soilMoisture,
          temperature: addForm.temperature,
        },
      });

      setAddDialog(false);
      setAddForm(createEmptyForm(farms[0]?.id || ""));
      toast({ title: "Plot added", description: `${addForm.name} has been added to the map.` });
      await loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create plot",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editForm) return;
    if (!editForm.name.trim() || !editForm.farm_id) {
      toast({
        title: "Missing fields",
        description: "Farm and plot name are required.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await farmService.updateField(editForm.id, {
        farm_id: editForm.farm_id,
        name: editForm.name.trim(),
        area: Number(editForm.area) || 0,
        unit: editForm.unit,
        soil_type: editForm.soil_type,
        status: mapPlotStatusToFieldStatus(editForm.status),
      });

      await syncFieldCrop(editForm.id, editForm.crop, editForm.status, editForm.activeCropId);

      const nextLayouts = {
        ...layoutPrefs,
        [editForm.id]: {
          row: editForm.row,
          col: editForm.col,
          rowSpan: editForm.rowSpan,
          colSpan: editForm.colSpan,
          soilMoisture: editForm.soilMoisture,
          temperature: editForm.temperature,
        },
      };
      persistLayout(nextLayouts);

      setSelectedId(editForm.id);
      setEditDialog(false);
      setEditForm(null);
      toast({ title: "Plot updated", description: `${editForm.name} has been updated.` });
      await loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update plot",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const plot = plots.find((item) => item.id === id);
    if (!plot) return;

    try {
      await farmService.deleteField(id);
      const nextLayouts = { ...layoutPrefs };
      delete nextLayouts[id];
      persistLayout(nextLayouts);
      if (selectedId === id) {
        setSelectedId(null);
      }
      toast({ title: "Plot removed", description: "The plot has been deleted from the map." });
      await loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete plot",
        variant: "destructive",
      });
    }
  };

  const handleMove = (id: string, row: number, col: number) => {
    const plot = plots.find((item) => item.id === id);
    if (!plot) return;

    const nextLayouts = {
      ...layoutPrefs,
      [id]: {
        row,
        col,
        rowSpan: plot.rowSpan,
        colSpan: plot.colSpan,
        soilMoisture: plot.soilMoisture,
        temperature: plot.temperature,
      },
    };

    setPlots((current) =>
      current.map((item) => (item.id === id ? { ...item, row, col } : item))
    );
    setSelectedId(id);
    persistLayout(nextLayouts);
    toast({ title: "Plot moved", description: "Plot position updated on the map." });
  };

  const totalArea = useMemo(
    () => plots.reduce((sum, plot) => sum + (Number(plot.area) || 0), 0),
    [plots]
  );
  const primaryUnit = plots[0]?.unit || "units";

  if (loading) {
    return (
      <PageShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold font-display">Field Map</h1>
        <div className="flex items-center gap-2 flex-wrap">
          {statusOptions.map((status) => (
            <Badge key={status.value} variant="outline" className={statusColors[status.value]}>
              {status.label}
            </Badge>
          ))}
          <Button size="sm" onClick={openAdd} className="gap-1" disabled={farms.length === 0}>
            <Plus className="w-4 h-4" /> Add Plot
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <FarmGridMap
            title={
              <>
                <MapPin className="w-5 h-5" /> Farm Layout
              </>
            }
            items={plots}
            onMove={handleMove}
            selectedId={selectedId}
            gridCols={GRID_COLS}
            gridRows={GRID_ROWS}
            renderTile={(plot, isDragging, isSelected) => (
              <div
                onClick={() => setSelectedId(plot.id)}
                className={`relative rounded-lg border-2 p-3 text-left transition-all cursor-grab active:cursor-grabbing hover:shadow-lg group h-full w-full ${
                  isSelected
                    ? "border-primary ring-2 ring-primary/30 shadow-md"
                    : "border-border hover:border-primary/40"
                } ${isDragging ? "opacity-50 scale-95" : ""}`}
                style={{ backgroundColor: statusBgColors[plot.status] }}
              >
                <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      openEdit(plot);
                    }}
                    className="p-1 rounded bg-background/80 hover:bg-background border border-border/50 transition-colors"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDelete(plot.id);
                    }}
                    className="p-1 rounded bg-background/80 hover:bg-destructive/10 border border-border/50 transition-colors"
                  >
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </button>
                </div>
                <div className="absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-60 transition-opacity">
                  <GripVertical className="w-3.5 h-3.5" />
                </div>
                <p className="text-xs font-bold text-muted-foreground">{plot.farmName}</p>
                <p className="text-sm font-semibold truncate">{plot.name}</p>
                {plot.crop !== "—" && <p className="text-xs text-muted-foreground">{plot.crop}</p>}
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {plot.area} {plot.unit}
                </p>
                <Badge variant="outline" className={`${statusColors[plot.status]} text-[10px] px-1.5 py-0 mt-1 border`}>
                  {formatStatusLabel(plot.status)}
                </Badge>
              </div>
            )}
          />
        </div>

        <div className="space-y-4">
          {selected ? (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{selected.name}</CardTitle>
                    <CardDescription>
                      {selected.farmName} · {selected.area} {selected.unit}
                    </CardDescription>
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
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Coordinates:</span>
                  <span className="text-sm">
                    {selected.latitude.toFixed(4)}, {selected.longitude.toFixed(4)}
                  </span>
                </div>
                <Badge className={statusColors[selected.status]}>{formatStatusLabel(selected.status)}</Badge>
                <div className="space-y-3 pt-2">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="flex items-center gap-1">
                        <Droplets className="w-3.5 h-3.5" /> Soil Moisture
                      </span>
                      <span className="font-medium">{selected.soilMoisture}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${selected.soilMoisture}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="flex items-center gap-1">
                        <Thermometer className="w-3.5 h-3.5" /> Temperature
                      </span>
                      <span className="font-medium">{selected.temperature}°C</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(selected.temperature / 45) * 100}%` }} />
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground pt-2">
                  Position: Row {selected.row + 1}, Col {selected.col + 1} · Size: {selected.colSpan}x{selected.rowSpan}
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
                <span className="font-medium">
                  {totalArea.toFixed(1)} {primaryUnit}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Active Crops</span>
                <span className="font-medium">{plots.filter((plot) => plot.crop !== "—").length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Harvest Ready</span>
                <span className="font-medium">{plots.filter((plot) => plot.status === "harvest-ready").length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fallow</span>
                <span className="font-medium">{plots.filter((plot) => plot.status === "fallow").length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={editDialog}
        onOpenChange={(open) => {
          setEditDialog(open);
          if (!open) setEditForm(null);
        }}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Edit Plot {editForm?.name}</DialogTitle>
            <DialogDescription>Update the plot details, backend field data, and layout metadata.</DialogDescription>
          </DialogHeader>
          {editForm && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Farm</Label>
                  <Select value={editForm.farm_id} onValueChange={(value) => setEditForm({ ...editForm, farm_id: value })}>
                    <SelectTrigger><SelectValue placeholder="Select farm" /></SelectTrigger>
                    <SelectContent>
                      {farms.map((farm) => (
                        <SelectItem key={farm.id} value={farm.id}>
                          {farm.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Area</Label>
                  <Input type="number" value={editForm.area} onChange={(event) => setEditForm({ ...editForm, area: event.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Unit</Label>
                  <Select value={editForm.unit} onValueChange={(value) => setEditForm({ ...editForm, unit: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {unitOptions.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Crop</Label>
                  <Select value={editForm.crop} onValueChange={(value) => setEditForm({ ...editForm, crop: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {cropOptions.map((crop) => (
                        <SelectItem key={crop} value={crop}>
                          {crop}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={editForm.status} onValueChange={(value) => setEditForm({ ...editForm, status: value as PlotStatus })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Soil Type</Label>
                <Select value={editForm.soil_type} onValueChange={(value) => setEditForm({ ...editForm, soil_type: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {soilOptions.map((soil) => (
                      <SelectItem key={soil} value={soil}>
                        {soil}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Soil Moisture: {editForm.soilMoisture}%</Label>
                <Slider value={[editForm.soilMoisture]} onValueChange={([value]) => setEditForm({ ...editForm, soilMoisture: value })} max={100} step={1} />
              </div>
              <div className="space-y-1.5">
                <Label>Temperature: {editForm.temperature}°C</Label>
                <Slider value={[editForm.temperature]} onValueChange={([value]) => setEditForm({ ...editForm, temperature: value })} max={45} step={1} />
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Row</Label>
                  <Input type="number" min={0} max={GRID_ROWS - 1} value={editForm.row} onChange={(event) => setEditForm({ ...editForm, row: clamp(Number(event.target.value) || 0, 0, GRID_ROWS - 1) })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Column</Label>
                  <Input type="number" min={0} max={GRID_COLS - 1} value={editForm.col} onChange={(event) => setEditForm({ ...editForm, col: clamp(Number(event.target.value) || 0, 0, GRID_COLS - 1) })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Width</Label>
                  <Input type="number" min={1} max={GRID_COLS} value={editForm.colSpan} onChange={(event) => setEditForm({ ...editForm, colSpan: clamp(Number(event.target.value) || 1, 1, GRID_COLS) })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Height</Label>
                  <Input type="number" min={1} max={GRID_ROWS} value={editForm.rowSpan} onChange={(event) => setEditForm({ ...editForm, rowSpan: clamp(Number(event.target.value) || 1, 1, GRID_ROWS) })} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={saving}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Add New Plot</DialogTitle>
            <DialogDescription>Create a new backend field and place it on the grid.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Farm</Label>
                <Select value={addForm.farm_id} onValueChange={(value) => setAddForm({ ...addForm, farm_id: value })}>
                  <SelectTrigger><SelectValue placeholder="Select farm" /></SelectTrigger>
                  <SelectContent>
                    {farms.map((farm) => (
                      <SelectItem key={farm.id} value={farm.id}>
                        {farm.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input placeholder="e.g. River Bend" value={addForm.name} onChange={(event) => setAddForm({ ...addForm, name: event.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Area</Label>
                <Input type="number" value={addForm.area} onChange={(event) => setAddForm({ ...addForm, area: event.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Unit</Label>
                <Select value={addForm.unit} onValueChange={(value) => setAddForm({ ...addForm, unit: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {unitOptions.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Crop</Label>
                <Select value={addForm.crop} onValueChange={(value) => setAddForm({ ...addForm, crop: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {cropOptions.map((crop) => (
                      <SelectItem key={crop} value={crop}>
                        {crop}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={addForm.status} onValueChange={(value) => setAddForm({ ...addForm, status: value as PlotStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Soil Type</Label>
              <Select value={addForm.soil_type} onValueChange={(value) => setAddForm({ ...addForm, soil_type: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {soilOptions.map((soil) => (
                    <SelectItem key={soil} value={soil}>
                      {soil}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Soil Moisture: {addForm.soilMoisture}%</Label>
              <Slider value={[addForm.soilMoisture]} onValueChange={([value]) => setAddForm({ ...addForm, soilMoisture: value })} max={100} step={1} />
            </div>
            <div className="space-y-1.5">
              <Label>Temperature: {addForm.temperature}°C</Label>
              <Slider value={[addForm.temperature]} onValueChange={([value]) => setAddForm({ ...addForm, temperature: value })} max={45} step={1} />
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Row</Label>
                <Input type="number" min={0} max={GRID_ROWS - 1} value={addForm.row} onChange={(event) => setAddForm({ ...addForm, row: clamp(Number(event.target.value) || 0, 0, GRID_ROWS - 1) })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Column</Label>
                <Input type="number" min={0} max={GRID_COLS - 1} value={addForm.col} onChange={(event) => setAddForm({ ...addForm, col: clamp(Number(event.target.value) || 0, 0, GRID_COLS - 1) })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Width</Label>
                <Input type="number" min={1} max={GRID_COLS} value={addForm.colSpan} onChange={(event) => setAddForm({ ...addForm, colSpan: clamp(Number(event.target.value) || 1, 1, GRID_COLS) })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Height</Label>
                <Input type="number" min={1} max={GRID_ROWS} value={addForm.rowSpan} onChange={(event) => setAddForm({ ...addForm, rowSpan: clamp(Number(event.target.value) || 1, 1, GRID_ROWS) })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving}>Add Plot</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
};

export default FieldMap;

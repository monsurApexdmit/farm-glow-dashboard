import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader, MapPin, Grid3x3, Leaf, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageShell } from "@/components/PageShell";
import { PageHeader } from "@/components/PageHeader";
import { StatCards } from "@/components/StatCards";
import { SearchFilterBar } from "@/components/SearchFilterBar";
import { FormModal } from "@/components/FormModal";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { TableActions } from "@/components/TableActions";
import { farmService } from "@/services/farm.service";
import { Farm, Field } from "@/types/common";

type FarmType = "crop" | "livestock" | "mixed";
type SoilType = "clay" | "sandy" | "loam" | "silt" | "peat" | "chalk";
type ClimateZone = "tropical" | "arid" | "temperate" | "continental" | "polar";

const farmTypes: FarmType[] = ["crop", "livestock", "mixed"];
const soilTypes: SoilType[] = ["clay", "sandy", "loam", "silt", "peat", "chalk"];
const climateZones: ClimateZone[] = ["tropical", "arid", "temperate", "continental", "polar"];
const units = ["hectares", "acres", "square_meters"];

interface FarmForm extends Omit<Farm, "id" | "created_at" | "updated_at" | "company_id"> {
  unit?: string;
}
interface FieldForm extends Omit<Field, "id" | "created_at" | "updated_at"> {}

const emptyFarm = (): FarmForm => ({
  name: "",
  location: "",
  total_area: 0,
  farm_type: "crop",
  soil_type: "loam",
  climate_zone: "temperate",
  unit: "hectares",
});

const fieldStatuses = ["available", "in_use", "fallow", "preparation"];

const emptyField = (): FieldForm => ({
  farm_id: "",
  name: "",
  area: 0,
  unit: "hectares",
  soil_type: "loam",
  status: "available",
  latitude: 0,
  longitude: 0,
});

const Farms = () => {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("farms");

  // Farm state
  const [farmSearch, setFarmSearch] = useState("");
  const [farmTypeFilter, setFarmTypeFilter] = useState("all");
  const [farmDialog, setFarmDialog] = useState(false);
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  const [deletingFarm, setDeletingFarm] = useState<Farm | null>(null);
  const [farmForm, setFarmForm] = useState<FarmForm>(emptyFarm());
  const [farmSaving, setFarmSaving] = useState(false);

  // Field state
  const [fieldSearch, setFieldSearch] = useState("");
  const [fieldFarmFilter, setFieldFarmFilter] = useState("all");
  const [fieldDialog, setFieldDialog] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [deletingField, setDeletingField] = useState<Field | null>(null);
  const [fieldForm, setFieldForm] = useState<FieldForm>(emptyField());
  const [fieldSaving, setFieldSaving] = useState(false);

  const { toast } = useToast();

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [farmsData, fieldsData] = await Promise.all([
        farmService.getFarms(),
        farmService.getFields(),
      ]);
      setFarms(Array.isArray(farmsData) ? farmsData : []);
      setFields(Array.isArray(fieldsData) ? fieldsData : []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load farms",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter data
  const filteredFarms = farms.filter((f) => {
    const matchSearch = f.name.toLowerCase().includes(farmSearch.toLowerCase()) ||
      f.location.toLowerCase().includes(farmSearch.toLowerCase());
    return matchSearch && (farmTypeFilter === "all" || f.farm_type === farmTypeFilter);
  });

  const filteredFields = fields.filter((f) => {
    const matchSearch = f.name.toLowerCase().includes(fieldSearch.toLowerCase());
    const farmName = farms.find((farm) => farm.id === f.farm_id)?.name || "";
    const matchFarm = fieldFarmFilter === "all" || f.farm_id === fieldFarmFilter;
    return (matchSearch || farmName.toLowerCase().includes(fieldSearch.toLowerCase())) && matchFarm;
  });

  // Farm handlers
  const handleAddFarm = () => {
    setEditingFarm(null);
    setFarmForm(emptyFarm());
    setFarmDialog(true);
  };

  const handleEditFarm = (f: Farm) => {
    setEditingFarm(f);
    const { id, created_at, updated_at, company_id, deleted_at, ...rest } = f;
    setFarmForm(rest as FarmForm);
    setFarmDialog(true);
  };

  const handleSaveFarm = async () => {
    if (!farmForm.name || !farmForm.location) {
      toast({ title: "Missing fields", description: "Name and location are required.", variant: "destructive" });
      return;
    }
    setFarmSaving(true);
    try {
      if (editingFarm) {
        await farmService.updateFarm(editingFarm.id, farmForm);
        toast({ title: "Farm updated" });
      } else {
        await farmService.createFarm(farmForm);
        toast({ title: "Farm created" });
      }
      setFarmDialog(false);
      setEditingFarm(null);
      setFarmForm(emptyFarm());
      await loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save farm", variant: "destructive" });
    } finally {
      setFarmSaving(false);
    }
  };

  const handleDeleteFarm = async () => {
    if (!deletingFarm) return;
    try {
      await farmService.deleteFarm(deletingFarm.id);
      toast({ title: "Farm deleted" });
      setDeletingFarm(null);
      await loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete farm", variant: "destructive" });
    }
  };

  // Field handlers
  const handleAddField = () => {
    setEditingField(null);
    setFieldForm(emptyField());
    setFieldDialog(true);
  };

  const handleEditField = (f: Field) => {
    setEditingField(f);
    const { id, created_at, updated_at, ...rest } = f;
    setFieldForm(rest);
    setFieldDialog(true);
  };

  const handleSaveField = async () => {
    if (!fieldForm.farm_id || !fieldForm.name) {
      toast({ title: "Missing fields", description: "Farm and name are required.", variant: "destructive" });
      return;
    }
    setFieldSaving(true);
    try {
      if (editingField) {
        await farmService.updateField(editingField.id, fieldForm);
        toast({ title: "Field updated" });
      } else {
        await farmService.createField(fieldForm);
        toast({ title: "Field created" });
      }
      setFieldDialog(false);
      setEditingField(null);
      setFieldForm(emptyField());
      await loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save field", variant: "destructive" });
    } finally {
      setFieldSaving(false);
    }
  };

  const handleDeleteField = async () => {
    if (!deletingField) return;
    try {
      await farmService.deleteField(deletingField.id);
      toast({ title: "Field deleted" });
      setDeletingField(null);
      await loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete field", variant: "destructive" });
    }
  };

  const totalArea = farms.reduce((sum, f) => sum + (f.total_area || 0), 0);

  if (loading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center h-screen">
          <Loader className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader title="Farms" description="Manage your farms and fields"
        addLabel={activeTab === "farms" ? "Add Farm" : "Add Field"}
        onAdd={activeTab === "farms" ? handleAddFarm : handleAddField}
      />

      <StatCards columns="grid-cols-2 sm:grid-cols-4" stats={[
        { label: "Total Farms", value: farms.length, icon: <Grid3x3 className="w-6 h-6 text-primary" /> },
        { label: "Total Fields", value: fields.length, icon: <Leaf className="w-6 h-6 text-primary" /> },
        { label: "Total Area", value: `${totalArea.toFixed(1)} ha`, icon: <MapPin className="w-6 h-6 text-primary" /> },
        { label: "Data Points", value: farms.length + fields.length, color: "text-accent" },
      ]} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="farms">Farms ({farms.length})</TabsTrigger>
          <TabsTrigger value="fields">Fields ({fields.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="farms" className="space-y-4">
          <SearchFilterBar
            search={farmSearch} onSearch={setFarmSearch} searchPlaceholder="Search farms..."
            filters={[
              {
                value: farmTypeFilter,
                onChange: setFarmTypeFilter,
                placeholder: "Type",
                options: [{ value: "all", label: "All Types" }, ...farmTypes.map((t) => ({ value: t, label: t }))],
              },
            ]}
          />

          <Card>
            <CardHeader><CardTitle>Farms ({filteredFarms.length})</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Area</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Soil Type</TableHead>
                    <TableHead>Climate</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFarms.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.name}</TableCell>
                      <TableCell>{f.location}</TableCell>
                      <TableCell>{f.total_area}</TableCell>
                      <TableCell className="text-sm">{f.unit || "-"}</TableCell>
                      <TableCell>{f.farm_type || "-"}</TableCell>
                      <TableCell>{f.soil_type || "-"}</TableCell>
                      <TableCell>{f.climate_zone || "-"}</TableCell>
                      <TableCell className="text-right">
                        <TableActions onEdit={() => handleEditFarm(f)} onDelete={() => setDeletingFarm(f)} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredFarms.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No farms found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fields" className="space-y-4">
          <SearchFilterBar
            search={fieldSearch} onSearch={setFieldSearch} searchPlaceholder="Search fields..."
            filters={[
              {
                value: fieldFarmFilter,
                onChange: setFieldFarmFilter,
                placeholder: "Farm",
                options: [{ value: "all", label: "All Farms" }, ...farms.map((f) => ({ value: f.id, label: f.name }))],
              },
            ]}
          />

          <Card>
            <CardHeader><CardTitle>Fields ({filteredFields.length})</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Farm</TableHead>
                    <TableHead>Field Name</TableHead>
                    <TableHead>Area</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Soil Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Coordinates</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFields.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{farms.find((farm) => farm.id === f.farm_id)?.name || "N/A"}</TableCell>
                      <TableCell>{f.name}</TableCell>
                      <TableCell>{f.area}</TableCell>
                      <TableCell className="text-sm">{f.unit || "-"}</TableCell>
                      <TableCell>{f.soil_type}</TableCell>
                      <TableCell className="text-sm">{f.status || "-"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{f.latitude.toFixed(4)}, {f.longitude.toFixed(4)}</TableCell>
                      <TableCell className="text-right">
                        <TableActions onEdit={() => handleEditField(f)} onDelete={() => setDeletingField(f)} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredFields.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No fields found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Farm Form Modal */}
      <FormModal open={farmDialog} onOpenChange={(open) => { setFarmDialog(open); if (!open) { setEditingFarm(null); setFarmForm(emptyFarm()); } }}
        title={editingFarm ? "Edit Farm" : "Add Farm"} onSave={handleSaveFarm} saveLabel={farmSaving ? "Saving..." : (editingFarm ? "Update Farm" : "Add Farm")}>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-sm font-medium">Name *</label><Input value={farmForm.name} onChange={(e) => setFarmForm({ ...farmForm, name: e.target.value })} /></div>
          <div><label className="text-sm font-medium">Location *</label><Input value={farmForm.location} onChange={(e) => setFarmForm({ ...farmForm, location: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-sm font-medium">Total Area</label><Input type="number" step="0.1" value={farmForm.total_area} onChange={(e) => setFarmForm({ ...farmForm, total_area: Number(e.target.value) })} /></div>
          <div><label className="text-sm font-medium">Unit</label>
            <Select value={farmForm.unit || "hectares"} onValueChange={(v) => setFarmForm({ ...farmForm, unit: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{units.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div><label className="text-sm font-medium">Type</label>
          <Select value={farmForm.farm_type} onValueChange={(v) => setFarmForm({ ...farmForm, farm_type: v as FarmType })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{farmTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-sm font-medium">Soil Type</label>
            <Select value={farmForm.soil_type} onValueChange={(v) => setFarmForm({ ...farmForm, soil_type: v as SoilType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{soilTypes.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><label className="text-sm font-medium">Climate Zone</label>
            <Select value={farmForm.climate_zone} onValueChange={(v) => setFarmForm({ ...farmForm, climate_zone: v as ClimateZone })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{climateZones.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
      </FormModal>

      {/* Field Form Modal */}
      <FormModal open={fieldDialog} onOpenChange={(open) => { setFieldDialog(open); if (!open) { setEditingField(null); setFieldForm(emptyField()); } }}
        title={editingField ? "Edit Field" : "Add Field"} onSave={handleSaveField} saveLabel={fieldSaving ? "Saving..." : (editingField ? "Update Field" : "Add Field")}>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-sm font-medium">Farm *</label>
            <Select value={fieldForm.farm_id} onValueChange={(v) => setFieldForm({ ...fieldForm, farm_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select farm" /></SelectTrigger>
              <SelectContent>{farms.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><label className="text-sm font-medium">Field Name *</label><Input value={fieldForm.name} onChange={(e) => setFieldForm({ ...fieldForm, name: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-sm font-medium">Area</label><Input type="number" step="0.1" value={fieldForm.area} onChange={(e) => setFieldForm({ ...fieldForm, area: Number(e.target.value) })} /></div>
          <div><label className="text-sm font-medium">Unit</label>
            <Select value={fieldForm.unit || "hectares"} onValueChange={(v) => setFieldForm({ ...fieldForm, unit: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{units.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-sm font-medium">Soil Type</label>
            <Select value={fieldForm.soil_type} onValueChange={(v) => setFieldForm({ ...fieldForm, soil_type: v as SoilType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{soilTypes.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><label className="text-sm font-medium">Status</label>
            <Select value={fieldForm.status || "available"} onValueChange={(v) => setFieldForm({ ...fieldForm, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{fieldStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-sm font-medium">Latitude</label><Input type="number" step="0.0001" value={fieldForm.latitude} onChange={(e) => setFieldForm({ ...fieldForm, latitude: Number(e.target.value) })} /></div>
          <div><label className="text-sm font-medium">Longitude</label><Input type="number" step="0.0001" value={fieldForm.longitude} onChange={(e) => setFieldForm({ ...fieldForm, longitude: Number(e.target.value) })} /></div>
        </div>
      </FormModal>

      <DeleteConfirmDialog open={deletingFarm !== null} onOpenChange={(open) => !open && setDeletingFarm(null)}
        onConfirm={handleDeleteFarm} title={`Delete "${deletingFarm?.name}"?`} description="This action cannot be undone." />

      <DeleteConfirmDialog open={deletingField !== null} onOpenChange={(open) => !open && setDeletingField(null)}
        onConfirm={handleDeleteField} title={`Delete field "${deletingField?.name}"?`} description="This action cannot be undone." />
    </PageShell>
  );
};

export default Farms;

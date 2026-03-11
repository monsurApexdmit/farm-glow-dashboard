import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sprout, Droplets, Thermometer, MapPin } from "lucide-react";

interface FieldPlot {
  id: string;
  name: string;
  crop: string;
  area: string;
  status: "growing" | "harvest-ready" | "fallow" | "planted";
  soilMoisture: number;
  temperature: number;
  color: string;
  gridArea: string;
}

const plots: FieldPlot[] = [
  { id: "A1", name: "North Field", crop: "Wheat", area: "12 acres", status: "growing", soilMoisture: 68, temperature: 24, color: "hsl(var(--chart-green))", gridArea: "1 / 1 / 3 / 3" },
  { id: "A2", name: "East Paddock", crop: "Corn", area: "8 acres", status: "harvest-ready", soilMoisture: 55, temperature: 26, color: "hsl(var(--chart-gold))", gridArea: "1 / 3 / 2 / 5" },
  { id: "B1", name: "South Valley", crop: "Rice", area: "15 acres", status: "growing", soilMoisture: 85, temperature: 28, color: "hsl(var(--chart-blue))", gridArea: "3 / 1 / 5 / 2" },
  { id: "B2", name: "West Hills", crop: "Barley", area: "6 acres", status: "planted", soilMoisture: 72, temperature: 22, color: "hsl(var(--chart-brown))", gridArea: "3 / 2 / 4 / 4" },
  { id: "B3", name: "Creek Side", crop: "Soybeans", area: "10 acres", status: "growing", soilMoisture: 78, temperature: 25, color: "hsl(142 45% 55%)", gridArea: "2 / 3 / 4 / 5" },
  { id: "C1", name: "Hilltop", crop: "—", area: "4 acres", status: "fallow", soilMoisture: 40, temperature: 23, color: "hsl(var(--muted))", gridArea: "4 / 2 / 5 / 4" },
  { id: "C2", name: "Orchard Edge", crop: "Oats", area: "5 acres", status: "planted", soilMoisture: 65, temperature: 21, color: "hsl(38 60% 60%)", gridArea: "4 / 4 / 5 / 5" },
];

const statusColors: Record<string, string> = {
  growing: "bg-primary/15 text-primary",
  "harvest-ready": "bg-accent/15 text-accent-foreground",
  fallow: "bg-muted text-muted-foreground",
  planted: "bg-secondary text-secondary-foreground",
};

const FieldMap = () => {
  const [selected, setSelected] = useState<FieldPlot | null>(null);

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 p-6 overflow-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold font-display">Field Map</h1>
            <div className="flex gap-2">
              {["growing", "harvest-ready", "planted", "fallow"].map((s) => (
                <Badge key={s} variant="outline" className={statusColors[s]}>
                  {s.replace("-", " ")}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map Grid */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><MapPin className="w-5 h-5" /> Farm Layout</CardTitle>
                  <CardDescription>Click a plot to view details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    className="grid gap-2"
                    style={{
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gridTemplateRows: "repeat(4, 80px)",
                    }}
                  >
                    {plots.map((plot) => (
                      <button
                        key={plot.id}
                        onClick={() => setSelected(plot)}
                        className={`rounded-lg border-2 p-3 text-left transition-all hover:scale-[1.02] hover:shadow-md ${
                          selected?.id === plot.id ? "border-primary ring-2 ring-primary/30" : "border-border"
                        }`}
                        style={{
                          gridArea: plot.gridArea,
                          backgroundColor: plot.status === "fallow" ? "hsl(var(--muted))" : `${plot.color}20`,
                        }}
                      >
                        <p className="text-xs font-bold">{plot.id}</p>
                        <p className="text-sm font-medium truncate">{plot.name}</p>
                        {plot.crop !== "—" && <p className="text-xs text-muted-foreground">{plot.crop}</p>}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detail Panel */}
            <div>
              {selected ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{selected.name}</CardTitle>
                    <CardDescription>Plot {selected.id} · {selected.area}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Sprout className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Crop:</span>
                      <span className="text-sm">{selected.crop}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusColors[selected.status]}>{selected.status.replace("-", " ")}</Badge>
                    </div>
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
                    <Button variant="outline" size="sm" className="w-full mt-2">View Full History</Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <MapPin className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">Select a plot on the map to view its details</p>
                  </CardContent>
                </Card>
              )}

              {/* Summary */}
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Plots</span>
                    <span className="font-medium">{plots.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Area</span>
                    <span className="font-medium">60 acres</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Active Crops</span>
                    <span className="font-medium">{plots.filter((p) => p.status !== "fallow").length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Harvest Ready</span>
                    <span className="font-medium">{plots.filter((p) => p.status === "harvest-ready").length}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default FieldMap;

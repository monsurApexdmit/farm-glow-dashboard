import { useState, useMemo } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Search, AlertCircle, TrendingUp } from "lucide-react";

type AnimalType = "cow" | "sheep" | "chicken";
type HealthStatus = "healthy" | "sick" | "treatment" | "quarantine";

interface LivestockType {
  type: AnimalType;
  label: string;
  icon: string;
  healthyCount: number;
  sickCount: number;
  treatmentCount: number;
  quarantineCount: number;
  capacityUsed: number;
  totalCapacity: number;
  avgAge: string;
  avgWeight: string;
  productionRate: string;
}

interface Animal {
  id: number;
  type: AnimalType;
  status: HealthStatus;
  animalTypeName: string;
  age: string;
  weight: string;
  lastCheckup?: string;
  condition?: string;
}

const initialLivestock: LivestockType[] = [
  {
    type: "cow",
    label: "Dairy Cows",
    icon: "🐄",
    healthyCount: 30,
    sickCount: 5,
    treatmentCount: 4,
    quarantineCount: 1,
    capacityUsed: 70,
    totalCapacity: 80,
    avgAge: "4.2 years",
    avgWeight: "680 kg",
    productionRate: "420L/day",
  },
  {
    type: "sheep",
    label: "Wool Sheep",
    icon: "🐑",
    healthyCount: 32,
    sickCount: 6,
    treatmentCount: 8,
    quarantineCount: 4,
    capacityUsed: 50,
    totalCapacity: 60,
    avgAge: "3.1 years",
    avgWeight: "72 kg",
    productionRate: "12kg wool/year",
  },
  {
    type: "chicken",
    label: "Laying Hens",
    icon: "🐔",
    healthyCount: 160,
    sickCount: 20,
    treatmentCount: 15,
    quarantineCount: 5,
    capacityUsed: 200,
    totalCapacity: 240,
    avgAge: "2.3 years",
    avgWeight: "3.1 kg",
    productionRate: "170 eggs/day",
  },
];

const LivestockInventory = () => {
  const [livestock] = useState<LivestockType[]>(initialLivestock);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<AnimalType | "all">("all");
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);

  const filtered = useMemo(() => {
    return livestock.filter((item) => {
      const matchSearch = item.label.toLowerCase().includes(search.toLowerCase());
      const matchType = selectedType === "all" || item.type === selectedType;
      return matchSearch && matchType;
    });
  }, [livestock, search, selectedType]);

  const stats = {
    totalAnimals: livestock.reduce((sum, item) => sum + item.healthyCount + item.sickCount + item.treatmentCount + item.quarantineCount, 0),
    totalHealthy: livestock.reduce((sum, item) => sum + item.healthyCount, 0),
    totalSick: livestock.reduce((sum, item) => sum + item.sickCount, 0),
    totalTreatment: livestock.reduce((sum, item) => sum + item.treatmentCount, 0),
    totalQuarantine: livestock.reduce((sum, item) => sum + item.quarantineCount, 0),
    totalCapacity: livestock.reduce((sum, item) => sum + item.totalCapacity, 0),
    totalUsed: livestock.reduce((sum, item) => sum + item.capacityUsed, 0),
  };

  const getCapacityStatus = (used: number, total: number) => {
    const percentage = (used / total) * 100;
    if (percentage >= 95) return { label: "Full", color: "bg-destructive/10 text-destructive" };
    if (percentage >= 80) return { label: "High", color: "bg-accent/10 text-accent" };
    return { label: "Normal", color: "bg-primary/10 text-primary" };
  };

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 p-6 overflow-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-3xl font-bold font-display">Livestock Inventory</h1>
              <p className="text-muted-foreground">Visual stock overview by animal type</p>
            </div>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Total Animals</p>
                <p className="text-2xl font-bold">{stats.totalAnimals}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="text-green-600">●</span> Healthy
                </p>
                <p className="text-2xl font-bold text-green-600">{stats.totalHealthy}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="text-red-600">●</span> Sick
                </p>
                <p className="text-2xl font-bold text-red-600">{stats.totalSick}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="text-orange-600">●</span> Treatment
                </p>
                <p className="text-2xl font-bold text-orange-600">{stats.totalTreatment}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="text-yellow-600">●</span> Quarantine
                </p>
                <p className="text-2xl font-bold text-yellow-600">{stats.totalQuarantine}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Capacity</p>
                <p className="text-2xl font-bold">
                  {Math.round((stats.totalUsed / stats.totalCapacity) * 100)}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search livestock..."
                      className="pl-9"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
                <Select value={selectedType} onValueChange={(v) => setSelectedType(v as AnimalType | "all")}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="cow">Cows</SelectItem>
                    <SelectItem value="sheep">Sheep</SelectItem>
                    <SelectItem value="chicken">Chickens</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Livestock Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item) => {
              const capacityStatus = getCapacityStatus(item.capacityUsed, item.totalCapacity);
              const capacityPercentage = (item.capacityUsed / item.totalCapacity) * 100;

              return (
                <Card key={item.type} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-5xl">{item.icon}</span>
                        <div>
                          <CardTitle className="text-lg">{item.label}</CardTitle>
                          <CardDescription className="text-sm">
                            {item.healthyCount + item.sickCount} total
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className={capacityStatus.color}>{capacityStatus.label}</Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Health Status */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Health Status</p>
                      <div className="space-y-2">
                        <div className="flex gap-2 text-xs">
                          <div className="flex-1">
                            <div className="text-muted-foreground mb-1">Healthy: {item.healthyCount}</div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div className="h-full bg-green-500 rounded-full" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="text-muted-foreground mb-1">Sick: {item.sickCount}</div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div className="h-full bg-red-500 rounded-full" />
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 text-xs">
                          <div className="flex-1">
                            <div className="text-muted-foreground mb-1">Treatment: {item.treatmentCount}</div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div className="h-full bg-orange-500 rounded-full" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="text-muted-foreground mb-1">Quarantine: {item.quarantineCount}</div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div className="h-full bg-yellow-500 rounded-full" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Capacity */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Capacity</span>
                        <span className="text-muted-foreground">
                          {item.capacityUsed}/{item.totalCapacity}
                        </span>
                      </div>
                      <div className="h-3 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            capacityPercentage >= 95
                              ? "bg-destructive"
                              : capacityPercentage >= 80
                                ? "bg-accent"
                                : "bg-primary"
                          }`}
                          style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-3 pt-2 text-sm">
                      <div className="space-y-1 p-2 rounded bg-muted/40">
                        <p className="text-xs text-muted-foreground">Avg Age</p>
                        <p className="font-semibold">{item.avgAge}</p>
                      </div>
                      <div className="space-y-1 p-2 rounded bg-muted/40">
                        <p className="text-xs text-muted-foreground">Avg Weight</p>
                        <p className="font-semibold">{item.avgWeight}</p>
                      </div>
                    </div>

                    {/* Production */}
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <div className="text-sm">
                          <p className="text-xs text-muted-foreground">Production Rate</p>
                          <p className="font-semibold text-primary">{item.productionRate}</p>
                        </div>
                      </div>
                    </div>

                    {/* Visual Animal Grid */}
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-2">Visual Count (click to see details)</p>
                      <div className="flex gap-2 mb-2 flex-wrap">
                        <div className="flex items-center gap-1 text-xs">
                          <div className="w-3 h-3 rounded border-2 border-green-400 bg-green-100" />
                          <span>Healthy</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <div className="w-3 h-3 rounded border-2 border-red-500 bg-red-200" />
                          <span>Sick</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <div className="w-3 h-3 rounded border-2 border-orange-500 bg-orange-200" />
                          <span>Treatment</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <div className="w-3 h-3 rounded border-2 border-yellow-500 bg-yellow-200" />
                          <span>Quarantine</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-8 gap-1">
                        {(() => {
                          const totalCount = item.healthyCount + item.sickCount + item.treatmentCount + item.quarantineCount;
                          const displayItems = Array.from({ length: Math.min(totalCount, 40) }).map(
                            (_, idx) => {
                              let status: HealthStatus = "healthy";
                              let statusColor = "";
                              let condition = "";
                              let lastCheckup = "";

                              if (idx < item.healthyCount) {
                                status = "healthy";
                                statusColor = "bg-green-100 text-green-600 border-2 border-green-400 hover:shadow-lg hover:shadow-green-200";
                                condition = "Excellent";
                                lastCheckup = "1 week ago";
                              } else if (idx < item.healthyCount + item.sickCount) {
                                status = "sick";
                                statusColor = "bg-red-200 text-red-700 border-2 border-red-500 hover:shadow-lg hover:shadow-red-300";
                                condition = "Needs care";
                                lastCheckup = "2 days ago";
                              } else if (idx < item.healthyCount + item.sickCount + item.treatmentCount) {
                                status = "treatment";
                                statusColor = "bg-orange-200 text-orange-700 border-2 border-orange-500 hover:shadow-lg hover:shadow-orange-300";
                                condition = "Under treatment";
                                lastCheckup = "1 day ago";
                              } else {
                                status = "quarantine";
                                statusColor = "bg-yellow-200 text-yellow-700 border-2 border-yellow-500 hover:shadow-lg hover:shadow-yellow-300";
                                condition = "Quarantined";
                                lastCheckup = "12 hours ago";
                              }

                              const animalId = idx + 1;
                              const animal: Animal = {
                                id: animalId,
                                type: item.type,
                                status: status,
                                animalTypeName: item.label,
                                age: item.avgAge,
                                weight: item.avgWeight,
                                lastCheckup: lastCheckup,
                                condition: condition,
                              };

                              return (
                                <button
                                  key={idx}
                                  onClick={() => setSelectedAnimal(animal)}
                                  className={`w-full aspect-square rounded flex items-center justify-center text-xs font-bold transition-all hover:scale-110 cursor-pointer ${statusColor}`}
                                  title={`${item.label} #${animalId} - ${status}`}
                                >
                                  {item.icon}
                                </button>
                              );
                            }
                          );
                          return [...displayItems, totalCount > 40 && (
                            <div key="more" className="w-full aspect-square rounded flex items-center justify-center text-xs font-bold bg-muted text-muted-foreground border border-muted-foreground/20">
                              +{totalCount - 40}
                            </div>
                          )].filter(Boolean);
                        })()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>No livestock found</p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      {/* Animal Detail Dialog */}
      <Dialog open={!!selectedAnimal} onOpenChange={(open) => !open && setSelectedAnimal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{selectedAnimal?.type === "cow" ? "🐄" : selectedAnimal?.type === "sheep" ? "🐑" : "🐔"}</span>
              <div>
                <DialogTitle>{selectedAnimal?.animalTypeName} #{selectedAnimal?.id}</DialogTitle>
                <DialogDescription>Individual animal details</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedAnimal && (
            <div className="space-y-4 py-4">
              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <Badge
                  className={`text-base px-3 py-1 ${
                    selectedAnimal.status === "healthy"
                      ? "bg-green-100 text-green-700 border border-green-300"
                      : selectedAnimal.status === "sick"
                        ? "bg-red-100 text-red-700 border border-red-300"
                        : selectedAnimal.status === "treatment"
                          ? "bg-orange-100 text-orange-700 border border-orange-300"
                          : "bg-yellow-100 text-yellow-700 border border-yellow-300"
                  }`}
                >
                  {selectedAnimal.status === "healthy"
                    ? "🟢 Healthy"
                    : selectedAnimal.status === "sick"
                      ? "🔴 Sick"
                      : selectedAnimal.status === "treatment"
                        ? "🟠 Treatment"
                        : "🟡 Quarantine"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {selectedAnimal.condition}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">Animal ID</p>
                    <p className="text-lg font-semibold">#{selectedAnimal.id}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">Age</p>
                    <p className="text-lg font-semibold">{selectedAnimal.age}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">Weight</p>
                    <p className="text-lg font-semibold">{selectedAnimal.weight}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">Last Checkup</p>
                    <p className="text-sm font-semibold">{selectedAnimal.lastCheckup}</p>
                  </div>
                </div>
              </div>

              {/* Health Section */}
              {selectedAnimal.status === "healthy" && (
                <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                  <div className="flex items-start gap-2">
                    <span className="text-xl">✅</span>
                    <div className="flex-1">
                      <p className="font-semibold text-green-900">Status Good</p>
                      <p className="text-sm text-green-800 mt-1">Animal is in excellent condition. Keep monitoring and maintain regular feeding schedule.</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedAnimal.status === "sick" && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <div className="flex items-start gap-2">
                    <span className="text-xl">⚠️</span>
                    <div className="flex-1">
                      <p className="font-semibold text-red-900">Health Alert</p>
                      <p className="text-sm text-red-800 mt-1">This animal requires medical attention. Contact veterinarian immediately.</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedAnimal.status === "treatment" && (
                <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
                  <div className="flex items-start gap-2">
                    <span className="text-xl">💊</span>
                    <div className="flex-1">
                      <p className="font-semibold text-orange-900">Under Treatment</p>
                      <p className="text-sm text-orange-800 mt-1">Animal is currently receiving treatment. Monitor closely and follow veterinarian instructions.</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedAnimal.status === "quarantine" && (
                <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                  <div className="flex items-start gap-2">
                    <span className="text-xl">🚫</span>
                    <div className="flex-1">
                      <p className="font-semibold text-yellow-900">Quarantined</p>
                      <p className="text-sm text-yellow-800 mt-1">Animal is in quarantine. Keep isolated and maintain strict hygiene protocols.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t">
                <Button variant="outline" size="sm" className="w-full">
                  {selectedAnimal.status === "sick" ? "📋 Medical Record" : "📋 View Details"}
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  ✏️ Edit Info
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LivestockInventory;

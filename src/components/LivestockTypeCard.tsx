import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";

type HealthStatus = "healthy" | "sick" | "treatment" | "quarantine";

export interface LivestockTypeData {
  type: string;
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

export interface AnimalDetail {
  id: number;
  type: string;
  status: HealthStatus;
  animalTypeName: string;
  age: string;
  weight: string;
  lastCheckup: string;
  condition: string;
}

interface LivestockTypeCardProps {
  item: LivestockTypeData;
  onAnimalClick: (animal: AnimalDetail) => void;
}

function getCapacityStatus(used: number, total: number) {
  const pct = (used / total) * 100;
  if (pct >= 95) return { label: "Full", color: "bg-destructive/10 text-destructive" };
  if (pct >= 80) return { label: "High", color: "bg-accent/10 text-accent" };
  return { label: "Normal", color: "bg-primary/10 text-primary" };
}

const statusMeta: Record<HealthStatus, { color: string; condition: string; lastCheckup: string }> = {
  healthy:     { color: "bg-green-100 text-green-600 border-2 border-green-400 hover:shadow-lg hover:shadow-green-200",   condition: "Excellent",        lastCheckup: "1 week ago" },
  sick:        { color: "bg-red-200 text-red-700 border-2 border-red-500 hover:shadow-lg hover:shadow-red-300",           condition: "Needs care",       lastCheckup: "2 days ago" },
  treatment:   { color: "bg-orange-200 text-orange-700 border-2 border-orange-500 hover:shadow-lg hover:shadow-orange-300", condition: "Under treatment", lastCheckup: "1 day ago" },
  quarantine:  { color: "bg-yellow-200 text-yellow-700 border-2 border-yellow-500 hover:shadow-lg hover:shadow-yellow-300", condition: "Quarantined",    lastCheckup: "12 hours ago" },
};

export function LivestockTypeCard({ item, onAnimalClick }: LivestockTypeCardProps) {
  const capacityStatus = getCapacityStatus(item.capacityUsed, item.totalCapacity);
  const capacityPct = (item.capacityUsed / item.totalCapacity) * 100;
  const totalCount = item.healthyCount + item.sickCount + item.treatmentCount + item.quarantineCount;

  const animalStatuses: HealthStatus[] = [
    ...Array(item.healthyCount).fill("healthy"),
    ...Array(item.sickCount).fill("sick"),
    ...Array(item.treatmentCount).fill("treatment"),
    ...Array(item.quarantineCount).fill("quarantine"),
  ];

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-5xl">{item.icon}</span>
            <div>
              <CardTitle className="text-lg">{item.label}</CardTitle>
              <CardDescription className="text-sm">{totalCount} total</CardDescription>
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
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${(item.healthyCount / totalCount) * 100}%` }} />
                </div>
              </div>
              <div className="flex-1">
                <div className="text-muted-foreground mb-1">Sick: {item.sickCount}</div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: `${(item.sickCount / totalCount) * 100}%` }} />
                </div>
              </div>
            </div>
            <div className="flex gap-2 text-xs">
              <div className="flex-1">
                <div className="text-muted-foreground mb-1">Treatment: {item.treatmentCount}</div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(item.treatmentCount / totalCount) * 100}%` }} />
                </div>
              </div>
              <div className="flex-1">
                <div className="text-muted-foreground mb-1">Quarantine: {item.quarantineCount}</div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${(item.quarantineCount / totalCount) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Capacity */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Capacity</span>
            <span className="text-muted-foreground">{item.capacityUsed}/{item.totalCapacity}</span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                capacityPct >= 95 ? "bg-destructive" : capacityPct >= 80 ? "bg-accent" : "bg-primary"
              }`}
              style={{ width: `${Math.min(capacityPct, 100)}%` }}
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
            {(["healthy", "sick", "treatment", "quarantine"] as HealthStatus[]).map((s) => (
              <div key={s} className="flex items-center gap-1 text-xs">
                <div className={`w-3 h-3 rounded ${statusMeta[s].color.split(" ").filter(c => c.startsWith("bg-") || c.startsWith("border-")).join(" ")}`} />
                <span className="capitalize">{s}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-8 gap-1">
            {animalStatuses.slice(0, 40).map((status, idx) => {
              const animal: AnimalDetail = {
                id: idx + 1,
                type: item.type,
                status,
                animalTypeName: item.label,
                age: item.avgAge,
                weight: item.avgWeight,
                lastCheckup: statusMeta[status].lastCheckup,
                condition: statusMeta[status].condition,
              };
              return (
                <button
                  key={idx}
                  onClick={() => onAnimalClick(animal)}
                  className={`w-full aspect-square rounded flex items-center justify-center text-xs font-bold transition-all hover:scale-110 cursor-pointer ${statusMeta[status].color}`}
                  title={`${item.label} #${idx + 1} - ${status}`}
                >
                  {item.icon}
                </button>
              );
            })}
            {totalCount > 40 && (
              <div className="w-full aspect-square rounded flex items-center justify-center text-xs font-bold bg-muted text-muted-foreground border border-muted-foreground/20">
                +{totalCount - 40}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

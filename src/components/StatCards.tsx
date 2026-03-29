import { Card, CardContent } from "@/components/ui/card";

export interface StatCardItem {
  label: string;
  value: React.ReactNode;
  /** Tailwind text color class e.g. "text-primary" */
  color?: string;
  /** Optional icon rendered before the value */
  icon?: React.ReactNode;
}

interface StatCardsProps {
  stats: StatCardItem[];
  /** Tailwind grid-cols class, defaults to "grid-cols-2 sm:grid-cols-5" */
  columns?: string;
}

export function StatCards({ stats, columns = "grid-cols-2 sm:grid-cols-5" }: StatCardsProps) {
  return (
    <div className={`grid ${columns} gap-3`}>
      {stats.map((s) => (
        <Card key={s.label}>
          <CardContent className="p-4 text-center">
            {s.icon && <div className="flex justify-center mb-1">{s.icon}</div>}
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color ?? "text-foreground"}`}>{s.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

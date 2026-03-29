import { Button } from "@/components/ui/button";
import { Download, Plus } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  addLabel?: string;
  onAdd?: () => void;
  onExport?: () => void;
  /** Slot for extra buttons to the left of Export/Add */
  extra?: React.ReactNode;
}

export function PageHeader({ title, description, addLabel = "Add", onAdd, onExport, extra }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-4">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </div>
      <div className="flex gap-2 items-center">
        {extra}
        {onExport && (
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="w-4 h-4 mr-1" /> Export
          </Button>
        )}
        {onAdd && (
          <Button size="sm" onClick={onAdd}>
            <Plus className="w-4 h-4 mr-1" /> {addLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Move, ZoomIn, ZoomOut } from "lucide-react";

export interface GridItem {
  id: string;
  row: number;
  col: number;
  rowSpan: number;
  colSpan: number;
}

interface FarmGridMapProps<T extends GridItem> {
  title: React.ReactNode;
  items: T[];
  onMove: (id: string, row: number, col: number) => void;
  renderTile: (item: T, isDragging: boolean, isSelected: boolean) => React.ReactNode;
  selectedId?: string | null;
  gridCols?: number;
  gridRows?: number;
}

export function FarmGridMap<T extends GridItem>({
  title,
  items,
  onMove,
  renderTile,
  selectedId,
  gridCols = 6,
  gridRows = 6,
}: FarmGridMapProps<T>) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<{ row: number; col: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const gridRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleCellDragOver = (e: React.DragEvent, row: number, col: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver({ row, col });
  };

  const handleCellDrop = (e: React.DragEvent, row: number, col: number) => {
    e.preventDefault();
    if (!dragId) return;
    onMove(dragId, row, col);
    setDragId(null);
    setDragOver(null);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">{title}</CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              <Move className="w-3.5 h-3.5" /> Drag to reposition · Click to view details
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs text-muted-foreground w-10 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}>
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-auto">
        <div
          ref={gridRef}
          className="relative"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
            gridTemplateRows: `repeat(${gridRows}, ${70 * zoom}px)`,
            gap: `${3 * zoom}px`,
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
            width: `${100 / zoom}%`,
          }}
        >
          {/* Background empty cells */}
          {Array.from({ length: gridRows * gridCols }).map((_, i) => {
            const row = Math.floor(i / gridCols);
            const col = i % gridCols;
            const isOver = dragOver?.row === row && dragOver?.col === col;
            return (
              <div
                key={`cell-${row}-${col}`}
                className={`rounded-md border border-dashed transition-colors ${
                  isOver ? "border-primary bg-primary/10" : "border-border/40 bg-muted/20"
                }`}
                style={{ gridRow: row + 1, gridColumn: col + 1 }}
                onDragOver={(e) => handleCellDragOver(e, row, col)}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => handleCellDrop(e, row, col)}
              />
            );
          })}

          {/* Item tiles */}
          {items.map((item) => (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, item.id)}
              onDragEnd={() => { setDragId(null); setDragOver(null); }}
              style={{
                gridRow: `${item.row + 1} / ${item.row + 1 + item.rowSpan}`,
                gridColumn: `${item.col + 1} / ${item.col + 1 + item.colSpan}`,
              }}
              className="z-10"
            >
              {renderTile(item, dragId === item.id, selectedId === item.id)}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

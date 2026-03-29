import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterDef {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: FilterOption[];
  width?: string;
}

interface SearchFilterBarProps {
  search: string;
  onSearch: (v: string) => void;
  searchPlaceholder?: string;
  filters: FilterDef[];
  /** Slot for extra content (e.g. buttons) on the right */
  extra?: React.ReactNode;
}

export function SearchFilterBar({
  search,
  onSearch,
  searchPlaceholder = "Search...",
  filters,
  extra,
}: SearchFilterBarProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                className="pl-9"
                value={search}
                onChange={(e) => onSearch(e.target.value)}
              />
            </div>
          </div>
          {filters.map((f) => (
            <Select key={f.placeholder} value={f.value} onValueChange={f.onChange}>
              <SelectTrigger className={f.width ?? "w-[150px]"}>
                <SelectValue placeholder={f.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {f.options.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
          {extra}
        </div>
      </CardContent>
    </Card>
  );
}

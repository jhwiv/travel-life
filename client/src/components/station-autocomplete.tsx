import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { searchStations, type TrainStation } from "@/lib/european-stations";
import { cn } from "@/lib/utils";

interface StationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onStationSelect?: (station: TrainStation) => void;
  placeholder?: string;
  "data-testid"?: string;
  required?: boolean;
}

export function StationAutocomplete({
  value,
  onChange,
  onStationSelect,
  placeholder = "Station code",
  "data-testid": testId,
  required,
}: StationAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<TrainStation[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.length >= 1) {
      const matches = searchStations(value);
      setResults(matches);
      setOpen(matches.length > 0);
    } else {
      setResults([]);
      setOpen(false);
    }
  }, [value]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (station: TrainStation) => {
    onChange(station.code);
    onStationSelect?.(station);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        data-testid={testId}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        onFocus={() => {
          if (results.length > 0) setOpen(true);
        }}
        required={required}
        autoComplete="off"
      />
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 z-50 mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto w-72">
          {results.map((station) => (
            <button
              key={`${station.code}-${station.name}`}
              type="button"
              className={cn(
                "w-full text-left px-3 py-2.5 text-sm hover:bg-accent transition-colors",
                "first:rounded-t-lg last:rounded-b-lg"
              )}
              onClick={() => handleSelect(station)}
              data-testid={`station-option-${station.code}`}
            >
              <div className="flex items-baseline gap-1.5">
                <span className="font-semibold text-xs shrink-0">{station.code}</span>
                <span className="text-muted-foreground text-xs truncate">{station.name}</span>
              </div>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">{station.city}, {station.country}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

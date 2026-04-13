import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { CalendarIcon, TrainFront, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { TRAIN_OPERATORS, searchTrainOperators, type TrainOperatorMatch } from "@/lib/train-operators";
import { TRAIN_STATIONS, searchStations, type TrainStation } from "@/lib/train-stations";

interface SmartTrainFormProps {
  onSubmit: (data: TrainFormData) => void;
  isPending?: boolean;
}

export interface TrainFormData {
  type: "train";
  trainOperator: string;
  trainNumber: string;
  trainClass: string;
  departureCity: string;
  departureCode: string;
  departureCountry: string;
  arrivalCity: string;
  arrivalCode: string;
  arrivalCountry: string;
  departureDate: string;
  arrivalDate: string;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  distance: number;
  status: string;
  notes: string;
}

/* ─── Train operator autocomplete input ─── */
function OperatorInput({
  value,
  selectedCode,
  selectedName,
  onSelect,
  onClear,
}: {
  value: string;
  selectedCode: string;
  selectedName: string;
  onSelect: (code: string, name: string) => void;
  onClear: () => void;
}) {
  const [inputValue, setInputValue] = useState(value);
  const [showDropdown, setShowDropdown] = useState(false);
  const [suggestions, setSuggestions] = useState<TrainOperatorMatch[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInput = (raw: string) => {
    setInputValue(raw);
    if (selectedCode) onClear();

    if (raw.trim().length >= 1) {
      const matches = searchTrainOperators(raw);
      setSuggestions(matches);
      setShowDropdown(matches.length > 0);
    } else {
      setShowDropdown(false);
      setSuggestions([]);
    }
  };

  const selectOperator = (match: TrainOperatorMatch) => {
    setInputValue(match.name);
    onSelect(match.code, match.name);
    setShowDropdown(false);
    setSuggestions([]);
  };

  return (
    <div className="space-y-1.5 relative">
      <Label className="text-xs font-medium text-muted-foreground">Train Operator</Label>
      <div className="relative">
        <TrainFront className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => {
            if (!selectedCode && inputValue.trim().length >= 1) {
              const matches = searchTrainOperators(inputValue);
              setSuggestions(matches);
              setShowDropdown(matches.length > 0);
            }
          }}
          placeholder='e.g. Amtrak, Eurostar, SNCF...'
          className={cn(
            "pl-10 text-base h-12 rounded-xl border-2 transition-colors",
            selectedCode ? "border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/20" : "border-border"
          )}
          autoFocus
        />
        {selectedCode && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded">{selectedCode}</span>
            <CheckCircle2 className="w-4 h-4 text-amber-500" />
          </div>
        )}
      </div>
      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 top-full mt-1 left-0 right-0 bg-popover border rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto"
        >
          {suggestions.map((match) => (
            <button
              key={match.code}
              type="button"
              className="w-full px-3 py-2.5 text-left hover:bg-accent flex items-center gap-3 text-sm transition-colors"
              onClick={() => selectOperator(match)}
            >
              <span className="font-mono font-bold text-xs text-muted-foreground w-10">{match.code}</span>
              <span className="truncate">{match.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Station autocomplete input (matching flight form's AirportCodeInput style) ─── */
function StationInput({
  label,
  value,
  onChange,
  stationInfo,
  placeholder = "e.g. London",
}: {
  label: string;
  value: string;
  onChange: (code: string, station: TrainStation) => void;
  stationInfo: TrainStation | null;
  placeholder?: string;
}) {
  const [inputValue, setInputValue] = useState(value);
  const [showDropdown, setShowDropdown] = useState(false);
  const [suggestions, setSuggestions] = useState<TrainStation[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInput = (raw: string) => {
    setInputValue(raw);

    if (raw.trim().length >= 1) {
      const matches = searchStations(raw);
      setSuggestions(matches);
      setShowDropdown(matches.length > 0);
    } else {
      setShowDropdown(false);
      setSuggestions([]);
    }
  };

  const selectStation = (station: TrainStation) => {
    setInputValue(station.city);
    onChange(station.code, station);
    setShowDropdown(false);
    inputRef.current?.blur();
  };

  return (
    <div className="space-y-1.5 relative">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div className="relative">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => {
            if (inputValue.length >= 1 && !stationInfo) {
              const matches = searchStations(inputValue);
              setSuggestions(matches);
              setShowDropdown(matches.length > 0);
            }
          }}
          placeholder={placeholder}
          className={cn(
            "text-base h-12 rounded-xl border-2 transition-colors",
            stationInfo ? "border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20" : "border-border"
          )}
        />
        {stationInfo && (
          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
        )}
      </div>
      {stationInfo && (
        <div className="text-[11px] text-muted-foreground leading-tight">
          <span className="font-medium text-foreground">{stationInfo.name}</span>
          <span className="mx-1">·</span>
          <span>{stationInfo.city}, {stationInfo.country}</span>
        </div>
      )}
      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 top-full mt-1 w-full bg-popover border rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto"
        >
          {suggestions.map((station) => (
            <button
              key={`${station.code}-${station.name}`}
              type="button"
              className="w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-2 text-sm transition-colors"
              onClick={() => selectStation(station)}
            >
              <span className="font-mono font-bold text-xs w-10">{station.code}</span>
              <span className="truncate text-muted-foreground">
                {station.name} · {station.city}, {station.country}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main form: Operator → Train # → From/To → Date → Notes ─── */
export function SmartTrainForm({ onSubmit, isPending }: SmartTrainFormProps) {
  const [operatorCode, setOperatorCode] = useState("");
  const [operatorName, setOperatorName] = useState("");
  const [operatorInput, setOperatorInput] = useState("");
  const [trainNum, setTrainNum] = useState("");
  const [departureStation, setDepartureStation] = useState<TrainStation | null>(null);
  const [departureCode, setDepartureCode] = useState("");
  const [arrivalStation, setArrivalStation] = useState<TrainStation | null>(null);
  const [arrivalCode, setArrivalCode] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [notes, setNotes] = useState("");

  const trainNumRef = useRef<HTMLInputElement>(null);

  // Progressive reveal: each section appears once the previous is filled
  const showTrainNum = !!operatorCode;
  const showStations = showTrainNum && trainNum.length >= 1;
  const showDate = showStations && !!departureStation && !!arrivalStation;
  const showNotes = showDate && !!date;
  const isComplete = !!operatorCode && trainNum.length >= 1 && !!departureStation && !!arrivalStation && !!date;

  const handleOperatorSelect = (code: string, name: string) => {
    setOperatorCode(code);
    setOperatorName(name);
    setOperatorInput(name);
    setTimeout(() => trainNumRef.current?.focus(), 100);
  };

  const handleOperatorClear = () => {
    setOperatorCode("");
    setOperatorName("");
  };

  const handleTrainNumChange = (raw: string) => {
    // Allow alphanumeric for train numbers (e.g., "9024", "ICE575", "TGV6721")
    const cleaned = raw.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10);
    setTrainNum(cleaned);
  };

  const handleDepartureSelect = (code: string, station: TrainStation) => {
    setDepartureCode(code);
    setDepartureStation(station);
  };

  const handleArrivalSelect = (code: string, station: TrainStation) => {
    setArrivalCode(code);
    setArrivalStation(station);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete || !date || !departureStation || !arrivalStation) return;

    const dateStr = format(date, "yyyy-MM-dd");

    onSubmit({
      type: "train",
      trainOperator: operatorName,
      trainNumber: trainNum,
      trainClass: "",
      departureCity: departureStation.city,
      departureCode,
      departureCountry: departureStation.country,
      arrivalCity: arrivalStation.city,
      arrivalCode,
      arrivalCountry: arrivalStation.country,
      departureDate: dateStr,
      arrivalDate: dateStr,
      departureTime: "00:00",
      arrivalTime: "00:00",
      duration: 0,
      distance: 0,
      status: "completed",
      notes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 1. Train Operator */}
      <OperatorInput
        value={operatorInput}
        selectedCode={operatorCode}
        selectedName={operatorName}
        onSelect={handleOperatorSelect}
        onClear={handleOperatorClear}
      />

      {/* 2. Train Number (appears after operator selected) */}
      {showTrainNum && (
        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
          <Label className="text-xs font-medium text-muted-foreground">Train Number</Label>
          <div className="flex items-center gap-2">
            <div className="flex items-center h-12 px-3 rounded-xl bg-muted/60 border-2 border-transparent shrink-0">
              <span className="font-mono font-bold text-sm text-foreground">{operatorName.split(' ')[0]}</span>
            </div>
            <Input
              ref={trainNumRef}
              value={trainNum}
              onChange={(e) => handleTrainNumChange(e.target.value)}
              placeholder="e.g. 9024"
              className={cn(
                "font-mono text-lg tracking-wider h-12 rounded-xl border-2 transition-colors flex-1",
                trainNum.length >= 1 ? "border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/20" : "border-border"
              )}
            />
          </div>
          {trainNum && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Train</span>
              <span className="font-mono font-bold text-foreground">{trainNum}</span>
              <span>·</span>
              <span>{operatorName}</span>
            </div>
          )}
        </div>
      )}

      {/* 3. From / To stations (appears after train number entered) */}
      {showStations && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 gap-4">
            <StationInput
              label="From"
              value={departureStation ? departureStation.city : ""}
              onChange={handleDepartureSelect}
              stationInfo={departureStation}
              placeholder="e.g. London"
            />
            <StationInput
              label="To"
              value={arrivalStation ? arrivalStation.city : ""}
              onChange={handleArrivalSelect}
              stationInfo={arrivalStation}
              placeholder="e.g. Paris"
            />
          </div>

          {/* Route summary when both stations set */}
          {departureStation && arrivalStation && (
            <div className="mt-3 rounded-xl bg-muted/50 border border-border/60 px-4 py-3 flex items-center justify-between animate-in fade-in duration-200">
              <div className="text-sm font-medium">
                {departureStation.city}
                <span className="mx-2 text-muted-foreground">→</span>
                {arrivalStation.city}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-mono">{departureCode}</span>
                <span>→</span>
                <span className="font-mono">{arrivalCode}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Date (appears after stations filled) */}
      {showDate && (
        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
          <Label className="text-xs font-medium text-muted-foreground">Date</Label>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "w-full h-12 rounded-xl border-2 justify-start text-left font-normal text-base transition-colors",
                  date ? "border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20" : "border-border text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "MMMM d, yyyy") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => {
                  setDate(d);
                  setCalendarOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* 5. Notes (appears after date) */}
      {showNotes && (
        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
          <Label className="text-xs font-medium text-muted-foreground">Notes (optional)</Label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Seat, class, platform..."
            className="rounded-xl h-10"
          />
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        className="w-full h-12 rounded-xl text-base font-semibold"
        disabled={!isComplete || isPending}
        style={{ background: isComplete ? "linear-gradient(135deg, #f59e0b, #d97706)" : undefined }}
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Adding...
          </>
        ) : (
          <>
            <TrainFront className="w-4 h-4 mr-2" />
            Add Train Ride
          </>
        )}
      </Button>
    </form>
  );
}

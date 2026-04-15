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
      <Label className="text-xs font-medium text-white/50">Train Operator</Label>
      <div className="relative">
        <TrainFront className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
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
            "pl-10 text-base h-12 rounded-xl border-2 transition-colors bg-[#1E293B] text-white placeholder:text-white/20",
            selectedCode ? "border-amber-500/40" : "border-white/10 focus:border-teal-500/50"
          )}
          autoFocus
        />
        {selectedCode && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded">{selectedCode}</span>
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
          </div>
        )}
      </div>
      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 top-full mt-1 left-0 right-0 bg-[#1E293B] border border-white/10 rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto"
        >
          {suggestions.map((match) => (
            <button
              key={match.code}
              type="button"
              className="w-full px-3 py-2.5 text-left hover:bg-white/5 flex items-center gap-3 text-sm transition-colors text-white/80"
              onClick={() => selectOperator(match)}
            >
              <span className="font-mono font-bold text-xs text-white/40 w-10">{match.code}</span>
              <span className="truncate">{match.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Station autocomplete input ─── */
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
      <Label className="text-xs font-medium text-white/50">{label}</Label>
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
            "text-base h-12 rounded-xl border-2 transition-colors bg-[#1E293B] text-white placeholder:text-white/20",
            stationInfo ? "border-teal-500/40" : "border-white/10 focus:border-teal-500/50"
          )}
        />
        {stationInfo && (
          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-400" />
        )}
      </div>
      {stationInfo && (
        <div className="text-[11px] text-white/40 leading-tight">
          <span className="font-medium text-white/70">{stationInfo.name}</span>
          <span className="mx-1">&middot;</span>
          <span>{stationInfo.city}, {stationInfo.country}</span>
        </div>
      )}
      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 top-full mt-1 w-full bg-[#1E293B] border border-white/10 rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto"
        >
          {suggestions.map((station) => (
            <button
              key={`${station.code}-${station.name}`}
              type="button"
              className="w-full px-3 py-2 text-left hover:bg-white/5 flex items-center gap-2 text-sm transition-colors text-white/80"
              onClick={() => selectStation(station)}
            >
              <span className="font-mono font-bold text-xs w-10">{station.code}</span>
              <span className="truncate text-white/40">
                {station.name} &middot; {station.city}, {station.country}
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

      {/* 2. Train Number */}
      {showTrainNum && (
        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
          <Label className="text-xs font-medium text-white/50">Train Number</Label>
          <div className="flex items-center gap-2">
            <div className="flex items-center h-12 px-3 rounded-xl bg-white/5 border-2 border-transparent shrink-0">
              <span className="font-mono font-bold text-sm text-white/70">{operatorName.split(' ')[0]}</span>
            </div>
            <Input
              ref={trainNumRef}
              value={trainNum}
              onChange={(e) => handleTrainNumChange(e.target.value)}
              placeholder="e.g. 9024"
              className={cn(
                "font-mono text-lg tracking-wider h-12 rounded-xl border-2 transition-colors flex-1 bg-[#1E293B] text-white placeholder:text-white/20",
                trainNum.length >= 1 ? "border-amber-500/40" : "border-white/10 focus:border-teal-500/50"
              )}
            />
          </div>
          {trainNum && (
            <div className="flex items-center gap-1.5 text-xs text-white/40">
              <span>Train</span>
              <span className="font-mono font-bold text-white/70">{trainNum}</span>
              <span>&middot;</span>
              <span>{operatorName}</span>
            </div>
          )}
        </div>
      )}

      {/* 3. From / To stations */}
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

          {departureStation && arrivalStation && (
            <div className="mt-3 rounded-xl bg-white/5 border border-white/10 px-4 py-3 flex items-center justify-between animate-in fade-in duration-200">
              <div className="text-sm font-medium text-white">
                {departureStation.city}
                <span className="mx-2 text-white/30">&rarr;</span>
                {arrivalStation.city}
              </div>
              <div className="flex items-center gap-2 text-xs text-white/40">
                <span className="font-mono">{departureCode}</span>
                <span>&rarr;</span>
                <span className="font-mono">{arrivalCode}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Date */}
      {showDate && (
        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
          <Label className="text-xs font-medium text-white/50">Date</Label>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "w-full h-12 rounded-xl border-2 justify-start text-left font-normal text-base transition-colors bg-[#1E293B] text-white",
                  date ? "border-teal-500/40" : "border-white/10 text-white/30 hover:border-teal-500/30"
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

      {/* 5. Notes */}
      {showNotes && (
        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
          <Label className="text-xs font-medium text-white/50">Notes (optional)</Label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Seat, class, platform..."
            className="rounded-xl h-10 border-2 border-white/10 focus:border-teal-500/50 bg-[#1E293B] text-white placeholder:text-white/20"
          />
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        className="w-full h-12 rounded-xl text-base font-bold"
        disabled={!isComplete || isPending}
        style={{
          background: isComplete ? "linear-gradient(135deg, #F59E0B, #D97706)" : undefined,
          color: isComplete ? "#0F172A" : undefined,
        }}
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

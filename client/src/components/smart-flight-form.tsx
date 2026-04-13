import { useState, useEffect, useRef, useCallback } from "react";
import { format } from "date-fns";
import { CalendarIcon, Plane, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getAirlineFromFlightNumber, extractAirlineCode, AIRLINE_CODES } from "@/lib/airline-codes";
import { AIRPORTS, calculateDistanceMiles, estimateFlightDuration, type AirportInfo } from "@/lib/airport-data";

interface SmartFlightFormProps {
  onSubmit: (data: FlightFormData) => void;
  isPending?: boolean;
}

export interface FlightFormData {
  type: "flight";
  airline: string;
  flightNumber: string;
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

/** Airport code input with instant autocomplete dropdown */
function AirportCodeInput({
  label,
  value,
  onChange,
  airportInfo,
  placeholder = "e.g. JFK",
}: {
  label: string;
  value: string;
  onChange: (code: string) => void;
  airportInfo: AirportInfo | null;
  placeholder?: string;
}) {
  const [inputValue, setInputValue] = useState(value);
  const [showDropdown, setShowDropdown] = useState(false);
  const [suggestions, setSuggestions] = useState<[string, AirportInfo][]>([]);
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
    const upper = raw.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3);
    setInputValue(upper);

    if (upper.length >= 1) {
      const matches = Object.entries(AIRPORTS)
        .filter(([code, info]) =>
          code.startsWith(upper) ||
          info.city.toUpperCase().startsWith(upper) ||
          info.name.toUpperCase().includes(upper)
        )
        .slice(0, 6);
      setSuggestions(matches);
      setShowDropdown(matches.length > 0);
    } else {
      setShowDropdown(false);
      setSuggestions([]);
    }

    if (upper.length === 3 && AIRPORTS[upper]) {
      onChange(upper);
      setShowDropdown(false);
    }
  };

  const selectAirport = (code: string) => {
    setInputValue(code);
    onChange(code);
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
            if (inputValue.length >= 1 && suggestions.length > 0) setShowDropdown(true);
          }}
          placeholder={placeholder}
          className={cn(
            "text-center font-mono text-lg tracking-widest h-12 rounded-xl border-2 transition-colors",
            airportInfo ? "border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20" : "border-border"
          )}
          maxLength={3}
        />
        {airportInfo && (
          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
        )}
      </div>
      {airportInfo && (
        <div className="text-[11px] text-muted-foreground leading-tight">
          <span className="font-medium text-foreground">{airportInfo.city}</span>
          <span className="mx-1">·</span>
          <span>{airportInfo.country}</span>
        </div>
      )}
      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 top-full mt-1 w-full bg-popover border rounded-xl shadow-lg overflow-hidden"
        >
          {suggestions.map(([code, info]) => (
            <button
              key={code}
              type="button"
              className="w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-2 text-sm transition-colors"
              onClick={() => selectAirport(code)}
            >
              <span className="font-mono font-bold text-xs w-8">{code}</span>
              <span className="truncate text-muted-foreground">
                {info.city}, {info.country}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function SmartFlightForm({ onSubmit, isPending }: SmartFlightFormProps) {
  const [flightNumber, setFlightNumber] = useState("");
  const [airline, setAirline] = useState("");
  const [airlineDetected, setAirlineDetected] = useState(false);
  const [departureCode, setDepartureCode] = useState("");
  const [arrivalCode, setArrivalCode] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [notes, setNotes] = useState("");

  // Derived airport info
  const depAirport = AIRPORTS[departureCode] || null;
  const arrAirport = AIRPORTS[arrivalCode] || null;

  // Derived distance and duration
  const distance = departureCode && arrivalCode ? calculateDistanceMiles(departureCode, arrivalCode) : null;
  const duration = distance ? estimateFlightDuration(distance) : null;

  // Auto-detect airline from flight number
  useEffect(() => {
    const cleaned = flightNumber.trim().toUpperCase().replace(/\s+/g, "");
    if (cleaned.length >= 2) {
      const name = getAirlineFromFlightNumber(cleaned);
      if (name) {
        setAirline(name);
        setAirlineDetected(true);
      } else {
        setAirlineDetected(false);
      }
    } else {
      setAirline("");
      setAirlineDetected(false);
    }
  }, [flightNumber]);

  const handleFlightNumberChange = (raw: string) => {
    // Allow alphanumeric + space, auto-uppercase
    const cleaned = raw.toUpperCase().replace(/[^A-Z0-9 ]/g, "");
    setFlightNumber(cleaned);
  };

  const isComplete = flightNumber.length >= 3 && date && depAirport && arrAirport && duration;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete || !date || !depAirport || !arrAirport || !distance || !duration) return;

    const dateStr = format(date, "yyyy-MM-dd");

    onSubmit({
      type: "flight",
      airline: airline,
      flightNumber: flightNumber.replace(/\s+/g, ""),
      departureCity: depAirport.city,
      departureCode: departureCode,
      departureCountry: depAirport.country,
      arrivalCity: arrAirport.city,
      arrivalCode: arrivalCode,
      arrivalCountry: arrAirport.country,
      departureDate: dateStr,
      arrivalDate: dateStr,
      departureTime: "00:00",
      arrivalTime: "00:00",
      duration: duration,
      distance: distance,
      status: "completed",
      notes: notes,
    });
  };

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Flight Number — the primary input */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground">Flight Number</Label>
        <div className="relative">
          <Plane className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={flightNumber}
            onChange={(e) => handleFlightNumberChange(e.target.value)}
            placeholder="e.g. UA123"
            className={cn(
              "pl-10 font-mono text-lg tracking-wider h-12 rounded-xl border-2 transition-colors",
              airlineDetected ? "border-sky-500/40 bg-sky-50/50 dark:bg-sky-950/20" : "border-border"
            )}
            autoFocus
          />
        </div>
        {airlineDetected && airline && (
          <div className="flex items-center gap-1.5 text-sm text-sky-600 dark:text-sky-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="font-medium">{airline}</span>
          </div>
        )}
        {flightNumber.length >= 2 && !airlineDetected && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Airline not recognized — you can still add this flight</span>
          </div>
        )}
      </div>

      {/* Airport codes side by side */}
      <div className="grid grid-cols-2 gap-4">
        <AirportCodeInput
          label="From"
          value={departureCode}
          onChange={setDepartureCode}
          airportInfo={depAirport}
          placeholder="e.g. EWR"
        />
        <AirportCodeInput
          label="To"
          value={arrivalCode}
          onChange={setArrivalCode}
          airportInfo={arrAirport}
          placeholder="e.g. LHR"
        />
      </div>

      {/* Auto-calculated route info */}
      {distance && duration && depAirport && arrAirport && (
        <div className="rounded-xl bg-muted/50 border border-border/60 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium">
              {depAirport.city}
              <span className="mx-2 text-muted-foreground">→</span>
              {arrAirport.city}
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="font-mono">{distance.toLocaleString()} mi</span>
            <span>·</span>
            <span className="font-mono">{formatDuration(duration)}</span>
          </div>
        </div>
      )}

      {/* Date Picker */}
      <div className="space-y-1.5">
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

      {/* Notes (collapsed, optional) */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground">Notes (optional)</Label>
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Seat, terminal, layover..."
          className="rounded-xl h-10"
        />
      </div>

      {/* Submit */}
      <Button
        type="submit"
        className="w-full h-12 rounded-xl text-base font-semibold"
        disabled={!isComplete || isPending}
        style={{ background: isComplete ? "linear-gradient(135deg, #0ea5e9, #3b82f6)" : undefined }}
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Adding...
          </>
        ) : (
          <>
            <Plane className="w-4 h-4 mr-2" />
            Add Flight
          </>
        )}
      </Button>
    </form>
  );
}

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { CalendarIcon, Plane, Loader2, CheckCircle2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { AIRLINE_CODES, searchAirlines, type AirlineMatch } from "@/lib/airline-codes";
import { AIRPORTS, calculateDistanceMiles, estimateFlightDuration, type AirportInfo } from "@/lib/airport-data";
import { lookupFlightRoute } from "@/lib/flight-lookup";

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

/* ─── Airline autocomplete input ─── */
function AirlineInput({
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
  const [suggestions, setSuggestions] = useState<AirlineMatch[]>([]);
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
      const matches = searchAirlines(raw);
      setSuggestions(matches);
      setShowDropdown(matches.length > 0);
    } else {
      setShowDropdown(false);
      setSuggestions([]);
    }
  };

  const selectAirline = (match: AirlineMatch) => {
    setInputValue(match.name);
    onSelect(match.code, match.name);
    setShowDropdown(false);
    setSuggestions([]);
  };

  return (
    <div className="space-y-1.5 relative">
      <Label className="text-xs font-medium text-muted-foreground">Airline</Label>
      <div className="relative">
        <Plane className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => {
            if (!selectedCode && inputValue.trim().length >= 1) {
              const matches = searchAirlines(inputValue);
              setSuggestions(matches);
              setShowDropdown(matches.length > 0);
            }
          }}
          placeholder='e.g. SAS, Delta, BA...'
          className={cn(
            "pl-10 text-base h-12 rounded-xl border-2 transition-colors",
            selectedCode ? "border-sky-500/40 bg-sky-50/50 dark:bg-sky-950/20" : "border-border"
          )}
          autoFocus
        />
        {selectedCode && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            <span className="text-[10px] font-mono font-bold text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/40 px-1.5 py-0.5 rounded">{selectedCode}</span>
            <CheckCircle2 className="w-4 h-4 text-sky-500" />
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
              onClick={() => selectAirline(match)}
            >
              <span className="font-mono font-bold text-xs text-muted-foreground w-7">{match.code}</span>
              <span className="truncate">{match.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Airport code input with autocomplete ─── */
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

/* ─── Main form: Airline → Flight # → From/To → Date ─── */
export function SmartFlightForm({ onSubmit, isPending }: SmartFlightFormProps) {
  const [airlineCode, setAirlineCode] = useState("");
  const [airlineName, setAirlineName] = useState("");
  const [airlineInput, setAirlineInput] = useState("");
  const [flightNum, setFlightNum] = useState("");
  const [departureCode, setDepartureCode] = useState("");
  const [arrivalCode, setArrivalCode] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupDone, setLookupDone] = useState(false);

  const flightNumRef = useRef<HTMLInputElement>(null);
  const lookupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derived
  const depAirport = AIRPORTS[departureCode] || null;
  const arrAirport = AIRPORTS[arrivalCode] || null;
  const distance = departureCode && arrivalCode ? calculateDistanceMiles(departureCode, arrivalCode) : null;
  const duration = distance ? estimateFlightDuration(distance) : null;

  // Full flight number = airline code + number
  const fullFlightNumber = airlineCode && flightNum ? `${airlineCode}${flightNum}` : "";

  // Progressive reveal: each section appears once the previous is filled
  const showFlightNum = !!airlineCode;
  const showAirports = showFlightNum && flightNum.length >= 1;
  const showDate = showAirports && !!depAirport && !!arrAirport;
  const showNotes = showDate && !!date;
  const isComplete = !!airlineCode && flightNum.length >= 1 && !!depAirport && !!arrAirport && !!duration && !!date;

  const handleAirlineSelect = (code: string, name: string) => {
    setAirlineCode(code);
    setAirlineName(name);
    setAirlineInput(name);
    // Auto-focus flight number input
    setTimeout(() => flightNumRef.current?.focus(), 100);
  };

  const handleAirlineClear = () => {
    setAirlineCode("");
    setAirlineName("");
  };

  // Lookup flight route when flight number changes
  const doFlightLookup = async (num: string) => {
    if (!airlineCode || num.length < 1) return;
    const fullNum = `${airlineCode}${num}`;
    setLookupLoading(true);
    setLookupDone(false);
    try {
      const route = await lookupFlightRoute(fullNum);
      if (route) {
        setDepartureCode(route.origin.iata);
        setArrivalCode(route.destination.iata);
        setLookupDone(true);
      }
    } finally {
      setLookupLoading(false);
    }
  };

  const handleFlightNumChange = (raw: string) => {
    // Allow only digits
    const cleaned = raw.replace(/[^0-9]/g, "").slice(0, 5);
    setFlightNum(cleaned);
    // Reset airports when flight number changes
    setDepartureCode("");
    setArrivalCode("");
    setLookupDone(false);
    // Debounce the API lookup — fire after 600ms of no typing
    if (lookupTimerRef.current) clearTimeout(lookupTimerRef.current);
    if (cleaned.length >= 1) {
      lookupTimerRef.current = setTimeout(() => doFlightLookup(cleaned), 600);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete || !date || !depAirport || !arrAirport || !distance || !duration) return;

    const dateStr = format(date, "yyyy-MM-dd");

    onSubmit({
      type: "flight",
      airline: airlineName,
      flightNumber: fullFlightNumber,
      departureCity: depAirport.city,
      departureCode,
      departureCountry: depAirport.country,
      arrivalCity: arrAirport.city,
      arrivalCode,
      arrivalCountry: arrAirport.country,
      departureDate: dateStr,
      arrivalDate: dateStr,
      departureTime: "00:00",
      arrivalTime: "00:00",
      duration,
      distance,
      status: "completed",
      notes,
    });
  };

  const fmtDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 1. Airline */}
      <AirlineInput
        value={airlineInput}
        selectedCode={airlineCode}
        selectedName={airlineName}
        onSelect={handleAirlineSelect}
        onClear={handleAirlineClear}
      />

      {/* 2. Flight Number (appears after airline selected) */}
      {showFlightNum && (
        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
          <Label className="text-xs font-medium text-muted-foreground">Flight Number</Label>
          <div className="flex items-center gap-2">
            <div className="flex items-center h-12 px-3 rounded-xl bg-muted/60 border-2 border-transparent shrink-0">
              <span className="font-mono font-bold text-sm text-foreground">{airlineCode}</span>
            </div>
            <Input
              ref={flightNumRef}
              value={flightNum}
              onChange={(e) => handleFlightNumChange(e.target.value)}
              placeholder="e.g. 456"
              className={cn(
                "font-mono text-lg tracking-wider h-12 rounded-xl border-2 transition-colors flex-1",
                flightNum.length >= 1 ? "border-sky-500/40 bg-sky-50/50 dark:bg-sky-950/20" : "border-border"
              )}
              inputMode="numeric"
            />
          </div>
          {fullFlightNumber && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Flight</span>
              <span className="font-mono font-bold text-foreground">{fullFlightNumber}</span>
              <span>·</span>
              <span>{airlineName}</span>
            </div>
          )}
        </div>
      )}

      {/* 3. Loading indicator while looking up flight */}
      {lookupLoading && showFlightNum && flightNum.length >= 1 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground animate-in fade-in duration-200">
          <Loader2 className="w-4 h-4 animate-spin text-sky-500" />
          <span>Looking up flight {airlineCode}{flightNum}...</span>
        </div>
      )}

      {/* 3. From / To airports (appears after flight number entered) */}
      {showAirports && !lookupLoading && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Show auto-populated route or manual entry */}
          {lookupDone && depAirport && arrAirport ? (
            <div className="rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border-2 border-emerald-500/30 px-4 py-3 space-y-1 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Route found</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">
                  <span className="font-mono font-bold">{departureCode}</span>
                  <span className="mx-1 text-muted-foreground">{depAirport.city}</span>
                  <span className="mx-2 text-muted-foreground">→</span>
                  <span className="font-mono font-bold">{arrivalCode}</span>
                  <span className="mx-1 text-muted-foreground">{arrAirport.city}</span>
                </div>
              </div>
              {distance && duration && (
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="font-mono">{distance.toLocaleString()} mi</span>
                  <span>·</span>
                  <span className="font-mono">{fmtDuration(duration)}</span>
                </div>
              )}
              <button
                type="button"
                className="text-[11px] text-muted-foreground underline hover:text-foreground mt-1"
                onClick={() => { setLookupDone(false); setDepartureCode(""); setArrivalCode(""); }}
              >
                Edit airports manually
              </button>
            </div>
          ) : (
            <>
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

              {/* Route summary auto-populates when both airports set */}
              {distance && duration && depAirport && arrAirport && (
                <div className="mt-3 rounded-xl bg-muted/50 border border-border/60 px-4 py-3 flex items-center justify-between animate-in fade-in duration-200">
                  <div className="text-sm font-medium">
                    {depAirport.city}
                    <span className="mx-2 text-muted-foreground">→</span>
                    {arrAirport.city}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="font-mono">{distance.toLocaleString()} mi</span>
                    <span>·</span>
                    <span className="font-mono">{fmtDuration(duration)}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 4. Date (appears after airports filled) */}
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
            placeholder="Seat, terminal, layover..."
            className="rounded-xl h-10"
          />
        </div>
      )}

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

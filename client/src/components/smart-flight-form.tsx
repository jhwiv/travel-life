import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { CalendarIcon, Plane, Loader2, CheckCircle2, ChevronRight, ChevronLeft } from "lucide-react";
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

/* ─── Step indicator ─── */
function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-6">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;
        return (
          <div key={step} className="flex items-center gap-2">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                isActive && "bg-teal-500 text-white shadow-lg shadow-teal-500/30",
                isCompleted && "bg-teal-500/20 text-teal-300",
                !isActive && !isCompleted && "bg-white/5 text-white/30"
              )}
            >
              {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step}
            </div>
            {i < totalSteps - 1 && (
              <div className={cn(
                "w-8 h-0.5 rounded-full transition-all duration-300",
                step < currentStep ? "bg-teal-500/40" : "bg-white/10"
              )} />
            )}
          </div>
        );
      })}
      <span className="text-[10px] text-white/30 ml-2 uppercase tracking-wider">
        Step {currentStep} of {totalSteps}
      </span>
    </div>
  );
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
      <Label className="text-xs font-medium text-white/50">Airline</Label>
      <div className="relative">
        <Plane className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
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
            "pl-10 text-base h-12 rounded-xl border-2 transition-colors bg-[#1E293B] text-white placeholder:text-white/20",
            selectedCode ? "border-teal-500/40" : "border-white/10 focus:border-teal-500/50"
          )}
          autoFocus
        />
        {selectedCode && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            <span className="text-[10px] font-mono font-bold text-teal-300 bg-teal-500/20 px-1.5 py-0.5 rounded">{selectedCode}</span>
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
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
              onClick={() => selectAirline(match)}
            >
              <span className="font-mono font-bold text-xs text-white/40 w-7">{match.code}</span>
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
      <Label className="text-xs font-medium text-white/50">{label}</Label>
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
            "text-center font-mono text-lg tracking-widest h-12 rounded-xl border-2 transition-colors bg-[#1E293B] text-white placeholder:text-white/20",
            airportInfo ? "border-teal-500/40" : "border-white/10 focus:border-teal-500/50"
          )}
          maxLength={3}
        />
        {airportInfo && (
          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-400" />
        )}
      </div>
      {airportInfo && (
        <div className="text-[11px] text-white/40 leading-tight">
          <span className="font-medium text-white/70">{airportInfo.city}</span>
          <span className="mx-1">·</span>
          <span>{airportInfo.country}</span>
        </div>
      )}
      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 top-full mt-1 w-full bg-[#1E293B] border border-white/10 rounded-xl shadow-lg overflow-hidden"
        >
          {suggestions.map(([code, info]) => (
            <button
              key={code}
              type="button"
              className="w-full px-3 py-2 text-left hover:bg-white/5 flex items-center gap-2 text-sm transition-colors text-white/80"
              onClick={() => selectAirport(code)}
            >
              <span className="font-mono font-bold text-xs w-8">{code}</span>
              <span className="truncate text-white/40">
                {info.city}, {info.country}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main form: 3-step wizard ─── */
export function SmartFlightForm({ onSubmit, isPending }: SmartFlightFormProps) {
  const [step, setStep] = useState(1);
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

  // Extra fields for step 3
  const [manualFlightNumber, setManualFlightNumber] = useState("");
  const [manualDistance, setManualDistance] = useState("");
  const [manualDuration, setManualDuration] = useState("");
  const [manualCountryCode, setManualCountryCode] = useState("");

  const flightNumRef = useRef<HTMLInputElement>(null);
  const lookupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derived
  const depAirport = AIRPORTS[departureCode] || null;
  const arrAirport = AIRPORTS[arrivalCode] || null;
  const distance = departureCode && arrivalCode ? calculateDistanceMiles(departureCode, arrivalCode) : null;
  const duration = distance ? estimateFlightDuration(distance) : null;

  // Full flight number = airline code + number
  const fullFlightNumber = airlineCode && flightNum ? `${airlineCode}${flightNum}` : "";

  // Step validation
  const step1Valid = !!airlineCode && !!date;
  const step2Valid = !!depAirport && !!arrAirport;
  const step3Valid = true; // all optional overrides

  const handleAirlineSelect = (code: string, name: string) => {
    setAirlineCode(code);
    setAirlineName(name);
    setAirlineInput(name);
    setTimeout(() => flightNumRef.current?.focus(), 100);
  };

  const handleAirlineClear = () => {
    setAirlineCode("");
    setAirlineName("");
  };

  // Lookup flight route when flight number changes
  const doFlightLookup = async (num: string) => {
    if (!airlineCode || num.length < 1) return;
    setLookupLoading(true);
    setLookupDone(false);
    try {
      const route = await lookupFlightRoute(`${airlineCode}${num}`);
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
    const cleaned = raw.replace(/[^0-9]/g, "").slice(0, 5);
    setFlightNum(cleaned);
    setDepartureCode("");
    setArrivalCode("");
    setLookupDone(false);
    if (lookupTimerRef.current) clearTimeout(lookupTimerRef.current);
    if (cleaned.length >= 1) {
      lookupTimerRef.current = setTimeout(() => doFlightLookup(cleaned), 600);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !depAirport || !arrAirport) return;

    const dateStr = format(date, "yyyy-MM-dd");
    const finalDistance = manualDistance ? parseInt(manualDistance) : (distance || 0);
    const finalDuration = manualDuration ? parseDuration(manualDuration) : (duration || 0);
    const finalFlightNum = manualFlightNumber || fullFlightNumber;
    const finalCountry = manualCountryCode || arrAirport.country;

    onSubmit({
      type: "flight",
      airline: airlineName,
      flightNumber: finalFlightNum,
      departureCity: depAirport.city,
      departureCode,
      departureCountry: depAirport.country,
      arrivalCity: arrAirport.city,
      arrivalCode,
      arrivalCountry: finalCountry,
      departureDate: dateStr,
      arrivalDate: dateStr,
      departureTime: "00:00",
      arrivalTime: "00:00",
      duration: finalDuration,
      distance: finalDistance,
      status: "completed",
      notes,
    });
  };

  const fmtDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const parseDuration = (str: string): number => {
    const match = str.match(/(\d+)\s*h\s*(\d+)\s*m?/i);
    if (match) return parseInt(match[1]) * 60 + parseInt(match[2]);
    const hoursOnly = str.match(/(\d+)\s*h/i);
    if (hoursOnly) return parseInt(hoursOnly[1]) * 60;
    const minsOnly = str.match(/(\d+)\s*m/i);
    if (minsOnly) return parseInt(minsOnly[1]);
    return parseInt(str) || 0;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <StepIndicator currentStep={step} totalSteps={3} />

      {/* ─── STEP 1: Airline & Date ─── */}
      {step === 1 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <AirlineInput
            value={airlineInput}
            selectedCode={airlineCode}
            selectedName={airlineName}
            onSelect={handleAirlineSelect}
            onClear={handleAirlineClear}
          />

          <div className="space-y-1.5">
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

          <Button
            type="button"
            disabled={!step1Valid}
            onClick={() => setStep(2)}
            className="w-full h-12 rounded-xl text-base font-bold"
            style={{
              background: step1Valid ? "linear-gradient(135deg, #F59E0B, #D97706)" : undefined,
              color: step1Valid ? "#0F172A" : undefined,
            }}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}

      {/* ─── STEP 2: Route ─── */}
      {step === 2 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          {/* Flight number for auto-lookup */}
          {airlineCode && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-white/50">Flight Number (optional, for route lookup)</Label>
              <div className="flex items-center gap-2">
                <div className="flex items-center h-12 px-3 rounded-xl bg-white/5 border-2 border-transparent shrink-0">
                  <span className="font-mono font-bold text-sm text-white/70">{airlineCode}</span>
                </div>
                <Input
                  ref={flightNumRef}
                  value={flightNum}
                  onChange={(e) => handleFlightNumChange(e.target.value)}
                  placeholder="e.g. 456"
                  className={cn(
                    "font-mono text-lg tracking-wider h-12 rounded-xl border-2 transition-colors flex-1 bg-[#1E293B] text-white placeholder:text-white/20",
                    flightNum.length >= 1 ? "border-teal-500/40" : "border-white/10 focus:border-teal-500/50"
                  )}
                  inputMode="numeric"
                />
              </div>
            </div>
          )}

          {lookupLoading && (
            <div className="flex items-center gap-2 text-sm text-white/40 animate-in fade-in duration-200">
              <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
              <span>Looking up flight {airlineCode}{flightNum}...</span>
            </div>
          )}

          {lookupDone && depAirport && arrAirport ? (
            <div className="rounded-xl bg-teal-500/10 border-2 border-teal-500/20 px-4 py-3 space-y-1">
              <div className="flex items-center gap-2 text-xs text-teal-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Route found</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-white">
                  <span className="font-mono font-bold">{departureCode}</span>
                  <span className="mx-1 text-white/40">{depAirport.city}</span>
                  <span className="mx-2 text-white/40">&rarr;</span>
                  <span className="font-mono font-bold">{arrivalCode}</span>
                  <span className="mx-1 text-white/40">{arrAirport.city}</span>
                </div>
              </div>
              {distance && duration && (
                <div className="flex items-center gap-3 text-xs text-white/40">
                  <span className="font-mono">{distance.toLocaleString()} mi</span>
                  <span>&middot;</span>
                  <span className="font-mono">{fmtDuration(duration)}</span>
                </div>
              )}
              <button
                type="button"
                className="text-[11px] text-white/30 underline hover:text-white/60 mt-1"
                onClick={() => { setLookupDone(false); setDepartureCode(""); setArrivalCode(""); }}
              >
                Edit airports manually
              </button>
            </div>
          ) : !lookupLoading && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <AirportCodeInput
                  label="Origin (IATA)"
                  value={departureCode}
                  onChange={setDepartureCode}
                  airportInfo={depAirport}
                  placeholder="e.g. EWR"
                />
                <AirportCodeInput
                  label="Destination (IATA)"
                  value={arrivalCode}
                  onChange={setArrivalCode}
                  airportInfo={arrAirport}
                  placeholder="e.g. LHR"
                />
              </div>

              {distance && duration && depAirport && arrAirport && (
                <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 flex items-center justify-between animate-in fade-in duration-200">
                  <div className="text-sm font-medium text-white">
                    {depAirport.city}
                    <span className="mx-2 text-white/30">&rarr;</span>
                    {arrAirport.city}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-white/40">
                    <span className="font-mono">{distance.toLocaleString()} mi</span>
                    <span>&middot;</span>
                    <span className="font-mono">{fmtDuration(duration)}</span>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep(1)}
              className="flex-1 h-12 rounded-xl text-base text-white/50 hover:text-white hover:bg-white/5 border border-white/10"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              type="button"
              disabled={!step2Valid}
              onClick={() => setStep(3)}
              className="flex-1 h-12 rounded-xl text-base font-bold"
              style={{
                background: step2Valid ? "linear-gradient(135deg, #F59E0B, #D97706)" : undefined,
                color: step2Valid ? "#0F172A" : undefined,
              }}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* ─── STEP 3: Flight Details ─── */}
      {step === 3 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          {/* Route summary */}
          {depAirport && arrAirport && (
            <div className="rounded-xl bg-teal-500/5 border border-teal-500/15 px-4 py-3 text-center">
              <p className="text-sm text-white/70">
                <span className="font-mono font-bold text-teal-300">{departureCode}</span>
                <span className="mx-2 text-white/30">&rarr;</span>
                <span className="font-mono font-bold text-teal-300">{arrivalCode}</span>
              </p>
              <p className="text-[11px] text-white/30 mt-0.5">
                {depAirport.city} &rarr; {arrAirport.city}
                {distance && ` · ${distance.toLocaleString()} mi`}
                {duration && ` · ${fmtDuration(duration)}`}
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-white/50">Flight Number (e.g. UA 2631)</Label>
            <Input
              value={manualFlightNumber || fullFlightNumber}
              onChange={(e) => setManualFlightNumber(e.target.value)}
              placeholder={fullFlightNumber || "e.g. UA 2631"}
              className="h-12 rounded-xl border-2 border-white/10 focus:border-teal-500/50 bg-[#1E293B] text-white placeholder:text-white/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-white/50">Distance (miles)</Label>
              <Input
                value={manualDistance || (distance ? String(distance) : "")}
                onChange={(e) => setManualDistance(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder={distance ? String(distance) : "e.g. 3459"}
                className="h-12 rounded-xl border-2 border-white/10 focus:border-teal-500/50 bg-[#1E293B] text-white placeholder:text-white/20"
                inputMode="numeric"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-white/50">Duration (e.g. 2h 45m)</Label>
              <Input
                value={manualDuration || (duration ? fmtDuration(duration) : "")}
                onChange={(e) => setManualDuration(e.target.value)}
                placeholder={duration ? fmtDuration(duration) : "e.g. 2h 45m"}
                className="h-12 rounded-xl border-2 border-white/10 focus:border-teal-500/50 bg-[#1E293B] text-white placeholder:text-white/20"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-white/50">Destination Country Code (e.g. AW)</Label>
            <Input
              value={manualCountryCode || (arrAirport ? "" : "")}
              onChange={(e) => setManualCountryCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2))}
              placeholder={arrAirport ? `Auto: ${arrAirport.country}` : "e.g. AW"}
              className="h-12 rounded-xl border-2 border-white/10 focus:border-teal-500/50 bg-[#1E293B] text-white placeholder:text-white/20 font-mono"
              maxLength={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-white/50">Notes (optional)</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Seat, terminal, layover..."
              className="h-10 rounded-xl border-2 border-white/10 focus:border-teal-500/50 bg-[#1E293B] text-white placeholder:text-white/20"
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep(2)}
              className="h-12 rounded-xl text-base text-white/50 hover:text-white hover:bg-white/5 border border-white/10 px-6"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              type="submit"
              className="flex-1 h-12 rounded-xl text-base font-bold"
              disabled={isPending || !depAirport || !arrAirport}
              style={{
                background: "linear-gradient(135deg, #F59E0B, #D97706)",
                color: "#0F172A",
              }}
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
          </div>
        </div>
      )}
    </form>
  );
}

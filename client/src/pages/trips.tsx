import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plane, TrainFront, Plus, Trash2, Search, Filter, MapPin, CheckSquare, X } from "lucide-react";
import type { Trip } from "@shared/schema";
import { SmartFlightForm, type FlightFormData } from "@/components/smart-flight-form";
import { SmartTrainForm, type TrainFormData } from "@/components/smart-train-form";
import { getTrips, addTrip, deleteTrips } from "@/lib/static-data";

const airlineColors: Record<string, string> = {
  "United Airlines": "#005DAA",
  "SAS": "#000066",
  "Delta": "#003366",
  "American Airlines": "#0078D2",
  "JetBlue": "#003876",
  "Southwest": "#FF8C00",
  "British Airways": "#2E5090",
  "Lufthansa": "#05164D",
  "Air France": "#002157",
  "KLM": "#00A1DE",
  "Emirates": "#D71920",
  "Qatar Airways": "#5C0632",
  "Singapore Airlines": "#F5A623",
  "Ryanair": "#073590",
  "EasyJet": "#FF6600",
};

function getAirlineColor(airline: string | null | undefined): string {
  if (!airline) return "#0D9488";
  return airlineColors[airline] || "#0D9488";
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export default function Trips() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"flight" | "train">("flight");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>(() => {
    const hash = window.location.hash;
    const qIdx = hash.indexOf("?");
    if (qIdx !== -1) {
      const params = new URLSearchParams(hash.substring(qIdx));
      const f = params.get("filter");
      if (f === "flight" || f === "train") return f;
    }
    return "all";
  });

  const [version, setVersion] = useState(0);
  const trips = getTrips() as unknown as Trip[];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = version;

  // Selection mode state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleAddFlight = useCallback((data: FlightFormData) => {
    addTrip(data);
    setVersion((v) => v + 1);
    setDialogOpen(false);
    toast({ title: "Flight added", description: "Your flight has been recorded." });
  }, [toast]);

  const handleAddTrain = useCallback((data: TrainFormData) => {
    addTrip(data);
    setVersion((v) => v + 1);
    setDialogOpen(false);
    toast({ title: "Train ride added", description: "Your trip has been recorded." });
  }, [toast]);

  const handleDeleteSelected = useCallback(() => {
    const count = selectedIds.size;
    deleteTrips(Array.from(selectedIds));
    setVersion((v) => v + 1);
    setSelectedIds(new Set());
    setSelectionMode(false);
    setDeleteDialogOpen(false);
    toast({ title: `${count} trip${count !== 1 ? "s" : ""} deleted` });
  }, [selectedIds, toast]);

  const toggleSelection = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  const filteredTrips = trips.filter((trip) => {
    const matchesSearch =
      searchQuery === "" ||
      trip.departureCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.arrivalCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.departureCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.arrivalCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (trip.airline || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (trip.trainOperator || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === "all" || trip.type === filterType;
    return matchesSearch && matchesType;
  });

  const flightCount = trips.filter((t) => t.type === "flight").length;
  const trainCount = trips.filter((t) => t.type === "train").length;

  const allFilteredSelected = filteredTrips.length > 0 && filteredTrips.every((t) => selectedIds.has(t.id));

  const toggleSelectAll = useCallback(() => {
    if (allFilteredSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTrips.map((t) => t.id)));
    }
  }, [allFilteredSelected, filteredTrips]);

  return (
    <div className="min-h-screen pb-12 animate-page-enter">
      {/* Gradient header — teal themed */}
      <div className="relative overflow-hidden px-5 pl-14 lg:pl-8 pr-5 lg:pr-8 pt-5 pb-10" style={{ background: "linear-gradient(135deg, #0F172A 0%, #0D2137 50%, #1E3A5F 100%)" }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full" style={{ background: "radial-gradient(circle, rgba(13,148,136,0.1) 0%, transparent 70%)" }} />
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" aria-hidden>
            <defs>
              <pattern id="trips-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#trips-dots)" />
          </svg>
        </div>
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-3 mb-2">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-white font-display">Trips</h2>
            <p className="text-sm text-white/40 mt-1 truncate">
              {trips.length} total · {flightCount} flights · {trainCount} trains
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {selectionMode ? (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1.5 rounded-xl px-4 text-white/70 hover:text-white hover:bg-white/10"
                  onClick={exitSelectionMode}
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5 rounded-xl px-4 shadow-lg bg-red-600 hover:bg-red-700 text-white border-none"
                  disabled={selectedIds.size === 0}
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1.5 rounded-xl px-4 text-white/50 hover:text-white hover:bg-white/10"
                  onClick={() => setSelectionMode(true)}
                >
                  <CheckSquare className="w-4 h-4" />
                  Select
                </Button>
                <Dialog open={dialogOpen && dialogMode === "flight"} onOpenChange={(open) => { setDialogOpen(open); if (open) setDialogMode("flight"); }}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-flight" size="sm" className="gap-1.5 rounded-xl px-4 shadow-lg" style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)", border: "none", color: "#0F172A" }}>
                      <Plus className="w-4 h-4" />
                      <Plane className="w-4 h-4" />
                      Flight
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-white">
                        <Plane className="w-5 h-5 text-teal-400" />
                        Add Flight
                      </DialogTitle>
                    </DialogHeader>
                    <SmartFlightForm onSubmit={handleAddFlight} isPending={false} />
                  </DialogContent>
                </Dialog>
                <Dialog open={dialogOpen && dialogMode === "train"} onOpenChange={(open) => { setDialogOpen(open); if (open) setDialogMode("train"); }}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-train" size="sm" className="gap-1.5 rounded-xl px-4 shadow-lg" style={{ background: "linear-gradient(135deg, #0D9488, #1E3A5F)", border: "none" }}>
                      <Plus className="w-4 h-4" />
                      <TrainFront className="w-4 h-4" />
                      Train
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-white">
                        <TrainFront className="w-5 h-5 text-amber-400" />
                        Add Train Ride
                      </DialogTitle>
                    </DialogHeader>
                    <SmartTrainForm onSubmit={handleAddTrain} isPending={false} />
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 pl-14 lg:pl-8 pr-5 lg:pr-8 -mt-4 space-y-5">
        {/* Filters */}
        <div className="flex items-center gap-3">
          {selectionMode && (
            <Checkbox
              checked={allFilteredSelected}
              onCheckedChange={toggleSelectAll}
              className="h-5 w-5 shrink-0 border-white/30 data-[state=checked]:bg-teal-500 data-[state=checked]:border-teal-500"
            />
          )}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/30" />
            <Input
              data-testid="input-search"
              placeholder="Search trips..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-xl bg-white/5 border-teal-500/10 text-white placeholder:text-white/20"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32 rounded-xl bg-white/5 border-teal-500/10 text-white/70" data-testid="select-filter-type">
              <Filter className="w-4 h-4 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="flight">Flights</SelectItem>
              <SelectItem value="train">Trains</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Trip List */}
        {filteredTrips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <MapPin className="w-10 h-10 text-teal-400/20 mb-3" />
            <p className="text-sm font-medium text-white mb-1">
              {trips.length === 0 ? "No trips yet" : "No results"}
            </p>
            <p className="text-xs text-white/30">
              {trips.length === 0
                ? "Click a button above to record your first journey."
                : "Try a different search term."}
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {filteredTrips.map((trip, idx) => (
              <div
                key={trip.id}
                className={`glass-card !rounded-2xl !p-4 card-hover ${selectionMode && selectedIds.has(trip.id) ? "ring-1 ring-teal-400/40" : ""}`}
                style={{
                  background: idx % 2 === 0
                    ? "rgba(15,23,42,0.6)"
                    : "rgba(15,23,42,0.4)",
                }}
                data-testid={`trip-card-${trip.id}`}
                onClick={selectionMode ? () => toggleSelection(trip.id) : undefined}
              >
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {selectionMode && (
                      <Checkbox
                        checked={selectedIds.has(trip.id)}
                        onCheckedChange={() => toggleSelection(trip.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-5 w-5 shrink-0 border-white/30 data-[state=checked]:bg-teal-500 data-[state=checked]:border-teal-500"
                      />
                    )}
                    {/* Airline color badge */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0 relative" style={{
                      background: trip.type === "flight"
                        ? `${getAirlineColor(trip.airline)}22`
                        : "rgba(245,158,11,0.12)",
                    }}>
                      {trip.type === "flight" ? (
                        <>
                          <Plane className="w-[18px] h-[18px]" style={{ color: getAirlineColor(trip.airline) }} />
                          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[#0F172A]" style={{ background: getAirlineColor(trip.airline) }} />
                        </>
                      ) : (
                        <TrainFront className="w-[18px] h-[18px] text-amber-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white font-display shrink-0">{trip.departureCode}</span>
                        {/* Route arc visualization */}
                        <svg width="32" height="12" viewBox="0 0 32 12" className="text-teal-400/40 shrink-0">
                          <path d="M2,10 Q16,0 30,10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          <circle cx="2" cy="10" r="1.5" fill="currentColor" />
                          <circle cx="30" cy="10" r="1.5" fill="currentColor" />
                        </svg>
                        <span className="text-sm font-bold text-white font-display shrink-0">{trip.arrivalCode}</span>
                      </div>
                      <p className="text-[11px] text-white/25 mt-0.5 truncate">
                        {trip.departureCity} → {trip.arrivalCity}
                        {" · "}
                        {trip.type === "flight"
                          ? [trip.airline, trip.flightNumber].filter(Boolean).join(" ")
                          : [trip.trainOperator, trip.trainNumber].filter(Boolean).join(" ")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm tabular-nums font-medium text-white/70 whitespace-nowrap">
                        {new Date(trip.departureDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-[11px] text-white/25 tabular-nums whitespace-nowrap">
                        {trip.distance
                          ? `${Math.round(trip.distance).toLocaleString()} mi`
                          : "\u2014"}{" "}
                        · {formatDuration(trip.duration)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} trip{selectedIds.size !== 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the selected trip{selectedIds.size !== 1 ? "s" : ""} from your list. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelected}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete {selectedIds.size} trip{selectedIds.size !== 1 ? "s" : ""}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

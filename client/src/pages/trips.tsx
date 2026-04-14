import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plane, TrainFront, Plus, Trash2, Search, Filter, MapPin } from "lucide-react";
import type { Trip } from "@shared/schema";
import { SmartFlightForm, type FlightFormData } from "@/components/smart-flight-form";
import { SmartTrainForm, type TrainFormData } from "@/components/smart-train-form";
import { getTrips, addTrip, deleteTrip as removeTrip, isBaseTripId } from "@/lib/static-data";


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

  // Force re-render after mutations by tracking a version counter
  const [version, setVersion] = useState(0);
  const trips = getTrips() as unknown as Trip[];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = version; // ensure version is in the render dependency

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

  const handleDelete = useCallback((id: number) => {
    removeTrip(id);
    setVersion((v) => v + 1);
    toast({ title: "Trip deleted" });
  }, [toast]);

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

  return (
    <div className="min-h-screen pb-12">
      {/* Gradient header */}
      <div className="relative overflow-hidden px-5 pl-14 lg:pl-8 pr-5 lg:pr-8 pt-5 pb-8" style={{ background: "linear-gradient(135deg, #1a1040 0%, #2d1b69 50%, #1a2744 100%)" }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)" }} />
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" aria-hidden>
            <defs>
              <pattern id="trips-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#trips-dots)" />
          </svg>
        </div>
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">Trips</h2>
            <p className="text-sm text-white/40 mt-1">
              {trips.length} total · {flightCount} flights · {trainCount} trains
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={dialogOpen && dialogMode === "flight"} onOpenChange={(open) => { setDialogOpen(open); if (open) setDialogMode("flight"); }}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-flight" size="sm" className="gap-1.5 rounded-xl px-4 shadow-lg" style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)", border: "none" }}>
                  <Plus className="w-4 h-4" />
                  <Plane className="w-4 h-4" />
                  Flight
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Plane className="w-5 h-5 text-purple-400" />
                    Add Flight
                  </DialogTitle>
                </DialogHeader>
                <SmartFlightForm
                  onSubmit={handleAddFlight}
                  isPending={false}
                />
              </DialogContent>
            </Dialog>
            <Dialog open={dialogOpen && dialogMode === "train"} onOpenChange={(open) => { setDialogOpen(open); if (open) setDialogMode("train"); }}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-train" size="sm" className="gap-1.5 rounded-xl px-4 shadow-lg" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", border: "none" }}>
                  <Plus className="w-4 h-4" />
                  <TrainFront className="w-4 h-4" />
                  Train
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <TrainFront className="w-5 h-5 text-amber-500" />
                    Add Train Ride
                  </DialogTitle>
                </DialogHeader>
                <SmartTrainForm
                  onSubmit={handleAddTrain}
                  isPending={false}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="px-5 pl-14 lg:pl-8 pr-5 lg:pr-8 -mt-4 space-y-5">
        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/30" />
            <Input
              data-testid="input-search"
              placeholder="Search trips..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/20"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32 rounded-xl bg-white/5 border-white/10 text-white/70" data-testid="select-filter-type">
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
            <MapPin className="w-10 h-10 text-purple-400/20 mb-3" />
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
          <div className="space-y-2">
            {filteredTrips.map((trip) => (
              <div
                key={trip.id}
                className="rounded-2xl p-4 hover:bg-white/[0.04] transition-all"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                data-testid={`trip-card-${trip.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
                      style={{
                        background: trip.type === "flight" ? "rgba(139,92,246,0.12)" : "rgba(251,191,36,0.12)",
                      }}
                    >
                      {trip.type === "flight" ? (
                        <Plane className="w-[18px] h-[18px] text-purple-400" />
                      ) : (
                        <TrainFront className="w-[18px] h-[18px] text-amber-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{trip.departureCode}</span>
                        <span className="text-xs text-white/25">→</span>
                        <span className="text-sm font-bold text-white">{trip.arrivalCode}</span>
                        <Badge
                          variant={
                            trip.status === "completed"
                              ? "secondary"
                              : trip.status === "upcoming"
                              ? "default"
                              : "destructive"
                          }
                          className="text-[9px] px-1.5 py-0 rounded-md bg-white/5 text-white/40 border-white/10"
                        >
                          {trip.status}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-white/25 mt-0.5">
                        {trip.departureCity} → {trip.arrivalCity}
                        {" · "}
                        {trip.type === "flight"
                          ? [trip.airline, trip.flightNumber].filter(Boolean).join(" ")
                          : [trip.trainOperator, trip.trainNumber].filter(Boolean).join(" ")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm tabular-nums font-medium text-white/70">
                        {new Date(trip.departureDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-[11px] text-white/25 tabular-nums">
                        {trip.distance
                          ? `${Math.round(trip.distance).toLocaleString()} mi`
                          : "—"}{" "}
                        · {formatDuration(trip.duration)}
                      </p>
                    </div>
                    {!isBaseTripId(trip.id) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                          data-testid={`button-delete-${trip.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Trip</AlertDialogTitle>
                          <AlertDialogDescription>
                            Remove {trip.departureCode} → {trip.arrivalCode} from{" "}
                            {new Date(trip.departureDate).toLocaleDateString()}?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(trip.id)}
                            className="bg-destructive text-destructive-foreground"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

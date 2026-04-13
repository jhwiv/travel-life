import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import type { Trip, InsertTrip } from "@shared/schema";
import { StationAutocomplete } from "@/components/station-autocomplete";
import { SmartFlightForm, type FlightFormData } from "@/components/smart-flight-form";
import type { TrainStation } from "@/lib/european-stations";

const emptyTrainForm = {
  type: "train" as const,
  trainOperator: "",
  trainNumber: "",
  trainClass: "",
  departureCity: "",
  departureCode: "",
  departureCountry: "",
  arrivalCity: "",
  arrivalCode: "",
  arrivalCountry: "",
  departureDate: "",
  arrivalDate: "",
  departureTime: "",
  arrivalTime: "",
  duration: 0,
  distance: 0,
  status: "completed",
  notes: "",
};

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
  const [trainForm, setTrainForm] = useState({ ...emptyTrainForm });
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const { data: trips = [], isLoading } = useQuery<Trip[]>({
    queryKey: ["/api/trips"],
  });

  const createFlightMutation = useMutation({
    mutationFn: async (data: FlightFormData) => {
      const res = await apiRequest("POST", "/api/trips", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      setDialogOpen(false);
      toast({ title: "Flight added", description: "Your flight has been recorded." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createTrainMutation = useMutation({
    mutationFn: async (data: typeof emptyTrainForm) => {
      const res = await apiRequest("POST", "/api/trips", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      setDialogOpen(false);
      setTrainForm({ ...emptyTrainForm });
      toast({ title: "Train ride added", description: "Your trip has been recorded." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/trips/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({ title: "Trip deleted" });
    },
  });

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

  const updateTrainField = (field: string, value: any) => {
    setTrainForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleTrainSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTrainMutation.mutate(trainForm);
  };

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
                  onSubmit={(data) => createFlightMutation.mutate(data)}
                  isPending={createFlightMutation.isPending}
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
              <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <TrainFront className="w-5 h-5 text-amber-500" />
                    Add Train Ride
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleTrainSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Operator</Label>
                      <Input data-testid="input-train-operator" placeholder="e.g. Eurostar" value={trainForm.trainOperator || ""} onChange={(e) => updateTrainField("trainOperator", e.target.value)} />
                    </div>
                    <div>
                      <Label>Train Number</Label>
                      <Input data-testid="input-train-number" placeholder="e.g. 9024" value={trainForm.trainNumber || ""} onChange={(e) => updateTrainField("trainNumber", e.target.value)} />
                    </div>
                    <div className="col-span-2">
                      <Label>Class</Label>
                      <Select value={trainForm.trainClass || ""} onValueChange={(v) => updateTrainField("trainClass", v)}>
                        <SelectTrigger data-testid="select-train-class"><SelectValue placeholder="Select class" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="first">First Class</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="second">Second Class</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Departure</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Input data-testid="input-departure-city" placeholder="City" value={trainForm.departureCity} onChange={(e) => updateTrainField("departureCity", e.target.value)} required />
                      <StationAutocomplete placeholder="Station" value={trainForm.departureCode} onChange={(v) => updateTrainField("departureCode", v)} onStationSelect={(s: TrainStation) => { updateTrainField("departureCode", s.code); if (!trainForm.departureCity) updateTrainField("departureCity", s.city); if (!trainForm.departureCountry) updateTrainField("departureCountry", s.country); }} required />
                      <Input data-testid="input-departure-country" placeholder="Country" value={trainForm.departureCountry} onChange={(e) => updateTrainField("departureCountry", e.target.value)} required />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input data-testid="input-departure-date" type="date" value={trainForm.departureDate} onChange={(e) => updateTrainField("departureDate", e.target.value)} required />
                      <Input data-testid="input-departure-time" type="time" value={trainForm.departureTime} onChange={(e) => updateTrainField("departureTime", e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Arrival</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Input data-testid="input-arrival-city" placeholder="City" value={trainForm.arrivalCity} onChange={(e) => updateTrainField("arrivalCity", e.target.value)} required />
                      <StationAutocomplete placeholder="Station" value={trainForm.arrivalCode} onChange={(v) => updateTrainField("arrivalCode", v)} onStationSelect={(s: TrainStation) => { updateTrainField("arrivalCode", s.code); if (!trainForm.arrivalCity) updateTrainField("arrivalCity", s.city); if (!trainForm.arrivalCountry) updateTrainField("arrivalCountry", s.country); }} required />
                      <Input data-testid="input-arrival-country" placeholder="Country" value={trainForm.arrivalCountry} onChange={(e) => updateTrainField("arrivalCountry", e.target.value)} required />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input data-testid="input-arrival-date" type="date" value={trainForm.arrivalDate} onChange={(e) => updateTrainField("arrivalDate", e.target.value)} required />
                      <Input data-testid="input-arrival-time" type="time" value={trainForm.arrivalTime} onChange={(e) => updateTrainField("arrivalTime", e.target.value)} required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Duration (minutes)</Label>
                      <Input data-testid="input-duration" type="number" min="1" value={trainForm.duration || ""} onChange={(e) => updateTrainField("duration", parseInt(e.target.value) || 0)} required />
                    </div>
                    <div>
                      <Label>Distance (miles)</Label>
                      <Input data-testid="input-distance" type="number" min="0" step="0.1" value={trainForm.distance || ""} onChange={(e) => updateTrainField("distance", parseFloat(e.target.value) || 0)} />
                    </div>
                  </div>
                  <div>
                    <Label>Notes (optional)</Label>
                    <Textarea data-testid="input-notes" placeholder="Any notes about this trip..." value={trainForm.notes || ""} onChange={(e) => updateTrainField("notes", e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full rounded-xl" disabled={createTrainMutation.isPending}
                    style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", border: "none" }}>
                    {createTrainMutation.isPending ? "Adding..." : "Add Train Ride"}
                  </Button>
                </form>
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
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredTrips.length === 0 ? (
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
                            onClick={() => deleteMutation.mutate(trip.id)}
                            className="bg-destructive text-destructive-foreground"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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

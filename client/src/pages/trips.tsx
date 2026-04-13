import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plane, TrainFront, Plus, Trash2, Search, Filter } from "lucide-react";
import type { Trip, InsertTrip } from "@shared/schema";

const emptyFormData: Omit<InsertTrip, "id"> = {
  type: "flight",
  airline: "",
  flightNumber: "",
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
  const [formData, setFormData] = useState(emptyFormData);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const { data: trips = [], isLoading } = useQuery<Trip[]>({
    queryKey: ["/api/trips"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/trips", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      setDialogOpen(false);
      setFormData(emptyFormData);
      toast({ title: "Trip added", description: "Your trip has been recorded." });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-6 space-y-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold">All Trips</h2>
          <p className="text-sm text-muted-foreground">
            {trips.length} trip{trips.length !== 1 ? "s" : ""} recorded
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-trip" size="sm">
              <Plus className="w-4 h-4 mr-1" /> Add Trip
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Trip</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type */}
              <div>
                <Label>Trip Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => updateField("type", v)}
                >
                  <SelectTrigger data-testid="select-trip-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flight">Flight</SelectItem>
                    <SelectItem value="train">Train</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Flight-specific */}
              {formData.type === "flight" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Airline</Label>
                    <Input
                      data-testid="input-airline"
                      placeholder="e.g. United"
                      value={formData.airline || ""}
                      onChange={(e) => updateField("airline", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Flight Number</Label>
                    <Input
                      data-testid="input-flight-number"
                      placeholder="e.g. UA123"
                      value={formData.flightNumber || ""}
                      onChange={(e) =>
                        updateField("flightNumber", e.target.value)
                      }
                    />
                  </div>
                </div>
              )}

              {/* Train-specific */}
              {formData.type === "train" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Operator</Label>
                    <Input
                      data-testid="input-train-operator"
                      placeholder="e.g. Eurostar"
                      value={formData.trainOperator || ""}
                      onChange={(e) =>
                        updateField("trainOperator", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label>Train Number</Label>
                    <Input
                      data-testid="input-train-number"
                      placeholder="e.g. 9024"
                      value={formData.trainNumber || ""}
                      onChange={(e) =>
                        updateField("trainNumber", e.target.value)
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Class</Label>
                    <Select
                      value={formData.trainClass || ""}
                      onValueChange={(v) => updateField("trainClass", v)}
                    >
                      <SelectTrigger data-testid="select-train-class">
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="first">First Class</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="second">Second Class</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Departure */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Departure
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    data-testid="input-departure-city"
                    placeholder="City"
                    value={formData.departureCity}
                    onChange={(e) =>
                      updateField("departureCity", e.target.value)
                    }
                    required
                  />
                  <Input
                    data-testid="input-departure-code"
                    placeholder={
                      formData.type === "flight" ? "IATA (EWR)" : "Station"
                    }
                    value={formData.departureCode}
                    onChange={(e) =>
                      updateField("departureCode", e.target.value.toUpperCase())
                    }
                    required
                  />
                  <Input
                    data-testid="input-departure-country"
                    placeholder="Country"
                    value={formData.departureCountry}
                    onChange={(e) =>
                      updateField("departureCountry", e.target.value)
                    }
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    data-testid="input-departure-date"
                    type="date"
                    value={formData.departureDate}
                    onChange={(e) =>
                      updateField("departureDate", e.target.value)
                    }
                    required
                  />
                  <Input
                    data-testid="input-departure-time"
                    type="time"
                    value={formData.departureTime}
                    onChange={(e) =>
                      updateField("departureTime", e.target.value)
                    }
                    required
                  />
                </div>
              </div>

              {/* Arrival */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Arrival
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    data-testid="input-arrival-city"
                    placeholder="City"
                    value={formData.arrivalCity}
                    onChange={(e) =>
                      updateField("arrivalCity", e.target.value)
                    }
                    required
                  />
                  <Input
                    data-testid="input-arrival-code"
                    placeholder={
                      formData.type === "flight" ? "IATA (LHR)" : "Station"
                    }
                    value={formData.arrivalCode}
                    onChange={(e) =>
                      updateField("arrivalCode", e.target.value.toUpperCase())
                    }
                    required
                  />
                  <Input
                    data-testid="input-arrival-country"
                    placeholder="Country"
                    value={formData.arrivalCountry}
                    onChange={(e) =>
                      updateField("arrivalCountry", e.target.value)
                    }
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    data-testid="input-arrival-date"
                    type="date"
                    value={formData.arrivalDate}
                    onChange={(e) =>
                      updateField("arrivalDate", e.target.value)
                    }
                    required
                  />
                  <Input
                    data-testid="input-arrival-time"
                    type="time"
                    value={formData.arrivalTime}
                    onChange={(e) =>
                      updateField("arrivalTime", e.target.value)
                    }
                    required
                  />
                </div>
              </div>

              {/* Duration & Distance */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Duration (minutes)</Label>
                  <Input
                    data-testid="input-duration"
                    type="number"
                    min="1"
                    value={formData.duration || ""}
                    onChange={(e) =>
                      updateField("duration", parseInt(e.target.value) || 0)
                    }
                    required
                  />
                </div>
                <div>
                  <Label>Distance (miles)</Label>
                  <Input
                    data-testid="input-distance"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.distance || ""}
                    onChange={(e) =>
                      updateField("distance", parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => updateField("status", v)}
                >
                  <SelectTrigger data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div>
                <Label>Notes (optional)</Label>
                <Textarea
                  data-testid="input-notes"
                  placeholder="Any notes about this trip..."
                  value={formData.notes || ""}
                  onChange={(e) => updateField("notes", e.target.value)}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={createMutation.isPending}
                data-testid="button-submit-trip"
              >
                {createMutation.isPending ? "Adding..." : "Add Trip"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            data-testid="input-search"
            placeholder="Search trips..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-32" data-testid="select-filter-type">
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
            <div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredTrips.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {trips.length === 0
              ? "No trips yet. Click 'Add Trip' to record your first journey."
              : "No trips match your search."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredTrips.map((trip) => (
            <Card
              key={trip.id}
              className="hover:shadow-sm transition-shadow"
              data-testid={`trip-card-${trip.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex items-center justify-center w-9 h-9 rounded-lg ${
                        trip.type === "flight"
                          ? "bg-blue-50 text-blue-600"
                          : "bg-amber-50 text-amber-600"
                      }`}
                    >
                      {trip.type === "flight" ? (
                        <Plane className="w-4 h-4" />
                      ) : (
                        <TrainFront className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">
                          {trip.departureCode}
                        </span>
                        <span className="text-xs text-muted-foreground">→</span>
                        <span className="text-sm font-semibold">
                          {trip.arrivalCode}
                        </span>
                        <Badge
                          variant={
                            trip.status === "completed"
                              ? "secondary"
                              : trip.status === "upcoming"
                              ? "default"
                              : "destructive"
                          }
                          className="text-[10px] px-1.5 py-0"
                        >
                          {trip.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {trip.departureCity} → {trip.arrivalCity}
                        {" · "}
                        {trip.type === "flight"
                          ? [trip.airline, trip.flightNumber]
                              .filter(Boolean)
                              .join(" ")
                          : [trip.trainOperator, trip.trainNumber]
                              .filter(Boolean)
                              .join(" ")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm tabular-nums">
                        {new Date(trip.departureDate).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground tabular-nums">
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
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plane, TrainFront, BarChart3, Image, ArrowRight, Globe, MapPin, Route, Sparkles, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import { StationAutocomplete } from "@/components/station-autocomplete";
import type { TrainStation } from "@/lib/european-stations";
import type { Trip } from "@shared/schema";

interface Analytics {
  totalTrips: number;
  totalFlights: number;
  totalTrains: number;
  totalDistance: number;
  totalDuration: number;
  uniqueCities: number;
  uniqueCountries: number;
  countries: string[];
}

const countryFlags: Record<string, string> = {
  "United States": "🇺🇸", US: "🇺🇸", USA: "🇺🇸",
  "United Kingdom": "🇬🇧", UK: "🇬🇧", England: "🇬🇧",
  France: "🇫🇷", Germany: "🇩🇪", Italy: "🇮🇹", Spain: "🇪🇸",
  Netherlands: "🇳🇱", Belgium: "🇧🇪", Switzerland: "🇨🇭",
  Austria: "🇦🇹", Portugal: "🇵🇹", Ireland: "🇮🇪",
  Sweden: "🇸🇪", Norway: "🇳🇴", Denmark: "🇩🇰", Finland: "🇫🇮",
  Poland: "🇵🇱", "Czech Republic": "🇨🇿", Czechia: "🇨🇿",
  Greece: "🇬🇷", Turkey: "🇹🇷", Japan: "🇯🇵",
  "South Korea": "🇰🇷", China: "🇨🇳", India: "🇮🇳",
  Australia: "🇦🇺", Canada: "🇨🇦", Mexico: "🇲🇽",
  Croatia: "🇭🇷",
};

function getFlag(country: string) {
  return countryFlags[country] || "🏳️";
}

function formatDistance(miles: number) {
  if (miles >= 1000) return `${(miles / 1000).toFixed(1)}k`;
  return miles.toLocaleString();
}

function formatDuration(minutes: number) {
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h ${minutes % 60}m`;
}

/** Animated world map SVG — simplified but vivid */
function WorldMapSVG() {
  return (
    <svg viewBox="0 0 800 400" className="absolute inset-0 w-full h-full opacity-[0.07]" aria-hidden>
      {/* Simplified continental outlines */}
      <g fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
        {/* North America */}
        <path d="M120,80 Q140,70 160,75 Q180,65 200,70 L220,80 Q240,75 250,85 L260,100 Q250,120 240,140 L230,160 Q220,170 200,175 L180,165 Q160,155 150,140 L140,120 Q130,100 120,80Z" />
        {/* South America */}
        <path d="M210,200 Q220,190 230,195 L240,210 Q245,230 240,250 L235,270 Q230,280 220,285 L210,275 Q200,260 205,240 L208,220Z" />
        {/* Europe */}
        <path d="M370,70 Q380,65 395,68 L410,75 Q420,80 425,90 L420,105 Q415,115 405,118 L390,115 Q380,110 375,100 L370,85Z" />
        {/* Africa */}
        <path d="M380,140 Q390,135 400,138 L415,150 Q420,170 418,190 L410,210 Q400,225 390,230 L380,220 Q370,200 372,180 L375,160Z" />
        {/* Asia */}
        <path d="M440,60 Q470,50 500,55 L540,65 Q570,70 590,80 L600,95 Q595,110 580,120 L560,125 Q530,130 500,125 L470,115 Q450,105 440,90Z" />
        {/* Australia */}
        <path d="M580,220 Q600,215 620,220 L635,230 Q640,240 635,250 L620,255 Q600,258 585,250 L578,240 Q575,230 580,220Z" />
      </g>
      {/* Flight arcs */}
      <g fill="none" strokeWidth="1" strokeDasharray="6,4">
        <path d="M180,100 Q300,30 400,85" stroke="rgba(56,189,248,0.4)" />
        <path d="M400,85 Q480,50 550,80" stroke="rgba(129,140,248,0.3)" />
        <path d="M180,100 Q350,180 400,140" stroke="rgba(52,211,153,0.3)" />
      </g>
      {/* City dots */}
      {[
        { x: 180, y: 100, color: "#38bdf8" },
        { x: 400, y: 85, color: "#f0d78c" },
        { x: 550, y: 80, color: "#34d399" },
        { x: 610, y: 235, color: "#f472b6" },
        { x: 230, y: 210, color: "#fb923c" },
        { x: 395, y: 170, color: "#a78bfa" },
      ].map((dot, i) => (
        <circle key={i} cx={dot.x} cy={dot.y} r="4" fill={dot.color} fillOpacity="0.6">
          <animate attributeName="r" values="4;6;4" dur={`${2.5 + i * 0.3}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

const emptyFormData = {
  type: "flight" as string,
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

function AddTripDialog({ trigger, defaultType }: { trigger: React.ReactNode; defaultType?: string }) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ ...emptyFormData, type: defaultType || "flight" });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/trips", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      setDialogOpen(false);
      setFormData({ ...emptyFormData, type: defaultType || "flight" });
      toast({ title: "Trip added", description: "Your trip has been recorded." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Trip</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type */}
          <div>
            <Label>Trip Type</Label>
            <Select value={formData.type} onValueChange={(v) => updateField("type", v)}>
              <SelectTrigger>
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
                  placeholder="e.g. United"
                  value={formData.airline || ""}
                  onChange={(e) => updateField("airline", e.target.value)}
                />
              </div>
              <div>
                <Label>Flight Number</Label>
                <Input
                  placeholder="e.g. UA123"
                  value={formData.flightNumber || ""}
                  onChange={(e) => updateField("flightNumber", e.target.value)}
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
                  placeholder="e.g. Eurostar"
                  value={formData.trainOperator || ""}
                  onChange={(e) => updateField("trainOperator", e.target.value)}
                />
              </div>
              <div>
                <Label>Train Number</Label>
                <Input
                  placeholder="e.g. 9024"
                  value={formData.trainNumber || ""}
                  onChange={(e) => updateField("trainNumber", e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <Label>Class</Label>
                <Select value={formData.trainClass || ""} onValueChange={(v) => updateField("trainClass", v)}>
                  <SelectTrigger>
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
            <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Departure</Label>
            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="City" value={formData.departureCity} onChange={(e) => updateField("departureCity", e.target.value)} required />
              {formData.type === "train" ? (
                <StationAutocomplete
                  placeholder="Station"
                  value={formData.departureCode}
                  onChange={(v) => updateField("departureCode", v)}
                  onStationSelect={(s: TrainStation) => {
                    updateField("departureCode", s.code);
                    if (!formData.departureCity) updateField("departureCity", s.city);
                    if (!formData.departureCountry) updateField("departureCountry", s.country);
                  }}
                  required
                />
              ) : (
                <Input placeholder="IATA (EWR)" value={formData.departureCode} onChange={(e) => updateField("departureCode", e.target.value.toUpperCase())} required />
              )}
              <Input placeholder="Country" value={formData.departureCountry} onChange={(e) => updateField("departureCountry", e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" value={formData.departureDate} onChange={(e) => updateField("departureDate", e.target.value)} required />
              <Input type="time" value={formData.departureTime} onChange={(e) => updateField("departureTime", e.target.value)} required />
            </div>
          </div>

          {/* Arrival */}
          <div className="space-y-2">
            <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Arrival</Label>
            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="City" value={formData.arrivalCity} onChange={(e) => updateField("arrivalCity", e.target.value)} required />
              {formData.type === "train" ? (
                <StationAutocomplete
                  placeholder="Station"
                  value={formData.arrivalCode}
                  onChange={(v) => updateField("arrivalCode", v)}
                  onStationSelect={(s: TrainStation) => {
                    updateField("arrivalCode", s.code);
                    if (!formData.arrivalCity) updateField("arrivalCity", s.city);
                    if (!formData.arrivalCountry) updateField("arrivalCountry", s.country);
                  }}
                  required
                />
              ) : (
                <Input placeholder="IATA (LHR)" value={formData.arrivalCode} onChange={(e) => updateField("arrivalCode", e.target.value.toUpperCase())} required />
              )}
              <Input placeholder="Country" value={formData.arrivalCountry} onChange={(e) => updateField("arrivalCountry", e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" value={formData.arrivalDate} onChange={(e) => updateField("arrivalDate", e.target.value)} required />
              <Input type="time" value={formData.arrivalTime} onChange={(e) => updateField("arrivalTime", e.target.value)} required />
            </div>
          </div>

          {/* Duration & Distance */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Duration (minutes)</Label>
              <Input type="number" min="1" value={formData.duration || ""} onChange={(e) => updateField("duration", parseInt(e.target.value) || 0)} required />
            </div>
            <div>
              <Label>Distance (miles)</Label>
              <Input type="number" min="0" step="0.1" value={formData.distance || ""} onChange={(e) => updateField("distance", parseFloat(e.target.value) || 0)} />
            </div>
          </div>

          {/* Status */}
          <div>
            <Label>Status</Label>
            <Select value={formData.status} onValueChange={(v) => updateField("status", v)}>
              <SelectTrigger>
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
            <Textarea placeholder="Any notes about this trip..." value={formData.notes || ""} onChange={(e) => updateField("notes", e.target.value)} />
          </div>

          <Button type="submit" className="w-full rounded-xl" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Adding..." : "Add Trip"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Landing() {
  const { data: analytics } = useQuery<Analytics>({
    queryKey: ["/api/analytics"],
  });
  const { data: trips = [] } = useQuery<Trip[]>({
    queryKey: ["/api/trips"],
  });

  const hasData = analytics && analytics.totalTrips > 0;
  const recentTrips = trips.slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(165deg, #0a1628 0%, #0f2341 20%, #162d50 35%, #1a3a5c 50%, #0e3347 65%, #0a2a3e 80%, #081c2e 100%)" }}>
      {/* Hero Section — fits viewport without overflow */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-5 py-10 overflow-hidden">
        {/* Background layers */}
        <WorldMapSVG />

        {/* Gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] rounded-full" style={{ background: "radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%)" }} />
          <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full" style={{ background: "radial-gradient(circle, rgba(129,140,248,0.1) 0%, transparent 70%)" }} />
          <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full" style={{ background: "radial-gradient(circle, rgba(52,211,153,0.06) 0%, transparent 70%)" }} />
        </div>

        {/* Subtle grid */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" aria-hidden>
          <defs>
            <pattern id="hero-grid" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M80 0 L0 0 0 80" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
        </svg>

        <div className="relative z-10 max-w-2xl mx-auto text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(56,189,248,0.2), rgba(129,140,248,0.15))", border: "1px solid rgba(56,189,248,0.2)" }}>
              <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8 text-sky-300" aria-label="Travel Life">
                <circle cx="16" cy="16" r="15" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 18 C10 14, 14 12, 16 10 C18 12, 22 14, 24 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                <circle cx="16" cy="10" r="1.5" fill="currentColor" />
                <path d="M12 22 L16 16 L20 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <line x1="16" y1="16" x2="16" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4" style={{ background: "linear-gradient(135deg, #ffffff 0%, #e0f2fe 40%, #bae6fd 60%, #93c5fd 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Travel Life
          </h1>
          <p className="text-base md:text-lg text-sky-200/60 max-w-md mx-auto mb-8 leading-relaxed">
            Track every flight and train ride. Visualize your journeys with stunning infographics.
          </p>

          {/* Primary action buttons — Add Flight / Add Train */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <AddTripDialog
              defaultType="flight"
              trigger={
                <Button size="lg" className="gap-2 px-7 text-sm font-semibold shadow-lg w-full sm:w-auto" style={{ background: "linear-gradient(135deg, #0ea5e9, #3b82f6)", border: "none" }}>
                  <Plus className="w-4 h-4" />
                  <Plane className="w-4 h-4" />
                  Add Flight
                </Button>
              }
            />
            <AddTripDialog
              defaultType="train"
              trigger={
                <Button size="lg" className="gap-2 px-7 text-sm font-semibold shadow-lg w-full sm:w-auto" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", border: "none" }}>
                  <Plus className="w-4 h-4" />
                  <TrainFront className="w-4 h-4" />
                  Add Train
                </Button>
              }
            />
          </div>

          {/* Secondary navigation */}
          <div className="flex items-center justify-center gap-3 mb-8">
            {hasData && (
              <>
                <Link href="/dashboard">
                  <Button variant="outline" size="sm" className="gap-2 px-5 text-sm font-semibold border-white/15 text-white/80 hover:bg-white/10 hover:text-white">
                    <BarChart3 className="w-4 h-4" />
                    Dashboard
                  </Button>
                </Link>
                <Link href="/infographics">
                  <Button variant="outline" size="sm" className="gap-2 px-5 text-sm font-semibold border-white/15 text-white/80 hover:bg-white/10 hover:text-white">
                    <Image className="w-4 h-4" />
                    Infographics
                  </Button>
                </Link>
              </>
            )}
            <Link href="/trips">
              <Button variant="outline" size="sm" className="gap-2 px-5 text-sm font-semibold border-white/15 text-white/80 hover:bg-white/10 hover:text-white">
                <Route className="w-4 h-4" />
                All Trips
              </Button>
            </Link>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 mb-8">
            {[
              { icon: Plane, label: "Flights", color: "#38bdf8" },
              { icon: TrainFront, label: "Trains", color: "#fbbf24" },
              { icon: BarChart3, label: "Analytics", color: "#34d399" },
              { icon: Sparkles, label: "Infographics", color: "#c084fc" },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white/70" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <Icon className="w-4 h-4" style={{ color }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Stats section — only with data */}
        {hasData && analytics && (
          <div className="relative z-10 w-full max-w-4xl mx-auto">
            {/* KPI Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                { icon: Route, value: analytics.totalTrips, label: "Trips", gradient: "linear-gradient(135deg, rgba(14,165,233,0.15), rgba(99,102,241,0.1))", borderColor: "rgba(56,189,248,0.15)", iconColor: "#38bdf8" },
                { icon: Plane, value: analytics.totalFlights, label: "Flights", gradient: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(37,99,235,0.1))", borderColor: "rgba(59,130,246,0.15)", iconColor: "#60a5fa" },
                { icon: TrainFront, value: analytics.totalTrains, label: "Train Rides", gradient: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(217,119,6,0.1))", borderColor: "rgba(245,158,11,0.15)", iconColor: "#fbbf24" },
                { icon: Globe, value: analytics.uniqueCountries, label: "Countries", gradient: "linear-gradient(135deg, rgba(168,85,247,0.15), rgba(139,92,246,0.1))", borderColor: "rgba(168,85,247,0.15)", iconColor: "#c084fc" },
              ].map(({ icon: Icon, value, label, gradient, borderColor, iconColor }) => (
                <div
                  key={label}
                  className="relative rounded-2xl p-4 text-center backdrop-blur-md transition-all hover:scale-[1.02]"
                  style={{ background: gradient, border: `1px solid ${borderColor}` }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2.5" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <Icon className="w-5 h-5" style={{ color: iconColor }} />
                  </div>
                  <p className="text-2xl font-bold tabular-nums text-white">{value}</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider font-medium mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Distance + Flags row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div className="rounded-2xl p-5 flex items-center gap-5 backdrop-blur-md" style={{ background: "linear-gradient(135deg, rgba(52,211,153,0.12), rgba(6,182,212,0.08))", border: "1px solid rgba(52,211,153,0.12)" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(52,211,153,0.15)" }}>
                  <MapPin className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums text-white">
                    {formatDistance(analytics.totalDistance)} <span className="text-sm font-normal text-white/40">miles</span>
                  </p>
                  <p className="text-xs text-white/40">
                    {formatDuration(analytics.totalDuration)} travel time · {analytics.uniqueCities} cities
                  </p>
                </div>
              </div>

              {analytics.countries.length > 0 && (
                <div className="rounded-2xl p-5 flex items-center gap-3 backdrop-blur-md" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex flex-wrap gap-2">
                    {analytics.countries.map((c) => (
                      <span key={c} className="text-2xl drop-shadow-lg" title={c}>
                        {getFlag(c)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Recent trips */}
            {recentTrips.length > 0 && (
              <div className="rounded-2xl p-5 backdrop-blur-md" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] text-white/40 uppercase tracking-wider font-medium">Recent Journeys</p>
                  <Link href="/trips">
                    <span className="text-[11px] text-sky-400 hover:text-sky-300 cursor-pointer font-medium">View all →</span>
                  </Link>
                </div>
                <div className="space-y-2">
                  {recentTrips.map((trip) => (
                    <div key={trip.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: trip.type === "flight" ? "rgba(56,189,248,0.12)" : "rgba(251,191,36,0.12)" }}>
                          {trip.type === "flight" ? (
                            <Plane className="w-4 h-4 text-sky-400" />
                          ) : (
                            <TrainFront className="w-4 h-4 text-amber-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{trip.departureCode} → {trip.arrivalCode}</p>
                          <p className="text-[11px] text-white/35">
                            {trip.departureCity} → {trip.arrivalCity}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-white/35 tabular-nums">
                        {new Date(trip.departureDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state when no data */}
        {!hasData && (
          <div className="relative z-10 w-full max-w-md mx-auto text-center mt-2">
            <div className="rounded-2xl p-8 backdrop-blur-md" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Globe className="w-12 h-12 text-sky-400/40 mx-auto mb-4" />
              <p className="text-white/50 text-sm leading-relaxed">
                Add your first flight or train ride to start tracking your journeys. Your data is stored locally in your browser.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <p className="text-[10px] text-white/25 uppercase tracking-wider">Travel Life v3.0</p>
          <p className="text-[10px] text-white/25">Flights · Trains · Analytics</p>
        </div>
      </div>
    </div>
  );
}

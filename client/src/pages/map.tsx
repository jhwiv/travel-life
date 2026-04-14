import { useState, useMemo, useEffect, useRef } from "react";
import { AIRPORTS } from "@/lib/airport-data";
import { getTrips, computeAnalytics } from "@/lib/static-data";
import type { Trip } from "@shared/schema";

/* ─── Projection (Mercator-like, fit to viewBox) ─── */
const VIEW_W = 1000;
const VIEW_H = 500;
const MAP_PAD = 40;

function project(lat: number, lon: number): { x: number; y: number } {
  const x = MAP_PAD + ((lon + 180) / 360) * (VIEW_W - MAP_PAD * 2);
  const latRad = (Math.max(-60, Math.min(75, lat)) * Math.PI) / 180;
  const mercY = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const yNorm = (mercY - -1.0) / (1.6 - -1.0);
  const y = VIEW_H - MAP_PAD - yNorm * (VIEW_H - MAP_PAD * 2);
  return { x, y };
}

function arcPath(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const curvature = Math.min(dist * 0.3, 100);
  const cx = mx - (dy / dist) * curvature;
  const cy = my + (dx / dist) * curvature * 0.3 - curvature * 0.5;
  return `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`;
}

/* Continent outline paths */
const CONTINENTS = [
  "M100,85 Q125,70 155,75 Q175,62 200,70 L225,80 Q245,72 260,88 L275,108 Q265,135 255,155 L240,175 Q225,188 200,192 L175,180 Q155,168 145,152 L130,128 Q118,105 100,85Z",
  "M200,215 Q215,200 228,208 L240,225 Q248,255 242,280 L236,305 Q228,320 218,328 L205,315 Q195,290 200,268 L203,242Z",
  "M375,68 Q388,58 405,64 L422,74 Q435,82 440,96 L434,115 Q428,130 415,135 L398,130 Q385,122 378,108 L375,90Z",
  "M385,155 Q398,146 410,152 L428,168 Q435,195 432,222 L422,248 Q410,268 398,275 L385,260 Q374,235 377,205 L380,178Z",
  "M450,60 Q485,48 520,54 L565,70 Q600,78 622,95 L632,115 Q626,132 608,145 L585,152 Q548,158 515,148 L480,135 Q458,122 450,100Z",
  "M600,248 Q622,238 645,248 L662,262 Q668,278 662,292 L645,298 Q620,302 604,290 L596,275 Q592,260 600,248Z",
];

/* Rescale continent paths from 800x450 viewBox to 1000x500 */
function scalePath(d: string): string {
  return d.replace(/(-?\d+\.?\d*)/g, (match, num, offset, str) => {
    // Determine if this is an x or y coordinate by counting preceding numbers
    const before = str.substring(0, offset);
    const numsBefore = (before.match(/(-?\d+\.?\d*)/g) || []).length;
    // Commands: M, Q, L have (x,y) pairs, so even index = x, odd = y
    const val = parseFloat(num);
    if (numsBefore % 2 === 0) {
      return String(Math.round((val / 800) * VIEW_W * 10) / 10);
    } else {
      return String(Math.round((val / 450) * VIEW_H * 10) / 10);
    }
  });
}

const SCALED_CONTINENTS = CONTINENTS.map(scalePath);

const countryFlags: Record<string, string> = {
  "United States": "\u{1F1FA}\u{1F1F8}", US: "\u{1F1FA}\u{1F1F8}", USA: "\u{1F1FA}\u{1F1F8}",
  "United Kingdom": "\u{1F1EC}\u{1F1E7}", UK: "\u{1F1EC}\u{1F1E7}",
  France: "\u{1F1EB}\u{1F1F7}", Germany: "\u{1F1E9}\u{1F1EA}", Italy: "\u{1F1EE}\u{1F1F9}", Spain: "\u{1F1EA}\u{1F1F8}",
  Netherlands: "\u{1F1F3}\u{1F1F1}", Belgium: "\u{1F1E7}\u{1F1EA}", Switzerland: "\u{1F1E8}\u{1F1ED}",
  Austria: "\u{1F1E6}\u{1F1F9}", Portugal: "\u{1F1F5}\u{1F1F9}", Ireland: "\u{1F1EE}\u{1F1EA}",
  Sweden: "\u{1F1F8}\u{1F1EA}", Norway: "\u{1F1F3}\u{1F1F4}", Denmark: "\u{1F1E9}\u{1F1F0}", Finland: "\u{1F1EB}\u{1F1EE}",
  Japan: "\u{1F1EF}\u{1F1F5}", Canada: "\u{1F1E8}\u{1F1E6}", Mexico: "\u{1F1F2}\u{1F1FD}",
  Croatia: "\u{1F1ED}\u{1F1F7}", Aruba: "\u{1F1E6}\u{1F1FC}",
  Greece: "\u{1F1EC}\u{1F1F7}", Turkey: "\u{1F1F9}\u{1F1F7}",
  "Czech Republic": "\u{1F1E8}\u{1F1FF}", Czechia: "\u{1F1E8}\u{1F1FF}",
  Poland: "\u{1F1F5}\u{1F1F1}", Hungary: "\u{1F1ED}\u{1F1FA}",
  Iceland: "\u{1F1EE}\u{1F1F8}", Australia: "\u{1F1E6}\u{1F1FA}",
  "South Korea": "\u{1F1F0}\u{1F1F7}", China: "\u{1F1E8}\u{1F1F3}", India: "\u{1F1EE}\u{1F1F3}",
};

function getFlag(c: string) { return countryFlags[c] || "\u{1F3F3}\u{FE0F}"; }

function formatDistance(miles: number) {
  return miles.toLocaleString();
}

function formatDuration(minutes: number) {
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h ${minutes % 60}m`;
}

/** Label placement: nudge labels away from nearby airports to prevent overlap */
function computeLabelOffsets(
  airports: { code: string; x: number; y: number; count: number }[]
): Map<string, { dx: number; dy: number }> {
  const offsets = new Map<string, { dx: number; dy: number }>();
  const sorted = [...airports].sort((a, b) => b.count - a.count);

  for (let i = 0; i < sorted.length; i++) {
    const ap = sorted[i];
    let bestDx = 0;
    let bestDy = -14; // default: above
    let bestScore = -Infinity;

    // Try 8 directions for placing the label
    const candidates = [
      { dx: 0, dy: -14 },   // above
      { dx: 14, dy: -8 },   // upper-right
      { dx: 14, dy: 6 },    // right
      { dx: 14, dy: 14 },   // lower-right
      { dx: 0, dy: 18 },    // below
      { dx: -14, dy: 14 },  // lower-left
      { dx: -14, dy: 6 },   // left
      { dx: -14, dy: -8 },  // upper-left
    ];

    for (const cand of candidates) {
      const labelX = ap.x + cand.dx;
      const labelY = ap.y + cand.dy;
      let score = 0;

      // Penalty for proximity to other airport dots
      for (let j = 0; j < sorted.length; j++) {
        if (i === j) continue;
        const other = sorted[j];
        const dist = Math.sqrt((labelX - other.x) ** 2 + (labelY - other.y) ** 2);
        if (dist < 20) score -= (20 - dist) * 3;
      }

      // Penalty for proximity to already-placed labels
      for (const [otherCode, otherOff] of offsets.entries()) {
        const otherAp = sorted.find(a => a.code === otherCode);
        if (!otherAp) continue;
        const otherLabelX = otherAp.x + otherOff.dx;
        const otherLabelY = otherAp.y + otherOff.dy;
        const dist = Math.sqrt((labelX - otherLabelX) ** 2 + (labelY - otherLabelY) ** 2);
        if (dist < 25) score -= (25 - dist) * 5;
      }

      // Prefer above or upper-right (natural reading)
      if (cand.dy < 0) score += 2;
      if (cand.dx >= 0) score += 1;

      // Penalty for going out of bounds
      if (labelX < 10 || labelX > VIEW_W - 10) score -= 50;
      if (labelY < 5 || labelY > VIEW_H - 5) score -= 50;

      if (score > bestScore) {
        bestScore = score;
        bestDx = cand.dx;
        bestDy = cand.dy;
      }
    }

    offsets.set(ap.code, { dx: bestDx, dy: bestDy });
  }

  return offsets;
}

/** Animated count-up */
function useCountUp(target: number, duration: number = 1200) {
  const [value, setValue] = useState(0);
  const ref = useRef(false);

  useEffect(() => {
    if (ref.current) return;
    ref.current = true;
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);

  return value;
}

function AnimatedStat({ value, suffix }: { value: number; suffix?: string }) {
  const animated = useCountUp(value);
  return <>{animated.toLocaleString()}{suffix}</>;
}

export default function MapPage() {
  const [hoveredArc, setHoveredArc] = useState<number | null>(null);
  const trips = getTrips() as unknown as Trip[];
  const analytics = computeAnalytics();

  const { airports, arcs, mostRecent } = useMemo(() => {
    const flights = trips.filter((t: any) => t.type === "flight" && t.status === "completed");
    const airportMap = new Map<string, { code: string; x: number; y: number; count: number; city: string }>();

    flights.forEach((t: any) => {
      const depCode = t.departureCode || t.departure_code;
      const arrCode = t.arrivalCode || t.arrival_code;
      const depCity = t.departureCity || t.departure_city;
      const arrCity = t.arrivalCity || t.arrival_city;

      for (const [code, city] of [[depCode, depCity], [arrCode, arrCity]] as [string, string][]) {
        if (!code) continue;
        const info = AIRPORTS[code];
        if (info) {
          const { x, y } = project(info.lat, info.lon);
          const existing = airportMap.get(code);
          if (existing) {
            existing.count++;
          } else {
            airportMap.set(code, { code, x, y, count: 1, city });
          }
        }
      }
    });

    const arcList = flights.map((t: any, i: number) => {
      const depCode = t.departureCode || t.departure_code;
      const arrCode = t.arrivalCode || t.arrival_code;
      const depInfo = AIRPORTS[depCode];
      const arrInfo = AIRPORTS[arrCode];
      if (!depInfo || !arrInfo) return null;
      const from = project(depInfo.lat, depInfo.lon);
      const to = project(arrInfo.lat, arrInfo.lon);
      return {
        id: i,
        depCode,
        arrCode,
        depCity: t.departureCity || t.departure_city,
        arrCity: t.arrivalCity || t.arrival_city,
        date: t.departureDate || t.departure_date || "",
        airline: t.airline || "",
        flightNum: t.flightNumber || t.flight_number || "",
        path: arcPath(from.x, from.y, to.x, to.y),
        from,
        to,
        distance: t.distance || 0,
      };
    }).filter(Boolean) as any[];

    const sorted = [...arcList].sort((a: any, b: any) => a.date.localeCompare(b.date));
    const mostRecentArc = sorted.length > 0 ? sorted[sorted.length - 1] : null;

    return { airports: Array.from(airportMap.values()), arcs: arcList, mostRecent: mostRecentArc };
  }, [trips]);

  const labelOffsets = useMemo(() => computeLabelOffsets(airports), [airports]);

  const countries = analytics.countries || [];
  const totalFlights = analytics.totalFlights || 0;
  const totalDistance = analytics.totalDistance || 0;
  const totalDuration = analytics.totalDuration || 0;
  const uniqueAirports = analytics.uniqueAirports || 0;
  const uniqueAirlines = analytics.uniqueAirlines || 0;
  const uniqueCountries = analytics.uniqueCountries || 0;

  return (
    <div className="min-h-screen animate-page-enter" style={{ background: "linear-gradient(180deg, #0a0a2e 0%, #1a1040 30%, #0d0d30 60%, #08081e 100%)" }}>
      {/* Full-width world map */}
      <div className="relative w-full" style={{ height: "min(50vh, 500px)" }}>
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden
        >
          <defs>
            {/* Arc glow gradient — bright cyan/purple */}
            <linearGradient id="pp-arc-glow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#7c3aed" stopOpacity="1" />
              <stop offset="100%" stopColor="#c084fc" stopOpacity="0.8" />
            </linearGradient>

            {/* Gold gradient for most recent arc */}
            <linearGradient id="pp-arc-recent" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#facc15" stopOpacity="1" />
              <stop offset="50%" stopColor="#fbbf24" stopOpacity="1" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.9" />
            </linearGradient>

            {/* Glow filter */}
            <filter id="pp-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <filter id="pp-glow-strong" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <filter id="pp-dot-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Plane icon symbol */}
            <symbol id="pp-plane" viewBox="0 0 24 24">
              <path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2 1.5 1.5 0 0 0 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="currentColor" />
            </symbol>
          </defs>

          {/* Subtle grid */}
          <pattern id="pp-grid" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M50 0 L0 0 0 50" fill="none" stroke="rgba(139,92,246,0.04)" strokeWidth="0.5" />
          </pattern>
          <rect width={VIEW_W} height={VIEW_H} fill="url(#pp-grid)" />

          {/* Continental outlines — subtle purple tint */}
          <g fill="none" stroke="rgba(139,92,246,0.15)" strokeWidth="1.5" strokeLinecap="round">
            {SCALED_CONTINENTS.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>

          {/* Arc glow layer (behind) */}
          <g fill="none">
            {arcs.map((arc: any, i: number) => {
              const isRecent = mostRecent && arc.id === mostRecent.id;
              const isHovered = hoveredArc === i;
              return (
                <path
                  key={`glow-${i}`}
                  d={arc.path}
                  stroke={isRecent ? "#facc15" : "#a855f7"}
                  strokeWidth={isHovered ? 10 : isRecent ? 8 : 5}
                  strokeOpacity={isHovered ? 0.5 : isRecent ? 0.35 : 0.2}
                  filter="url(#pp-glow)"
                  className="animate-passport-arc"
                  style={{ animationDelay: `${0.12 * i}s` }}
                />
              );
            })}
          </g>

          {/* Flight arcs — main stroke */}
          <g fill="none">
            {arcs.map((arc: any, i: number) => {
              const isRecent = mostRecent && arc.id === mostRecent.id;
              const isHovered = hoveredArc === i;
              return (
                <path
                  key={`arc-${i}`}
                  d={arc.path}
                  stroke={isRecent ? "url(#pp-arc-recent)" : "url(#pp-arc-glow)"}
                  strokeWidth={isHovered ? 3.5 : isRecent ? 3 : 2}
                  strokeLinecap="round"
                  className="animate-passport-arc"
                  style={{
                    animationDelay: `${0.12 * i}s`,
                    cursor: "pointer",
                    transition: "stroke-width 0.2s ease",
                  }}
                  filter={isHovered || isRecent ? "url(#pp-glow-strong)" : undefined}
                  onMouseEnter={() => setHoveredArc(i)}
                  onMouseLeave={() => setHoveredArc(null)}
                />
              );
            })}
          </g>

          {/* Animated plane on most recent route */}
          {mostRecent && (
            <g className="animate-plane-travel" style={{ color: "#fbbf24" }}>
              <animateMotion
                dur="4s"
                begin="1.5s"
                repeatCount="indefinite"
                rotate="auto"
                path={mostRecent.path}
              />
              <use href="#pp-plane" x="-7" y="-7" width="14" height="14" />
            </g>
          )}

          {/* Airport dots */}
          {airports.map((ap, i) => {
            const isHub = ap.count >= 4;
            const baseR = isHub ? 5.5 : Math.min(3.5 + ap.count * 0.5, 5);
            return (
              <g key={ap.code}>
                {/* Outer pulse ring */}
                <circle cx={ap.x} cy={ap.y} r={baseR * 2.5} fill={isHub ? "#c084fc" : "#a78bfa"} fillOpacity="0.1">
                  <animate attributeName="r" values={`${baseR * 2.5};${baseR * 3.5};${baseR * 2.5}`} dur={`${3 + i * 0.15}s`} repeatCount="indefinite" />
                  <animate attributeName="fill-opacity" values="0.1;0.04;0.1" dur={`${3 + i * 0.15}s`} repeatCount="indefinite" />
                </circle>
                {/* Inner solid dot */}
                <circle cx={ap.x} cy={ap.y} r={baseR} fill={isHub ? "#c084fc" : "#a78bfa"} fillOpacity="0.95" filter="url(#pp-dot-glow)" />
                {/* White center */}
                <circle cx={ap.x} cy={ap.y} r={baseR * 0.35} fill="white" fillOpacity="0.85" />
              </g>
            );
          })}

          {/* Airport code labels with smart placement */}
          {airports.map((ap) => {
            const isHub = ap.count >= 4;
            const offset = labelOffsets.get(ap.code) || { dx: 0, dy: -14 };
            const anchor = offset.dx > 5 ? "start" : offset.dx < -5 ? "end" : "middle";
            return (
              <text
                key={`label-${ap.code}`}
                x={ap.x + offset.dx}
                y={ap.y + offset.dy}
                fill={isHub ? "#e9d5ff" : "rgba(255,255,255,0.8)"}
                fontSize={isHub ? "12" : "10"}
                fontWeight={isHub ? "bold" : "600"}
                textAnchor={anchor}
                fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                style={{ textShadow: "0 0 8px rgba(10,10,46,0.9), 0 0 16px rgba(139,92,246,0.3)" }}
              >
                {ap.code}
              </text>
            );
          })}
        </svg>

        {/* Tooltip on hover */}
        {hoveredArc !== null && arcs[hoveredArc] && (
          <div
            className="absolute z-20 pointer-events-none px-3 py-2 rounded-lg text-xs font-mono"
            style={{
              left: "50%",
              bottom: "16px",
              transform: "translateX(-50%)",
              background: "rgba(10,10,46,0.95)",
              border: "1px solid rgba(139,92,246,0.3)",
              backdropFilter: "blur(8px)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.5), 0 0 15px rgba(139,92,246,0.15)",
            }}
          >
            <div className="flex items-center gap-2 text-white/90">
              <span className="text-purple-300 font-bold">{arcs[hoveredArc].depCode}</span>
              <span className="text-white/30">&rarr;</span>
              <span className="text-purple-300 font-bold">{arcs[hoveredArc].arrCode}</span>
              {arcs[hoveredArc].distance > 0 && (
                <span className="text-white/40 ml-1">{arcs[hoveredArc].distance.toLocaleString()} mi</span>
              )}
            </div>
            <div className="text-white/40 mt-0.5">
              {arcs[hoveredArc].depCity} &rarr; {arcs[hoveredArc].arrCity}
              {arcs[hoveredArc].airline && <span className="ml-2 text-amber-300/60">{arcs[hoveredArc].airline} {arcs[hoveredArc].flightNum}</span>}
            </div>
          </div>
        )}

        {/* Bottom gradient fade into stats section */}
        <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none" style={{ background: "linear-gradient(180deg, transparent 0%, #0d0d30 100%)" }} />
      </div>

      {/* Stats section below the map */}
      <div className="relative z-10 max-w-2xl mx-auto px-5 pb-16 -mt-4">
        {/* Country flags row */}
        {countries.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            {countries.map((c: string) => (
              <span key={c} className="text-2xl drop-shadow-lg" title={c}>
                {getFlag(c)}
              </span>
            ))}
          </div>
        )}

        {/* Section title with divider */}
        <div className="text-center mb-8">
          <div className="h-px mx-auto w-32 mb-4" style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.3), transparent)" }} />
          <h2 className="text-lg font-extrabold tracking-[0.2em] uppercase font-display" style={{ color: "#e9d5ff" }}>
            My Travel Passport
          </h2>
          <div className="h-px mx-auto w-32 mt-4" style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.3), transparent)" }} />
        </div>

        {/* Primary stats grid */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="text-center">
            <p className="text-5xl font-extrabold text-white tabular-nums font-display leading-none">
              <AnimatedStat value={totalFlights} />
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] mt-2 font-medium" style={{ color: "rgba(196,181,253,0.5)" }}>Flights</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-extrabold text-white tabular-nums font-display leading-none">
              {formatDistance(totalDistance)}
              <span className="text-lg font-semibold ml-1" style={{ color: "rgba(196,181,253,0.5)" }}>mi</span>
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] mt-2 font-medium" style={{ color: "rgba(196,181,253,0.5)" }}>Flight Distance</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center">
            <p className="text-3xl font-extrabold text-white tabular-nums font-display leading-none">
              {formatDuration(totalDuration)}
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] mt-2 font-medium" style={{ color: "rgba(196,181,253,0.5)" }}>Flight Time</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-extrabold text-white tabular-nums font-display leading-none">
              <AnimatedStat value={uniqueAirports} />
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] mt-2 font-medium" style={{ color: "rgba(196,181,253,0.5)" }}>Airports</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-extrabold text-white tabular-nums font-display leading-none">
              <AnimatedStat value={uniqueAirlines} />
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] mt-2 font-medium" style={{ color: "rgba(196,181,253,0.5)" }}>Airlines</p>
          </div>
        </div>

        {/* Countries stat + divider */}
        <div className="text-center mb-8">
          <div className="h-px mx-auto w-48 mb-6" style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.2), transparent)" }} />
          <p className="text-5xl font-extrabold text-white tabular-nums font-display leading-none">
            <AnimatedStat value={uniqueCountries} />
          </p>
          <p className="text-[10px] uppercase tracking-[0.2em] mt-2 font-medium" style={{ color: "rgba(196,181,253,0.5)" }}>Countries</p>
        </div>

        {/* Earth circumference comparison */}
        {totalDistance > 0 && (
          <div className="rounded-2xl p-5 mb-6" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.1)" }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🌍</span>
              <span className="text-[10px] uppercase tracking-[0.2em] font-medium" style={{ color: "rgba(196,181,253,0.4)" }}>Around the Earth</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: "rgba(139,92,246,0.1)" }}>
                <div className="h-full rounded-full transition-all duration-1000" style={{
                  width: `${Math.min((totalDistance / 24901) * 100, 100)}%`,
                  background: "linear-gradient(90deg, #7c3aed, #a855f7, #facc15)",
                }} />
              </div>
              <span className="text-sm font-bold text-white tabular-nums font-display">
                {((totalDistance / 24901) * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-[10px] mt-1.5" style={{ color: "rgba(196,181,253,0.3)" }}>
              {formatDistance(totalDistance)} of 24,901 miles
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-6">
          <div className="h-px mx-auto w-32 mb-4" style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.15), transparent)" }} />
          <p className="text-[8px] font-mono tracking-[0.3em] uppercase" style={{ color: "rgba(196,181,253,0.15)" }}>
            Travel Life &middot; grandloopstudio.com
          </p>
        </div>
      </div>
    </div>
  );
}

import { useState, useMemo } from "react";
import { AIRPORTS } from "@/lib/airport-data";
import type { Trip } from "@shared/schema";

/* ─── Coordinate projection (Mercator-like, fit to SVG viewBox 0 0 800 450) ─── */
const VIEW_W = 800;
const VIEW_H = 450;
const MAP_PAD = 30;

function project(lat: number, lon: number): { x: number; y: number } {
  // Simple equirectangular projection centered roughly for Atlantic flights
  const x = MAP_PAD + ((lon + 180) / 360) * (VIEW_W - MAP_PAD * 2);
  // Clamp latitude and apply mild Mercator stretch
  const latRad = (Math.max(-60, Math.min(75, lat)) * Math.PI) / 180;
  const mercY = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const yNorm = (mercY - (-1.0)) / (1.6 - (-1.0)); // normalise ~[-60,75] range
  const y = VIEW_H - MAP_PAD - yNorm * (VIEW_H - MAP_PAD * 2);
  return { x, y };
}

function arcPath(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  // Curve up — perpendicular offset proportional to distance
  const curvature = Math.min(dist * 0.35, 120);
  const cx = mx - (dy / dist) * curvature;
  const cy = my + (dx / dist) * curvature * 0.3 - curvature * 0.5;
  return `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`;
}

/* Continent outline paths — slightly brighter for contrast */
const CONTINENTS = [
  // N. America
  "M100,85 Q125,70 155,75 Q175,62 200,70 L225,80 Q245,72 260,88 L275,108 Q265,135 255,155 L240,175 Q225,188 200,192 L175,180 Q155,168 145,152 L130,128 Q118,105 100,85Z",
  // S. America
  "M200,215 Q215,200 228,208 L240,225 Q248,255 242,280 L236,305 Q228,320 218,328 L205,315 Q195,290 200,268 L203,242Z",
  // Europe
  "M375,68 Q388,58 405,64 L422,74 Q435,82 440,96 L434,115 Q428,130 415,135 L398,130 Q385,122 378,108 L375,90Z",
  // Africa
  "M385,155 Q398,146 410,152 L428,168 Q435,195 432,222 L422,248 Q410,268 398,275 L385,260 Q374,235 377,205 L380,178Z",
  // Asia
  "M450,60 Q485,48 520,54 L565,70 Q600,78 622,95 L632,115 Q626,132 608,145 L585,152 Q548,158 515,148 L480,135 Q458,122 450,100Z",
  // Australia
  "M600,248 Q622,238 645,248 L662,262 Q668,278 662,292 L645,298 Q620,302 604,290 L596,275 Q592,260 600,248Z",
];

interface FlightMapProps {
  trips: Trip[];
  /** "hero" = large centerpiece (dashboard), "background" = full bleed behind content (landing), "compact" = infographic */
  variant?: "hero" | "background" | "compact";
  className?: string;
}

export default function FlightMap({ trips, variant = "hero", className = "" }: FlightMapProps) {
  const [hoveredArc, setHoveredArc] = useState<number | null>(null);

  // Build unique airports and arcs from trip data
  const { airports, arcs, mostRecent } = useMemo(() => {
    const flights = trips.filter(t => t.type === "flight" && t.status === "completed");
    const airportMap = new Map<string, { code: string; x: number; y: number; count: number; city: string }>();

    flights.forEach(t => {
      const depCode = (t as any).departureCode || (t as any).departure_code;
      const arrCode = (t as any).arrivalCode || (t as any).arrival_code;
      const depCity = (t as any).departureCity || (t as any).departure_city;
      const arrCity = (t as any).arrivalCity || (t as any).arrival_city;

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

    const arcList = flights.map((t, i) => {
      const depCode = (t as any).departureCode || (t as any).departure_code;
      const arrCode = (t as any).arrivalCode || (t as any).arrival_code;
      const depInfo = AIRPORTS[depCode];
      const arrInfo = AIRPORTS[arrCode];
      if (!depInfo || !arrInfo) return null;
      const from = project(depInfo.lat, depInfo.lon);
      const to = project(arrInfo.lat, arrInfo.lon);
      const depCity = (t as any).departureCity || (t as any).departure_city;
      const arrCity = (t as any).arrivalCity || (t as any).arrival_city;
      const date = (t as any).departureDate || (t as any).departure_date || "";
      const airline = (t as any).airline || "";
      const flightNum = (t as any).flightNumber || (t as any).flight_number || "";
      return {
        id: i,
        depCode,
        arrCode,
        depCity,
        arrCity,
        date,
        airline,
        flightNum,
        path: arcPath(from.x, from.y, to.x, to.y),
        from,
        to,
        distance: t.distance || 0,
      };
    }).filter(Boolean) as NonNullable<ReturnType<typeof Array.prototype.map>[number]>[];

    // Most recent flight (last by departure date)
    const sorted = [...arcList].sort((a: any, b: any) => a.date.localeCompare(b.date));
    const mostRecentArc = sorted.length > 0 ? sorted[sorted.length - 1] : null;

    return { airports: Array.from(airportMap.values()), arcs: arcList as any[], mostRecent: mostRecentArc as any };
  }, [trips]);

  const isBackground = variant === "background";
  const isCompact = variant === "compact";

  // Size classes per variant
  const wrapperClasses = isBackground
    ? `absolute inset-0 w-full h-full ${className}`
    : isCompact
    ? `relative w-full overflow-hidden rounded-xl ${className}`
    : `relative w-full overflow-hidden rounded-2xl ${className}`;

  const heightStyle = isBackground
    ? {}
    : isCompact
    ? { minHeight: "300px" }
    : { minHeight: "420px", maxHeight: "560px" };

  return (
    <div
      className={wrapperClasses}
      style={{
        background: isBackground ? "transparent" : "linear-gradient(180deg, #0B1422 0%, #0D1F35 50%, #0B1422 100%)",
        ...heightStyle,
      }}
    >
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          {/* Grid */}
          <pattern id="fm-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0 L0 0 0 40" fill="none" stroke="rgba(20,184,166,0.07)" strokeWidth="0.5" />
          </pattern>

          {/* Arc glow gradient */}
          <linearGradient id="fm-arc-glow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#14B8A6" stopOpacity="1" />
            <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.7" />
          </linearGradient>

          {/* Gold gradient for most recent arc */}
          <linearGradient id="fm-arc-recent" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="1" />
            <stop offset="50%" stopColor="#FBBF24" stopOpacity="1" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.8" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="fm-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Strong glow for hovered/recent arc */}
          <filter id="fm-glow-strong" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Dot glow */}
          <filter id="fm-dot-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Plane icon symbol */}
          <symbol id="fm-plane" viewBox="0 0 24 24">
            <path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2 1.5 1.5 0 0 0 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="currentColor" />
          </symbol>
        </defs>

        {/* Background grid */}
        <rect width={VIEW_W} height={VIEW_H} fill="url(#fm-grid)" />

        {/* Continental outlines — slightly brighter */}
        <g fill="none" stroke="rgba(20,184,166,0.22)" strokeWidth="1.2" strokeLinecap="round">
          {CONTINENTS.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>

        {/* Arc glow layer (behind) — blurred duplicates for bloom */}
        <g fill="none">
          {arcs.map((arc: any, i: number) => {
            const isRecent = mostRecent && arc.id === mostRecent.id;
            const isHovered = hoveredArc === i;
            return (
              <path
                key={`glow-${i}`}
                d={arc.path}
                stroke={isRecent ? "#F59E0B" : "#14B8A6"}
                strokeWidth={isHovered ? 8 : isRecent ? 6 : 4}
                strokeOpacity={isHovered ? 0.4 : isRecent ? 0.3 : 0.15}
                filter="url(#fm-glow)"
                className="animate-arc"
                style={{ animationDelay: `${0.15 * i}s` }}
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
                stroke={isRecent ? "url(#fm-arc-recent)" : "url(#fm-arc-glow)"}
                strokeWidth={isHovered ? 3.5 : isRecent ? 3 : 2}
                strokeLinecap="round"
                className="animate-arc"
                style={{
                  animationDelay: `${0.15 * i}s`,
                  cursor: "pointer",
                  transition: "stroke-width 0.2s ease",
                }}
                filter={isHovered || isRecent ? "url(#fm-glow-strong)" : undefined}
                onMouseEnter={() => setHoveredArc(i)}
                onMouseLeave={() => setHoveredArc(null)}
              />
            );
          })}
        </g>

        {/* Plane icon traveling along the most recent route */}
        {mostRecent && (
          <g className="animate-plane-travel" style={{ color: "#FBBF24" }}>
            <animateMotion
              dur="4s"
              begin="1.5s"
              repeatCount="indefinite"
              rotate="auto"
              path={mostRecent.path}
            />
            <use href="#fm-plane" x="-7" y="-7" width="14" height="14" />
          </g>
        )}

        {/* Airport dots */}
        {airports.map((ap, i) => {
          const isHub = ap.count >= 4; // EWR will be the hub
          const baseR = isHub ? 5 : Math.min(3 + ap.count * 0.5, 4.5);
          return (
            <g key={ap.code}>
              {/* Outer pulse ring */}
              <circle cx={ap.x} cy={ap.y} r={baseR * 2} fill={isHub ? "#14B8A6" : "#22D3EE"} fillOpacity="0.12" className="animate-dot-pulse" style={{ animationDelay: `${i * 0.3}s` }}>
                <animate attributeName="r" values={`${baseR * 2};${baseR * 3};${baseR * 2}`} dur={`${3 + i * 0.2}s`} repeatCount="indefinite" />
                <animate attributeName="fill-opacity" values="0.12;0.06;0.12" dur={`${3 + i * 0.2}s`} repeatCount="indefinite" />
              </circle>
              {/* Inner solid dot */}
              <circle cx={ap.x} cy={ap.y} r={baseR} fill={isHub ? "#14B8A6" : "#22D3EE"} fillOpacity="0.95" filter="url(#fm-dot-glow)" />
              {/* White center */}
              <circle cx={ap.x} cy={ap.y} r={baseR * 0.4} fill="white" fillOpacity="0.8" />
            </g>
          );
        })}

        {/* Airport code labels */}
        {airports.map((ap) => {
          const isHub = ap.count >= 4;
          return (
            <text
              key={`label-${ap.code}`}
              x={ap.x}
              y={ap.y - (isHub ? 12 : 9)}
              fill={isHub ? "#5EEAD4" : "rgba(255,255,255,0.85)"}
              fontSize={isHub ? "11" : "9"}
              fontWeight={isHub ? "bold" : "600"}
              textAnchor="middle"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              style={{ textShadow: "0 0 6px rgba(0,0,0,0.8), 0 0 12px rgba(20,184,166,0.3)" }}
            >
              {ap.code}
            </text>
          );
        })}
      </svg>

      {/* "FLIGHT MAP" badge */}
      {!isBackground && (
        <div className="absolute top-3 left-4 flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-teal-300/60 tracking-wider uppercase">
            <span className="inline-block w-2 h-2 rounded-full bg-teal-400/80 animate-dot-pulse" />
            Flight Map
          </div>
          {mostRecent && (
            <div className="text-[9px] font-mono text-amber-300/50 tracking-wider ml-2">
              Latest: {mostRecent.depCode} → {mostRecent.arrCode}
            </div>
          )}
        </div>
      )}

      {/* Stats overlay — bottom right */}
      {variant === "hero" && (
        <div className="absolute bottom-3 right-4 flex items-center gap-3">
          <div className="text-[10px] font-mono text-white/40 tabular-nums">
            {airports.length} airports
          </div>
          <div className="text-[10px] font-mono text-white/40 tabular-nums">
            {arcs.length} flights
          </div>
        </div>
      )}

      {/* Tooltip on hover */}
      {hoveredArc !== null && arcs[hoveredArc] && (
        <div
          className="absolute z-20 pointer-events-none px-3 py-2 rounded-lg text-xs font-mono"
          style={{
            left: "50%",
            bottom: "16px",
            transform: "translateX(-50%)",
            background: "rgba(15,23,42,0.92)",
            border: "1px solid rgba(20,184,166,0.3)",
            backdropFilter: "blur(8px)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.5), 0 0 15px rgba(20,184,166,0.1)",
          }}
        >
          <div className="flex items-center gap-2 text-white/90">
            <span className="text-teal-300 font-bold">{arcs[hoveredArc].depCode}</span>
            <span className="text-white/30">→</span>
            <span className="text-teal-300 font-bold">{arcs[hoveredArc].arrCode}</span>
            {arcs[hoveredArc].distance > 0 && (
              <span className="text-white/40 ml-1">{arcs[hoveredArc].distance.toLocaleString()} mi</span>
            )}
          </div>
          <div className="text-white/40 mt-0.5">
            {arcs[hoveredArc].depCity} → {arcs[hoveredArc].arrCity}
            {arcs[hoveredArc].airline && <span className="ml-2 text-amber-300/60">{arcs[hoveredArc].airline} {arcs[hoveredArc].flightNum}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

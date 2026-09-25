"use client";

import { useId, useState } from "react";
import { TrendingUp, Sparkles, Activity, ShieldCheck, ArrowUpRight } from "lucide-react";
import type { TrendPoint } from "@/lib/mock-report-data";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface TrendSparklineProps {
  points: TrendPoint[];
  height?: number;
}

const WIDTH = 380;

function getSmoothPath(coords: { x: number; y: number }[]) {
  if (coords.length === 0) return "";
  if (coords.length === 1) return `M ${coords[0].x} ${coords[0].y}`;

  let d = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i];
    const p1 = coords[i + 1];
    const cp1x = p0.x + (p1.x - p0.x) / 2;
    const cp1y = p0.y;
    const cp2x = p0.x + (p1.x - p0.x) / 2;
    const cp2y = p1.y;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
  }
  return d;
}

export function TrendSparkline({ points, height = 180 }: TrendSparklineProps) {
  const gradientId = useId();
  const shadowId = useId();
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  if (!points || points.length === 0) return null;

  const validScores = points.map((p) => p.score).filter((s): s is number => s !== null);

  if (validScores.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-3 bg-muted/20 rounded-2xl border border-dashed border-border/60">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-primary" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold font-heading text-foreground">No Emotional Trend Data Recorded</p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
            Log your daily mood or complete a therapy session to activate your 7-day emotional stability curve.
          </p>
        </div>
      </div>
    );
  }

  const avgScore = Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length);
  const maxScore = Math.max(...validScores);
  const minScore = Math.min(...validScores);

  const stepX = WIDTH / Math.max(1, points.length - 1);
  const maxRange = 100;
  const minRange = 0;

  const validCoords: { x: number; y: number; point: TrendPoint; index: number }[] = [];

  points.forEach((p, i) => {
    if (p.score !== null) {
      const x = i * stepX;
      const y = height - ((p.score - minRange) / (maxRange - minRange)) * (height - 50) - 25;
      validCoords.push({ x, y, point: p, index: i });
    }
  });

  const linePath = getSmoothPath(validCoords);
  const first = validCoords[0];
  const last = validCoords[validCoords.length - 1];
  const areaPath = `${linePath} L ${last.x} ${height - 5} L ${first.x} ${height - 5} Z`;

  const hoveredCoord = hoveredPointIndex !== null ? validCoords.find((c) => c.index === hoveredPointIndex) : null;

  return (
    <div className="w-full space-y-4">
      {/* Top Quick Metrics Pills */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-muted/40 border border-border/50 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-muted-foreground">7-Day Average:</span>
          <span className="font-bold font-heading text-foreground text-sm">{avgScore} / 100</span>
        </div>
        <div className="flex items-center gap-3 text-muted-foreground">
          <span>Peak: <strong className="text-foreground">{maxScore}</strong></span>
          <span>·</span>
          <span>Lowest: <strong className="text-foreground">{minScore}</strong></span>
        </div>
      </div>

      {/* SVG Smooth Curve Container */}
      <div className="relative w-full p-2 bg-gradient-to-b from-card via-card to-muted/20 rounded-2xl border border-border/40">
        <svg
          viewBox={`0 0 ${WIDTH} ${height}`}
          className="w-full overflow-visible"
          preserveAspectRatio="none"
          style={{ height }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.45" />
              <stop offset="50%" stopColor="var(--color-primary)" stopOpacity="0.15" />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.0" />
            </linearGradient>
            <filter id={shadowId} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="var(--color-primary)" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Background Grid Lines */}
          {[0.25, 0.5, 0.75].map((ratio) => (
            <line
              key={ratio}
              x1={0}
              x2={WIDTH}
              y1={height * ratio}
              y2={height * ratio}
              stroke="var(--color-muted-foreground)"
              strokeOpacity={0.1}
              strokeDasharray="3 3"
              strokeWidth={1}
            />
          ))}

          {/* Gradient Shaded Area */}
          {validCoords.length > 1 && (
            <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
          )}

          {/* Smooth Curved Line */}
          {validCoords.length > 1 && (
            <path
              d={linePath}
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={`url(#${shadowId})`}
            />
          )}

          {/* Single Point Horizontal Guide */}
          {validCoords.length === 1 && (
            <line
              x1={0}
              x2={WIDTH}
              y1={validCoords[0].y}
              y2={validCoords[0].y}
              stroke="var(--color-primary)"
              strokeOpacity={0.4}
              strokeDasharray="4 4"
              strokeWidth={2}
            />
          )}

          {/* Data Points */}
          {validCoords.map((c) => {
            const isHovered = hoveredPointIndex === c.index;
            return (
              <g
                key={c.index}
                className="cursor-pointer transition-transform"
                onMouseEnter={() => setHoveredPointIndex(c.index)}
                onMouseLeave={() => setHoveredPointIndex(null)}
              >
                {/* Active Outer Pulsing Circle */}
                {isHovered && (
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r={10}
                    fill="var(--color-primary)"
                    opacity={0.25}
                    className="animate-ping"
                  />
                )}
                {/* Node Ring */}
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={isHovered ? 7 : 5}
                  fill="var(--color-background)"
                  stroke="var(--color-primary)"
                  strokeWidth={isHovered ? 3 : 2.5}
                  className="transition-all duration-200"
                />
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={isHovered ? 3.5 : 2.5}
                  fill="var(--color-primary)"
                />
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        <AnimatePresence>
          {hoveredCoord && (
            <motion.div
              initial={{ opacity: 0, y: 5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute pointer-events-none z-20 px-3 py-1.5 rounded-xl bg-card border border-primary/30 shadow-lg text-xs"
              style={{
                left: `${Math.min(85, Math.max(15, (hoveredCoord.x / WIDTH) * 100))}%`,
                top: `${Math.max(10, (hoveredCoord.y / height) * 100 - 35)}%`,
                transform: "translateX(-50%)",
              }}
            >
              <div className="flex items-center gap-1.5 font-bold font-heading text-foreground">
                <span>{hoveredCoord.point.label}:</span>
                <span className="text-primary">{hoveredCoord.point.score} / 100</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* X-axis Days Footer */}
      <div className="flex justify-between text-xs px-2 pt-1">
        {points.map((p, i) => {
          const hasData = p.score !== null;
          return (
            <div
              key={i}
              onMouseEnter={() => hasData && setHoveredPointIndex(i)}
              onMouseLeave={() => setHoveredPointIndex(null)}
              className={cn(
                "flex flex-col items-center gap-1 cursor-pointer transition-colors px-1 py-0.5 rounded-lg",
                hoveredPointIndex === i
                  ? "text-primary font-bold bg-primary/10"
                  : hasData
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground/50"
              )}
            >
              <span>{p.label}</span>
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all",
                  hasData ? "bg-primary" : "bg-muted-foreground/20"
                )}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

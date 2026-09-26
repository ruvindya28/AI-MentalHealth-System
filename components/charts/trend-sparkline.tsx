"use client";

import { useId, useState } from "react";
import { TrendingUp, Sparkles, Activity, ShieldCheck, ArrowUpRight, Calendar } from "lucide-react";
import type { TrendPoint } from "@/lib/mock-report-data";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface TrendSparklineProps {
  points: TrendPoint[];
  height?: number;
}

const VIEW_WIDTH = 800;

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

function getStabilityLabel(score: number) {
  if (score >= 75) return { label: "Optimal Peace", color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30" };
  if (score >= 50) return { label: "Balanced Mood", color: "text-primary bg-primary/10 border-primary/30" };
  return { label: "Needs Extra Care", color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30" };
}

export function TrendSparkline({ points, height = 220 }: TrendSparklineProps) {
  const gradientId = useId();
  const shadowId = useId();
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  if (!points || points.length === 0) return null;

  const validScores = points.map((p) => p.score).filter((s): s is number => s !== null);

  if (validScores.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-3 bg-muted/20 rounded-3xl border border-dashed border-border/60">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-primary" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold font-heading text-foreground">No Emotional Trend Data Recorded</p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
            Log your daily mood or complete a therapy session to activate your emotional stability curve.
          </p>
        </div>
      </div>
    );
  }

  const avgScore = Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length);
  const maxScore = Math.max(...validScores);
  const minScore = Math.min(...validScores);

  const stepX = (VIEW_WIDTH - 60) / Math.max(1, points.length - 1);
  const maxRange = 100;
  const minRange = 0;
  const topPadding = 30;
  const bottomPadding = 30;
  const chartHeight = height - topPadding - bottomPadding;

  const validCoords: { x: number; y: number; point: TrendPoint; index: number }[] = [];

  points.forEach((p, i) => {
    if (p.score !== null) {
      const x = 30 + i * stepX;
      const y = topPadding + chartHeight - ((p.score - minRange) / (maxRange - minRange)) * chartHeight;
      validCoords.push({ x, y, point: p, index: i });
    }
  });

  const linePath = getSmoothPath(validCoords);
  const first = validCoords[0];
  const last = validCoords[validCoords.length - 1];
  const areaPath = `${linePath} L ${last.x} ${height - bottomPadding} L ${first.x} ${height - bottomPadding} Z`;

  const hoveredCoord = hoveredPointIndex !== null ? validCoords.find((c) => c.index === hoveredPointIndex) : null;
  const overallStability = getStabilityLabel(avgScore);

  // Label Step skip for longer ranges (e.g. 30 days or 90 days)
  const skipStep = points.length > 20 ? 5 : points.length > 10 ? 2 : 1;

  return (
    <div className="w-full space-y-4">
      {/* Top Quick Metrics Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-muted/40 border border-border/50 text-xs">
        <div className="space-y-0.5">
          <span className="text-muted-foreground font-medium flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-primary" /> Average Stability
          </span>
          <p className="text-base font-bold font-heading text-foreground">{avgScore} / 100</p>
        </div>

        <div className="space-y-0.5">
          <span className="text-muted-foreground font-medium flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> Peak Mood
          </span>
          <p className="text-base font-bold font-heading text-emerald-600 dark:text-emerald-400">{maxScore} / 100</p>
        </div>

        <div className="space-y-0.5">
          <span className="text-muted-foreground font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-amber-500" /> Lowest Point
          </span>
          <p className="text-base font-bold font-heading text-amber-600 dark:text-amber-400">{minScore} / 100</p>
        </div>

        <div className="space-y-0.5">
          <span className="text-muted-foreground font-medium flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-500" /> State Summary
          </span>
          <span className={cn("inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border mt-0.5", overallStability.color)}>
            {overallStability.label}
          </span>
        </div>
      </div>

      {/* SVG Smooth Curve Container */}
      <div className="relative w-full p-3 bg-gradient-to-b from-card via-card to-muted/20 rounded-3xl border border-border/50 shadow-inner">
        <svg
          viewBox={`0 0 ${VIEW_WIDTH} ${height}`}
          className="w-full h-auto overflow-visible"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.4" />
              <stop offset="60%" stopColor="var(--color-primary)" stopOpacity="0.1" />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.0" />
            </linearGradient>
            <filter id={shadowId} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="var(--color-primary)" floodOpacity="0.35" />
            </filter>
          </defs>

          {/* Grid Guidelines */}
          {[0.2, 0.5, 0.8].map((ratio) => (
            <line
              key={ratio}
              x1={20}
              x2={VIEW_WIDTH - 20}
              y1={topPadding + chartHeight * ratio}
              y2={topPadding + chartHeight * ratio}
              stroke="var(--color-muted-foreground)"
              strokeOpacity={0.12}
              strokeDasharray="4 4"
              strokeWidth={1}
            />
          ))}

          {/* Gradient Shaded Area under curve */}
          {validCoords.length > 1 && (
            <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
          )}

          {/* Smooth Curved Line */}
          {validCoords.length > 1 && (
            <path
              d={linePath}
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth={3.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={`url(#${shadowId})`}
            />
          )}

          {/* Interactive Data Points */}
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
                    r={12}
                    fill="var(--color-primary)"
                    opacity={0.3}
                    className="animate-ping"
                  />
                )}
                {/* Node Ring */}
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={isHovered ? 8 : 6}
                  fill="var(--color-background)"
                  stroke="var(--color-primary)"
                  strokeWidth={isHovered ? 3.5 : 2.5}
                  className="transition-all duration-200"
                />
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={isHovered ? 4 : 3}
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
              className="absolute pointer-events-none z-20 px-3.5 py-2 rounded-2xl bg-card border border-primary/30 shadow-xl text-xs space-y-1"
              style={{
                left: `${Math.min(85, Math.max(15, (hoveredCoord.x / VIEW_WIDTH) * 100))}%`,
                top: `${Math.max(8, (hoveredCoord.y / height) * 100 - 30)}%`,
                transform: "translateX(-50%)",
              }}
            >
              <div className="flex items-center justify-between gap-3 font-bold font-heading text-foreground">
                <span>{hoveredCoord.point.label}:</span>
                <span className="text-primary font-extrabold">{hoveredCoord.point.score} / 100</span>
              </div>
              {hoveredCoord.point.score !== null && (
                <div className="text-[10px] font-medium text-muted-foreground flex items-center justify-between gap-2 border-t border-border/40 pt-1">
                  <span>Stability Status</span>
                  <span className={cn("px-1.5 py-0.5 rounded-full font-semibold border", getStabilityLabel(hoveredCoord.point.score).color)}>
                    {getStabilityLabel(hoveredCoord.point.score).label}
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* X-axis Days & Dates Footer */}
      <div className="flex justify-between text-xs px-2 pt-1 overflow-x-auto">
        {points.map((p, i) => {
          if (i % skipStep !== 0 && i !== points.length - 1) return null;
          const hasData = p.score !== null;
          return (
            <div
              key={i}
              onMouseEnter={() => hasData && setHoveredPointIndex(i)}
              onMouseLeave={() => setHoveredPointIndex(null)}
              className={cn(
                "flex flex-col items-center gap-1 cursor-pointer transition-colors px-1.5 py-1 rounded-xl",
                hoveredPointIndex === i
                  ? "text-primary font-bold bg-primary/10"
                  : hasData
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground/50"
              )}
            >
              <span className="text-[11px] font-heading">{p.label}</span>
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

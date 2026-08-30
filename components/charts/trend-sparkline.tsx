"use client";

import { useId } from "react";
import { TrendingUp } from "lucide-react";
import type { TrendPoint } from "@/lib/mock-report-data";

interface TrendSparklineProps {
  points: TrendPoint[];
  height?: number;
}

const WIDTH = 320;

export function TrendSparkline({ points, height = 150 }: TrendSparklineProps) {
  const gradientId = useId();

  if (points.length === 0) return null;

  const validCoords: { x: number; y: number; point: TrendPoint }[] = [];
  const max = 100;
  const min = 0;
  const stepX = WIDTH / Math.max(1, points.length - 1);

  points.forEach((p, i) => {
    if (p.score !== null) {
      const x = i * stepX;
      const y = height - ((p.score - min) / (max - min)) * (height - 40) - 20;
      validCoords.push({ x, y, point: p });
    }
  });

  if (validCoords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-primary" />
        </div>
        <p className="text-sm font-medium text-foreground">No emotional trend data recorded yet</p>
        <p className="text-xs text-muted-foreground max-w-sm">
          Log your daily mood check-in or start a therapy conversation to track your real 7-day emotional stability trend.
        </p>
      </div>
    );
  }

  // Construct SVG paths from valid coordinates
  const linePath = validCoords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`)
    .join(" ");

  const first = validCoords[0];
  const last = validCoords[validCoords.length - 1];
  const areaPath = `${linePath} L ${last.x} ${height - 10} L ${first.x} ${height - 10} Z`;

  return (
    <div className="w-full space-y-2">
      <svg
        viewBox={`0 0 ${WIDTH} ${height}`}
        className="w-full overflow-visible"
        preserveAspectRatio="none"
        style={{ height }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid reference lines */}
        {[0.2, 0.5, 0.8].map((f) => (
          <line
            key={f}
            x1={0}
            x2={WIDTH}
            y1={height * f}
            y2={height * f}
            stroke="var(--color-muted-foreground)"
            strokeOpacity={0.12}
            strokeDasharray="4 4"
            strokeWidth={1}
          />
        ))}

        {/* Shaded Area under curve if 2 or more points */}
        {validCoords.length > 1 && (
          <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
        )}

        {/* Main trend line */}
        {validCoords.length > 1 && (
          <path
            d={linePath}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Single point fallback horizontal guide */}
        {validCoords.length === 1 && (
          <line
            x1={0}
            x2={WIDTH}
            y1={validCoords[0].y}
            y2={validCoords[0].y}
            stroke="var(--color-primary)"
            strokeOpacity={0.3}
            strokeDasharray="3 3"
            strokeWidth={1.5}
          />
        )}

        {/* Data points */}
        {validCoords.map((c, i) => (
          <g key={i} className="transition-all">
            <circle
              cx={c.x}
              cy={c.y}
              r={5}
              fill="var(--color-background)"
              stroke="var(--color-primary)"
              strokeWidth={2.5}
            />
            <circle cx={c.x} cy={c.y} r={2.5} fill="var(--color-primary)" />
            {/* Score label above point */}
            <text
              x={c.x}
              y={c.y - 8}
              textAnchor="middle"
              className="text-[10px] font-semibold fill-foreground select-none"
            >
              {c.point.score}
            </text>
          </g>
        ))}

        {/* Markers for days without data */}
        {points.map((p, i) => {
          if (p.score === null) {
            const x = i * stepX;
            return (
              <circle
                key={`empty-${i}`}
                cx={x}
                cy={height - 12}
                r={2}
                fill="var(--color-muted-foreground)"
                opacity={0.3}
              />
            );
          }
          return null;
        })}
      </svg>

      {/* X-axis day labels */}
      <div className="flex justify-between text-[11px] text-muted-foreground px-1">
        {points.map((p, i) => (
          <span
            key={i}
            className={p.score !== null ? "font-medium text-foreground" : "opacity-60"}
          >
            {p.label}
          </span>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useId } from "react";
import type { TrendPoint } from "@/lib/mock-report-data";

interface TrendSparklineProps {
  points: TrendPoint[];
  height?: number;
}

const WIDTH = 320;

export function TrendSparkline({ points, height = 140 }: TrendSparklineProps) {
  const gradientId = useId();

  if (points.length === 0) return null;

  const max = 100;
  const min = 0;
  const stepX = WIDTH / Math.max(1, points.length - 1);

  const coords = points.map((p, i) => {
    const x = i * stepX;
    const y = height - ((p.score - min) / (max - min)) * (height - 20) - 10;
    return { x, y, point: p };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${height} L ${coords[0].x} ${height} Z`;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${WIDTH} ${height}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={0}
            x2={WIDTH}
            y1={height * f}
            y2={height * f}
            stroke="var(--color-muted-foreground)"
            strokeOpacity={0.15}
            strokeWidth={1}
          />
        ))}
        <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
        <path d={linePath} fill="none" stroke="var(--color-primary)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r={3} fill="var(--color-primary)" />
        ))}
      </svg>
      <div className="flex justify-between text-xs text-muted-foreground mt-1 px-0.5">
        {points.map((p, i) => (
          <span key={i}>{p.label}</span>
        ))}
      </div>
    </div>
  );
}

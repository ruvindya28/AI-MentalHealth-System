"use client";

import * as React from "react";

interface ProgressProps {
  value?: number;
  className?: string;
}

export function Progress({
  value = 0,
  className = "",
}: ProgressProps) {
  return (
    <div
      className={`relative h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800 ${className}`}
    >
      <div
        className="h-full bg-primary transition-all duration-300 ease-in-out"
        style={{
          width: `${Math.min(Math.max(value, 0), 100)}%`,
        }}
      />
    </div>
  );
}
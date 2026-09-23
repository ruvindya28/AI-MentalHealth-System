"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Slim top progress bar that fires on every pathname change.
 * Gives immediate visual feedback that navigation is in-flight,
 * then quickly completes once the new page mounts.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    if (pathname === prevPathRef.current) return;
    prevPathRef.current = pathname;

    // Clear any existing animation
    if (timerRef.current) clearInterval(timerRef.current);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

    // Start: jump to 15% immediately, animate to ~85% while page loads
    setVisible(true);
    setProgress(15);

    let p = 15;
    timerRef.current = setInterval(() => {
      // Easing: slows down as it approaches 85%
      const increment = Math.max(1, (85 - p) * 0.12);
      p = Math.min(85, p + increment);
      setProgress(p);
      if (p >= 85 && timerRef.current) {
        clearInterval(timerRef.current);
      }
    }, 80);

    // Complete quickly once the page is mounted
    const complete = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      setProgress(100);
      hideTimerRef.current = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 350);
    };

    // Give the page 100ms to settle, then complete
    const doneTimer = setTimeout(complete, 100);

    return () => {
      clearTimeout(doneTimer);
    };
  }, [pathname]);

  return (
    <div
      aria-hidden
      className={cn(
        "fixed top-0 left-0 z-[9999] h-[2.5px] bg-primary transition-all ease-out",
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      style={{
        width: `${progress}%`,
        transitionDuration: progress === 100 ? "200ms" : "80ms",
      }}
    >
      {/* Glow tip */}
      <div className="absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-primary/0 to-primary opacity-60 blur-sm" />
    </div>
  );
}

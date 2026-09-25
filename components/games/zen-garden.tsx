"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RotateCcw, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const items = [
  { type: "rock", label: "Rock", icon: "🪨" },
  { type: "flower", label: "Flower", icon: "🌸" },
  { type: "tree", label: "Tree", icon: "🌳" },
  { type: "bamboo", label: "Bamboo", icon: "🎍" },
];

export function ZenGarden() {
  const [placedItems, setPlacedItems] = useState<
    Array<{
      type: string;
      icon: string;
      x: number;
      y: number;
    }>
  >([]);

  const [selectedItem, setSelectedItem] = useState(items[0]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setPlacedItems((prev) => [...prev, { ...selectedItem, x, y }]);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPlacedItems([]);
  };

  return (
    <div className="space-y-4 p-4 rounded-3xl bg-card/40 backdrop-blur-md border border-border/50">
      {/* Top Palette Bar & Clear Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {items.map((item) => (
            <motion.button
              key={item.type}
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedItem(item)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold transition-all duration-200 cursor-pointer",
                selectedItem.type === item.type
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105"
                  : "bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="hidden sm:inline font-heading">{item.label}</span>
            </motion.button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/5 text-primary border-primary/20">
            {placedItems.length} Placed
          </Badge>
          {placedItems.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-8 text-xs font-semibold rounded-full px-3 text-muted-foreground hover:text-foreground gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Clear
            </Button>
          )}
        </div>
      </div>

      {/* Garden Canvas */}
      <div
        onClick={handleCanvasClick}
        className="relative w-full h-80 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-100/5 to-teal-500/10 border border-amber-500/20 shadow-inner cursor-crosshair overflow-hidden group select-none"
      >
        {/* Subtle Sand Pattern Lines */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#374151_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

        {placedItems.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center pointer-events-none space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-semibold font-heading text-foreground">Your Peaceful Canvas</p>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-xs">
                Tap anywhere on the garden floor to place a {selectedItem.label} ({selectedItem.icon})
              </p>
            </div>
          </div>
        )}

        {placedItems.map((item, index) => (
          <motion.div
            key={index}
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            style={{
              position: "absolute",
              left: item.x - 14,
              top: item.y - 14,
            }}
            className="text-3xl filter drop-shadow-md hover:scale-125 transition-transform duration-150 cursor-pointer pointer-events-none"
          >
            {item.icon}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { TreePine } from "lucide-react";
import { AmbientSoundGame } from "@/components/games/ambient-sound-game";

export function ForestGame() {
  return (
    <AmbientSoundGame
      icon={TreePine}
      iconColorClass="text-success"
      glowColorClass="from-success/20"
      motionVariant="sway"
      sounds={["/sounds/birds.mp3", "/sounds/wind.mp3", "/sounds/leaves.mp3"]}
    />
  );
}

"use client";

import { Waves } from "lucide-react";
import { AmbientSoundGame } from "@/components/games/ambient-sound-game";

export function OceanWaves() {
  return (
    <AmbientSoundGame
      icon={Waves}
      iconColorClass="text-accent-foreground"
      glowColorClass="from-accent/25"
      motionVariant="wave"
      sounds={["/sounds/waves.mp3"]}
    />
  );
}

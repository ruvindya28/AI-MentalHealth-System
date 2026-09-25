"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useAnimation } from "framer-motion";
import { Volume2, VolumeX, Play, Pause, type LucideIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AmbientSoundGameProps {
  icon: LucideIcon;
  iconColorClass: string;
  glowColorClass: string;
  sounds: string[];
  motionVariant?: "sway" | "wave";
  durationSeconds?: number;
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function AmbientSoundGame({
  icon: Icon,
  iconColorClass,
  glowColorClass,
  sounds,
  motionVariant = "sway",
  durationSeconds = 5 * 60,
}: AmbientSoundGameProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const waveControls = useAnimation();
  const audioElementsRef = useRef<HTMLAudioElement[] | null>(null);

  if (audioElementsRef.current === null) {
    audioElementsRef.current = sounds.map((src) => {
      const audio = new Audio(src);
      audio.loop = true;
      return audio;
    });
  }

  useEffect(() => {
    const audioElements = audioElementsRef.current;
    return () => {
      audioElements?.forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
    };
  }, []);

  useEffect(() => {
    audioElementsRef.current?.forEach((audio) => {
      audio.volume = volume / 100;
    });
  }, [volume]);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isPlaying && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          setProgress(((durationSeconds - newTime) / durationSeconds) * 100);
          return newTime;
        });
      }, 1000);

      if (motionVariant === "wave") {
        waveControls.start({
          y: [0, -15, 0],
          transition: { duration: 6, repeat: Infinity, ease: "easeInOut" },
        });
      }
    } else if (motionVariant === "wave") {
      waveControls.stop();
    }

    return () => clearInterval(timer);
  }, [isPlaying, timeLeft, durationSeconds, motionVariant, waveControls]);

  const togglePlay = () => {
    const audioElements = audioElementsRef.current;
    audioElements?.forEach((audio) => (isPlaying ? audio.pause() : audio.play()));
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-7 bg-card/40 backdrop-blur-md rounded-3xl border border-border/50">
      {/* Sound Status Pill */}
      <div className="flex items-center justify-between w-full">
        <Badge variant="outline" className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border-primary/20 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          {isPlaying ? "Sound Active" : "Paused"}
        </Badge>
        <span className="text-xs font-medium text-muted-foreground">
          {formatTime(timeLeft)} remaining
        </span>
      </div>

      {/* Main Animated Icon Container */}
      <div className="relative w-44 h-44 flex items-center justify-center my-2">
        <div className={cn("absolute inset-0 rounded-full blur-2xl bg-gradient-to-b to-transparent transition-opacity duration-500", isPlaying ? "opacity-100" : "opacity-40", glowColorClass)} />
        
        {isPlaying && (
          <motion.div
            animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full border border-primary/30"
          />
        )}

        {motionVariant === "sway" ? (
          <motion.div
            animate={isPlaying ? { scale: [1, 1.06, 1], rotate: [0, 2, -2, 0] } : { scale: 1, rotate: 0 }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative z-10 flex items-center justify-center w-28 h-28 rounded-3xl bg-background/80 backdrop-blur-md border border-border/60 shadow-xl"
          >
            <Icon className={cn("w-14 h-14", iconColorClass)} />
          </motion.div>
        ) : (
          <motion.div animate={waveControls} className="relative z-10 flex items-center justify-center w-28 h-28 rounded-3xl bg-background/80 backdrop-blur-md border border-border/60 shadow-xl">
            <Icon className={cn("w-14 h-14", iconColorClass)} />
          </motion.div>
        )}
      </div>

      {/* Controls Container */}
      <div className="w-full max-w-xs space-y-5">
        {/* Play/Pause Button */}
        <div className="flex items-center justify-center">
          <Button
            size="lg"
            onClick={togglePlay}
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-105",
              isPlaying
                ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/30"
                : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20"
            )}
          >
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 translate-x-0.5" />}
          </Button>
        </div>

        {/* Volume Control */}
        <div className="space-y-2 p-3 rounded-2xl bg-muted/40 border border-border/40">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Ambient Volume</span>
            <span>{volume}%</span>
          </div>
          <div className="flex items-center gap-3">
            {volume === 0 ? (
              <VolumeX className="w-4 h-4 text-muted-foreground shrink-0" />
            ) : (
              <Volume2 className="w-4 h-4 text-primary shrink-0" />
            )}
            <Slider
              value={[volume]}
              onValueChange={(value) => setVolume(value[0])}
              max={100}
              step={1}
              className="py-1"
            />
          </div>
        </div>

        {/* Timer Progress */}
        <div className="space-y-1.5">
          <Progress value={progress} className="h-2 rounded-full" />
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>{formatTime(durationSeconds - timeLeft)}</span>
            <span>{formatTime(durationSeconds)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

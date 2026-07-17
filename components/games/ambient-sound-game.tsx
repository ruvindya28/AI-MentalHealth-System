"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useAnimation } from "framer-motion";
import { Volume2, VolumeX, Play, Pause, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
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
          y: [0, -20, 0],
          transition: { duration: 8, repeat: Infinity, ease: "easeInOut" },
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
    <div className="flex flex-col items-center justify-center h-100 space-y-8">
      <div className="relative w-48 h-48">
        <div className={cn("absolute inset-0 rounded-full blur-xl bg-linear-to-b to-transparent", glowColorClass)} />
        {motionVariant === "sway" ? (
          <motion.div
            animate={{ scale: [1, 1.05, 1], rotate: [0, 1, -1, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Icon className={cn("w-24 h-24", iconColorClass)} />
          </motion.div>
        ) : (
          <motion.div animate={waveControls} className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <Icon className={cn("w-24 h-24", iconColorClass)} />
              <motion.div
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className={cn("absolute inset-0 rounded-full blur-xl", glowColorClass)}
              />
            </div>
          </motion.div>
        )}
      </div>

      <div className="w-64 space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Volume</span>
            <span>{volume}%</span>
          </div>
          <div className="flex items-center gap-2">
            {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <Slider value={[volume]} onValueChange={(value) => setVolume(value[0])} max={100} step={1} />
          </div>
        </div>

        <Progress value={progress} className="h-2" />

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{formatTime(timeLeft)}</span>
          <Button variant="outline" size="icon" onClick={togglePlay} className="rounded-full">
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <span className="text-sm text-muted-foreground">{formatTime(durationSeconds)}</span>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Gamepad2, Flower2, Wind, TreePine, Waves, Clock, Sparkles, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BreathingGame } from "./breathing-game";
import { ZenGarden } from "./zen-garden";
import { ForestGame } from "./forest-game";
import { OceanWaves } from "./ocean-waves";

const games = [
  {
    id: "breathing",
    title: "Breathing Patterns",
    description: "Follow calming rhythmic breathing exercises with real-time visual guidance",
    icon: Wind,
    color: "text-blue-500 dark:text-blue-400",
    bgColor: "bg-blue-500/10",
    gradient: "from-blue-500/10 via-cyan-500/5 to-transparent",
    duration: "5 mins",
    tag: "Rhythmic Focus",
  },
  {
    id: "garden",
    title: "Zen Garden",
    description: "Create a peaceful virtual garden and practice tactile mindfulness",
    icon: Flower2,
    color: "text-amber-500 dark:text-amber-400",
    bgColor: "bg-amber-500/10",
    gradient: "from-amber-500/10 via-orange-500/5 to-transparent",
    duration: "10 mins",
    tag: "Mindful Creation",
  },
  {
    id: "forest",
    title: "Forest Journey",
    description: "Take a tranquil sensory walk through a calming forest environment",
    icon: TreePine,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10",
    gradient: "from-emerald-500/10 via-teal-500/5 to-transparent",
    duration: "15 mins",
    tag: "Nature Soundscape",
  },
  {
    id: "waves",
    title: "Ocean Waves",
    description: "Sync your breath with gentle, rhythmic ocean wave animations",
    icon: Waves,
    color: "text-teal-500 dark:text-teal-400",
    bgColor: "bg-teal-500/10",
    gradient: "from-teal-500/10 via-sky-500/5 to-transparent",
    duration: "8 mins",
    tag: "Deep Relaxation",
  },
];

interface AnxietyGamesProps {
  onGamePlayed?: (gameName: string, description: string) => Promise<void>;
}

export const AnxietyGames = ({ onGamePlayed }: AnxietyGamesProps) => {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [showGame, setShowGame] = useState(false);

  const handleGameStart = async (gameId: string) => {
    setSelectedGame(gameId);
    setShowGame(true);

    if (onGamePlayed) {
      try {
        await onGamePlayed(
          gameId,
          games.find((g) => g.id === gameId)?.description || ""
        );
      } catch (error) {
        console.error("Error logging game activity", error);
      }
    }
  };

  const renderGame = () => {
    switch (selectedGame) {
      case "breathing":
        return <BreathingGame />;
      case "garden":
        return <ZenGarden />;
      case "forest":
        return <ForestGame />;
      case "waves":
        return <OceanWaves />;
      default:
        return null;
    }
  };

  return (
    <>
      <Card className="border-border/60 shadow-sm rounded-3xl overflow-hidden bg-card/60 backdrop-blur-md">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold font-heading text-foreground">
                  Anxiety Relief & Calming Activities
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Interactive, evidence-based exercises to reduce stress and restore mental balance
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="w-fit text-xs font-semibold px-3 py-1 rounded-full bg-primary/5 text-primary border-primary/20">
              4 Interactive Exercises
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {games.map((game) => {
              const Icon = game.icon;
              return (
                <motion.div
                  key={game.id}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.99 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    onClick={() => handleGameStart(game.id)}
                    className={cn(
                      "group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 cursor-pointer flex flex-col justify-between h-full",
                      "bg-muted/30 border-border/50 hover:border-primary/40 hover:bg-muted/60 hover:shadow-md",
                      selectedGame === game.id ? "ring-2 ring-primary border-primary" : ""
                    )}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />

                    <div className="relative space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs transition-transform duration-300 group-hover:scale-105", game.bgColor, game.color)}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-background/80 border border-border/60 text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3 text-primary" />
                            {game.duration}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-heading font-bold text-base text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                          {game.title}
                        </h4>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-1">
                          {game.description}
                        </p>
                      </div>
                    </div>

                    <div className="relative pt-4 mt-2 border-t border-border/40 flex items-center justify-between text-xs">
                      <span className="font-semibold text-primary/80 group-hover:text-primary transition-colors">
                        {game.tag}
                      </span>
                      <span className="font-semibold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform duration-200">
                        Start Exercise <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showGame} onOpenChange={setShowGame}>
        <DialogContent className="sm:max-w-150 rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {games.find((g) => g.id === selectedGame)?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="pt-2">
            {renderGame()}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
"use client";

import { Container } from "@/components/ui/container";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BrainCircuit,
  Heart,
  MessageCircle,
  Sparkles,
  Brain,
  Trophy,
  Activity,
  FileText,
  Download,
  Mic,
  ArrowRight,
  Headphones,
  Zap,
  CheckCircle2,
  ArrowDown,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, isSameDay } from "date-fns";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AnxietyGames } from "@/components/games/anxiety-games";
import { MoodForm } from "@/components/mood/mood-form";
import { ActivityLogger } from "@/components/activities/activity-logger";
import { EmotionTrends } from "@/components/dashboard/emotion-trends";
import { CrisisAlerts } from "@/components/dashboard/crisis-alerts";
import { sessionsToEmotionLog, type EmotionLogEntry } from "@/lib/emotion-log";
import { sessionsToCallRecords, type CallRecord } from "@/lib/voice/call-history";
import { computeWellnessScore, wellnessScoreLabel } from "@/lib/mock-wellness-score";
import type { Emotion, CrisisLevel } from "@/lib/mock-emotion-analyzer";
import { useAuth } from "@/lib/contexts/auth-context";

interface RawTherapySession {
  _id: string;
  type: string;
  messages: {
    role: "user" | "assistant";
    content: string;
    timestamp: string;
    emotion?: Emotion;
    confidence?: number;
    crisisLevel?: CrisisLevel;
  }[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.name ? user.name.trim().split(/\s+/)[0] : "";
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [isSavingMood, setIsSavingMood] = useState(false);
  const [showActivityLogger, setShowActivityLogger] = useState(false);
  const [todayMoodScore, setTodayMoodScore] = useState<number | null>(null);
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
  const [activityCount, setActivityCount] = useState(0);
  const [chatSessionCount, setChatSessionCount] = useState(0);
  const [emotionLog, setEmotionLog] = useState<EmotionLogEntry[]>([]);
  const [dismissedStressAlert, setDismissedStressAlert] = useState(false);

  const router = useRouter();

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getTimeGreeting = () => {
    if (!currentTime) return "Welcome back";
    const hours = currentTime.getHours();
    if (hours < 12) return "Good morning";
    if (hours < 18) return "Good afternoon";
    return "Good evening";
  };

  const fetchTodayMoodScore = async () => {
    try {
      const res = await fetch("/api/mood", { cache: "no-store" });
      if (!res.ok) return;
      const { entries } = (await res.json()) as {
        entries: { moodScore: number; createdAt: string }[];
      };
      const todayEntries = entries.filter((entry) =>
        isSameDay(new Date(entry.createdAt), new Date())
      );
      if (todayEntries.length === 0) return;
      const average = Math.round(
        todayEntries.reduce((sum, entry) => sum + entry.moodScore, 0) / todayEntries.length
      );
      setTodayMoodScore(average);
    } catch (error) {
      console.error("Error loading today's mood:", error);
    }
  };

  const fetchActivityCount = async () => {
    try {
      const res = await fetch("/api/activities", { cache: "no-store" });
      if (!res.ok) return;
      const { activities } = (await res.json()) as { activities: unknown[] };
      setActivityCount(activities.length);
    } catch (error) {
      console.error("Error loading activities:", error);
    }
  };

  const fetchTherapyData = async () => {
    try {
      const res = await fetch("/api/therapy?full=true", { cache: "no-store" });
      if (!res.ok) return;
      const { sessions } = (await res.json()) as { sessions: RawTherapySession[] };
      setChatSessionCount(sessions.filter((s) => s.type === "chat").length);
      setCallHistory(sessionsToCallRecords(sessions));
      setEmotionLog(sessionsToEmotionLog(sessions));
    } catch (error) {
      console.error("Error loading therapy sessions:", error);
    }
  };

  useEffect(() => {
    fetchTodayMoodScore();
    fetchActivityCount();
    fetchTherapyData();
  }, []);

  const totalSessions = chatSessionCount + callHistory.length;

  const completionRate = useMemo(() => {
    let completed = 0;
    const totalGoals = 2;
    if (todayMoodScore !== null) completed += 1;
    if (activityCount > 0 || totalSessions > 0) completed += 1;
    return Math.round((completed / totalGoals) * 100);
  }, [todayMoodScore, activityCount, totalSessions]);

  const wellnessScore = useMemo(
    () => computeWellnessScore({ moodScore: todayMoodScore, emotionLog, completionRate }),
    [todayMoodScore, emotionLog, completionRate]
  );

  const isUnderStress = useMemo(() => {
    if (todayMoodScore === null) return true; // Show initial calming care recommendation upon login
    if (todayMoodScore <= 60) return true;
    if (wellnessScore !== null && wellnessScore < 70) return true;
    const stressEmotions = ["Anxiety", "Fear", "Sadness", "Overwhelmed", "Stress", "Crisis"];
    return emotionLog.some((entry) => stressEmotions.includes(entry.emotion));
  }, [todayMoodScore, wellnessScore, emotionLog]);

  const scrollToGames = () => {
    const el = document.getElementById("anxiety-games");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const wellnessStats = [
    {
      title: "Mood Score",
      value: todayMoodScore === null ? "No data" : `${todayMoodScore}/100`,
      icon: Brain,
      color: "text-primary",
      bgColor: "bg-primary/10",
      description: "Today's average mood",
    },
    {
      title: "Goal Completion",
      value: `${completionRate}%`,
      icon: Trophy,
      color: "text-amber-500 dark:text-amber-400",
      bgColor: "bg-amber-500/10",
      description: completionRate === 100 ? "All goals complete" : completionRate === 0 ? "Start daily check-in" : "In progress today",
    },
    {
      title: "Total Sessions",
      value: `${totalSessions} session${totalSessions === 1 ? "" : "s"}`,
      icon: Heart,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10",
      description: `${chatSessionCount} chat · ${callHistory.length} voice`,
    },
    {
      title: "Check-ins Logged",
      value: `${activityCount}`,
      icon: Activity,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      description: "Mindfulness activities",
    },
  ];

  const handleMoodSubmit = async (data: { moodScore: number }) => {
    setIsSavingMood(true);
    try {
      const res = await fetch("/api/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save mood");
      await fetchTodayMoodScore();
      setShowMoodModal(false);
      toast.success("Mood saved", { description: "Thanks for checking in with yourself today." });
    } catch (error) {
      console.error("Error saving mood:", error);
      toast.error("Couldn't save your mood. Please try again.");
    } finally {
      setIsSavingMood(false);
    }
  };

  const handleAICheckIn = () => {
    setShowActivityLogger(true);
  };

  const handleStartTherapy = () => {
    router.push("/therapy/new");
  };

  const handleStartVoice = () => {
    router.push("/voice");
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <Container className="pt-28 space-y-8">
        {/* Top Header Greeting */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                AI Mental Health Companion
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold font-heading tracking-tight">
              {getTimeGreeting()}{firstName ? `, ${firstName}` : ""} 👋
            </h1>
            <p className="text-sm text-muted-foreground">
              {currentTime
                ? format(currentTime, "EEEE, MMMM d, yyyy")
                : "Loading date..."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMoodModal(true)}
              className="rounded-full gap-2 border-primary/20 hover:border-primary/50"
            >
              <Heart className="w-4 h-4 text-primary" />
              Track Mood
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAICheckIn}
              className="rounded-full gap-2 border-primary/20 hover:border-primary/50"
            >
              <BrainCircuit className="w-4 h-4 text-primary" />
              Check-in
            </Button>
          </div>
        </motion.div>

        {/* Stress Detection Alert Card */}
        {isUnderStress && !dismissedStressAlert && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="relative overflow-hidden border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-primary/15 p-5 sm:p-6 rounded-3xl shadow-lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-heading font-bold text-base sm:text-lg text-foreground">
                        Elevated Stress Level Detected
                      </h3>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                        Calming Activity Available
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
                      We noticed your recent mood or wellness indicators suggest stress. Take a quick moment for yourself with our 4 guided calming exercises below.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <Button
                    onClick={scrollToGames}
                    className="rounded-full px-5 h-11 text-xs sm:text-sm font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-500/20 gap-2 transition-all duration-200 hover:scale-105"
                  >
                    <span>Play Calming Games</span>
                    <ArrowDown className="w-4 h-4 animate-bounce" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDismissedStressAlert(true)}
                    className="w-9 h-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-amber-500/10 shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Primary Flagship Features: Chat Therapy & Voice Studio (Twin Hero Showcase) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-heading">Choose Your Therapy Mode</h2>
            <span className="text-xs text-muted-foreground">Select how you want to express yourself</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Feature 1: Chat Therapy Card */}
            <motion.div
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="relative overflow-hidden border-primary/20 shadow-md h-full flex flex-col justify-between">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent pointer-events-none" />
                <CardContent className="relative p-6 space-y-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                        <MessageCircle className="w-6 h-6" />
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/20">
                        Chat Counseling
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold font-heading">AI Chat Therapy</h3>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        Thoughtful text-based counseling with real-time emotion recognition, CBT techniques, and personalized guidance.
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Instant Reply
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Emotion Tracking
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={handleStartTherapy}
                    className="w-full justify-center gap-2 rounded-2xl h-12 text-sm font-semibold bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 transition-all duration-200"
                  >
                    Start Chat Session
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Feature 2: Voice Studio Card */}
            <motion.div
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="relative overflow-hidden border-emerald-500/30 shadow-md h-full flex flex-col justify-between">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent pointer-events-none" />
                <CardContent className="relative p-6 space-y-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <Mic className="w-6 h-6" />
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live Voice AI
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold font-heading">Voice Therapy Studio</h3>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        Talk out loud in real time with high-fidelity speech synthesis. Hands-free, natural, and therapeutic spoken dialogue.
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                      <span className="flex items-center gap-1">
                        <Headphones className="w-3.5 h-3.5 text-emerald-500" /> Spoken Dialogue
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-emerald-500" /> Real-time Speech
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={handleStartVoice}
                    className="w-full justify-center gap-2 rounded-2xl h-12 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 transition-all duration-200"
                  >
                    Open Voice Studio
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Wellness Score Gauge + Overview Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Wellness Score Circular Card */}
          <Card className="lg:col-span-4 relative overflow-hidden flex flex-col justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/15 via-accent/10 to-transparent pointer-events-none" />
            <CardContent className="relative flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Wellness Score</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">Daily Assessment</span>
              </div>

              <div className="relative flex h-36 w-36 items-center justify-center my-2">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-muted)" strokeWidth="8" />
                  {wellnessScore !== null && (
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="var(--color-primary)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 42}
                      strokeDashoffset={2 * Math.PI * 42 * (1 - wellnessScore / 100)}
                      className="transition-all duration-700 ease-out"
                    />
                  )}
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-4xl font-bold font-heading tracking-tight">
                    {wellnessScore !== null ? wellnessScore : "--"}
                  </span>
                  <span className="text-xs text-muted-foreground">/ 100</span>
                </div>
              </div>

              <div>
                <p className="text-base font-semibold text-foreground">{wellnessScoreLabel(wellnessScore)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {wellnessScore !== null
                    ? "Calculated from mood logs, chat emotion analytics, and check-ins"
                    : "Log your mood or start a therapy session to activate your score"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Today's Overview Stat Cards */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {wellnessStats.map((stat) => (
              <Card key={stat.title} className="p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className={cn("p-2 rounded-xl", stat.bgColor)}>
                      <stat.icon className={cn("w-4 h-4", stat.color)} />
                    </div>
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold font-heading">{stat.value}</p>
                </div>
                <p className="text-[11px] text-muted-foreground mt-3 pt-2 border-t border-border/40 truncate">
                  {stat.description}
                </p>
              </Card>
            ))}
          </div>
        </div>



        {/* Guided Activities */}
        <div id="anxiety-games">
          <AnxietyGames />
        </div>
      </Container>

      {/* Mood Tracking Dialog */}
      <Dialog open={showMoodModal} onOpenChange={setShowMoodModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">How are you feeling?</DialogTitle>
            <DialogDescription>Move the slider to log your current mood score.</DialogDescription>
          </DialogHeader>
          <MoodForm onSubmit={handleMoodSubmit} isLoading={isSavingMood} />
        </DialogContent>
      </Dialog>

      {/* Activity Logger Component */}
      <ActivityLogger
        open={showActivityLogger}
        onOpenChange={setShowActivityLogger}
        onLogged={fetchActivityCount}
      />
    </div>
  );
}

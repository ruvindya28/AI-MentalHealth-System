"use client"

import { Container } from "@/components/ui/container";
import { useState, useEffect, useMemo } from "react";
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, Heart, MessageCircle, Sparkles, Brain, Trophy, Activity, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, isSameDay } from "date-fns";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AnxietyGames } from "@/components/games/anxiety-games";
import { MoodForm } from "@/components/mood/mood-form";
import { ActivityLogger } from "@/components/activities/activity-logger";
import { VoiceSessionCard } from "@/components/voice/voice-session-card";
import { CallHistory } from "@/components/voice/call-history";
import { EmotionTrends } from "@/components/dashboard/emotion-trends";
import { CrisisAlerts } from "@/components/dashboard/crisis-alerts";
import { sessionsToEmotionLog, type EmotionLogEntry } from "@/lib/emotion-log";
import { sessionsToCallRecords, type CallRecord } from "@/lib/voice/call-history";
import { computeWellnessScore, wellnessScoreLabel } from "@/lib/mock-wellness-score";
import type { Emotion, CrisisLevel } from "@/lib/mock-emotion-analyzer";

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

    const [currentTime, setCurrentTime] = useState<Date | null>(null);
    const [showMoodModal, setShowMoodModal] = useState(false);
    const [isSavingMood, setIsSavingMood] = useState(false);
    const [showActivityLogger, setShowActivityLogger] = useState(false);
    const [todayMoodScore, setTodayMoodScore] = useState<number | null>(null);
    const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
    const [activityCount, setActivityCount] = useState(0);
    const [chatSessionCount, setChatSessionCount] = useState(0);
    const [emotionLog, setEmotionLog] = useState<EmotionLogEntry[]>([]);

    const router = useRouter();


    useEffect(() => {
        // Client-only clock: starts null to match SSR output, then syncs to
        // the real time. This first set is intentional, not a derivable value.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentTime(new Date());
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

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
            const res = await fetch("/api/therapy", { cache: "no-store" });
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
        // Initial data fetch from the server, not a derivable value.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchTodayMoodScore();
        fetchActivityCount();
        fetchTherapyData();
    }, []);

    const completionRate = 100;

    const wellnessScore = useMemo(
        () => computeWellnessScore({ moodScore: todayMoodScore, emotionLog, completionRate }),
        [todayMoodScore, emotionLog, completionRate]
    );

    const totalSessions = chatSessionCount + callHistory.length;

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
            title: "Completion Rate",
            value: `${completionRate}%`,
            icon: Trophy,
            color: "text-secondary-foreground",
            bgColor: "bg-secondary/20",
            description: "Perfect completion rate",
        },
        {
            title: "Therapy Sessions",
            value: `${totalSessions} session${totalSessions === 1 ? "" : "s"}`,
            icon: Heart,
            color: "text-accent-foreground",
            bgColor: "bg-accent/20",
            description: "Total sessions completed",
        },
        {
            title: "Total Activities",
            value: `${activityCount}`,
            icon: Activity,
            color: "text-success",
            bgColor: "bg-success/10",
            description: "Check-ins logged",
        },
    ]

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

    const handleCallEnd = () => {
        fetchTherapyData();
    };

    const handleStartTherapy = () => {
        router.push("/therapy");
    }


    return (
        <div className="min-h-screen bg-background">
            <Container className="pt-28 pb-16 space-y-8">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex flex-col gap-1"
                >
                    <h1 className="text-3xl font-bold font-heading">Welcome back</h1>
                    <p className="text-muted-foreground text-sm">
                        {currentTime?.toLocaleTimeString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                        })}
                    </p>
                </motion.div>

                {/* Hero: wellness score + start therapy + quick actions */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <Card className="lg:col-span-3 relative overflow-hidden">
                        <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-accent/10 to-transparent" />
                        <CardContent className="relative p-6 sm:p-8 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold font-heading text-lg">Start your session</h3>
                                    <p className="text-sm text-muted-foreground">Whenever you&apos;re ready, we&apos;re here to listen</p>
                                </div>
                            </div>

                            <Button
                                variant="default"
                                className="w-full justify-center p-6 h-auto rounded-2xl bg-linear-to-r from-primary via-primary/90 to-accent hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
                                onClick={handleStartTherapy}
                            >
                                <div className="flex items-center gap-4 w-full">
                                    <MessageCircle className="w-6 h-6 shrink-0" />
                                    <div className="flex flex-col items-start text-left">
                                        <h4 className="font-semibold text-lg">Start Therapy</h4>
                                        <p className="text-sm opacity-80">Begin a new conversation</p>
                                    </div>
                                </div>
                            </Button>

                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    variant="outline"
                                    className="flex h-27.5 flex-col items-center justify-center gap-2 rounded-2xl px-4 py-3 text-center hover:border-primary/50 transition-all duration-200"
                                    onClick={() => setShowMoodModal(true)}
                                >
                                    <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center">
                                        <Heart className="w-4.5 h-4.5 text-accent-foreground" />
                                    </div>
                                    <div className="font-medium text-sm">Track Mood</div>
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex h-27.5 flex-col items-center justify-center gap-2 rounded-2xl px-4 py-3 text-center hover:border-primary/50 transition-all duration-200"
                                    onClick={handleAICheckIn}
                                >
                                    <div className="w-9 h-9 rounded-full bg-secondary/25 flex items-center justify-center">
                                        <BrainCircuit className="w-4.5 h-4.5 text-secondary-foreground" />
                                    </div>
                                    <div className="font-medium text-sm">Check-in</div>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2 relative overflow-hidden">
                        <div className="absolute inset-0 bg-linear-to-br from-secondary/15 via-accent/10 to-transparent" />
                        <CardContent className="relative flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
                            <p className="text-sm font-medium text-muted-foreground">Wellness Score</p>
                            <div className="relative flex h-32 w-32 items-center justify-center">
                                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                                    <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-muted)" strokeWidth="9" />
                                    <circle
                                        cx="50" cy="50" r="42" fill="none"
                                        stroke="var(--color-primary)" strokeWidth="9" strokeLinecap="round"
                                        strokeDasharray={2 * Math.PI * 42}
                                        strokeDashoffset={2 * Math.PI * 42 * (1 - wellnessScore / 100)}
                                        className="transition-all duration-700 ease-out"
                                    />
                                </svg>
                                <div className="absolute flex flex-col items-center">
                                    <span className="text-3xl font-bold font-heading">{wellnessScore}</span>
                                    <span className="text-xs text-muted-foreground">/ 100</span>
                                </div>
                            </div>
                            <p className="text-sm font-medium text-foreground">{wellnessScoreLabel(wellnessScore)}</p>
                            <p className="text-xs text-muted-foreground">Based on mood, calm moments, and check-ins</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Today's overview stats */}
                <Card>
                    <CardHeader>
                        <CardTitle className="font-heading">Today&apos;s Overview</CardTitle>
                        <CardDescription>Your wellness metrics for {format(new Date(), "MMMM dd, yyyy")}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {wellnessStats.map((stat) => (
                            <div key={stat.title} className={cn(
                                "p-4 rounded-2xl transition-transform duration-200 hover:scale-[1.02]",
                                stat.bgColor)}>
                                <div className="flex items-center gap-2">
                                    <stat.icon className={cn("w-5 h-5", stat.color)} />
                                    <p className="text-sm font-medium">{stat.title}</p>
                                </div>
                                <p className="text-2xl font-bold font-heading mt-2">{stat.value}</p>
                                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Voice session + call history */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <VoiceSessionCard onCallEnd={handleCallEnd} />
                    </div>
                    <div className="lg:col-span-2">
                        <CallHistory calls={callHistory} />
                    </div>
                </div>

                {/* Emotion insights */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <EmotionTrends entries={emotionLog} />
                    </div>
                    <div className="lg:col-span-1">
                        <CrisisAlerts entries={emotionLog} />
                    </div>
                </div>

                {/* Guided activities — lighter-weight section */}
                <div className="space-y-3">
                    <div>
                        <h2 className="text-lg font-semibold font-heading">Guided Wellness Activities</h2>
                        <p className="text-sm text-muted-foreground">A few minutes of calm, whenever you need it</p>
                    </div>
                    <AnxietyGames />
                </div>

                {/* Download report */}
                <Card>
                    <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <FileText className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold font-heading">Your Mental Health Report</h3>
                                <p className="text-sm text-muted-foreground">See trends, session summaries, and insights</p>
                            </div>
                        </div>
                        <Button className="gap-2 shrink-0 rounded-full" onClick={() => router.push("/reports")}>
                            <Download className="w-4 h-4" />
                            View Report
                        </Button>
                    </CardContent>
                </Card>
            </Container>

            <Dialog open={showMoodModal} onOpenChange={setShowMoodModal}>
                <DialogContent className="sm:max-w-106.25">
                    <DialogHeader>
                        <DialogTitle>How are you feeling?</DialogTitle>
                        <DialogDescription>Move the slider to track your current mood.</DialogDescription>
                    </DialogHeader>
                    <MoodForm onSubmit={handleMoodSubmit} isLoading={isSavingMood} />
                </DialogContent>
            </Dialog>

            <ActivityLogger
                open={showActivityLogger} onOpenChange={setShowActivityLogger} onLogged={fetchActivityCount} />

        </div>
    );
}

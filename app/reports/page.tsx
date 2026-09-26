"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Download,
  FileText,
  TrendingUp,
  Sparkles,
  MessageSquareText,
  Loader2,
  User as UserIcon,
  PieChart,
  Brain,
  Calendar,
  ShieldCheck,
  Award,
  Filter,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { sessionsToEmotionLog, type EmotionLogEntry } from "@/lib/emotion-log";
import { EMOTION_COLORS, EMOTION_ORDER } from "@/lib/mock-emotion-analyzer";
import {
  getEmotionDistribution,
  getTrend,
  getSessionSummaries,
  getWellnessInsights,
  type MoodLogItem,
  type RawTherapySessionItem,
} from "@/lib/mock-report-data";
import { EmotionDistributionBars } from "@/components/charts/emotion-distribution-bars";
import { TrendSparkline } from "@/components/charts/trend-sparkline";
import { toast } from "sonner";
import { useAuth } from "@/lib/contexts/auth-context";
import { generatePDFReport } from "@/lib/reports/pdf-report";
import { Skeleton } from "@/components/ui/skeleton-primitives";

export default function ReportsPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<EmotionLogEntry[]>([]);
  const [moodEntries, setMoodEntries] = useState<MoodLogItem[]>([]);
  const [rawSessions, setRawSessions] = useState<RawTherapySessionItem[]>([]);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [trendDays, setTrendDays] = useState<number>(7);
  const [selectedEmotionFilter, setSelectedEmotionFilter] = useState<string>("all");

  const fetchReportData = async () => {
    try {
      const [therapyRes, moodRes] = await Promise.all([
        fetch("/api/therapy?full=true", { cache: "no-store" }),
        fetch("/api/mood", { cache: "no-store" }),
      ]);

      if (therapyRes.ok) {
        const { sessions } = (await therapyRes.json()) as {
          sessions: Parameters<typeof sessionsToEmotionLog>[0];
        };
        setRawSessions((sessions as unknown as RawTherapySessionItem[]) || []);
        setEntries(sessionsToEmotionLog(sessions || []));
      }

      if (moodRes.ok) {
        const { entries: moods } = (await moodRes.json()) as {
          entries: MoodLogItem[];
        };
        setMoodEntries(moods || []);
      }
    } catch (error) {
      console.error("Error loading report data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  const filteredEntries = useMemo(() => {
    if (selectedEmotionFilter === "all") return entries;
    return entries.filter((e) => e.emotion === selectedEmotionFilter);
  }, [entries, selectedEmotionFilter]);

  const distribution = useMemo(() => getEmotionDistribution(entries), [entries]);
  const trend = useMemo(
    () => getTrend(filteredEntries, moodEntries, trendDays),
    [filteredEntries, moodEntries, trendDays]
  );
  const sessions = useMemo(() => getSessionSummaries(rawSessions, entries), [rawSessions, entries]);
  const insights = useMemo(() => getWellnessInsights(entries, moodEntries), [entries, moodEntries]);

  const matchingCheckInsCount = useMemo(() => {
    return filteredEntries.length;
  }, [filteredEntries]);

  const avgScore = useMemo(() => {
    const valid = trend.filter((p) => p.score !== null);
    if (valid.length === 0) return null;
    return Math.round(valid.reduce((sum, p) => sum + (p.score ?? 0), 0) / valid.length);
  }, [trend]);

  const handleDownload = () => {
    setIsGeneratingPdf(true);
    try {
      generatePDFReport({
        user,
        entries,
        distribution,
        trend,
        sessions,
        insights,
      });
      toast.success("Report downloaded as PDF", {
        description: `Saved report for ${user?.name || "your account"} to your downloads folder.`,
      });
    } catch (error) {
      console.error("Error generating PDF report:", error);
      toast.error("Couldn't generate PDF report. Please try again.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadFiltered = () => {
    setIsGeneratingPdf(true);
    try {
      const filteredForExport = selectedEmotionFilter === "all"
        ? entries
        : entries.filter((e) => e.emotion === selectedEmotionFilter);

      const filteredDist = getEmotionDistribution(filteredForExport);
      const filteredTrend = getTrend(filteredForExport, moodEntries, trendDays);
      const filteredSessions = getSessionSummaries(rawSessions, filteredForExport);

      generatePDFReport({
        user,
        entries: filteredForExport,
        distribution: filteredDist,
        trend: filteredTrend,
        sessions: filteredSessions,
        insights,
      });

      const emotionLabel = selectedEmotionFilter === "all" ? "Emotional Analysis" : `${selectedEmotionFilter} Analysis`;
      toast.success(`${emotionLabel} PDF Report Downloaded`, {
        description: `Exported report for ${trendDays} days date range (${selectedEmotionFilter === "all" ? "All emotions" : selectedEmotionFilter}).`,
      });
    } catch (error) {
      console.error("Error generating filtered PDF report:", error);
      toast.error("Couldn't generate filtered PDF report. Please try again.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <Container className="pt-28 space-y-8">
        {/* Top Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                Mental Health Insights
              </span>
              {user?.name && (
                <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 font-normal">
                  <UserIcon className="w-3 h-3" />
                  {user.name}
                </Badge>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold font-heading tracking-tight">
              Comprehensive Health Report
            </h1>
            <p className="text-sm text-muted-foreground">
              Emotional stability trends, mood breakdown charts, and session summaries.
            </p>
          </div>
        </motion.div>



        {/* Analytics Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Emotional Analysis Component */}
          <Card className="lg:col-span-2 border-border/60 shadow-sm rounded-3xl overflow-hidden bg-card/70 backdrop-blur">
            <CardHeader className="pb-3 border-b border-border/40 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="font-heading text-lg">
                      {selectedEmotionFilter === "all" ? "Emotional Stability Analysis" : `${selectedEmotionFilter} Analysis & Trend`}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Filter analytics by emotion, date or month &amp; export filtered PDF reports
                    </CardDescription>
                  </div>
                </div>

                <Button
                  onClick={handleDownloadFiltered}
                  disabled={isGeneratingPdf || isLoading}
                  size="sm"
                  className="gap-1.5 rounded-full px-4 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs shrink-0 active:scale-95"
                >
                  {isGeneratingPdf ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>Download Report</span>
                </Button>
              </div>

              {/* Filtering Toolbar */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                {/* Date Range / Month Select */}
                <div className="flex items-center gap-1.5 min-w-[130px]">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <Select value={String(trendDays)} onValueChange={(val) => setTrendDays(Number(val))}>
                    <SelectTrigger className="w-full rounded-2xl bg-background border-border/60 text-xs font-medium">
                      <SelectValue placeholder="Date Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Last 7 Days</SelectItem>
                      <SelectItem value="14">Last 14 Days</SelectItem>
                      <SelectItem value="30">Last 30 Days (Month)</SelectItem>
                      <SelectItem value="90">Last 90 Days (Quarter)</SelectItem>
                      <SelectItem value="365">All Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Emotion Select */}
                <div className="flex items-center gap-1.5 min-w-[140px]">
                  <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <Select value={selectedEmotionFilter} onValueChange={setSelectedEmotionFilter}>
                    <SelectTrigger className="w-full rounded-2xl bg-background border-border/60 text-xs font-medium">
                      <SelectValue placeholder="Emotion Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Emotions</SelectItem>
                      {EMOTION_ORDER.map((emotion) => (
                        <SelectItem key={emotion} value={emotion}>
                          {emotion}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Analytics Metrics Pills */}
                <div className="flex items-center gap-2 ml-auto text-xs text-muted-foreground flex-wrap">
                  <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-semibold text-[11px] border border-primary/20">
                    {matchingCheckInsCount} Check-in{matchingCheckInsCount === 1 ? "" : "s"}
                  </span>
                  {avgScore !== null && (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] border border-emerald-500/20">
                      Avg Score: {avgScore}/100
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              {isLoading ? (
                <Skeleton className="h-44 w-full rounded-2xl" />
              ) : (
                <TrendSparkline points={trend} />
              )}
            </CardContent>
          </Card>

          {/* Emotion Distribution Bar Chart */}
          <Card className="border-border/60 shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <PieChart className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="font-heading text-lg">Emotion Breakdown</CardTitle>
                  <CardDescription className="text-xs">Distribution across all check-ins</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {isLoading ? (
                <Skeleton className="h-44 w-full rounded-2xl" />
              ) : (
                <EmotionDistributionBars rows={distribution} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Session Summaries Recap Section */}
        <Card className="border-border/60 shadow-sm rounded-3xl overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <MessageSquareText className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="font-heading text-lg">Session Summaries & Recaps</CardTitle>
                  <CardDescription className="text-xs">
                    Overview of your recent therapeutic conversations
                  </CardDescription>
                </div>
              </div>
              <span className="text-xs font-semibold text-muted-foreground px-2.5 py-1 rounded-full bg-muted">
                {sessions.length} Session{sessions.length === 1 ? "" : "s"}
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full rounded-2xl" />
                <Skeleton className="h-16 w-full rounded-2xl" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <MessageSquareText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold font-heading text-foreground">No Therapy Sessions Recorded</p>
                  <p className="text-xs text-muted-foreground max-w-sm mt-0.5">
                    Start a chat or voice conversation to automatically generate therapy recaps and emotion logs.
                  </p>
                </div>
              </div>
            ) : (
              <div className="max-h-[380px] sm:max-h-[440px] overflow-y-auto pr-2 space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border/40 hover:bg-muted/60 transition-all duration-200"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 justify-between sm:justify-start">
                        <p className="text-xs sm:text-sm font-bold font-heading text-foreground">
                          {format(session.date, "MMMM d, yyyy")}
                        </p>
                        <span className="text-xs text-muted-foreground">· {session.durationMinutes} min session</span>
                        {session.dominantEmotion && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs border font-medium px-2 py-0.5",
                              EMOTION_COLORS[session.dominantEmotion]?.bg || "",
                              EMOTION_COLORS[session.dominantEmotion]?.border || ""
                            )}
                          >
                            <span
                              className={cn(
                                "h-1.5 w-1.5 rounded-full mr-1.5",
                                EMOTION_COLORS[session.dominantEmotion]?.dot || ""
                              )}
                            />
                            {session.dominantEmotion}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2">
                        {session.blurb}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security & Privacy Guarantee */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span>Report generated securely. Confidential & encrypted.</span>
        </div>
      </Container>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Download, FileText, TrendingUp, Sparkles, MessageSquareText, Loader2, User as UserIcon } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { sessionsToEmotionLog, type EmotionLogEntry } from "@/lib/emotion-log";
import { EMOTION_COLORS } from "@/lib/mock-emotion-analyzer";
import {
  getEmotionDistribution,
  getTrend,
  getSessionSummaries,
  getWellnessInsights,
} from "@/lib/mock-report-data";
import { EmotionDistributionBars } from "@/components/charts/emotion-distribution-bars";
import { TrendSparkline } from "@/components/charts/trend-sparkline";
import { toast } from "sonner";
import { useAuth } from "@/lib/contexts/auth-context";
import { generatePDFReport } from "@/lib/reports/pdf-report";

export default function ReportsPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<EmotionLogEntry[]>([]);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const fetchEntries = async () => {
    try {
      const res = await fetch("/api/therapy", { cache: "no-store" });
      if (!res.ok) return;
      const { sessions } = (await res.json()) as {
        sessions: Parameters<typeof sessionsToEmotionLog>[0];
      };
      setEntries(sessionsToEmotionLog(sessions));
    } catch (error) {
      console.error("Error loading report data:", error);
    }
  };

  useEffect(() => {
    // Initial data fetch from the server, not a derivable value.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEntries();
  }, []);

  const distribution = useMemo(() => getEmotionDistribution(entries), [entries]);
  const trend = useMemo(() => getTrend(entries), [entries]);
  const sessions = useMemo(() => getSessionSummaries(entries), [entries]);
  const insights = useMemo(() => getWellnessInsights(entries), [entries]);

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

  return (
    <div className="min-h-screen bg-background">
      <Container className="pt-28 pb-16 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-3xl font-bold font-heading">Your Mental Health Report</h1>
              {user?.name && (
                <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 font-normal">
                  <UserIcon className="w-3 h-3" />
                  {user.name}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              Emotional trends, session summaries, and wellness insights over time.
            </p>
          </div>
          <Button
            onClick={handleDownload}
            disabled={isGeneratingPdf}
            className="gap-2 rounded-full shrink-0 shadow-md shadow-primary/10 transition-transform active:scale-95"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Download PDF Report
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {insights.map((insight, i) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <Card className="h-full bg-linear-to-br from-primary/8 via-transparent to-transparent">
                <CardContent className="p-5 flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-sm leading-relaxed">{insight.text}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <CardTitle className="font-heading">Emotional Trend</CardTitle>
              </div>
              <CardDescription>Crisis-free share of check-ins over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <TrendSparkline points={trend} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Emotion Breakdown</CardTitle>
              <CardDescription>All logged check-ins</CardDescription>
            </CardHeader>
            <CardContent>
              <EmotionDistributionBars rows={distribution} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquareText className="w-4 h-4 text-primary" />
              <CardTitle className="font-heading">Session Summaries</CardTitle>
            </div>
            <CardDescription>A recap of recent conversations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sessions.map((session) => (
              <div key={session.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl bg-muted/30">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <FileText className="w-4.5 h-4.5 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{format(session.date, "MMM d, yyyy")}</p>
                    <span className="text-xs text-muted-foreground">{session.durationMinutes} min</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs border",
                        EMOTION_COLORS[session.dominantEmotion].bg,
                        EMOTION_COLORS[session.dominantEmotion].border
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", EMOTION_COLORS[session.dominantEmotion].dot)} />
                      {session.dominantEmotion}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{session.blurb}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </Container>
    </div>
  );
}

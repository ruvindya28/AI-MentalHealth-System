"use client";

import { useEffect, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  User,
  Sun,
  Moon,
  Monitor,
  Bell,
  ShieldCheck,
  Save,
  Mail,
  Globe,
  Calendar,
  KeyRound,
  Activity,
  Heart,
  MessageCircle,
  LogOut,
  Loader2,
  CheckCircle2,
  History,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/contexts/auth-context";
import { cn } from "@/lib/utils";

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

interface ToggleSetting {
  id: string;
  label: string;
  description: string;
  defaultChecked: boolean;
}

const NOTIFICATION_SETTINGS: ToggleSetting[] = [
  {
    id: "sessionReminders",
    label: "Session reminders",
    description: "Gentle nudges to check in when you haven't in a while",
    defaultChecked: true,
  },
  {
    id: "weeklySummary",
    label: "Weekly wellness summary",
    description: "A recap of your mood and activity trends each week",
    defaultChecked: true,
  },
  {
    id: "crisisFollowup",
    label: "Crisis follow-up check-ins",
    description: "A caring follow-up after a flagged conversation",
    defaultChecked: true,
  },
];

const PRIVACY_SETTINGS: ToggleSetting[] = [
  {
    id: "storeHistory",
    label: "Store conversation history",
    description: "Keep past sessions available in your History",
    defaultChecked: true,
  },
  {
    id: "personalize",
    label: "Personalize responses",
    description: "Use your history to tailor how the AI responds",
    defaultChecked: true,
  },
  {
    id: "shareAnalytics",
    label: "Share anonymous usage analytics",
    description: "Help us improve MindCare with anonymized data",
    defaultChecked: false,
  },
];

interface RecentLogItem {
  id: string;
  type: "therapy" | "mood" | "activity";
  title: string;
  timestamp: Date;
  detail?: string;
}

export default function ProfilePage() {
  const { theme, setTheme } = useTheme();
  const { user, setUser, refetch } = useAuth();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Profile fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password fields
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Settings
  const [notifications, setNotifications] = useState<Record<string, boolean>>({});
  const [privacy, setPrivacy] = useState<Record<string, boolean>>({});

  // Activity & Logging stats
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [stats, setStats] = useState({
    therapySessions: 0,
    moodLogs: 0,
    activities: 0,
  });
  const [recentLogs, setRecentLogs] = useState<RecentLogItem[]>([]);

  // Sign out state
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Sync user data to local state
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setTimezone(user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");

      const initialNotifications = Object.fromEntries(
        NOTIFICATION_SETTINGS.map((s) => [
          s.id,
          user.preferences?.notifications?.[s.id] ?? s.defaultChecked,
        ])
      );
      setNotifications(initialNotifications);

      const initialPrivacy = Object.fromEntries(
        PRIVACY_SETTINGS.map((s) => [
          s.id,
          user.preferences?.privacy?.[s.id] ?? s.defaultChecked,
        ])
      );
      setPrivacy(initialPrivacy);
    }
  }, [user]);

  // Fetch real user activity logging stats
  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    const fetchUserActivityLogs = async () => {
      setIsLoadingStats(true);
      try {
        const [therapyRes, moodRes, activitiesRes] = await Promise.all([
          fetch("/api/therapy", { cache: "no-store" }),
          fetch("/api/mood", { cache: "no-store" }),
          fetch("/api/activities", { cache: "no-store" }),
        ]);

        const therapyData = therapyRes.ok ? await therapyRes.json() : { sessions: [] };
        const moodData = moodRes.ok ? await moodRes.json() : { entries: [] };
        const activitiesData = activitiesRes.ok ? await activitiesRes.json() : { activities: [] };

        if (!isMounted) return;

        const sessionsList = therapyData.sessions || [];
        const moodList = moodData.entries || [];
        const activityList = activitiesData.activities || [];

        setStats({
          therapySessions: sessionsList.length,
          moodLogs: moodList.length,
          activities: activityList.length,
        });

        // Assemble recent activity logs
        const logs: RecentLogItem[] = [];

        sessionsList.slice(0, 3).forEach((s: { _id: string; createdAt: string; type?: string; messages?: { content: string }[] }) => {
          const firstMsg = s.messages?.[0]?.content;
          logs.push({
            id: `session-${s._id}`,
            type: "therapy",
            title: s.type === "voice" ? "Voice Call Session" : "Therapy Chat",
            timestamp: new Date(s.createdAt),
            detail: firstMsg ? (firstMsg.length > 35 ? `${firstMsg.slice(0, 35)}...` : firstMsg) : "Conversation logged",
          });
        });

        moodList.slice(0, 3).forEach((m: { _id?: string; createdAt: string; moodScore: number }) => {
          logs.push({
            id: `mood-${m._id || m.createdAt}`,
            type: "mood",
            title: "Mood Check-in",
            timestamp: new Date(m.createdAt),
            detail: `Score: ${m.moodScore}/100`,
          });
        });

        activityList.slice(0, 2).forEach((a: { _id?: string; createdAt: string; name: string }) => {
          logs.push({
            id: `act-${a._id || a.createdAt}`,
            type: "activity",
            title: a.name || "Wellness Activity",
            timestamp: new Date(a.createdAt),
            detail: "Completed activity",
          });
        });

        // Sort descending by timestamp
        logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        setRecentLogs(logs.slice(0, 5));
      } catch (err) {
        console.error("Error fetching user activity logs:", err);
      } finally {
        if (isMounted) setIsLoadingStats(false);
      }
    };

    fetchUserActivityLogs();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Initials generator
  const initials = (name || user?.name || "U")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "MC";

  // Auto-detect browser timezone
  const handleDetectTimezone = () => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) {
        setTimezone(tz);
        toast.info("Timezone detected", { description: `Set to ${tz}` });
      }
    } catch {
      toast.error("Could not detect local timezone");
    }
  };

  // Save profile updates
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          timezone: timezone.trim(),
          preferences: {
            notifications,
            privacy,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      setUser(data.user);
      await refetch();
      toast.success("Profile updated", { description: "Your changes have been saved to your account." });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update profile. Please try again.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Toggle notification settings and persist immediately
  const toggleNotification = async (id: string, checked: boolean) => {
    const updated = { ...notifications, [id]: checked };
    setNotifications(updated);

    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferences: { notifications: updated },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        toast.success(checked ? "Notification enabled" : "Notification disabled");
      }
    } catch {
      toast.error("Failed to save notification preference");
    }
  };

  // Toggle privacy settings and persist immediately
  const togglePrivacy = async (id: string, checked: boolean) => {
    const updated = { ...privacy, [id]: checked };
    setPrivacy(updated);

    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferences: { privacy: updated },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        toast.success(checked ? "Setting enabled" : "Setting disabled");
      }
    } catch {
      toast.error("Failed to save privacy preference");
    }
  };

  // Password change handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error("Please enter your current password");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to change password");
      }

      toast.success("Password updated", { description: "Your account password was successfully changed." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordSection(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Sign out handler
  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) throw new Error("Logout request failed");

      setUser(null);
      startTransition(() => {
        router.push("/login");
        router.refresh();
      });
    } catch {
      toast.error("Couldn't sign out. Please try again.");
      setIsSigningOut(false);
    }
  };

  // Loading skeleton if user is still hydrating
  if (!mounted || isPending) {
    return (
      <div className="min-h-screen bg-background">
        <Container className="pt-28 pb-16 max-w-3xl space-y-8">
          <div className="space-y-2 animate-pulse">
            <div className="h-8 w-48 bg-muted rounded-xl" />
            <div className="h-4 w-72 bg-muted/60 rounded-lg" />
          </div>
          <Card className="animate-pulse">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-muted" />
                <div className="space-y-2 flex-1">
                  <div className="h-5 w-40 bg-muted rounded-md" />
                  <div className="h-3.5 w-60 bg-muted/60 rounded-md" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-10 bg-muted rounded-xl" />
                <div className="h-10 bg-muted rounded-xl" />
              </div>
            </CardContent>
          </Card>
        </Container>
      </div>
    );
  }

  // Not authenticated fallback (if middleware bypass occurs)
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8 space-y-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-xl font-heading">Authentication Required</CardTitle>
          <CardDescription>
            Please sign in to view and manage your personal MindCare profile.
          </CardDescription>
          <Button asChild className="w-full rounded-xl" size="lg">
            <Link href="/login?from=/profile">Sign In</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const memberSinceFormatted = user.createdAt
    ? format(new Date(user.createdAt), "MMMM d, yyyy")
    : "Active Member";

  return (
    <div className="min-h-screen bg-background">
      <Container className="pt-28 pb-16 max-w-3xl space-y-8">
        {/* Header with Title and User Badges */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-3xl font-bold font-heading">Profile Settings</h1>
              <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 font-normal">
                <CheckCircle2 className="w-3 h-3" />
                Logged In
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              Manage your personal information, account preferences, and activity logs.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="rounded-full gap-2 self-start sm:self-auto hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
          >
            {isSigningOut ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <LogOut className="w-3.5 h-3.5" />
            )}
            Sign Out
          </Button>
        </motion.div>

        {/* User Logging & Activity Overview Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="relative overflow-hidden border-primary/20 bg-linear-to-br from-primary/5 via-accent/5 to-transparent shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <CardTitle className="text-base font-heading">Activity &amp; Session Logs</CardTitle>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5 text-primary/70" />
                  <span>Member since {memberSinceFormatted}</span>
                </div>
              </div>
              <CardDescription>
                Summary of your live mental health check-ins, chats, and wellness logs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Activity Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-card border border-border/80 text-center transition-all hover:border-primary/40">
                  <div className="flex justify-center mb-1.5">
                    <MessageCircle className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-xl font-bold font-heading">
                    {isLoadingStats ? "..." : stats.therapySessions}
                  </p>
                  <p className="text-xs text-muted-foreground">Therapy Sessions</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-card border border-border/80 text-center transition-all hover:border-primary/40">
                  <div className="flex justify-center mb-1.5">
                    <Heart className="w-4 h-4 text-rose-500" />
                  </div>
                  <p className="text-xl font-bold font-heading">
                    {isLoadingStats ? "..." : stats.moodLogs}
                  </p>
                  <p className="text-xs text-muted-foreground">Mood Check-ins</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-card border border-border/80 text-center transition-all hover:border-primary/40">
                  <div className="flex justify-center mb-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                  </div>
                  <p className="text-xl font-bold font-heading">
                    {isLoadingStats ? "..." : stats.activities}
                  </p>
                  <p className="text-xs text-muted-foreground">Activities Logged</p>
                </div>
              </div>

              {/* Recent Activity Log Feed */}
              <div className="pt-2 border-t border-border/60">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Recent Logs
                  </span>
                  <Link
                    href="/history"
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    View all history <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                {isLoadingStats ? (
                  <div className="flex items-center justify-center py-4 text-xs text-muted-foreground gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                    Loading activity logs...
                  </div>
                ) : recentLogs.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2 text-center">
                    No recent activity logs recorded yet. Start a therapy chat or mood check-in!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {recentLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between gap-3 text-xs p-2.5 rounded-xl bg-background/80 border border-border/60"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            {log.type === "therapy" ? (
                              <MessageCircle className="w-3 h-3 text-primary" />
                            ) : log.type === "mood" ? (
                              <Heart className="w-3 h-3 text-rose-500" />
                            ) : (
                              <Activity className="w-3 h-3 text-amber-500" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="font-medium text-foreground truncate block">
                              {log.title}
                            </span>
                            {log.detail && (
                              <span className="text-muted-foreground truncate block text-[11px]">
                                {log.detail}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-[11px] text-muted-foreground shrink-0">
                          {format(log.timestamp, "MMM d, h:mm a")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Personal Preferences (User Info) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                <CardTitle className="font-heading">Personal Information</CardTitle>
              </div>
              <CardDescription>Your verified account credentials and identity</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-5">
                {/* Avatar Display */}
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary/30 to-accent/30 text-lg font-bold font-heading text-foreground shadow-xs ring-2 ring-primary/20">
                    {initials}
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-foreground">{name || user.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3 h-3 text-primary/70" />
                      {email}
                    </p>
                    <p className="text-[11px] text-muted-foreground/80">
                      Your initials are derived from your real name across MindCare.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Display Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email">Email Address</Label>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Primary login
                      </span>
                    </div>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      disabled
                      className="bg-muted/50 cursor-not-allowed opacity-90"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="timezone" className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-primary" />
                      Timezone
                    </Label>
                    <button
                      type="button"
                      onClick={handleDetectTimezone}
                      className="text-xs text-primary hover:underline flex items-center gap-1 font-medium transition-opacity hover:opacity-80"
                    >
                      <RefreshCw className="w-3 h-3" /> Detect my timezone
                    </button>
                  </div>
                  <div className="sm:w-1/2">
                    <Input
                      id="timezone"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      placeholder="e.g. Asia/Colombo or UTC"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <Button
                    type="submit"
                    disabled={isSavingProfile}
                    className="gap-2 rounded-full px-6 bg-linear-to-r from-primary to-primary/90 shadow-md shadow-primary/10"
                  >
                    {isSavingProfile ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Account Security (Change Password) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-primary" />
                  <CardTitle className="font-heading">Account Security</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPasswordSection(!showPasswordSection)}
                  className="text-xs rounded-full"
                >
                  {showPasswordSection ? "Cancel" : "Change Password"}
                </Button>
              </div>
              <CardDescription>Manage your password and security credentials</CardDescription>
            </CardHeader>
            {showPasswordSection && (
              <CardContent className="pt-0">
                <form onSubmit={handleChangePassword} className="space-y-4 pt-2 border-t border-border/60">
                  <div className="space-y-1.5">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isChangingPassword}
                    className="gap-2 rounded-full"
                  >
                    {isChangingPassword ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <KeyRound className="w-4 h-4" />
                    )}
                    Update Password
                  </Button>
                </form>
              </CardContent>
            )}
          </Card>
        </motion.div>

        {/* Theme Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Theme</CardTitle>
              <CardDescription>Choose how MindCare looks on this device</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {THEME_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTheme(option.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-2xl border p-4 transition-colors",
                      mounted && theme === option.value
                        ? "border-primary bg-primary/10 font-semibold"
                        : "border-border hover:bg-muted/60"
                    )}
                  >
                    <option.icon className="w-5 h-5 text-primary" />
                    <span className="text-sm">{option.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notifications Settings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                <CardTitle className="font-heading">Notifications</CardTitle>
              </div>
              <CardDescription>What MindCare should let you know about</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {NOTIFICATION_SETTINGS.map((setting) => (
                <div
                  key={setting.id}
                  className="flex items-center justify-between gap-4 py-3 border-b border-border/60 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">{setting.label}</p>
                    <p className="text-xs text-muted-foreground">{setting.description}</p>
                  </div>
                  <Switch
                    checked={notifications[setting.id] ?? setting.defaultChecked}
                    onCheckedChange={(checked) => toggleNotification(setting.id, checked)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Privacy Settings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <CardTitle className="font-heading">Privacy &amp; Data</CardTitle>
              </div>
              <CardDescription>Control how your mental health and usage data is stored</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {PRIVACY_SETTINGS.map((setting) => (
                <div
                  key={setting.id}
                  className="flex items-center justify-between gap-4 py-3 border-b border-border/60 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">{setting.label}</p>
                    <p className="text-xs text-muted-foreground">{setting.description}</p>
                  </div>
                  <Switch
                    checked={privacy[setting.id] ?? setting.defaultChecked}
                    onCheckedChange={(checked) => togglePrivacy(setting.id, checked)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </Container>
    </div>
  );
}

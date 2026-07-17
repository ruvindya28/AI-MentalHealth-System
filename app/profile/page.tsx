"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { User, Sun, Moon, Monitor, Bell, ShieldCheck, Save } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
  { id: "session-reminders", label: "Session reminders", description: "Gentle nudges to check in when you haven't in a while", defaultChecked: true },
  { id: "weekly-summary", label: "Weekly wellness summary", description: "A recap of your mood and activity trends each week", defaultChecked: true },
  { id: "crisis-followup", label: "Crisis follow-up check-ins", description: "A caring follow-up after a flagged conversation", defaultChecked: true },
];

const PRIVACY_SETTINGS: ToggleSetting[] = [
  { id: "store-history", label: "Store conversation history", description: "Keep past sessions available in your History", defaultChecked: true },
  { id: "personalize", label: "Personalize responses", description: "Use your history to tailor how the AI responds", defaultChecked: true },
  { id: "share-analytics", label: "Share anonymous usage analytics", description: "Help us improve MindCare with anonymized data", defaultChecked: false },
];

export default function ProfilePage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("Alex Morgan");
  const [email, setEmail] = useState("alex@example.com");
  const [timezone, setTimezone] = useState("UTC");

  const [notifications, setNotifications] = useState(
    Object.fromEntries(NOTIFICATION_SETTINGS.map((s) => [s.id, s.defaultChecked]))
  );
  const [privacy, setPrivacy] = useState(
    Object.fromEntries(PRIVACY_SETTINGS.map((s) => [s.id, s.defaultChecked]))
  );

  // next-themes only knows the real theme after mount (it reads localStorage /
  // matchMedia client-side) — rendering the selected state before that would
  // mismatch the server-rendered HTML. This first set is intentional, not a
  // derivable value.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Profile updated", { description: "Your preferences have been saved." });
  };

  const toggleNotification = (id: string, checked: boolean) => {
    setNotifications((prev) => ({ ...prev, [id]: checked }));
    toast.success(checked ? "Notification enabled" : "Notification disabled");
  };

  const togglePrivacy = (id: string, checked: boolean) => {
    setPrivacy((prev) => ({ ...prev, [id]: checked }));
    toast.success(checked ? "Setting enabled" : "Setting disabled");
  };

  return (
    <div className="min-h-screen bg-background">
      <Container className="pt-28 pb-16 max-w-3xl space-y-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-3xl font-bold font-heading">Profile Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Personalize your MindCare experience.
          </p>
        </motion.div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              <CardTitle className="font-heading">Personal Preferences</CardTitle>
            </div>
            <CardDescription>How we address you and keep in touch</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary/30 to-accent/30 text-lg font-semibold font-heading">
                  {name
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <p className="text-sm text-muted-foreground">
                  Your initials are shown as your avatar across MindCare.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Display Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5 sm:w-1/2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input id="timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)} />
              </div>

              <Button type="submit" className="gap-2 rounded-full">
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>

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
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-muted/60"
                  )}
                >
                  <option.icon className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

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
              <div key={setting.id} className="flex items-center justify-between gap-4 py-3 border-b border-border/60 last:border-0">
                <div>
                  <p className="text-sm font-medium">{setting.label}</p>
                  <p className="text-xs text-muted-foreground">{setting.description}</p>
                </div>
                <Switch
                  checked={notifications[setting.id]}
                  onCheckedChange={(checked) => toggleNotification(setting.id, checked)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <CardTitle className="font-heading">Privacy</CardTitle>
            </div>
            <CardDescription>Control how your data is used</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {PRIVACY_SETTINGS.map((setting) => (
              <div key={setting.id} className="flex items-center justify-between gap-4 py-3 border-b border-border/60 last:border-0">
                <div>
                  <p className="text-sm font-medium">{setting.label}</p>
                  <p className="text-xs text-muted-foreground">{setting.description}</p>
                </div>
                <Switch
                  checked={privacy[setting.id]}
                  onCheckedChange={(checked) => togglePrivacy(setting.id, checked)}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </Container>
    </div>
  );
}

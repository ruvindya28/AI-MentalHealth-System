"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2, Volume2, PhoneOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { VoiceOrb, type VoiceOrbState } from "@/components/voice/voice-orb";
import {
  analyzeMessage,
  createTherapySession,
  persistTherapyMessage,
  fetchTherapyReply,
} from "@/lib/therapy-client";
import { generateReply } from "@/lib/mock-therapist-responses";
import { MAX_RECORDING_MS, pickRecordingMimeType, blobToBase64 } from "@/lib/voice/audio-recording";

type Phase = "idle" | "recording" | "processing" | "speaking";

interface LastExchange {
  userText: string;
  replyText: string;
  technique: string;
}

interface VoiceSessionCardProps {
  onCallEnd: () => void;
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function VoiceSessionCard({ onCallEnd }: VoiceSessionCardProps) {
  const [isSupported, setIsSupported] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [lastExchange, setLastExchange] = useState<LastExchange | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const recordTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const turnGenerationRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Client-only capability check — must run in an effect to avoid an SSR
    // mismatch (navigator/MediaRecorder don't exist on the server).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsSupported(
      typeof navigator !== "undefined" &&
        !!navigator.mediaDevices?.getUserMedia &&
        typeof MediaRecorder !== "undefined"
    );
  }, []);

  useEffect(() => {
    if (!isActive) return;
    const timer = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [isActive]);

  // Release the mic and cancel any in-flight turn if the card unmounts mid-call.
  useEffect(() => {
    return () => {
      turnGenerationRef.current += 1;
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (recordTimeoutRef.current) clearTimeout(recordTimeoutRef.current);
    };
  }, []);

  const speakWithBrowserSpeech = (text: string, generation: number): boolean => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const preferredVoice =
          voices.find(
            (v) =>
              (v.name.includes("Natural") ||
                v.name.includes("Google") ||
                v.name.includes("Samantha") ||
                v.name.includes("Jenny") ||
                v.name.includes("Zira")) &&
              v.lang.startsWith("en")
          ) || voices.find((v) => v.lang.startsWith("en"));

        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.onstart = () => {
          if (turnGenerationRef.current === generation) setPhase("speaking");
        };
        utterance.onend = () => {
          if (turnGenerationRef.current === generation) setPhase("idle");
        };
        utterance.onerror = () => {
          if (turnGenerationRef.current === generation) setPhase("idle");
        };

        setPhase("speaking");
        window.speechSynthesis.speak(utterance);
        return true;
      } catch (e) {
        console.error("Browser speech synthesis failed:", e);
      }
    }
    return false;
  };

  const clearRecordTimeout = () => {
    if (recordTimeoutRef.current) {
      clearTimeout(recordTimeoutRef.current);
      recordTimeoutRef.current = null;
    }
  };

  const startCall = async () => {
    if (!isSupported) {
      toast.error("Voice sessions aren't supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
    } catch (error) {
      console.error("Microphone access denied:", error);
      toast.error("Microphone access is required for voice sessions. Please allow microphone permission and try again.");
      return;
    }

    turnGenerationRef.current += 1;
    sessionIdRef.current = null;
    setLastExchange(null);
    setElapsed(0);
    setPhase("idle");
    setIsActive(true);
  };

  const endCall = () => {
    turnGenerationRef.current += 1;
    clearRecordTimeout();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    sessionIdRef.current = null;
    setIsActive(false);
    setPhase("idle");
    onCallEnd();
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    const mimeType = pickRecordingMimeType();
    if (!mimeType) {
      toast.error("Voice recording isn't supported in this browser.");
      return;
    }

    const generation = turnGenerationRef.current;
    chunksRef.current = [];

    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => handleRecordingStopped(mimeType, generation);
    mediaRecorderRef.current = recorder;

    recorder.start();
    setPhase("recording");
    recordTimeoutRef.current = setTimeout(() => stopRecordingAndSend(), MAX_RECORDING_MS);
  };

  const stopRecordingAndSend = () => {
    clearRecordTimeout();
    mediaRecorderRef.current?.stop();
  };

  const handleRecordingStopped = async (mimeType: string, generation: number) => {
    if (turnGenerationRef.current !== generation) return;

    const blob = new Blob(chunksRef.current, { type: mimeType });
    chunksRef.current = [];

    if (blob.size === 0) {
      toast.error("We didn't catch that — try again.");
      setPhase("idle");
      return;
    }

    setPhase("processing");

    try {
      const audioBase64 = await blobToBase64(blob);
      const transcribeRes = await fetch("/api/voice/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioBase64, mimeType }),
      });
      if (turnGenerationRef.current !== generation) return;

      if (!transcribeRes.ok) {
        toast.error("We couldn't process that recording. Please try again.");
        setPhase("idle");
        return;
      }

      const { transcript } = (await transcribeRes.json()) as { transcript: string };
      if (!transcript.trim()) {
        toast.error("We didn't catch that — try again.");
        setPhase("idle");
        return;
      }

      const analysis = await analyzeMessage(transcript);
      if (turnGenerationRef.current !== generation) return;

      if (!sessionIdRef.current) {
        sessionIdRef.current = await createTherapySession("voice");
      }
      const sessionId = sessionIdRef.current;
      if (turnGenerationRef.current !== generation) return;

      if (sessionId) {
        // Awaited so the message is in the database before fetchTherapyReply
        // asks the server to build conversation history from it.
        await persistTherapyMessage(sessionId, {
          role: "user",
          content: transcript,
          emotion: analysis.emotion,
          confidence: analysis.confidence,
          crisisLevel: analysis.crisisLevel,
        });
      }
      if (turnGenerationRef.current !== generation) return;

      const reply = sessionId
        ? await fetchTherapyReply(sessionId, analysis)
        : generateReply(analysis);
      if (turnGenerationRef.current !== generation) return;

      setLastExchange({ userText: transcript, replyText: reply.text, technique: reply.technique });

      try {
        const synthesizeRes = await fetch("/api/voice/synthesize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: reply.text }),
        });
        if (turnGenerationRef.current !== generation) return;
        if (!synthesizeRes.ok) throw new Error("Synthesize request failed");

        const { audioBase64: outBase64, mimeType: outMimeType } = (await synthesizeRes.json()) as {
          audioBase64: string;
          mimeType: string;
        };
        if (turnGenerationRef.current !== generation || !audioRef.current) {
          setPhase("idle");
          return;
        }

        audioRef.current.src = `data:${outMimeType};base64,${outBase64}`;
        setPhase("speaking");
        await audioRef.current.play();
      } catch (error) {
        console.warn("Cloud TTS unavailable (quota or network), falling back to browser speech synthesis:", error);
        if (turnGenerationRef.current === generation) {
          const spoke = speakWithBrowserSpeech(reply.text, generation);
          if (!spoke) {
            toast.error("Voice playback unavailable — showing your reply as text.");
            setPhase("idle");
          }
        }
      }
    } catch (error) {
      console.error("Voice turn failed:", error);
      if (turnGenerationRef.current === generation) {
        toast.error("Something went wrong. Please try again.");
        setPhase("idle");
      }
    }
  };

  const handleOrbTap = () => {
    if (!isActive) {
      startCall();
      return;
    }
    if (phase === "idle") {
      startRecording();
      return;
    }
    if (phase === "recording") {
      stopRecordingAndSend();
      return;
    }
  };

  const handleAudioEnded = () => {
    setPhase("idle");
  };

  const orbState: VoiceOrbState = !isActive
    ? "idle"
    : phase === "recording"
      ? "listening"
      : phase === "processing"
        ? "processing"
        : phase === "speaking"
          ? "speaking"
          : "idle";

  const orbDisabled = isActive && (phase === "processing" || phase === "speaking");

  const phaseLabel = !isActive
    ? "Ready"
    : phase === "recording"
      ? "Listening…"
      : phase === "processing"
        ? "Thinking…"
        : phase === "speaking"
          ? "Speaking…"
          : "Tap to speak";

  return (
    <Card className="border-primary/10 h-full">
      <CardHeader>
        <CardTitle>Voice Session</CardTitle>
        <CardDescription>Talk it out with your AI therapist</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center gap-6 py-6">
        <VoiceOrb state={orbState} size={128}>
          <button
            type="button"
            onClick={handleOrbTap}
            disabled={orbDisabled}
            className={cn(
              "flex h-full w-full items-center justify-center rounded-full transition-transform duration-300",
              !orbDisabled && "hover:scale-105 cursor-pointer"
            )}
          >
            {!isActive || phase === "idle" ? (
              <Mic className="w-7 h-7 text-primary-foreground" />
            ) : phase === "recording" ? (
              <Square className="w-6 h-6 text-primary-foreground" />
            ) : phase === "processing" ? (
              <Loader2 className="w-7 h-7 text-primary-foreground animate-spin" />
            ) : (
              <Volume2 className="w-7 h-7 text-primary-foreground" />
            )}
          </button>
        </VoiceOrb>

        {isActive ? (
          <div className="flex flex-col items-center gap-4 w-full">
            <span className="text-xs font-medium text-muted-foreground">{phaseLabel}</span>
            <span className="text-2xl font-semibold font-heading tabular-nums">
              {formatDuration(elapsed)}
            </span>
            <Button
              variant="destructive"
              size="icon"
              className="rounded-full"
              onClick={endCall}
            >
              <PhoneOff className="w-4 h-4" />
            </Button>

            {lastExchange && (
              <div className="w-full space-y-2 rounded-xl bg-muted/30 p-3 text-sm">
                <div className="flex items-start gap-2">
                  <span className="font-medium shrink-0">You:</span>
                  <span className="text-muted-foreground">{lastExchange.userText}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-medium shrink-0">AI:</span>
                  <span>{lastExchange.replyText}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {lastExchange.technique}
                </Badge>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {isSupported
              ? "Tap to start a voice session"
              : "Voice sessions aren't supported in this browser"}
          </p>
        )}

        <audio ref={audioRef} onEnded={handleAudioEnded} className="hidden" />
      </CardContent>
    </Card>
  );
}

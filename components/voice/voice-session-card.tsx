"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2, Volume2, PhoneOff, Clock } from "lucide-react";
import { toast } from "sonner";
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
  className?: string;
}

interface SpeechRecognitionResultItem {
  transcript: string;
}

interface SpeechRecognitionResultList {
  [index: number]: {
    [index: number]: SpeechRecognitionResultItem;
    length: number;
  };
  length: number;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface IBrowserSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  start: () => void;
  stop: () => void;
  abort?: () => void;
}

type SpeechRecognitionConstructor = new () => IBrowserSpeechRecognition;

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/** Authentic Google Gemini gradient star brand mark */
function GeminiIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="gemini-star-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1BA1E3" />
          <stop offset="35%" stopColor="#5B7CF6" />
          <stop offset="70%" stopColor="#9B51E0" />
          <stop offset="100%" stopColor="#D96570" />
        </linearGradient>
      </defs>
      <path
        d="M12 2C12 7.52285 7.52285 12 2 12C7.52285 12 12 16.4771 12 22C12 16.4771 16.4771 12 22 12C16.4771 12 12 7.52285 12 2Z"
        fill="url(#gemini-star-grad)"
      />
    </svg>
  );
}

export function VoiceSessionCard({ onCallEnd, className }: VoiceSessionCardProps) {
  const [isSupported, setIsSupported] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [lastExchange, setLastExchange] = useState<LastExchange | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [frequencies, setFrequencies] = useState<number[]>([]);
  const [voiceEngine, setVoiceEngine] = useState<"instant" | "cloud">("cloud");

  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const recordTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const turnGenerationRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const nextAudioSrcRef = useRef<string | null>(null);
  const speechRecognizerRef = useRef<IBrowserSpeechRecognition | null>(null);
  const liveTranscriptRef = useRef<string>("");

  // Web Audio API real-time visualizer refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const phaseRef = useRef<Phase>("idle");
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Auto-scroll so the latest AI reply is immediately visible without manual scrolling
  useEffect(() => {
    if (lastExchange && contentRef.current) {
      contentRef.current.scrollTo({
        top: contentRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [lastExchange]);

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

  const cleanupVisualizer = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
    setFrequencies([]);
  };

  // Real-time audio analyser loop (Web Audio API)
  const setupAudioVisualizer = (stream: MediaStream) => {
    cleanupVisualizer();
    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return;

      const ctx = new AudioCtxClass();
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.65;
      source.connect(analyser);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateAudioVisuals = () => {
        const currentPhase = phaseRef.current;

        if (currentPhase === "speaking") {
          // Organic speech wave rhythm while the AI speaks
          const t = Date.now() / 140;
          const simulatedVol = 0.35 + 0.3 * Math.sin(t * 1.4) * Math.cos(t * 0.8);
          setAudioLevel(Math.max(0.08, simulatedVol));
          const simBars = Array.from({ length: 14 }, (_, i) =>
            Math.max(0.05, 0.4 + 0.45 * Math.sin(t + i * 0.7))
          );
          setFrequencies(simBars);
        } else if (currentPhase === "recording" && analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);

          // Calculate average volume / amplitude
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          // Filter out room noise floor (ignore volume below 12)
          const normalized = Math.min(1, Math.max(0, (avg - 12) / 60));
          setAudioLevel(normalized);

          // Sample 14 discrete frequency bands
          const barCount = 14;
          const step = Math.max(1, Math.floor(dataArray.length / barCount));
          const barHeights: number[] = [];
          for (let i = 0; i < barCount; i++) {
            const val = dataArray[i * step] || 0;
            barHeights.push(Math.min(1, Math.max(0, (val - 14) / 160)));
          }
          setFrequencies(barHeights);
        } else {
          setAudioLevel(0);
          setFrequencies([]);
        }

        animFrameRef.current = requestAnimationFrame(updateAudioVisuals);
      };

      updateAudioVisuals();
    } catch (err) {
      console.warn("Could not start Web Audio visualizer:", err);
    }
  };

  // Release the mic and cancel visualizers if the card unmounts mid-call.
  useEffect(() => {
    return () => {
      turnGenerationRef.current += 1;
      cleanupVisualizer();
      if (speechRecognizerRef.current) {
        try {
          speechRecognizerRef.current.stop();
        } catch {}
        speechRecognizerRef.current = null;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (recordTimeoutRef.current) clearTimeout(recordTimeoutRef.current);
    };
  }, []);

  // Pre-warm SpeechSynthesis voices so high-quality natural voices are ready instantly
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      const onVoicesChanged = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.addEventListener("voiceschanged", onVoicesChanged);
      return () => {
        window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
      };
    }
  }, []);

  const speakWithBrowserSpeech = (text: string, generation: number): boolean => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.98;
        utterance.pitch = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const preferredVoice =
          voices.find(
            (v) =>
              (v.name.includes("Natural") ||
                v.name.includes("Google US English") ||
                v.name.includes("Samantha") ||
                v.name.includes("Ava") ||
                v.name.includes("Siri") ||
                v.name.includes("Jenny") ||
                v.name.includes("Zira")) &&
              v.lang.startsWith("en")
          ) || voices.find((v) => v.lang.startsWith("en"));

        if (preferredVoice) utterance.voice = preferredVoice;

        // Chrome keepalive interval for longer paragraphs
        const heartbeat = setInterval(() => {
          if (typeof window !== "undefined" && window.speechSynthesis.speaking) {
            window.speechSynthesis.pause();
            window.speechSynthesis.resume();
          } else {
            clearInterval(heartbeat);
          }
        }, 8000);

        utterance.onstart = () => {
          if (turnGenerationRef.current === generation) setPhase("speaking");
        };
        utterance.onend = () => {
          clearInterval(heartbeat);
          if (turnGenerationRef.current === generation) setPhase("idle");
        };
        utterance.onerror = (e) => {
          clearInterval(heartbeat);
          if (e.error === "canceled" || e.error === "interrupted") return;
          console.warn("SpeechSynthesis error:", e.error || e);
          if (turnGenerationRef.current === generation) setPhase("idle");
        };

        setPhase("speaking");
        window.speechSynthesis.speak(utterance);
        return true;
      } catch (err) {
        console.warn("Browser SpeechSynthesis failed:", err);
        return false;
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

  // Single-tap initiation: acquires mic, starts visualizer, and immediately listens!
  const startCallAndRecord = async () => {
    if (!isSupported) {
      toast.error("Voice sessions aren't supported in this browser.");
      return;
    }
    let stream = streamRef.current;
    if (!stream || !stream.active) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
      } catch (error) {
        console.error("Microphone access denied:", error);
        toast.error("Microphone access is required for voice sessions. Please allow microphone permission and try again.");
        return;
      }
    }

    turnGenerationRef.current += 1;
    sessionIdRef.current = null;
    setLastExchange(null);
    setElapsed(0);
    setIsActive(true);

    // Pre-create session in background while user starts speaking to eliminate turn latency
    createTherapySession("voice")
      .then((sid) => {
        if (sid && !sessionIdRef.current) {
          sessionIdRef.current = sid;
        }
      })
      .catch(() => {});

    setupAudioVisualizer(stream);
    startRecordingWithStream(stream);
  };

  const endCall = async () => {
    clearRecordTimeout();
    cleanupVisualizer();
    if (speechRecognizerRef.current) {
      try {
        speechRecognizerRef.current.stop();
      } catch {}
      speechRecognizerRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    const currentSessionId = sessionIdRef.current;
    const finalElapsed = Math.max(1, elapsed);
    const recorder = mediaRecorderRef.current;
    const wasRecording = recorder?.state === "recording";
    const mimeType = recorder?.mimeType || pickRecordingMimeType();

    if (recorder) {
      recorder.onstop = null;
      if (wasRecording) {
        if (typeof recorder.requestData === "function") {
          try {
            recorder.requestData();
          } catch {}
        }
        recorder.stop();
      }
    }
    mediaRecorderRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    nextAudioSrcRef.current = null;
    sessionIdRef.current = null;
    turnGenerationRef.current += 1;
    setIsActive(false);
    setPhase("idle");

    // If the user spoke right before hanging up, process and save their closing disclosure
    if (wasRecording && mimeType && chunksRef.current.length > 0) {
      const closingChunks = [...chunksRef.current];
      chunksRef.current = [];
      try {
        const blob = new Blob(closingChunks, { type: mimeType });
        if (blob.size > 0) {
          const audioBase64 = await blobToBase64(blob);
          const transcribeRes = await fetch("/api/voice/transcribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audioBase64, mimeType }),
          });
          if (transcribeRes.ok) {
            const { transcript } = (await transcribeRes.json()) as { transcript: string };
            if (transcript?.trim()) {
              const analysis = await analyzeMessage(transcript);
              const targetSessionId = currentSessionId || (await createTherapySession("voice"));
              if (targetSessionId) {
                await persistTherapyMessage(targetSessionId, {
                  role: "user",
                  content: transcript,
                  emotion: analysis.emotion,
                  confidence: analysis.confidence,
                  crisisLevel: analysis.crisisLevel,
                });
                await fetch(`/api/therapy/${targetSessionId}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ durationSeconds: finalElapsed }),
                });
                onCallEnd();
                return;
              }
            }
          }
        }
      } catch (err) {
        console.warn("Could not process closing voice turn:", err);
      }
    }

    // Persist actual call duration if a session exists
    if (currentSessionId && finalElapsed > 0) {
      try {
        await fetch(`/api/therapy/${currentSessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ durationSeconds: finalElapsed }),
        });
      } catch (err) {
        console.warn("Could not persist call duration:", err);
      }
    }

    onCallEnd();
  };

  const startRecordingWithStream = (stream: MediaStream) => {
    const mimeType = pickRecordingMimeType();
    if (!mimeType) {
      toast.error("Voice recording isn't supported in this browser.");
      return;
    }

    const generation = turnGenerationRef.current;
    chunksRef.current = [];
    liveTranscriptRef.current = "";

    // Start live browser speech recognition if supported (instant, zero network latency)
    if (typeof window !== "undefined") {
      const windowWithSpeech = window as unknown as {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
      };
      const SpeechRecognitionClass =
        windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition;
      if (SpeechRecognitionClass) {
        try {
          const recognizer = new SpeechRecognitionClass();
          recognizer.continuous = true;
          recognizer.interimResults = true;
          recognizer.lang = "en-US";
          recognizer.onresult = (event: SpeechRecognitionEvent) => {
            let finalStr = "";
            for (let i = 0; i < event.results.length; ++i) {
              finalStr += event.results[i][0]?.transcript || "";
            }
            if (finalStr.trim()) {
              liveTranscriptRef.current = finalStr.trim();
            }
          };
          recognizer.onerror = () => {};
          recognizer.start();
          speechRecognizerRef.current = recognizer;
        } catch {}
      }
    }

    const recorder = new MediaRecorder(stream, { mimeType });
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => handleRecordingStopped(mimeType, generation);
    mediaRecorderRef.current = recorder;

    recorder.start(250);
    setPhase("recording");
    recordTimeoutRef.current = setTimeout(() => stopRecordingAndSend(), MAX_RECORDING_MS);
  };

  const startRecording = () => {
    if (!streamRef.current) {
      startCallAndRecord();
      return;
    }
    startRecordingWithStream(streamRef.current);
  };

  const stopRecordingAndSend = () => {
    clearRecordTimeout();
    if (speechRecognizerRef.current) {
      try {
        speechRecognizerRef.current.stop();
      } catch {}
      speechRecognizerRef.current = null;
    }
    if (mediaRecorderRef.current?.state === "recording") {
      try {
        if (typeof mediaRecorderRef.current.requestData === "function") {
          mediaRecorderRef.current.requestData();
        }
      } catch {}
      mediaRecorderRef.current.stop();
    }
  };

  const stopPlaybackAndRecord = () => {
    nextAudioSrcRef.current = null;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    startRecording();
  };

  const handleRecordingStopped = async (mimeType: string, generation: number) => {
    if (turnGenerationRef.current !== generation) return;

    const blob = new Blob(chunksRef.current, { type: mimeType });
    chunksRef.current = [];

    if (blob.size === 0 && !liveTranscriptRef.current.trim()) {
      toast.error("We didn't catch that — try again.");
      setPhase("idle");
      return;
    }

    setPhase("processing");

    try {
      let transcript = liveTranscriptRef.current.trim();

    // If live browser recognition didn't yield text, fall back to server Gemini transcription
    if (!transcript && blob.size > 0) {
      try {
        const audioBase64 = await blobToBase64(blob);
        const transcribeRes = await fetch("/api/voice/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audioBase64, mimeType }),
        });
        if (turnGenerationRef.current !== generation) return;

        if (transcribeRes.ok) {
          const data = (await transcribeRes.json()) as { transcript?: string };
          transcript = data.transcript?.trim() ?? "";
        }
      } catch (err) {
        console.warn("Server transcribe fallback failed:", err);
      }
    }

    if (turnGenerationRef.current !== generation) return;

    if (!transcript) {
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
        // Non-blocking: fire persistence asynchronously so it doesn't block LLM reply generation.
        // The reply route receives userMessage directly and appends it to context automatically.
        persistTherapyMessage(sessionId, {
          role: "user",
          content: transcript,
          emotion: analysis.emotion,
          confidence: analysis.confidence,
          crisisLevel: analysis.crisisLevel,
        }).catch((err) => console.error("Could not persist voice message:", err));
      }

      if (turnGenerationRef.current !== generation) return;

      const reply = sessionId
        ? await fetchTherapyReply(sessionId, analysis, transcript)
        : generateReply(analysis, transcript);
      if (turnGenerationRef.current !== generation) return;

      setLastExchange({ userText: transcript, replyText: reply.text, technique: reply.technique });

      // In Instant Mode, start speaking immediately with zero latency (< 50ms)
      if (voiceEngine === "instant") {
        const spoke = speakWithBrowserSpeech(reply.text, generation);
        if (spoke) return;
        // Fall back to cloud synthesis if browser speech is unavailable
      }

      try {
        nextAudioSrcRef.current = null;

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
      startCallAndRecord();
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
    if (phase === "speaking") {
      stopPlaybackAndRecord();
      return;
    }
  };

  const handleAudioEnded = () => {
    if (nextAudioSrcRef.current && audioRef.current) {
      const nextSrc = nextAudioSrcRef.current;
      nextAudioSrcRef.current = null;
      audioRef.current.src = nextSrc;
      audioRef.current.play().catch((err) => {
        console.warn("Queued audio playback failed:", err);
        setPhase("idle");
      });
      return;
    }
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

  const orbDisabled = isActive && phase === "processing";

  const phaseLabel = !isActive
    ? "Ready"
    : phase === "recording"
      ? "Listening… (tap when done)"
      : phase === "processing"
        ? voiceEngine === "cloud"
          ? "Synthesizing cloud voice…"
          : "Thinking…"
        : phase === "speaking"
          ? "Speaking… (tap to interrupt)"
          : "Tap to speak";

  return (
    <Card className={cn("border-primary/10 h-full flex flex-col min-h-[580px] lg:min-h-[640px] max-h-[700px]", className)}>
      <CardHeader className="space-y-3 pb-3 shrink-0">
        <div>
          <CardTitle className="text-lg font-heading">Voice Session</CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            Talk it out with your AI therapist
          </CardDescription>
        </div>
        <div className="grid grid-cols-2 gap-1.5 bg-muted/60 p-1 rounded-xl text-xs w-full border border-border/40">
          <button
            type="button"
            onClick={() => setVoiceEngine("cloud")}
            className={cn(
              "flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg font-medium transition-all cursor-pointer text-xs",
              voiceEngine === "cloud"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-background/40"
            )}
            title="Uses Google Gemini 3.8 Flash cloud voice engine"
          >
            <GeminiIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Google Gemini</span>
          </button>
          <button
            type="button"
            onClick={() => setVoiceEngine("instant")}
            className={cn(
              "flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg font-medium transition-all cursor-pointer text-xs",
              voiceEngine === "instant"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-background/40"
            )}
            title="Instant device speech synthesis (< 0.1s)"
          >
            <Volume2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="truncate">Instant Voice</span>
          </button>
        </div>
      </CardHeader>
      <CardContent
        ref={contentRef}
        className="flex-1 overflow-y-auto flex flex-col items-center gap-2.5 sm:gap-3 py-3 px-4 min-h-0"
      >
        <VoiceOrb
          state={orbState}
          size={112}
          audioLevel={audioLevel}
          frequencies={frequencies}
          className={cn("shrink-0", !lastExchange ? "my-auto" : "mt-1 mb-1")}
        >
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
              <Mic className="w-6 h-6 text-primary-foreground" />
            ) : phase === "recording" ? (
              <Square className="w-5 h-5 text-primary-foreground" />
            ) : phase === "processing" ? (
              <Loader2 className="w-6 h-6 text-primary-foreground animate-spin" />
            ) : (
              <Volume2 className="w-6 h-6 text-primary-foreground" />
            )}
          </button>
        </VoiceOrb>

        {isActive ? (
          <div className="flex flex-col items-center gap-2.5 sm:gap-3 w-full max-w-md mx-auto shrink-0 pb-1">
            <span className="text-xs font-medium text-muted-foreground text-center">{phaseLabel}</span>

            {/* Live session timer */}
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xl sm:text-2xl font-semibold font-heading tabular-nums">
                {formatDuration(elapsed)}
              </span>
            </div>

            {/* End Call button — clearly labeled with tooltip */}
            <div className="relative group flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={endCall}
                title="End session and save your conversation"
                aria-label="End session"
                className={cn(
                  "flex items-center gap-2.5 px-5 py-2.5 rounded-full font-semibold text-sm transition-all duration-200 select-none",
                  "bg-red-500 hover:bg-red-600 active:bg-red-700 text-white shadow-lg hover:shadow-red-500/40",
                  "ring-2 ring-red-500/30 hover:ring-red-500/60",
                  "hover:scale-105 active:scale-95"
                )}
              >
                {/* Pulsing status dot when AI is busy */}
                {(phase === "processing" || phase === "speaking") && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                  </span>
                )}
                <PhoneOff className="w-4 h-4" />
                <span>End Session</span>
              </button>
              {/* Tooltip hint */}
              <span
                className={cn(
                  "text-[10px] text-muted-foreground text-center leading-tight transition-opacity duration-300",
                  phase === "processing" ? "opacity-100" : "opacity-60"
                )}
              >
                {phase === "processing"
                  ? "AI is thinking… you can still hang up"
                  : phase === "speaking"
                  ? "Tap the orb to interrupt or end call below"
                  : phase === "recording"
                  ? "Tap the orb to stop recording"
                  : "Tap the orb to speak, or end the session"}
              </span>
            </div>

            {lastExchange && (
              <div className="w-full space-y-2 rounded-2xl bg-muted/40 p-3 sm:p-4 text-xs sm:text-sm border border-border/30">
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-primary shrink-0">You:</span>
                  <span className="text-muted-foreground break-words">{lastExchange.userText}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">AI:</span>
                  <span className="break-words leading-relaxed">{lastExchange.replyText}</span>
                </div>
                <Badge variant="secondary" className="text-[10px] sm:text-xs font-normal">
                  {lastExchange.technique}
                </Badge>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs sm:text-sm text-muted-foreground text-center">
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

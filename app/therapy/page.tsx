"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/** Entry point for "Chat" navigation — resumes the user's most recent
 * session so casual navigation doesn't lose an in-progress conversation.
 * Starting fresh is instead an explicit action (the "New Chat" button
 * inside the chat page itself). */
export default function TherapyEntryPage() {
    const router = useRouter();

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch("/api/therapy", { cache: "no-store" });
                const { sessions } = res.ok
                    ? ((await res.json()) as { sessions: { _id: string }[] })
                    : { sessions: [] };
                if (cancelled) return;
                router.replace(sessions.length > 0 ? `/therapy/${sessions[0]._id}` : "/therapy/new");
            } catch (error) {
                console.error("Error resolving therapy session:", error);
                if (!cancelled) router.replace("/therapy/new");
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [router]);

    return (
        <div className="flex h-[calc(100vh-4rem)] mt-20 items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
    );
}

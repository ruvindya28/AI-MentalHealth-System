"use client";

import { useState } from "react";
import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
    src?: string | null;
    name?: string;
    className?: string;
    fallbackClassName?: string;
}

export function UserAvatar({
    src,
    name,
    className = "h-8 w-8",
    fallbackClassName,
}: UserAvatarProps) {
    const [imageError, setImageError] = useState(false);

    const initials = name
        ? name
              .trim()
              .split(/\s+/)
              .map((part) => part[0])
              .filter(Boolean)
              .slice(0, 2)
              .join("")
              .toUpperCase()
        : "";

    if (src && !imageError) {
        return (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
                src={src}
                alt={name || "User avatar"}
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
                className={cn("rounded-full object-cover shrink-0", className)}
            />
        );
    }

    return (
        <div
            className={cn(
                "rounded-full bg-linear-to-br from-primary/30 to-accent/30 text-foreground font-semibold flex items-center justify-center shrink-0 ring-1 ring-primary/20",
                className,
                fallbackClassName
            )}
        >
            {initials ? initials : <UserRound className="h-4 w-4 text-muted-foreground" />}
        </div>
    );
}

import { type NextRequest } from "next/server";

/**
 * Determines the application origin URL (e.g. https://example.com or http://localhost:3000)
 * taking into account environment variables, reverse proxy headers, and request URL.
 */
export function getAppOrigin(request?: Request | NextRequest): string {
    // 1. Explicit environment configuration
    if (process.env.APP_URL) {
        return process.env.APP_URL.replace(/\/$/, "");
    }
    if (process.env.NEXT_PUBLIC_APP_URL) {
        return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
    }

    // 2. Derive from request headers (behind reverse proxies like Vercel / Railway / Nginx)
    if (request) {
        const forwardedHost = request.headers.get("x-forwarded-host");
        const forwardedProto = request.headers.get("x-forwarded-proto") || "http";
        if (forwardedHost) {
            return `${forwardedProto}://${forwardedHost}`.replace(/\/$/, "");
        }

        const host = request.headers.get("host");
        if (host) {
            const proto = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
            return `${proto}://${host}`.replace(/\/$/, "");
        }

        try {
            const url = new URL(request.url);
            return url.origin;
        } catch {
            // fallback
        }
    }

    return "http://localhost:3000";
}

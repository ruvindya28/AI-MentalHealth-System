import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";

const protectedPrefixes = ["/dashboard", "/therapy", "/history", "/reports", "/profile", "/set-password"];
const authOnlyPaths = ["/login", "/signup"];

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const isProtected = protectedPrefixes.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
    const isAuthOnly = authOnlyPaths.includes(pathname);

    if (!isProtected && !isAuthOnly) {
        return NextResponse.next();
    }

    const userId = await getSessionUserId();

    if (isProtected && !userId) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("from", pathname);
        return NextResponse.redirect(loginUrl);
    }

    if (isAuthOnly && userId) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sounds).*)"],
};

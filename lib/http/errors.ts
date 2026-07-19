import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonError(message: string, status: number) {
    return NextResponse.json({ error: message }, { status });
}

export function zodErrorResponse(error: ZodError) {
    const firstIssue = error.issues[0];
    return jsonError(firstIssue?.message ?? "Invalid input", 400);
}

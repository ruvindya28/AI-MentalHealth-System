import { redirect } from "next/navigation";

/** Entry point for /therapy — redirects directly to /therapy/new */
export default function TherapyEntryPage() {
    redirect("/therapy/new");
}


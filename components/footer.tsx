export function Footer() {
    return (
        <footer className="border-t border-border/60 py-8">
            <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 text-center sm:px-6 lg:px-8">
                <p className="text-sm text-muted-foreground">
                    &copy; {new Date().getFullYear()} MindCare. A calm space to be heard.
                </p>
                <p className="text-xs text-muted-foreground/70">
                    If you or someone you know is in crisis, please reach out to a local emergency service or crisis line right away.
                </p>
            </div>
        </footer>
    );
}
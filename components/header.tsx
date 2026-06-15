import { AudioWaveform } from "lucide-react";
import  Link  from "next/link";


export default function Header() {
    return (
        <div className="w-full fixed top-0 z-50 bg-background/95 bg-backdrop-blur-2xl">
            <div className="absolute inset-0 border-b border-primary/10"></div>
        <header className="relative max-w-6xl mx-auto px-4 py-2">
            <div className="flex h-16 items-center justify-between">
                <Link
                 href="/"
                 className="flex items-center space-x-2 transition-opacity hover:opacity-80"
                 >
                    <AudioWaveform 
                    className="h-7 w-7 text-primary animate-pulse-gentle"
                    />
                    <div className="flex flex-col">
                        <span className="text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 text-transparent bg-clip-text">MindCare</span>
                    </div>
                 </Link>
            </div>
        </header>
        </div>
    )
}

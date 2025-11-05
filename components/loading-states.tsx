import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function PageLoader({ className }: { className?: string }) {
    return (
        <div className={cn("flex min-h-screen items-center justify-center", className)}>
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
        </div>
    )
}

export function InlineLoader({ text = "Loading...", className }: { text?: string; className?: string }) {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">{text}</span>
        </div>
    )
}

export function SkeletonCard({ className }: { className?: string }) {
    return (
        <div className={cn("animate-pulse space-y-4 rounded-lg border p-4", className)}>
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-20 bg-muted rounded" />
        </div>
    )
}

export function SkeletonText({ className, lines = 3 }: { className?: string; lines?: number }) {
    return (
        <div className={cn("space-y-2", className)}>
            {Array.from({ length: lines }).map((_, i) => (
                <div
                    key={i}
                    className="h-4 bg-muted rounded animate-pulse"
                    style={{ width: `${Math.random() * 30 + 70}%` }}
                />
            ))}
        </div>
    )
}

export function ButtonLoader() {
    return <Loader2 className="h-4 w-4 animate-spin" />
}

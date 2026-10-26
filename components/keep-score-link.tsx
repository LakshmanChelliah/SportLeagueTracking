import Link from "next/link"
import { cn } from "cn"

export function KeepScoreLink({ className, matchId }: { className?: string; matchId?: string }) {
  const href = matchId ? `/score?match=${encodeURIComponent(matchId)}` : "/score"
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center rounded-lg border border-border px-3.5 py-2.5 text-[13px] font-semibold transition-transform active:scale-95",
        className,
      )}
    >
      Keep score
    </Link>
  )
}

import type { Metadata } from "next"
import { AdminView } from "@/components/admin-view"
import { getLeague } from "@/lib/league"

export const metadata: Metadata = { title: "Enter scores" }

export default function AdminPage() {
  if (process.env.NEXT_PUBLIC_STATIC === "1") {
    return (
      <div className="mx-auto w-[min(560px,calc(100%-48px))] py-7">
        <p className="text-xs font-semibold tracking-[0.16em] text-brand uppercase">Coordinator</p>
        <h1 className="mt-3 font-display text-4xl tracking-wide uppercase">Enter scores</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This public site is the schedule and standings. Score entry needs the coordinator server, which is not connected to this host yet. Until then, update <span className="text-foreground">data/results.json</span> in the repo.
        </p>
      </div>
    )
  }
  return <AdminView league={getLeague()} />
}

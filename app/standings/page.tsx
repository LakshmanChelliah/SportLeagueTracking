import type { Metadata } from "next"
import { StandingsHighlight } from "@/components/standings-highlight"
import { getLeague } from "@/lib/league"
import { standings } from "@/lib/standings"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Standings" }

export default function StandingsPage() {
  const league = getLeague()
  const rows = standings(league.schedule.matches, league.results)
  const played = Object.keys(league.results).length
  return (
    <div className="mx-auto w-[min(1120px,calc(100%-48px))] py-7 max-md:w-[calc(100%-48px)]">
      <h1 className="mb-1 font-display text-[42px] leading-none tracking-wide uppercase max-md:text-[28px]">Standings</h1>
      <p className="mb-[18px] text-sm text-muted-foreground">
        One point per game won.{played ? " Updated from entered scores." : " No games played yet."}
      </p>
      <div className="grid items-start gap-7 md:grid-cols-[1fr_280px]">
        <StandingsHighlight rows={rows} />
        <aside className="hidden pt-2 md:block">
          <h2 className="font-display text-base tracking-[0.08em] uppercase">If two teams tie</h2>
          <ol className="mt-2 list-decimal pl-[18px] text-muted-foreground">
            <li className="my-1.5">Games won</li>
            <li className="my-1.5">Point differential</li>
            <li className="my-1.5">Points scored</li>
          </ol>
          <p className="mt-3.5 text-[13px] leading-normal text-dim">
            A game stopped at 10 minutes to the hour still counts. The team ahead at the whistle gets the point. Tied games award nothing.
          </p>
          <p className="mt-3.5 text-[13px] leading-normal text-dim">
            Forfeit — no women on the court, or 4 players or fewer — is entered as 21–0, 21–0, 21–0.
          </p>
        </aside>
      </div>
      <p className="mt-4 text-[13px] text-dim md:hidden">Ranked by wins, then point differential, then points scored.</p>
    </div>
  )
}

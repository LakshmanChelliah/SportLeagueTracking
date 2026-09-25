import { diffLabel } from "@/lib/schedule"
import { teamName } from "@/lib/teams"
import type { Standing } from "@/lib/types"
import { cn } from "cn"

export function StandingsTable({ rows, you }: { rows: Standing[]; you?: number | null }) {
  const played = rows.some((row) => row.wins + row.losses > 0)
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-panel px-2 pt-4 pb-1.5">
      <table className="w-full border-separate border-spacing-0">
        <thead>
          <tr className="text-[11px] tracking-[0.1em] text-dim uppercase">
            <th className="px-2.5 pb-2.5 text-left font-semibold">#</th>
            <th className="px-2.5 pb-2.5 text-left font-semibold">Team</th>
            <th className="px-2.5 pb-2.5 text-right font-semibold">W</th>
            <th className="px-2.5 pb-2.5 text-right font-semibold">L</th>
            <th className="hidden px-2.5 pb-2.5 text-right font-semibold md:table-cell">PF</th>
            <th className="hidden px-2.5 pb-2.5 text-right font-semibold md:table-cell">PA</th>
            <th className="px-2.5 pb-2.5 text-right font-semibold">Diff</th>
            <th className="hidden px-2.5 pb-2.5 text-right font-semibold md:table-cell">Form</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const mine = you === row.team
            return (
              <tr key={row.team} className={mine ? "bg-[var(--highlight)]" : undefined}>
                <td className={cn("border-b border-border px-2.5 py-2.5 text-left font-display text-[22px] text-dim max-md:py-3.5 max-md:text-lg", mine && "shadow-[inset_3px_0_0_var(--brand)]")}>
                  {row.rank}
                </td>
                <td className="border-b border-border px-2.5 py-2.5 text-left text-[15px] font-medium">{teamName(row.team)}</td>
                <td className="border-b border-border px-2.5 py-2.5 text-right font-display text-[22px] max-md:text-lg">{row.wins}</td>
                <td className="border-b border-border px-2.5 py-2.5 text-right font-display text-[22px] max-md:text-lg">{row.losses}</td>
                <td className="hidden border-b border-border px-2.5 py-2.5 text-right font-display text-[22px] md:table-cell">{row.pointsFor}</td>
                <td className="hidden border-b border-border px-2.5 py-2.5 text-right font-display text-[22px] md:table-cell">{row.pointsAgainst}</td>
                <td className={cn("border-b border-border px-2.5 py-2.5 text-right font-display text-[22px] max-md:text-lg", row.diff > 0 && "text-pos", row.diff < 0 && "text-neg")}>
                  {diffLabel(row.diff)}
                </td>
                <td className="hidden border-b border-border px-2.5 py-2.5 md:table-cell">
                  <span className="flex justify-end gap-1.5">
                    {row.form.map((mark, index) => (
                      <i key={index} className={cn("size-2 rounded-full border border-zinc-600", mark === "W" && "border-foreground bg-foreground")} />
                    ))}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {!played ? <p className="px-2.5 py-3 text-[13px] text-dim">No games played yet. Each game won is 1 point.</p> : null}
    </div>
  )
}

export function StandingsList({ rows, you }: { rows: Standing[]; you?: number | null }) {
  return (
    <ol className="py-1">
      {rows.map((row) => (
        <li
          key={row.team}
          className={cn(
            "grid grid-cols-[28px_1fr_auto_auto] items-center gap-2 border-t border-border px-4 py-1.5 first:border-t-0",
            you === row.team && "bg-[var(--highlight)] shadow-[inset_3px_0_0_var(--brand)]",
          )}
        >
          <span className="font-display text-lg text-dim">{row.rank}</span>
          <span className="text-sm font-medium">{teamName(row.team)}</span>
          <span className="font-display text-lg text-muted-foreground">{row.wins}–{row.losses}</span>
          <span className={cn("w-10 text-right font-display text-lg", row.diff > 0 && "text-pos", row.diff < 0 && "text-neg")}>{diffLabel(row.diff)}</span>
        </li>
      ))}
    </ol>
  )
}

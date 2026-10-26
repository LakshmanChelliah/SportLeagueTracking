import type { Metadata } from "next"
import { getLeague } from "@/lib/league"

export const metadata: Metadata = { title: "Rules" }

export default function RulesPage() {
  const { rules } = getLeague()
  return (
    <div className="mx-auto w-[min(1120px,calc(100%-48px))] py-7 max-md:w-[calc(100%-32px)] max-md:pt-5">
      <h1 className="mb-1 font-display text-[42px] leading-none tracking-wide uppercase max-md:text-[28px]">Rules</h1>
      <p className="reading mb-[18px] max-w-3xl text-muted-foreground">{rules.intro}</p>
      <div className="grid grid-cols-2 gap-x-9 max-md:grid-cols-1">
        {rules.rules.map((rule) => (
          <article key={rule.n} className="grid grid-cols-[42px_1fr] gap-3 border-t border-border py-4 max-md:mt-2 max-md:rounded-xl max-md:border max-md:bg-panel max-md:px-4">
            <span className="font-display text-[22px] text-dim">{rule.n}</span>
            <div>
              <h2 className="text-base font-semibold tracking-tight">{rule.title}</h2>
              <p className="reading mt-1 text-muted-foreground">{rule.body}</p>
            </div>
          </article>
        ))}
      </div>
      <h2 className="eyebrow mt-7 mb-3 text-muted-foreground">Playoffs</h2>
      <div className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
        {rules.playoffs.map((round) => (
          <article key={round.name} className="rounded-xl border border-border px-4 py-3.5 max-md:bg-panel">
            <span className="kicker text-dim">{round.week}</span>
            <strong className="mt-1 block font-display text-[26px] tracking-wide uppercase">{round.name}</strong>
            <span className="text-[13px] text-dim">{round.series}</span>
          </article>
        ))}
      </div>
    </div>
  )
}

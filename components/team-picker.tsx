"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useTeam } from "@/components/team-provider"
import { TEAMS, teamName, type TeamId } from "@/lib/teams"
import { cn } from "cn"

export function TeamChoices({
  selected,
  onPick,
}: {
  selected?: TeamId | null
  onPick: (team: TeamId) => void
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {TEAMS.map((team) => (
        <button
          key={team}
          type="button"
          onClick={() => onPick(team)}
          className={cn(
            "rounded-lg border border-border px-2 py-3 font-display text-xl tracking-wide uppercase transition-transform active:scale-95",
            selected === team ? "border-brand bg-brand/15 text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {team}
        </button>
      ))}
    </div>
  )
}

export function TeamButton() {
  const { team, setTeam } = useTeam()
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center gap-2 rounded-full border border-[var(--team-ring)] bg-transparent py-1.5 pr-2.5 pl-2 text-[13px] font-medium text-[var(--header-fg)]">
        <span className="grid size-[22px] place-items-center rounded-full bg-brand font-display text-[15px] font-bold text-[var(--brand-ink)]">
          {team ?? "?"}
        </span>
        {team ? teamName(team) : "My team"}
        <ChevronDown className="size-3.5 text-[var(--header-muted)]" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl tracking-wide uppercase">Your team</DialogTitle>
          <DialogDescription>Home, schedule, and your nights follow this choice. Standings still show the whole league.</DialogDescription>
        </DialogHeader>
        <TeamChoices
          selected={team}
          onPick={(next) => {
            setTeam(next)
            setOpen(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

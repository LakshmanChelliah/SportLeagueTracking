"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { formatNight, formatTime, nightsOf } from "@/lib/schedule"
import { teamName } from "@/lib/teams"
import type { LeagueData, Match } from "@/lib/types"

const PIN_KEY = "gdra-pin"

export function AdminView({ league }: { league: LeagueData }) {
  const router = useRouter()
  const nights = useMemo(() => nightsOf(league.schedule.matches), [league.schedule.matches])
  const [pin, setPin] = useState("")
  const [authed, setAuthed] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [busy, setBusy] = useState(false)
  const [date, setDate] = useState(nights[0]?.date ?? "")
  const night = nights.find((item) => item.date === date) ?? nights[0]
  const flat = night.slots.flatMap((slot) => slot.matches)
  const [matchId, setMatchId] = useState(flat[0]?.id ?? "")
  const match = league.schedule.matches.find((item) => item.id === matchId) ?? flat[0]
  const existing = match ? league.results[match.id] : undefined
  const [games, setGames] = useState<[string, string][]>([
    ["", ""],
    ["", ""],
    ["", ""],
  ])
  const [forfeit, setForfeit] = useState(false)
  const [forfeitSide, setForfeitSide] = useState<"home" | "away">("away")

  function loadMatch(next: Match) {
    setMatchId(next.id)
    const saved = league.results[next.id]
    if (saved?.forfeit) {
      setForfeit(true)
      setForfeitSide(saved.forfeit)
      setGames(saved.games.map((game) => [String(game[0]), String(game[1])] as [string, string]))
      return
    }
    setForfeit(false)
    setForfeitSide("away")
    setGames(saved ? saved.games.map((game) => [String(game[0]), String(game[1])] as [string, string]) : [["", ""], ["", ""], ["", ""]])
  }

  async function call(body: unknown, savedPin = pin) {
    setBusy(true)
    setError("")
    setNotice("")
    try {
      const response = await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-pin": savedPin },
        body: JSON.stringify(body),
      })
      const payload = (await response.json()) as { error?: string; mode?: string }
      if (!response.ok) {
        setError(payload.error ?? "Could not save.")
        return false
      }
      if (payload.mode === "github") {
        setNotice("Saved. The public scoreboard updates after the site redeploys.")
      } else if (payload.mode === "local") {
        setNotice("Saved.")
        router.refresh()
      }
      return true
    } catch {
      setError("Could not reach the server.")
      return false
    } finally {
      setBusy(false)
    }
  }

  async function unlock(event: React.FormEvent) {
    event.preventDefault()
    const ok = await call({ action: "unlock" }, pin)
    if (ok) {
      sessionStorage.setItem(PIN_KEY, pin)
      setAuthed(true)
      setNotice("")
    }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault()
    if (!match) return
    const ok = await call({
      action: "save",
      matchId: match.id,
      result: forfeit
        ? { forfeit: forfeitSide }
        : { games: games.map(([home, away]) => [Number(home), Number(away)]) },
    })
    if (ok) router.refresh()
  }

  async function clear() {
    if (!match) return
    const ok = await call({ action: "clear", matchId: match.id })
    if (ok) {
      setGames([["", ""], ["", ""], ["", ""]])
      setForfeit(false)
      router.refresh()
    }
  }

  if (!authed) {
    return (
      <div className="mx-auto w-[min(420px,calc(100%-48px))] py-16">
        <p className="text-xs font-semibold tracking-[0.16em] text-brand uppercase">Coordinator</p>
        <h1 className="mt-2 font-display text-5xl tracking-wide uppercase">Enter scores</h1>
        <p className="mt-2 mb-6 text-sm text-muted-foreground">The PIN stays on the server. Players never see this page in the menu on their phones.</p>
        <form onSubmit={unlock} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pin">PIN</Label>
            <Input id="pin" type="password" autoComplete="current-password" value={pin} onChange={(event) => setPin(event.target.value)} />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" disabled={busy || pin.length === 0}>Continue</Button>
        </form>
      </div>
    )
  }

  return (
    <div className="mx-auto w-[min(1120px,calc(100%-48px))] py-7">
      <h1 className="font-display text-[42px] leading-none tracking-wide uppercase">Enter scores</h1>
      <p className="mt-1 mb-5 text-sm text-muted-foreground">Signed in with the coordinator PIN.</p>
      {notice ? <p className="mb-4 text-sm text-pos">{notice}</p> : null}
      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
      <div className="grid gap-4 md:grid-cols-[320px_1fr]">
        <section className="overflow-hidden rounded-xl border border-border bg-panel">
          <div className="border-b border-border px-4 py-3">
            <label className="text-xs tracking-wider text-dim uppercase" htmlFor="night">Night</label>
            <select
              id="night"
              className="mt-1 w-full bg-transparent font-display text-2xl tracking-wide uppercase outline-none"
              value={date}
              onChange={(event) => {
                const nextDate = event.target.value
                setDate(nextDate)
                const first = nights.find((item) => item.date === nextDate)?.slots[0]?.matches[0]
                if (first) loadMatch(first)
              }}
            >
              {nights.map((item) => (
                <option key={item.date} value={item.date}>{formatNight(item.date)}</option>
              ))}
            </select>
          </div>
          <div>
            {flat.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => loadMatch(item)}
                className={`flex w-full items-center justify-between gap-2 border-t border-border px-4 py-3 text-left ${item.id === match?.id ? "bg-[#025299]/15 shadow-[inset_3px_0_0_#025299]" : ""}`}
              >
                <span>
                  <span className="block text-[11px] tracking-[0.08em] text-dim uppercase">{formatTime(item.time)} · Court {item.court}</span>
                  <span className="font-display text-xl tracking-wide uppercase">{teamName(item.home)} vs {teamName(item.away)}</span>
                </span>
                <span className="text-[11px] tracking-[0.1em] text-dim uppercase">{league.results[item.id] ? "Saved" : "Open"}</span>
              </button>
            ))}
          </div>
        </section>
        {match ? (
          <form onSubmit={save} className="rounded-xl border border-border bg-panel px-5 py-5">
            <div className="text-xs font-semibold tracking-[0.16em] text-brand uppercase">{formatTime(match.time)} · Court {match.court}</div>
            <h2 className="mt-1 font-display text-[32px] tracking-wide uppercase">{teamName(match.home)} vs {teamName(match.away)}</h2>
            <div className="mt-4 grid grid-cols-[1fr_auto_1fr] text-xs tracking-[0.08em] text-muted-foreground uppercase">
              <span>{teamName(match.home)}</span>
              <span />
              <span className="text-right">{teamName(match.away)}</span>
            </div>
            <div className="mt-3 grid gap-2.5">
              {games.map((game, index) => (
                <label key={index} className="grid grid-cols-[72px_1fr_auto_1fr] items-center gap-3">
                  <span className="text-[13px] text-dim">Game {index + 1}</span>
                  <Input
                    inputMode="numeric"
                    aria-label={`${teamName(match.home)} game ${index + 1}`}
                    disabled={forfeit}
                    value={forfeit ? (forfeitSide === "away" ? "21" : "0") : game[0]}
                    onChange={(event) => {
                      const next = games.map((row) => [...row] as [string, string])
                      next[index][0] = event.target.value
                      setGames(next)
                    }}
                    className="h-14 text-center font-display text-3xl"
                  />
                  <span className="text-dim">–</span>
                  <Input
                    inputMode="numeric"
                    aria-label={`${teamName(match.away)} game ${index + 1}`}
                    disabled={forfeit}
                    value={forfeit ? (forfeitSide === "away" ? "0" : "21") : game[1]}
                    onChange={(event) => {
                      const next = games.map((row) => [...row] as [string, string])
                      next[index][1] = event.target.value
                      setGames(next)
                    }}
                    className="h-14 text-center font-display text-3xl"
                  />
                </label>
              ))}
            </div>
            <div className="mt-4 flex items-start gap-3 text-[13px] text-muted-foreground">
              <Switch checked={forfeit} onCheckedChange={setForfeit} aria-label="Forfeit" />
              <span>Forfeit. Records the match as 21–0, 21–0, 21–0 when a team has four players or fewer.</span>
            </div>
            {forfeit ? (
              <div className="mt-3 flex gap-2">
                <Button type="button" variant={forfeitSide === "home" ? "default" : "outline"} onClick={() => setForfeitSide("home")}>{teamName(match.home)} forfeits</Button>
                <Button type="button" variant={forfeitSide === "away" ? "default" : "outline"} onClick={() => setForfeitSide("away")}>{teamName(match.away)} forfeits</Button>
              </div>
            ) : null}
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={clear} disabled={busy || !existing}>Clear</Button>
              <Button type="submit" disabled={busy}>Save result</Button>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  )
}

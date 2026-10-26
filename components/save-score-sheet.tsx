"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { coordinatorApiUrl } from "@/lib/endpoints"
import { canvasBlob, drawScoreCard, scoreShareText, type ShareGame } from "@/lib/score-share"
import type { Result } from "@/lib/types"
import { cn } from "cn"

export function SaveScoreSheet({
  open,
  onOpenChange,
  matchId,
  leftName,
  rightName,
  when,
  games,
  officialGames,
  alreadyPosted,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  matchId: string
  leftName: string
  rightName: string
  when: string
  games: ShareGame[]
  officialGames: Result["games"]
  alreadyPosted: boolean
  onSaved: () => Promise<void> | void
}) {
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [busy, setBusy] = useState<"save" | "share" | null>(null)
  const action = "min-h-14 touch-manipulation rounded-xl px-3 text-base font-semibold disabled:opacity-40"

  function close(next: boolean) {
    if (!next) {
      setPin("")
      setError("")
      setNotice("")
    }
    onOpenChange(next)
  }

  async function save(event: React.FormEvent) {
    event.preventDefault()
    setBusy("save")
    setError("")
    setNotice("")
    try {
      const response = await fetch(coordinatorApiUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-pin": pin },
        body: JSON.stringify({ action: "save", matchId, result: { games: officialGames } }),
      })
      const payload = (await response.json()) as { error?: string }
      if (!response.ok) {
        setError(payload.error ?? "Could not save.")
        return
      }
      setNotice("Saved. This is the official score.")
      setPin("")
      await onSaved()
    } catch {
      setError("Could not reach the server.")
    } finally {
      setBusy(null)
    }
  }

  async function sendPicture() {
    setBusy("share")
    setError("")
    setNotice("")
    try {
      const text = scoreShareText(leftName, rightName, when, games)
      const canvas = document.createElement("canvas")
      drawScoreCard(canvas, leftName, rightName, when, games)
      const blob = await canvasBlob(canvas)
      const file = new File([blob], `score-${matchId}.png`, { type: "image/png" })
      const shareData: ShareData = { title: `${leftName} vs ${rightName}`, text, files: [file] }
      const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean }
      if (nav.share && (nav.canShare?.(shareData) ?? true)) {
        try {
          await nav.share(shareData)
          setNotice("Sent. Pick your captain in the share sheet.")
          return
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return
        }
      }
      if (nav.share) {
        try {
          await nav.share({ title: shareData.title, text })
          setNotice("Sent the score. The picture is saved if the share sheet could not take it.")
          downloadPicture(blob, file.name)
          return
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return
        }
      }
      downloadPicture(blob, file.name)
      setNotice("Picture saved. Send that image to the team captain.")
    } catch {
      setError("Could not make the picture.")
    } finally {
      setBusy(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl font-bold tracking-wide uppercase">Save score</DialogTitle>
          <DialogDescription>
            {leftName} vs {rightName}. {when}.
            {alreadyPosted ? " This replaces the official score." : ""}
          </DialogDescription>
        </DialogHeader>
        <ul className="grid gap-1 text-sm">
          {games.map((game) => (
            <li key={game.label} className="flex items-baseline justify-between gap-3">
              <span className="text-dim">{game.label}</span>
              <span className="font-display text-xl tabular-nums">
                {game.played ? `${game.left}–${game.right}` : "Not played"}
              </span>
            </li>
          ))}
        </ul>
        <form onSubmit={save} className="grid gap-2">
          <label htmlFor="score-pin" className="text-sm font-medium">
            Coordinator password
          </label>
          <input
            id="score-pin"
            type="password"
            autoComplete="current-password"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            className="h-14 w-full rounded-xl border border-border bg-background px-3 text-base outline-none"
          />
          <button type="submit" disabled={busy != null || pin.length === 0} className={cn(action, "bg-brand text-[var(--brand-ink)]")}>
            {busy === "save" ? "Saving" : "Save score"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => void sendPicture()}
          disabled={busy != null}
          className={cn(action, "border border-border")}
        >
          {busy === "share" ? "Preparing" : "Screenshot and send to captain"}
        </button>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {notice ? <p className="text-sm text-pos">{notice}</p> : null}
      </DialogContent>
    </Dialog>
  )
}

function downloadPicture(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

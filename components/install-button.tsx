"use client"

import { Download } from "lucide-react"
import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { createPortal } from "react-dom"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "cn"

type InstallPrompt = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

function standalone() {
  const nav = navigator as Navigator & { standalone?: boolean }
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true
}

function subscribe(onChange: () => void) {
  const media = window.matchMedia("(display-mode: standalone)")
  media.addEventListener("change", onChange)
  window.addEventListener("appinstalled", onChange)
  return () => {
    media.removeEventListener("change", onChange)
    window.removeEventListener("appinstalled", onChange)
  }
}

function installCopy(ios: boolean) {
  return ios
    ? "Tap Share, then Add to Home Screen."
    : "Open the browser menu and choose Install app, or Add to Home Screen."
}

export function InstallButton({ tone = "header" }: { tone?: "header" | "surface" }) {
  const installed = useSyncExternalStore(subscribe, standalone, () => false)
  const promptRef = useRef<InstallPrompt | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const [accepted, setAccepted] = useState(false)
  const [help, setHelp] = useState(false)
  const [ios, setIos] = useState(false)
  const [panel, setPanel] = useState<HTMLElement | null>(null)

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault()
      promptRef.current = event as InstallPrompt
    }
    window.addEventListener("beforeinstallprompt", onPrompt)
    return () => window.removeEventListener("beforeinstallprompt", onPrompt)
  }, [])

  useEffect(() => {
    if (!help || !panel) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      event.stopPropagation()
      setHelp(false)
    }
    const kids = [...panel.children].filter(
      (el): el is HTMLElement => el instanceof HTMLElement && el.getAttribute("data-install-help") !== "true",
    )
    const previous = kids.map((el) => el.style.display)
    kids.forEach((el) => {
      el.style.display = "none"
    })
    document.addEventListener("keydown", onKey, true)
    return () => {
      kids.forEach((el, index) => {
        el.style.display = previous[index]
      })
      document.removeEventListener("keydown", onKey, true)
    }
  }, [help, panel])

  if (installed || accepted) return null

  const copy = installCopy(ios)

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="Install app"
        aria-expanded={help}
        onClick={() => {
          const prompt = promptRef.current
          if (prompt) {
            void prompt.prompt().then(async () => {
              const choice = await prompt.userChoice
              promptRef.current = null
              if (choice.outcome === "accepted") setAccepted(true)
            })
            return
          }
          const host = rootRef.current?.closest("[data-slot=dialog-content]")
          setIos(/iphone|ipad|ipod/i.test(navigator.userAgent))
          setPanel(host instanceof HTMLElement ? host : null)
          setHelp(true)
        }}
        className={cn(
          "inline-flex size-9 shrink-0 items-center justify-center rounded-full border transition-transform active:scale-95",
          tone === "header"
            ? "border-[var(--team-ring)] text-[var(--header-fg)]"
            : "border-border text-foreground",
        )}
      >
        <Download className="size-4" />
      </button>
      {help && panel
        ? createPortal(
            <div data-install-help="true" className="flex flex-col">
              <p className="font-display text-3xl font-bold tracking-wide uppercase">Install the board</p>
              <p className="reading mt-2 text-muted-foreground">{copy}</p>
              <button
                type="button"
                onClick={() => setHelp(false)}
                className="mt-6 inline-flex h-9 w-fit items-center justify-center rounded-lg border border-border px-3 text-sm font-medium"
              >
                Back
              </button>
            </div>,
            panel,
          )
        : null}
      {help && !panel ? (
        <Dialog open={help} onOpenChange={setHelp}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl font-bold tracking-wide uppercase">Install the board</DialogTitle>
              <DialogDescription>{copy}</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  )
}

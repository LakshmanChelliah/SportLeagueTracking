"use client"

import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"
import { cn } from "cn"

export const THEME_COOKIE = "gdra-theme"

export function applyTheme(theme: "light" | "dark") {
  document.documentElement.classList.toggle("light", theme === "light")
  document.cookie = `${THEME_COOKIE}=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`
}

function readTheme(): "light" | "dark" {
  return document.documentElement.classList.contains("light") ? "light" : "dark"
}

export function ThemeToggle({ tone = "header" }: { tone?: "header" | "surface" }) {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null)

  useEffect(() => {
    setTheme(readTheme())
  }, [])

  const light = theme === "light"

  return (
    <button
      type="button"
      aria-pressed={light}
      aria-label={light ? "Switch to dark mode" : "Switch to light mode"}
      onClick={() => {
        const next = light ? "dark" : "light"
        applyTheme(next)
        setTheme(next)
      }}
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-full border transition-transform active:scale-95",
        tone === "header"
          ? "border-[var(--team-ring)] text-[var(--header-fg)]"
          : "border-border text-foreground",
      )}
    >
      {theme === null ? <span className="size-4" /> : light ? <Moon className="size-4" /> : <Sun className="size-4" />}
    </button>
  )
}

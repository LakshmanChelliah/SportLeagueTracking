"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useLayoutEffect, useRef, useState } from "react"
import { TeamButton } from "@/components/team-picker"
import { cn } from "cn"

const links = [
  { href: "/", label: "Home" },
  { href: "/schedule", label: "Schedule" },
  { href: "/standings", label: "Standings" },
  { href: "/rules", label: "Rules" },
]

export function SiteHeader() {
  const pathname = usePathname()
  const navRef = useRef<HTMLElement>(null)
  const [bar, setBar] = useState<{ left: number; width: number } | null>(null)

  useLayoutEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const measure = () => {
      const active = nav.querySelector<HTMLElement>("[data-active=true]")
      if (!active) return
      const navBox = nav.getBoundingClientRect()
      const box = active.getBoundingClientRect()
      setBar({ left: box.left - navBox.left, width: box.width })
    }
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [pathname])

  return (
    <header className="border-b border-border bg-background/90">
      <div className="mx-auto flex h-16 w-[min(1120px,calc(100%-48px))] items-center gap-7 max-md:h-14 max-md:w-[calc(100%-40px)]">
        <Link href="/" className="flex items-baseline gap-2.5 transition-opacity active:opacity-70">
          <span className="font-display text-[26px] leading-none tracking-[0.06em]">GD RA</span>
          <span className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase max-md:hidden">Volleyball</span>
        </Link>
        <nav ref={navRef} className="relative flex h-full items-stretch max-md:hidden">
          {links.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                data-active={active ? "true" : undefined}
                className={cn(
                  "flex items-center px-3 text-sm font-medium text-muted-foreground transition-all duration-200 active:scale-95",
                  active && "text-foreground",
                )}
              >
                {link.label}
              </Link>
            )
          })}
          <span
            className="pointer-events-none absolute bottom-0 h-0.5 bg-brand transition-[left,width] duration-300 ease-out"
            style={{ left: bar?.left ?? 0, width: bar?.width ?? 0 }}
          />
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <span className="text-xs tracking-[0.12em] text-dim uppercase max-md:hidden">2026–27</span>
          <TeamButton />
        </div>
      </div>
    </header>
  )
}

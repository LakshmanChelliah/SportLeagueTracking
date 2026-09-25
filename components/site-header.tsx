"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
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
  return (
    <header className="border-b border-border bg-background/90">
      <div className="mx-auto flex h-16 w-[min(1120px,calc(100%-48px))] items-center gap-7 max-md:h-14 max-md:w-[calc(100%-40px)]">
        <Link href="/" className="flex items-baseline gap-2.5">
          <span className="font-display text-[26px] leading-none tracking-[0.06em]">GD RA</span>
          <span className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase max-md:hidden">Volleyball</span>
        </Link>
        <nav className="flex h-full items-stretch max-md:hidden">
          {links.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center border-b-2 border-transparent px-3 text-sm font-medium text-muted-foreground",
                  active && "border-brand text-foreground",
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <span className="text-xs tracking-[0.12em] text-dim uppercase max-md:hidden">2026–27</span>
          <TeamButton />
        </div>
      </div>
    </header>
  )
}

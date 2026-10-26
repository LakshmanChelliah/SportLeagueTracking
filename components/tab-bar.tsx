"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CalendarDays, Hash, House, ListOrdered, UserRound } from "lucide-react"
import { useTeam } from "@/components/team-provider"
import { cn } from "cn"

export function TabBar() {
  const pathname = usePathname()
  const { team } = useTeam()
  const teamHref = team ? `/team/${team}` : "/team"
  const items = [
    { href: "/", label: "Home", icon: House, match: (path: string) => path === "/" },
    { href: "/score", label: "Score", icon: Hash, match: (path: string) => path.startsWith("/score") },
    { href: "/schedule", label: "Schedule", icon: CalendarDays, match: (path: string) => path.startsWith("/schedule") },
    { href: "/standings", label: "Standings", icon: ListOrdered, match: (path: string) => path.startsWith("/standings") },
    { href: teamHref, label: "Team", icon: UserRound, match: (path: string) => path.startsWith("/team") },
  ]
  const activeIndex = Math.max(items.findIndex((item) => item.match(pathname)), 0)

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--header-border)] bg-[var(--tab-bg)] pb-[env(safe-area-inset-bottom,0px)] text-[var(--tab-fg)] md:hidden">
      <div className="relative grid h-[60px] grid-cols-5">
        <span
          className="pointer-events-none absolute top-0 h-0.5 bg-[var(--tab-icon)] transition-[left] duration-300 ease-out"
          style={{ width: `${100 / items.length}%`, left: `${activeIndex * (100 / items.length)}%` }}
        />
        {items.map((item) => {
          const active = item.match(pathname)
          const Icon = item.icon
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold tracking-[0.12em] uppercase transition-all active:scale-90",
                active && "text-[var(--tab-active)]",
              )}
            >
              <Icon className={cn("size-[18px] transition-transform duration-200", active && "scale-110 text-[var(--tab-icon)]")} strokeWidth={1.6} />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

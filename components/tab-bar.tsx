"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CalendarDays, House, ListOrdered, UserRound } from "lucide-react"
import { useTeam } from "@/components/team-provider"
import { cn } from "cn"

export function TabBar() {
  const pathname = usePathname()
  const { team } = useTeam()
  const teamHref = team ? `/team/${team}` : "/team"
  const items = [
    { href: "/", label: "Home", icon: House, match: (path: string) => path === "/" },
    { href: "/schedule", label: "Schedule", icon: CalendarDays, match: (path: string) => path.startsWith("/schedule") },
    { href: "/standings", label: "Standings", icon: ListOrdered, match: (path: string) => path.startsWith("/standings") },
    { href: teamHref, label: "Team", icon: UserRound, match: (path: string) => path.startsWith("/team") },
  ]
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 grid h-[60px] grid-cols-4 border-t border-border bg-[#0c0c0e] md:hidden">
      {items.map((item) => {
        const active = item.match(pathname)
        const Icon = item.icon
        return (
          <Link key={item.label} href={item.href} className={cn("flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold tracking-wider text-dim uppercase", active && "text-foreground")}>
            <Icon className={cn("size-[18px]", active && "text-brand")} strokeWidth={1.6} />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

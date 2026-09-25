"use client"

import { usePathname } from "next/navigation"
import { PageTransition } from "@/components/page-transition"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { TabBar } from "@/components/tab-bar"
import { TeamChoices } from "@/components/team-picker"
import { ThemeToggle } from "@/components/theme-toggle"
import { useTeam } from "@/components/team-provider"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function SiteFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { team, ready, setTeam } = useTeam()

  if (pathname.startsWith("/prototype")) return children

  if (!ready || team == null) {
    if (!ready) return null
    return (
      <Dialog open>
        <DialogContent
          showCloseButton={false}
          className="gap-5 p-6 sm:max-w-md"
          onEscapeKeyDown={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <div className="flex items-start justify-between gap-3">
            <DialogHeader>
              <DialogTitle className="font-display text-3xl tracking-wide uppercase">Which team are you on?</DialogTitle>
              <DialogDescription>Your next match leads the page. The rest of the night and the standings stay with it.</DialogDescription>
            </DialogHeader>
            <ThemeToggle tone="surface" />
          </div>
          <TeamChoices onPick={setTeam} />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <>
      <div className="h-[3px] bg-brand" />
      <SiteHeader />
      <div className="flex-1 overflow-x-hidden pb-[72px] md:pb-0">
        <PageTransition>{children}</PageTransition>
      </div>
      <SiteFooter />
      <TabBar />
    </>
  )
}

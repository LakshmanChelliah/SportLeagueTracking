import type { Metadata } from "next"
import { Barlow_Condensed, Inter } from "next/font/google"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { TabBar } from "@/components/tab-bar"
import { TeamProvider } from "@/components/team-provider"
import { readTeamCookie } from "@/lib/read-team"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-barlow",
})

export const metadata: Metadata = {
  title: {
    default: "GD RA Volleyball",
    template: "%s · GD RA Volleyball",
  },
  description: "Schedule, standings, and scores for the GD RA Volleyball League. Double Gym, through December 2, 2026.",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const team = await readTeamCookie()
  return (
    <html lang="en" className={`dark ${inter.variable} ${barlow.variable} h-full overflow-x-hidden antialiased`}>
      <body className="flex min-h-full flex-col overflow-x-hidden bg-background pb-[72px] text-foreground md:overflow-x-visible md:pb-0">
        <div className="h-[3px] bg-brand" />
        <TeamProvider initialTeam={team}>
          <SiteHeader />
          <div className="flex-1">{children}</div>
          <SiteFooter />
          <TabBar />
        </TeamProvider>
      </body>
    </html>
  )
}

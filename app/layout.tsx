import type { Metadata, Viewport } from "next"
import { Big_Shoulders, Source_Sans_3 } from "next/font/google"
import { SiteFrame } from "@/components/site-frame"
import { TeamProvider } from "@/components/team-provider"
import { readTeamCookie } from "@/lib/read-team"
import "./globals.css"

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source",
  display: "swap",
})

const display = Big_Shoulders({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-display-face",
  display: "swap",
  fallback: ["Arial Narrow", "Arial"],
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export const metadata: Metadata = {
  title: {
    default: "GD RA Volleyball",
    template: "%s · GD RA Volleyball",
  },
  description: "Schedule, standings, and scores for the GD RA Volleyball League. One gym at Regina Street PS.",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const team = process.env.STATIC_EXPORT === "1" ? null : await readTeamCookie()
  return (
    <html lang="en" className={`dark ${sourceSans.variable} ${display.variable} h-full overflow-x-hidden antialiased`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(document.cookie.split("; ").indexOf("gdra-theme=light")!==-1)document.documentElement.classList.add("light")}catch(e){}})()`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col overflow-x-hidden bg-background text-foreground md:overflow-x-visible">
        <TeamProvider initialTeam={team}>
          <SiteFrame>{children}</SiteFrame>
        </TeamProvider>
      </body>
    </html>
  )
}

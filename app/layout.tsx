import type { Metadata, Viewport } from "next"
import { Big_Shoulders, Source_Sans_3 } from "next/font/google"
import { PwaRegister } from "@/components/pwa-register"
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
  themeColor: "#09090b",
}

export const metadata: Metadata = {
  applicationName: "GD RA Volleyball",
  title: {
    default: "GD RA Volleyball",
    template: "%s · GD RA Volleyball",
  },
  description: "Schedule, standings, and scores for the GD RA Volleyball League. One gym at Regina Street PS.",
  appleWebApp: {
    capable: true,
    title: "GD RA",
    statusBarStyle: "black-translucent",
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const team = process.env.STATIC_EXPORT === "1" ? null : await readTeamCookie()
  return (
    <html lang="en" className={`dark ${sourceSans.variable} ${display.variable} h-full overflow-x-hidden antialiased`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var light=document.cookie.split("; ").indexOf("gdra-theme=light")!==-1;if(light)document.documentElement.classList.add("light");var color=light?"#0c3969":"#09090b";var meta=document.querySelector('meta[name="theme-color"]');if(!meta){meta=document.createElement("meta");meta.setAttribute("name","theme-color");document.head.appendChild(meta)}meta.setAttribute("content",color)}catch(e){}})()`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col overflow-x-hidden bg-background text-foreground md:overflow-x-visible">
        <PwaRegister />
        <TeamProvider initialTeam={team}>
          <SiteFrame>{children}</SiteFrame>
        </TeamProvider>
      </body>
    </html>
  )
}

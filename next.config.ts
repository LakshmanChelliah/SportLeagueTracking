import type { NextConfig } from "next"

const pages = process.env.STATIC_EXPORT === "1"

const nextConfig: NextConfig = {
  // Quick tunnels serve this dev server on a trycloudflare.com host.
  // Without this, Next blocks the page's scripts and the site stays blank.
  allowedDevOrigins: ["127.0.0.1", "*.trycloudflare.com"],
  ...(pages
    ? {
        output: "export" as const,
        basePath: "/SportLeagueTracking",
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
}

export default nextConfig

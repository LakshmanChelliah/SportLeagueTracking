import type { NextConfig } from "next"

const pages = process.env.STATIC_EXPORT === "1"
const basePath = pages ? "/SportLeagueTracking" : ""

const nextConfig: NextConfig = {
  // Quick tunnels serve this dev server on a trycloudflare.com host.
  // Without this, Next blocks the page's scripts and the site stays blank.
  allowedDevOrigins: ["127.0.0.1", "*.trycloudflare.com"],
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  ...(pages
    ? {
        output: "export" as const,
        basePath,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
}

export default nextConfig

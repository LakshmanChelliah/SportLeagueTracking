import type { NextConfig } from "next"

const pages = process.env.STATIC_EXPORT === "1"

const nextConfig: NextConfig = {
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

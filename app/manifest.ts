import type { MetadataRoute } from "next"

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? ""

function asset(path: string) {
  return `${base}${path}`
}

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: asset("/"),
    name: "GD RA Volleyball",
    short_name: "GD RA",
    description: "Schedule, standings, and scores for the GD RA Volleyball League. One gym at Regina Street PS.",
    start_url: asset("/"),
    scope: asset("/"),
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#09090b",
    lang: "en",
    categories: ["sports"],
    icons: [
      { src: asset("/icons/icon-192.png"), sizes: "192x192", type: "image/png", purpose: "any" },
      { src: asset("/icons/icon-512.png"), sizes: "512x512", type: "image/png", purpose: "any" },
      { src: asset("/icons/icon-maskable-192.png"), sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: asset("/icons/icon-maskable-512.png"), sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}

import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "Prototypes" }

const items = [
  {
    href: "/prototype/open",
    n: "01",
    title: "Title sequence",
    body: "Pick a team. The board opens on your next match.",
  },
  {
    href: "/prototype/playback",
    n: "02",
    title: "Night playback",
    body: "Wednesday, Oct 7, one game at a time. Scrub it.",
  },
  {
    href: "/prototype/odds",
    n: "03",
    title: "Season odds",
    body: "Watch ten seasons, then see how often you finish first.",
  },
]

export default function PrototypePage() {
  return (
    <div className="flex min-h-dvh flex-col bg-[#09090b] px-5 py-8 text-[#f4f4f5]">
      <p className="text-[11px] font-semibold tracking-[0.22em] text-[#e8572a] uppercase">GD RA Volleyball</p>
      <h1 className="mt-3 font-display text-[68px] leading-[0.84] tracking-wide uppercase">Prototypes</h1>
      <p className="mt-4 max-w-sm text-sm text-[#a1a1aa]">
        Three samples. Scores in here are made up. The league board is unchanged.
      </p>
      <div className="mt-10 flex flex-col">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="border-t border-white/10 py-5">
            <span className="text-[11px] font-semibold tracking-[0.18em] text-[#71717a]">{item.n}</span>
            <span className="mt-1 block font-display text-4xl tracking-wide uppercase">{item.title}</span>
            <span className="mt-1 block text-sm text-[#a1a1aa]">{item.body}</span>
          </Link>
        ))}
      </div>
      <Link href="/" className="mt-auto pt-10 text-sm text-[#a1a1aa] underline underline-offset-4">
        Back to the league
      </Link>
    </div>
  )
}

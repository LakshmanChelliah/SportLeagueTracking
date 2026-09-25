import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-[#0C3969] text-[#DCE1E6] max-md:hidden">
      <div className="mx-auto flex h-[52px] w-[min(1120px,calc(100%-48px))] items-center justify-between text-xs">
        <span>GD RA Volleyball League</span>
        <span className="flex gap-4">
          <Link href="/admin" className="hover:text-white">Coordinator</Link>
        </span>
      </div>
    </footer>
  )
}

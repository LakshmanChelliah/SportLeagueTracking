import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border max-md:hidden">
      <div className="mx-auto flex h-[52px] w-[min(1120px,calc(100%-48px))] items-center justify-between text-xs text-dim">
        <span>GD RA Volleyball League</span>
        <span className="flex gap-4">
          <Link href="/admin" className="hover:text-foreground">Coordinator</Link>
        </span>
      </div>
    </footer>
  )
}

"use client"

import { usePathname } from "next/navigation"
import { useRef } from "react"

const ORDER = ["/", "/schedule", "/standings", "/rules", "/team", "/admin"]

function pageIndex(path: string) {
  if (path === "/") return 0
  const index = ORDER.findIndex((item) => item !== "/" && path.startsWith(item))
  return index === -1 ? 0 : index
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const previous = useRef(pathname)
  const direction = pageIndex(pathname) >= pageIndex(previous.current) ? "page-forward" : "page-back"
  previous.current = pathname

  return (
    <div key={pathname} className={direction}>
      {children}
    </div>
  )
}

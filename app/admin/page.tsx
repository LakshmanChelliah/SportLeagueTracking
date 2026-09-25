import type { Metadata } from "next"
import { AdminView } from "@/components/admin-view"
import { getLeague } from "@/lib/league"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Enter scores" }

export default function AdminPage() {
  return <AdminView league={getLeague()} />
}

import { HomeView } from "@/components/home-view"
import { getLeague } from "@/lib/league"

export default function HomePage() {
  return <HomeView league={getLeague()} nowIso={new Date().toISOString()} />
}

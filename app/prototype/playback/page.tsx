import type { Metadata } from "next"
import { NightPlayback } from "@/components/prototype/night-playback"
import { getLeague } from "@/lib/league"

export const metadata: Metadata = { title: "Night playback" }

export default function PlaybackPage() {
  const { schedule } = getLeague()
  return <NightPlayback matches={schedule.matches} />
}

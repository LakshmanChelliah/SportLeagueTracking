import type { Metadata } from "next"
import { TitleSequence } from "@/components/prototype/title-sequence"
import { getLeague } from "@/lib/league"

export const metadata: Metadata = { title: "Title sequence" }

export default function OpenPage() {
  const { schedule } = getLeague()
  return <TitleSequence matches={schedule.matches} />
}

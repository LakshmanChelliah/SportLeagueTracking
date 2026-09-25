import { countdownLabel } from "@/lib/schedule"

export function Countdown({ startIso, nowIso }: { startIso: string; nowIso: string }) {
  return <span>{countdownLabel(new Date(startIso), new Date(nowIso))}</span>
}

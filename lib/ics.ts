import { formatTime, opponent } from "@/lib/schedule"
import type { Match } from "@/lib/types"

function stamp(date: string, time: string) {
  return `${date.replaceAll("-", "")}T${time.replace(":", "")}00`
}

function endTime(time: string) {
  return time === "18:00" ? "19:00" : "20:00"
}

function escapeText(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("\n", "\\n").replaceAll(",", "\\,").replaceAll(";", "\\;")
}

export function buildCalendar(matches: Match[], team: number) {
  const events = matches
    .filter((match) => match.home === team || match.away === team)
    .map((match) => {
      const summary = `GD RA Volleyball · vs Team ${opponent(match, team)}`
      const description = `${formatTime(match.time)} · Court ${match.court} · Double Gym. Warm up 10 minutes before.`
      return [
        "BEGIN:VEVENT",
        `UID:${match.id}-team${team}@gd-ra-volleyball`,
        `DTSTART;TZID=America/Toronto:${stamp(match.date, match.time)}`,
        `DTEND;TZID=America/Toronto:${stamp(match.date, endTime(match.time))}`,
        `SUMMARY:${escapeText(summary)}`,
        `LOCATION:Double Gym`,
        `DESCRIPTION:${escapeText(description)}`,
        "END:VEVENT",
      ].join("\r\n")
    })

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GD RA Volleyball//Schedule//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VTIMEZONE",
    "TZID:America/Toronto",
    "BEGIN:DAYLIGHT",
    "TZOFFSETFROM:-0500",
    "TZOFFSETTO:-0400",
    "TZNAME:EDT",
    "DTSTART:19700308T020000",
    "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU",
    "END:DAYLIGHT",
    "BEGIN:STANDARD",
    "TZOFFSETFROM:-0400",
    "TZOFFSETTO:-0500",
    "TZNAME:EST",
    "DTSTART:19701101T020000",
    "RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU",
    "END:STANDARD",
    "END:VTIMEZONE",
    ...events,
    "END:VCALENDAR",
    "",
  ].join("\r\n")
}

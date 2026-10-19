import type { Match, Venue } from "@/lib/types"

export function findVenue(venues: Venue[] | undefined, match: Pick<Match, "venue">) {
  if (!match.venue || !venues) return undefined
  return venues.find((venue) => venue.id === match.venue)
}

export function placeName(venues: Venue[] | undefined, match: Pick<Match, "venue" | "court">) {
  return findVenue(venues, match)?.name ?? `Court ${match.court}`
}

export function appleMapsUrl(address: string) {
  return `https://maps.apple.com/?q=${encodeURIComponent(address)}`
}

export function googleMapsUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
}

"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { appleMapsUrl, findVenue, googleMapsUrl } from "@/lib/venues"
import type { Match, Venue } from "@/lib/types"
import { cn } from "cn"

export function LocationLabel({
  venue,
  fallback,
  className,
}: {
  venue?: Venue
  fallback: string
  className?: string
}) {
  if (!venue?.address) {
    return <span className={className}>{venue?.name ?? fallback}</span>
  }

  return (
    <Dialog>
      <DialogTrigger
        type="button"
        className={cn(
          "cursor-pointer border-0 bg-transparent p-0 font-[inherit] text-inherit underline decoration-current/40 underline-offset-4 hover:text-foreground",
          className,
        )}
      >
        {venue.name}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Open in maps</DialogTitle>
          <DialogDescription>
            {venue.name}
            <span className="mt-1 block">{venue.address}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Button variant="outline" className="w-full" asChild>
            <a href={appleMapsUrl(venue.address)} target="_blank" rel="noopener noreferrer">
              Apple Maps
            </a>
          </Button>
          <Button variant="outline" className="w-full" asChild>
            <a href={googleMapsUrl(venue.address)} target="_blank" rel="noopener noreferrer">
              Google Maps
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function NightPlaces({
  matches,
  venues,
  gym,
  className,
}: {
  matches: Match[]
  venues: Venue[]
  gym: string
  className?: string
}) {
  const seen = new Map<string, { venue?: Venue; fallback: string }>()
  for (const match of matches) {
    const venue = findVenue(venues, match)
    const key = venue?.id ?? `court-${match.court}`
    if (!seen.has(key)) seen.set(key, { venue, fallback: `Court ${match.court}` })
  }
  const items = [...seen.values()]
  if (items.every((item) => !item.venue)) {
    return <span className={className}>{gym}</span>
  }

  return (
    <span className={className}>
      {items.map((item, index) => (
        <span key={item.venue?.id ?? item.fallback}>
          {index > 0 ? " · " : null}
          <LocationLabel venue={item.venue} fallback={item.fallback} />
        </span>
      ))}
    </span>
  )
}

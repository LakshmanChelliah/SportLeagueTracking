"use client"

import { useSyncExternalStore } from "react"
import { createLiveStore, watchScorePersistence, type LiveSnapshot, type LiveStore } from "@/lib/live-score"

export type ScoreSnapshot = {
  ready: boolean
  boards: LiveSnapshot["boards"]
  matchId: string | null
  persistOk: boolean
}

const SERVER_SNAPSHOT: ScoreSnapshot = {
  ready: false,
  boards: {},
  matchId: null,
  persistOk: true,
}

let browserStore: LiveStore | null = null

export function getLiveStore() {
  if (!browserStore) {
    try {
      browserStore = createLiveStore(window.localStorage)
    } catch {
      const data = new Map<string, string>()
      browserStore = createLiveStore(
        {
          getItem: (key) => data.get(key) ?? null,
          setItem: () => {
            throw new Error("unavailable")
          },
        },
        false,
      )
    }
  }
  return browserStore
}

function subscribe(listener: () => void) {
  if (typeof window === "undefined") return () => {}
  const live = getLiveStore()
  const unlisten = live.subscribe(listener)
  const unwatch = watchScorePersistence(() => live.reload(), document, window)
  return () => {
    unlisten()
    unwatch()
  }
}

function clientSnapshot() {
  if (typeof window === "undefined") return SERVER_SNAPSHOT
  return getLiveStore().getSnapshot()
}

export function useLiveScore() {
  return useSyncExternalStore(subscribe, clientSnapshot, () => SERVER_SNAPSHOT)
}

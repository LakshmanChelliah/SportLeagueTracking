"use client"

import { useCallback, useEffect, useState } from "react"
import { resultsUrl, withCacheBust } from "@/lib/endpoints"
import type { ResultsFile } from "@/lib/types"

function isResultsFile(value: unknown): value is ResultsFile {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  return Object.values(value).every((item) => {
    if (!item || typeof item !== "object") return false
    return Array.isArray((item as { games?: unknown }).games)
  })
}

export function useLiveResults(initial: ResultsFile) {
  const [results, setResults] = useState(initial)
  const reload = useCallback(() => {
    const url = withCacheBust(resultsUrl())
    return fetch(url, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return
        const data: unknown = await response.json()
        if (isResultsFile(data)) setResults(data)
      })
      .catch(() => undefined)
  }, [])
  useEffect(() => {
    void reload()
  }, [reload])
  return { results, reload }
}

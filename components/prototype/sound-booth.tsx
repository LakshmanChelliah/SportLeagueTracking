"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import catalog from "@/data/sound-preview.json"

const base = process.env.NEXT_PUBLIC_STATIC === "1" ? "/SportLeagueTracking" : ""

type Sound = (typeof catalog)[number]

function src(file: string) {
  return `${base}/sounds/${file}`
}

export function SoundBooth() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const currentRef = useRef<string | null>(null)
  const setMode = useRef(false)
  const holdTimer = useRef<number | null>(null)
  const startRef = useRef<(id: string) => void>(() => {})
  const [current, setCurrent] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [playingSet, setPlayingSet] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function clearHold() {
    if (holdTimer.current != null) {
      window.clearTimeout(holdTimer.current)
      holdTimer.current = null
    }
  }

  function stopRow() {
    audioRef.current?.pause()
    clearHold()
    currentRef.current = null
    setCurrent(null)
    setProgress(0)
  }

  useEffect(() => {
    const audio = new Audio()
    audio.preload = "auto"
    audioRef.current = audio

    function clearHoldInside() {
      if (holdTimer.current != null) {
        window.clearTimeout(holdTimer.current)
        holdTimer.current = null
      }
    }

    function hold(id: string) {
      clearHoldInside()
      setProgress(1)
      holdTimer.current = window.setTimeout(() => {
        if (currentRef.current === id && !setMode.current) {
          currentRef.current = null
          setCurrent(null)
          setProgress(0)
        }
      }, 700)
    }

    function start(id: string) {
      const item = catalog.find((sound) => sound.id === id)
      if (!item) return
      clearHoldInside()
      setError(null)
      currentRef.current = id
      setCurrent(id)
      setProgress(0)
      audio.src = src(item.file)
      audio.currentTime = 0
      void audio.play().catch(() => setError("The browser blocked playback. Tap the sound again."))
    }

    function stopIfIdle() {
      if (setMode.current) {
        const index = catalog.findIndex((item) => item.id === currentRef.current)
        const next = catalog[index + 1]
        if (next) {
          start(next.id)
          return
        }
      }
      setMode.current = false
      setPlayingSet(false)
      if (currentRef.current) hold(currentRef.current)
    }

    function onTime() {
      if (!audio.duration || audio.ended) return
      setProgress(audio.currentTime / audio.duration)
    }

    function onError() {
      setError("This sound didn't load. Try it again.")
    }

    startRef.current = start
    audio.addEventListener("timeupdate", onTime)
    audio.addEventListener("ended", stopIfIdle)
    audio.addEventListener("error", onError)

    return () => {
      audio.pause()
      clearHoldInside()
      startRef.current = () => {}
      audio.removeEventListener("timeupdate", onTime)
      audio.removeEventListener("ended", stopIfIdle)
      audio.removeEventListener("error", onError)
    }
  }, [])

  function playOne(id: string) {
    setMode.current = false
    setPlayingSet(false)
    const audio = audioRef.current
    if (currentRef.current === id && audio && !audio.paused) {
      stopRow()
      return
    }
    startRef.current(id)
  }

  function playSet() {
    if (playingSet) {
      setMode.current = false
      setPlayingSet(false)
      stopRow()
      return
    }
    setMode.current = true
    setPlayingSet(true)
    startRef.current(catalog[0].id)
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#09090b] px-5 py-8 text-[#f4f4f5]">
      <Link href="/prototype" className="text-[11px] font-semibold tracking-[0.18em] text-[#71717a] uppercase">
        Prototypes
      </Link>
      <p className="mt-8 text-[11px] font-semibold tracking-[0.22em] text-[#e8572a] uppercase">Sound examples</p>
      <h1 className="mt-3 font-display text-[64px] leading-[0.84] tracking-wide uppercase">Listen first</h1>
      <p className="mt-4 max-w-sm text-sm text-[#a1a1aa]">
        Six sounds. Volume up. Hits are the loud ones. Spinning is the long whir. Nothing here is on the league board.
      </p>
      <p className="mt-3 max-w-sm text-sm text-[#a1a1aa]">
        Style of this pass: fast plastic-and-metal tops in a small stadium. Short hits, a high whir.
      </p>

      <button
        type="button"
        onClick={playSet}
        className="mt-8 h-14 rounded-xl bg-[#e8572a] text-sm font-semibold tracking-wide text-[#1c0c06] uppercase"
      >
        {playingSet ? "Stop the set" : "Play all six"}
      </button>
      {error ? <p className="mt-3 text-sm text-[#d7a8a3]">{error}</p> : null}

      <div className="mt-8 flex flex-col">
        {catalog.map((sound, index) => (
          <SoundRow
            key={sound.id}
            sound={sound}
            index={index}
            active={current === sound.id}
            progress={current === sound.id ? progress : 0}
            onPlay={() => playOne(sound.id)}
          />
        ))}
      </div>

      <section className="mt-12 border-t border-white/10 pt-8">
        <h2 className="font-display text-4xl tracking-wide uppercase">Before the rest</h2>
        <p className="mt-3 max-w-sm text-sm text-[#a1a1aa]">
          If this direction is right, the full set comes next, then we wire it in. Reply with whatever you know.
        </p>
        <ol className="mt-5 flex max-w-sm list-decimal flex-col gap-3 pl-5 text-sm text-[#d4d4d8]">
          <li>Are these spinning tops in a stadium, or something else, like a ball in a gym?</li>
          <li>Should the hits stay this short and punchy, or feel heavier and more like a real room?</li>
          <li>Do you want a light, medium, and heavy version of each hit?</li>
          <li>Is there a game, show, or clip these should sit near?</li>
          <li>Should the spin loop under a whole round, quieter than the hits?</li>
          <li>What else belongs in the set — a launch, a win, a burst, a countdown?</li>
        </ol>
      </section>

      <Link href="/prototype" className="mt-10 text-sm text-[#a1a1aa] underline underline-offset-4">
        Back to prototypes
      </Link>
    </div>
  )
}

function SoundRow({
  sound,
  index,
  active,
  progress,
  onPlay,
}: {
  sound: Sound
  index: number
  active: boolean
  progress: number
  onPlay: () => void
}) {
  return (
    <button type="button" onClick={onPlay} className="sound-hit border-t border-white/10 py-5 text-left" aria-pressed={active}>
      <span className="flex items-start gap-4">
        <span
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${active ? "bg-[#e8572a] text-[#1c0c06]" : "border border-white/15 text-[#f4f4f5]"}`}
          aria-hidden
        >
          {active ? <PauseMark /> : <PlayMark />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="text-[11px] font-semibold tracking-[0.18em] text-[#71717a]">
            {String(index + 1).padStart(2, "0")} · {sound.seconds.toFixed(1)}s
          </span>
          <span className="mt-1 block font-display text-4xl tracking-wide uppercase">{sound.title}</span>
          <span className="mt-1 block text-sm text-[#a1a1aa]">{sound.detail}</span>
          <span className="mt-3 flex h-8 items-end gap-[2px]" aria-hidden>
            {sound.peaks.map((peak, bar) => {
              const heard = active && progress >= bar / sound.peaks.length
              return (
                <span
                  key={bar}
                  className={`block flex-1 rounded-sm ${heard ? "bg-[#e8572a]" : "bg-white/20"}`}
                  style={{ height: `${Math.max(12, peak * 100)}%` }}
                />
              )
            })}
          </span>
        </span>
      </span>
    </button>
  )
}

function PlayMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
      <path d="M5 3.2v11.6L15 9 5 3.2Z" />
    </svg>
  )
}

function PauseMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
      <rect x="4" y="3" width="3.2" height="12" rx="0.6" />
      <rect x="10.8" y="3" width="3.2" height="12" rx="0.6" />
    </svg>
  )
}

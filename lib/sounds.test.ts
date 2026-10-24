import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import catalog from "@/data/sound-preview.json"

function readWav(file: string) {
  const buf = readFileSync(`public/sounds/${file}`)
  expect(buf.toString("ascii", 0, 4)).toBe("RIFF")
  expect(buf.toString("ascii", 8, 12)).toBe("WAVE")
  expect(buf.readUInt16LE(20)).toBe(1)
  expect(buf.readUInt16LE(22)).toBe(2)
  expect(buf.readUInt32LE(24)).toBe(44100)
  expect(buf.readUInt16LE(34)).toBe(16)
  const dataSize = buf.readUInt32LE(40)
  expect(buf.toString("ascii", 36, 40)).toBe("data")
  let sum = 0
  let peak = 0
  const samples = dataSize / 2
  for (let i = 44; i < 44 + dataSize; i += 2) {
    const value = buf.readInt16LE(i) / 32767
    peak = Math.max(peak, Math.abs(value))
    sum += value * value
  }
  return {
    seconds: dataSize / 4 / 44100,
    peak,
    rms: Math.sqrt(sum / samples),
  }
}

describe("sound examples", () => {
  it("ships the six listening examples as playable wavs", () => {
    expect(catalog.map((sound) => sound.id)).toEqual(["clash", "wall", "special", "spin", "spin-out", "bounce"])
    for (const sound of catalog) {
      const wav = readWav(sound.file)
      expect(wav.peak).toBeGreaterThan(0.4)
      expect(wav.peak).toBeLessThanOrEqual(1)
      expect(wav.rms).toBeGreaterThan(0.02)
      expect(wav.seconds).toBeCloseTo(sound.seconds, 1)
      expect(sound.peaks.length).toBeGreaterThan(8)
      expect(sound.title.length).toBeGreaterThan(0)
      expect(sound.detail.length).toBeGreaterThan(0)
    }
  })

  it("keeps the hits short and the spin bed longer", () => {
    const byId = Object.fromEntries(catalog.map((sound) => [sound.id, sound.seconds]))
    expect(byId.clash).toBeLessThan(0.6)
    expect(byId.wall).toBeLessThan(1)
    expect(byId.special).toBeLessThan(1.2)
    expect(byId.bounce).toBeLessThan(1.5)
    expect(byId.spin).toBeGreaterThan(3)
    expect(byId["spin-out"]).toBeGreaterThan(byId.spin)
  })
})

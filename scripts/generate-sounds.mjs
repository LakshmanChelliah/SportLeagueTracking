/**
 * Builds the first listening set in public/sounds/.
 * Run with `npm run sounds` and commit the wavs plus data/sound-preview.json.
 *
 * Style: fast plastic-and-metal tops in a small stadium.
 * Hits are short. Spin is a high whir. The spin-out is that same whir slowing down.
 */
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

const SR = 44100
const root = process.cwd()

function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function make(seconds) {
  return new Float64Array(Math.max(1, Math.floor(seconds * SR)))
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function biquad(kind) {
  return { kind, b0: 1, b1: 0, b2: 0, a1: 0, a2: 0, x1: 0, x2: 0, y1: 0, y2: 0 }
}

function setBiquad(filter, freq, q) {
  const f = clamp(freq, 30, 16000)
  const qq = clamp(q, 0.15, 12)
  const w0 = (2 * Math.PI * f) / SR
  const alpha = Math.sin(w0) / (2 * qq)
  const cos = Math.cos(w0)
  let b0 = 1
  let b1 = 0
  let b2 = 0
  let a0 = 1
  let a1 = 0
  let a2 = 0
  if (filter.kind === "low") {
    b0 = (1 - cos) / 2
    b1 = 1 - cos
    b2 = (1 - cos) / 2
    a0 = 1 + alpha
    a1 = -2 * cos
    a2 = 1 - alpha
  } else if (filter.kind === "high") {
    b0 = (1 + cos) / 2
    b1 = -(1 + cos)
    b2 = (1 + cos) / 2
    a0 = 1 + alpha
    a1 = -2 * cos
    a2 = 1 - alpha
  } else {
    b0 = alpha
    b1 = 0
    b2 = -alpha
    a0 = 1 + alpha
    a1 = -2 * cos
    a2 = 1 - alpha
  }
  filter.b0 = b0 / a0
  filter.b1 = b1 / a0
  filter.b2 = b2 / a0
  filter.a1 = a1 / a0
  filter.a2 = a2 / a0
}

function runBiquad(filter, x) {
  const y = filter.b0 * x + filter.b1 * filter.x1 + filter.b2 * filter.x2 - filter.a1 * filter.y1 - filter.a2 * filter.y2
  filter.x2 = filter.x1
  filter.x1 = x
  filter.y2 = filter.y1
  filter.y1 = y
  if (!Number.isFinite(y) || Math.abs(y) > 8) {
    filter.x1 = filter.x2 = filter.y1 = filter.y2 = 0
    return 0
  }
  return y
}

function saturate(x, drive = 1.8) {
  return Math.tanh(x * drive) / Math.tanh(drive)
}

function envExp(t, rate) {
  return Math.exp(-t * rate)
}

function addPartial(buf, start, seconds, hz, decay, amp, bend = 0) {
  let phase = 0
  const i0 = Math.floor(start * SR)
  const i1 = Math.min(buf.length, i0 + Math.floor(seconds * SR))
  for (let i = i0; i < i1; i++) {
    const t = (i - i0) / SR
    const freq = hz * (1 - bend * (1 - Math.exp(-t * 14)))
    buf[i] += Math.sin(phase) * amp * envExp(t, decay)
    phase += (2 * Math.PI * freq) / SR
    if (phase > 1e6) phase -= 1e6
  }
}

function addNoise(buf, start, seconds, amp, decay, color, seed) {
  const rng = mulberry32(seed)
  const filter = biquad(color.kind)
  setBiquad(filter, color.hz, color.q)
  const i0 = Math.floor(start * SR)
  const i1 = Math.min(buf.length, i0 + Math.floor(seconds * SR))
  for (let i = i0; i < i1; i++) {
    const t = (i - i0) / SR
    const n = runBiquad(filter, rng() * 2 - 1)
    buf[i] += n * amp * envExp(t, decay)
  }
}

/** One contact: crack, thud, short inharmonic ring. */
function hit(buf, start, opts) {
  const amp = opts.amp ?? 1
  const dur = opts.dur ?? 0.28
  addNoise(
    buf,
    start,
    Math.min(0.045, dur),
    amp * (opts.crack ?? 0.85),
    opts.crackDecay ?? 80,
    { kind: "band", hz: opts.crackHz ?? 2400, q: opts.crackQ ?? 0.9 },
    opts.seed ?? 1,
  )
  addNoise(
    buf,
    start,
    dur * 0.45,
    amp * (opts.bodyNoise ?? 0.28),
    opts.bodyDecay ?? 22,
    { kind: "low", hz: opts.bodyHz ?? 240, q: 0.8 },
    (opts.seed ?? 1) + 17,
  )
  addPartial(buf, start, dur, opts.bodyHz ?? 180, opts.bodyDecay ?? 16, amp * (opts.body ?? 0.55), opts.bend ?? 0.45)
  const rings = opts.rings ?? [740, 1280, 1960]
  rings.forEach((hz, index) => {
    addPartial(
      buf,
      start,
      dur,
      hz,
      (opts.ringDecay ?? 20) + index * 6,
      amp * (opts.ring ?? 0.22) * (1 - index * 0.22),
      0.08,
    )
  })
}

function clash() {
  const buf = make(0.42)
  hit(buf, 0.008, {
    seed: 11,
    amp: 1,
    dur: 0.34,
    crack: 1.15,
    crackHz: 2400,
    crackQ: 0.85,
    bodyHz: 168,
    body: 0.62,
    bodyNoise: 0.22,
    bend: 0.55,
    ring: 0.5,
    ringDecay: 22,
    rings: [860, 1040, 1730],
  })
  // A second piece, slightly late and a little higher, so the hit is two things meeting.
  hit(buf, 0.014, {
    seed: 29,
    amp: 0.55,
    dur: 0.22,
    crack: 0.35,
    crackHz: 2800,
    crackQ: 1.4,
    bodyHz: 240,
    body: 0.22,
    bodyNoise: 0.08,
    ring: 0.28,
    ringDecay: 34,
    rings: [1120, 1510],
  })
  return finish(buf, { fadeIn: 0.001, fadeOut: 0.02, drive: 1.6, haas: 11 })
}

function wallClash() {
  const buf = make(0.7)
  hit(buf, 0.008, {
    seed: 41,
    amp: 1,
    dur: 0.3,
    crack: 0.72,
    crackHz: 1900,
    crackQ: 0.8,
    crackDecay: 55,
    bodyHz: 210,
    body: 0.38,
    bodyNoise: 0.34,
    bend: 0.2,
    ring: 0.48,
    ringDecay: 16,
    rings: [320, 640, 1280, 2140],
  })
  // Chatter against the rail.
  hit(buf, 0.2, {
    seed: 43,
    amp: 0.78,
    dur: 0.22,
    crack: 0.55,
    crackHz: 2400,
    crackQ: 1.2,
    bodyHz: 340,
    body: 0.12,
    bodyNoise: 0.1,
    ring: 0.2,
    ringDecay: 22,
    rings: [1680, 2420],
  })
  return finish(buf, { fadeIn: 0.001, fadeOut: 0.04, drive: 1.35, haas: 18, room: 0.18 })
}

function specialClash() {
  const buf = make(0.95)
  const rng = mulberry32(70)
  const sweep = biquad("band")
  const airEnd = 0.22
  for (let i = 0; i < Math.floor(airEnd * SR); i++) {
    const t = i / SR
    const p = t / airEnd
    setBiquad(sweep, 380 + 2200 * p * p, 2.2)
    const n = runBiquad(sweep, rng() * 2 - 1)
    const rise = 0.35 + 0.65 * Math.pow(p, 1.2)
    buf[i] += n * 1.35 * rise
  }
  hit(buf, 0.2, {
    seed: 73,
    amp: 1,
    dur: 0.55,
    crack: 0.85,
    crackHz: 1500,
    crackQ: 0.85,
    bodyHz: 150,
    body: 0.42,
    bodyNoise: 0.22,
    bodyDecay: 12,
    bend: 0.45,
    ring: 0.7,
    ringDecay: 9,
    rings: [420, 860, 1410, 1980],
  })
  return finish(buf, { fadeIn: 0.004, fadeOut: 0.06, drive: 1.9, haas: 16, room: 0.22 })
}

function spinVoice(seconds, rpmAt, seed) {
  const buf = make(seconds)
  const rng = mulberry32(seed)
  const air = biquad("band")
  const body = biquad("band")
  let phase = 0
  let flutterPhase = 0
  for (let i = 0; i < buf.length; i++) {
    const t = i / SR
    const rpm = clamp(rpmAt(t), 0, 1.15)
    const flutterRate = 6 + 28 * rpm
    flutterPhase += (2 * Math.PI * flutterRate) / SR
    const depth = 0.08 + 0.82 * (1 - Math.min(rpm, 1))
    const pulse = 1 - depth + depth * (0.5 + 0.5 * Math.sin(flutterPhase))
    const drift = 1 + 0.05 * Math.sin((2 * Math.PI * 0.35 * t))
    if (i % 32 === 0) {
      setBiquad(air, (1400 + 1200 * rpm) * drift, 3.2)
      setBiquad(body, 180 + 280 * rpm, 2.2)
    }
    const airN = runBiquad(air, rng() * 2 - 1)
    const bodyN = runBiquad(body, rng() * 2 - 1)
    const whineHz = 190 + 460 * rpm
    phase += (2 * Math.PI * whineHz) / SR
    const whine = Math.sin(phase) * 0.45 + Math.sin(phase * 2) * 0.22
    const airAmt = 0.16 * Math.pow(Math.min(rpm, 1), 1.2)
    const level = 0.05 + 0.95 * Math.min(rpm, 1)
    buf[i] = (airN * airAmt + bodyN * 0.62 + whine * 0.36) * pulse * level
  }
  // Knock the rumble down so the whir reads on a phone speaker.
  const high = biquad("high")
  setBiquad(high, 140, 0.7)
  for (let i = 0; i < buf.length; i++) buf[i] = runBiquad(high, buf[i])
  return buf
}

function spinning() {
  const buf = spinVoice(4, () => 1, 101)
  return finish(buf, { fadeIn: 0.04, fadeOut: 0.06, drive: 1.05, haas: 22, peak: 0.62 })
}

function spinOut() {
  const seconds = 4.8
  const buf = spinVoice(seconds, (t) => Math.exp(-Math.pow(t / 2.15, 1.65)), 202)
  hit(buf, 3.55, {
    seed: 210,
    amp: 0.55,
    dur: 0.16,
    crack: 0.45,
    bodyHz: 220,
    body: 0.2,
    ring: 0.08,
    rings: [680],
    ringDecay: 30,
  })
  hit(buf, 3.92, {
    seed: 214,
    amp: 0.34,
    dur: 0.12,
    crack: 0.35,
    bodyHz: 180,
    body: 0.12,
    ring: 0.05,
    rings: [540],
  })
  hit(buf, 4.22, {
    seed: 218,
    amp: 0.18,
    dur: 0.1,
    crack: 0.22,
    bodyHz: 140,
    body: 0.08,
    ring: 0,
    rings: [],
  })
  return finish(buf, { fadeIn: 0.03, fadeOut: 0.08, drive: 1.15, haas: 22, peak: 0.72 })
}

function bounce() {
  const buf = make(0.85)
  const gaps = [0, 0.15, 0.27, 0.37, 0.45, 0.51, 0.56]
  gaps.forEach((start, index) => {
    const left = gaps.length - index
    hit(buf, 0.01 + start, {
      seed: 300 + index * 9,
      amp: 0.95 * Math.pow(0.74, index),
      dur: 0.12 + left * 0.015,
      crack: 0.55,
      crackHz: 1700 + index * 180,
      crackQ: 1.15,
      crackDecay: 95,
      bodyHz: 260 + index * 70,
      body: 0.22,
      bodyNoise: 0.12,
      bodyDecay: 28,
      bend: 0.15,
      ring: 0.08,
      ringDecay: 36,
      rings: [900 + index * 140],
    })
  })
  return finish(buf, { fadeIn: 0.001, fadeOut: 0.03, drive: 1.4, haas: 9 })
}

function finish(mono, opts) {
  const n = mono.length
  const l = new Float64Array(n)
  const r = new Float64Array(n)
  const drive = opts.drive ?? 1.4
  const fadeIn = Math.floor((opts.fadeIn ?? 0.002) * SR)
  const fadeOut = Math.floor((opts.fadeOut ?? 0.02) * SR)
  for (let i = 0; i < n; i++) {
    let x = saturate(mono[i], drive)
    if (i < fadeIn) x *= i / fadeIn
    if (i > n - fadeOut) x *= (n - i) / fadeOut
    l[i] = x
    r[i] = x
  }
  const delay = opts.haas ?? 12
  for (let i = n - 1; i >= delay; i--) {
    r[i] = r[i] * 0.82 + l[i - delay] * 0.18
  }
  if (opts.room) {
    const taps = [
      [Math.floor(0.013 * SR), opts.room * 0.45],
      [Math.floor(0.023 * SR), opts.room * 0.28],
      [Math.floor(0.037 * SR), opts.room * 0.16],
    ]
    for (const [tap, gain] of taps) {
      for (let i = tap; i < n; i++) {
        l[i] += l[i - tap] * gain
        r[i] += r[i - tap] * gain * 0.9
      }
    }
  }
  blockDc(l)
  blockDc(r)
  let peak = 0
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(l[i]), Math.abs(r[i]))
  const gain = peak > 0 ? (opts.peak ?? 0.89) / peak : 1
  for (let i = 0; i < n; i++) {
    l[i] *= gain
    r[i] *= gain
    if (!Number.isFinite(l[i]) || !Number.isFinite(r[i])) throw new Error("non-finite sample")
  }
  return { l, r, n }
}

function blockDc(buf) {
  let x1 = 0
  let y1 = 0
  for (let i = 0; i < buf.length; i++) {
    const x = buf[i]
    const y = x - x1 + 0.995 * y1
    x1 = x
    y1 = y
    buf[i] = y
  }
}

function peaksOf(left, bars = 42) {
  const out = []
  const size = Math.floor(left.length / bars)
  for (let i = 0; i < bars; i++) {
    let max = 0
    for (let j = 0; j < size; j++) max = Math.max(max, Math.abs(left[i * size + j]))
    out.push(Math.round(max * 100) / 100)
  }
  return out
}

function stats(left) {
  let sum = 0
  let peak = 0
  for (let i = 0; i < left.length; i++) {
    const v = left[i]
    peak = Math.max(peak, Math.abs(v))
    sum += v * v
  }
  return { peak, rms: Math.sqrt(sum / left.length) }
}

function wav(left, right) {
  const n = left.length
  const dataSize = n * 4
  const buf = Buffer.alloc(44 + dataSize)
  buf.write("RIFF", 0)
  buf.writeUInt32LE(36 + dataSize, 4)
  buf.write("WAVE", 8)
  buf.write("fmt ", 12)
  buf.writeUInt32LE(16, 16)
  buf.writeUInt16LE(1, 20)
  buf.writeUInt16LE(2, 22)
  buf.writeUInt32LE(SR, 24)
  buf.writeUInt32LE(SR * 4, 28)
  buf.writeUInt16LE(4, 32)
  buf.writeUInt16LE(16, 34)
  buf.write("data", 36)
  buf.writeUInt32LE(dataSize, 40)
  for (let i = 0; i < n; i++) {
    const ls = clamp(Math.round(left[i] * 32767), -32767, 32767)
    const rs = clamp(Math.round(right[i] * 32767), -32767, 32767)
    buf.writeInt16LE(ls, 44 + i * 4)
    buf.writeInt16LE(rs, 46 + i * 4)
  }
  return buf
}

const catalog = [
  {
    id: "clash",
    file: "clash.wav",
    title: "Clash",
    detail: "Two pieces meet. One short crack, then a little metal.",
    render: clash,
  },
  {
    id: "wall",
    file: "wall.wav",
    title: "Wall clash",
    detail: "A hit into the stadium wall, then a second tap as it chatters on the rail.",
    render: wallClash,
  },
  {
    id: "special",
    file: "special.wav",
    title: "Special move clash",
    detail: "A rush of air, then a heavier hit.",
    render: specialClash,
  },
  {
    id: "spin",
    file: "spin.wav",
    title: "Spinning",
    detail: "The steady whir at full speed. In a round this would sit quieter, under the hits.",
    render: spinning,
  },
  {
    id: "spin-out",
    file: "spin-out.wav",
    title: "Running out of spin",
    detail: "The same whir slows, wobbles, and drops, then a few last taps.",
    render: spinOut,
  },
  {
    id: "bounce",
    file: "bounce.wav",
    title: "Bounce",
    detail: "Light hits in a row. Each one is smaller, and closer to the last.",
    render: bounce,
  },
]

const outDir = path.join(root, "public", "sounds")
await mkdir(outDir, { recursive: true })

const manifest = []
for (const item of catalog) {
  const rendered = item.render()
  const info = stats(rendered.l)
  if (info.peak < 0.4 || info.rms < 0.02) {
    throw new Error(`${item.id} is too quiet (peak ${info.peak.toFixed(3)}, rms ${info.rms.toFixed(3)})`)
  }
  await writeFile(path.join(outDir, item.file), wav(rendered.l, rendered.r))
  const seconds = Math.round((rendered.n / SR) * 100) / 100
  manifest.push({
    id: item.id,
    file: item.file,
    title: item.title,
    detail: item.detail,
    seconds,
    peaks: peaksOf(rendered.l),
  })
  const bars = info.rms
  console.log(
    `${item.id.padEnd(10)} ${seconds.toFixed(2)}s  peak ${info.peak.toFixed(2)}  rms ${info.rms.toFixed(3)}  ${"█".repeat(Math.round(bars * 40))}`,
  )
}

await writeFile(path.join(root, "data", "sound-preview.json"), `${JSON.stringify(manifest, null, 2)}\n`)

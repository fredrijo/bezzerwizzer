export type MoodId = "think" | "cheer" | "gloom" | "rock" | "neighborhood"

export const MOODS: { id: MoodId; label: string; hint: string }[] = [
  { id: "think", label: "Tenkepuls", hint: "Rolig klokke mens laget tenker" },
  { id: "cheer", label: "God stemning", hint: "Lys, kort sløyfe" },
  { id: "gloom", label: "Dårlig stemning", hint: "Tung moll under bordet" },
  { id: "rock", label: "Rock", hint: "Et eget lite riff" },
  { id: "neighborhood", label: "Nabolaget", hint: "Tullete jingel fra gata" },
]

export class TableAudio {
  private ctx: AudioContext | null = null
  private moodStop: (() => void) | null = null
  muted = false

  unlock(): void {
    const ctx = this.context()
    if (ctx.state === "suspended") void ctx.resume()
  }

  stopMood(): void {
    this.moodStop?.()
    this.moodStop = null
  }

  async playMood(id: MoodId): Promise<void> {
    if (this.muted) return
    const ctx = this.context()
    if (ctx.state !== "running") {
      try {
        await ctx.resume()
      } catch {
        return
      }
    }
    if (this.muted) return
    this.stopMood()
    this.moodStop = startMood(ctx, id)
  }

  /** Rising roll that finishes as the streaker appears. Returns how long to wait, in ms. */
  anticipate(): number {
    if (this.muted) return 0
    const ctx = this.context()
    if (ctx.state === "suspended") void ctx.resume()
    let when = ctx.currentTime + 0.02
    const hits = 12
    for (let index = 0; index < hits; index += 1) {
      noiseHit(ctx, when, 0.05, 0.16 + index * 0.012)
      tone(ctx, 196 + index * 32, when, 0.07, "triangle", 0.09)
      when += Math.max(0.045, 0.15 - index * 0.009)
    }
    tone(ctx, 523, when, 0.16, "square", 0.1)
    tone(ctx, 784, when, 0.28, "sawtooth", 0.06)
    return Math.round((when - ctx.currentTime) * 1000) + 40
  }

  clap(): void {
    this.burst(0.22, "highpass", 900, 0.35)
  }

  shock(): void {
    if (this.muted) return
    const ctx = this.context()
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = "sawtooth"
    osc.frequency.setValueAtTime(90, now)
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.35)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.42)
    this.burst(0.3, "bandpass", 400, 0.2)
  }

  blip(): void {
    if (this.muted) return
    const ctx = this.context()
    const now = ctx.currentTime
    tone(ctx, 520, now, 0.09, "sine", 0.08)
    tone(ctx, 760, now + 0.06, 0.1, "sine", 0.06)
  }

  tick(): void {
    if (this.muted) return
    tone(this.context(), 1400, this.context().currentTime, 0.05, "square", 0.04)
  }

  fanfare(): void {
    if (this.muted) return
    const ctx = this.context()
    const notes = [523, 659, 784, 1046]
    notes.forEach((freq, index) => {
      tone(ctx, freq, ctx.currentTime + index * 0.13, 0.22, "triangle", 0.1)
    })
  }

  chime(): void {
    if (this.muted) return
    const ctx = this.context()
    tone(ctx, 880, ctx.currentTime, 0.18, "sine", 0.08)
    tone(ctx, 660, ctx.currentTime + 0.16, 0.28, "sine", 0.08)
  }

  private context(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext()
    if (this.ctx.state === "suspended") void this.ctx.resume()
    return this.ctx
  }

  private burst(
    seconds: number,
    filterType: BiquadFilterType,
    frequency: number,
    volume: number,
  ): void {
    if (this.muted) return
    const ctx = this.context()
    const now = ctx.currentTime
    const source = ctx.createBufferSource()
    source.buffer = noiseBuffer(ctx, seconds)
    const filter = ctx.createBiquadFilter()
    filter.type = filterType
    filter.frequency.value = frequency
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(volume, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds)
    source.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    source.start(now)
    source.stop(now + seconds)
  }
}

export const tableAudio = new TableAudio()

function noiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const length = Math.max(1, Math.floor(ctx.sampleRate * seconds))
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let index = 0; index < length; index += 1) data[index] = Math.random() * 2 - 1
  return buffer
}

function tone(
  ctx: AudioContext,
  freq: number,
  when: number,
  duration: number,
  type: OscillatorType,
  volume: number,
  destination: AudioNode = ctx.destination,
): void {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, when)
  gain.gain.setValueAtTime(0.0001, when)
  gain.gain.exponentialRampToValueAtTime(volume, when + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration)
  osc.connect(gain)
  gain.connect(destination)
  osc.start(when)
  osc.stop(when + duration + 0.02)
}

function startMood(ctx: AudioContext, id: MoodId): () => void {
  const master = ctx.createGain()
  master.gain.value = 0.72
  master.connect(ctx.destination)

  if (id === "gloom") return startGloom(ctx, master)

  const every = id === "rock" ? 0.14 : id === "cheer" ? 0.16 : id === "neighborhood" ? 0.2 : 0.48
  let step = 0
  let stopped = false
  let timer = 0

  const loop = () => {
    if (stopped) return
    const now = ctx.currentTime
    if (id === "think") {
      tone(ctx, step % 4 === 3 ? 330 : 196, now, 0.16, "sine", 0.08, master)
      if (step % 2 === 0) tone(ctx, 980, now, 0.03, "square", 0.03, master)
    } else if (id === "cheer") {
      const arp = [262, 330, 392, 523, 392, 330]
      tone(ctx, arp[step % arp.length]!, now, 0.14, "triangle", 0.09, master)
    } else if (id === "rock") {
      if (step % 4 === 0) {
        tone(ctx, 82, now, 0.12, "square", 0.08, master)
        tone(ctx, 123, now, 0.12, "square", 0.05, master)
      }
      tone(ctx, 1800, now, 0.03, "square", step % 2 === 0 ? 0.03 : 0.015, master)
    } else {
      const melody = [392, 440, 494, 392, 330, 294, 330, 392, 494, 523, 494, 392, 349, 330, 294, 262]
      tone(ctx, melody[step % melody.length]!, now, 0.16, "square", 0.05, master)
    }
    step += 1
    timer = window.setTimeout(loop, every * 1000)
  }
  loop()

  return () => {
    stopped = true
    window.clearTimeout(timer)
    fadeOut(ctx, master)
  }
}

function startGloom(ctx: AudioContext, master: GainNode): () => void {
  const filter = ctx.createBiquadFilter()
  filter.type = "lowpass"
  filter.frequency.value = 280
  filter.connect(master)
  const low = ctx.createOscillator()
  const high = ctx.createOscillator()
  low.type = "sawtooth"
  high.type = "sawtooth"
  low.frequency.value = 98
  high.frequency.value = 123
  const gain = ctx.createGain()
  gain.gain.value = 0.08
  low.connect(gain)
  high.connect(gain)
  gain.connect(filter)
  low.start()
  high.start()
  return () => {
    fadeOut(ctx, master)
    window.setTimeout(() => {
      low.stop()
      high.stop()
    }, 180)
  }
}

function noiseHit(ctx: AudioContext, when: number, seconds: number, volume: number): void {
  const source = ctx.createBufferSource()
  source.buffer = noiseBuffer(ctx, seconds)
  const filter = ctx.createBiquadFilter()
  filter.type = "highpass"
  filter.frequency.setValueAtTime(900, when)
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(volume, when)
  gain.gain.exponentialRampToValueAtTime(0.0001, when + seconds)
  source.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  source.start(when)
  source.stop(when + seconds + 0.02)
}

function fadeOut(ctx: AudioContext, master: GainNode): void {
  const now = ctx.currentTime
  master.gain.cancelScheduledValues(now)
  master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now)
  master.gain.exponentialRampToValueAtTime(0.0001, now + 0.18)
  window.setTimeout(() => master.disconnect(), 220)
}

// Web Audio API — kid-friendly UI sounds, no asset files needed.
// Short blips on tool tap, brush contact, clear, and happy "done" chord.

let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) {
    const AC = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)
    ctx = new AC()
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function tone(freq: number, durationMs: number, type: OscillatorType = 'sine', gain = 0.12, when = 0) {
  const ac = getCtx()
  const t = ac.currentTime + when
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(gain, t + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t + durationMs / 1000)
  osc.connect(g).connect(ac.destination)
  osc.start(t)
  osc.stop(t + durationMs / 1000 + 0.02)
}

export const sfx = {
  tap: () => tone(660, 80, 'sine', 0.08),
  pop: () => {
    const ac = getCtx()
    const t = ac.currentTime
    const osc = ac.createOscillator()
    const g = ac.createGain()
    osc.frequency.setValueAtTime(220, t)
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.08)
    g.gain.setValueAtTime(0.12, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12)
    osc.connect(g).connect(ac.destination)
    osc.start(t)
    osc.stop(t + 0.14)
  },
  scribble: () => {
    // Soft noise burst — called on stroke start, not every point
    const ac = getCtx()
    const buffer = ac.createBuffer(1, ac.sampleRate * 0.04, ac.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) * 0.08
    }
    const src = ac.createBufferSource()
    src.buffer = buffer
    src.connect(ac.destination)
    src.start()
  },
  clear: () => {
    tone(440, 120, 'triangle', 0.1, 0)
    tone(330, 140, 'triangle', 0.1, 0.08)
  },
  done: () => {
    // C major arpeggio — happy "saved" feedback
    tone(523.25, 140, 'sine', 0.1, 0)
    tone(659.25, 140, 'sine', 0.1, 0.1)
    tone(783.99, 240, 'sine', 0.1, 0.2)
  },
}

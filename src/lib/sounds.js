// Tiny synthesized sounds. No audio files — uses Web Audio API
// oscillators with soft envelopes so the bundle stays small and the
// tones stay editable. All sounds are gated on the user's
// settings.sounds toggle (default OFF) so we never surprise anyone.
//
// Tones are deliberately quiet and short. Higher frequencies are
// softer; lower ones carry more.

let _ctx = null
function ctx() {
  if (typeof window === 'undefined') return null
  if (_ctx) return _ctx
  try {
    _ctx = new (window.AudioContext || window.webkitAudioContext)()
  } catch {
    _ctx = null
  }
  return _ctx
}

// Play a tone with a gentle attack/decay envelope.
function tone({ freq, duration = 0.4, type = 'sine', volume = 0.06, attack = 0.04, decay = 0.18 }) {
  const ac = ctx()
  if (!ac) return
  try {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = type
    osc.frequency.value = freq
    osc.connect(gain)
    gain.connect(ac.destination)
    const now = ac.currentTime
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(volume, now + attack)
    gain.gain.linearRampToValueAtTime(0, now + attack + decay)
    osc.start(now)
    osc.stop(now + duration)
  } catch {
    // never let audio throw into the app
  }
}

// Gate the call on the user's toggle. Pass settings.sounds.
export function chime(enabled) {
  if (!enabled) return
  // Two-note soft chord: a clean fifth, decaying.
  tone({ freq: 660, duration: 0.45, volume: 0.04, attack: 0.02, decay: 0.32 })
  setTimeout(() => tone({ freq: 880, duration: 0.5, volume: 0.03, attack: 0.02, decay: 0.42 }), 60)
}

export function bloomSound(enabled) {
  if (!enabled) return
  // A small upward swell — three notes ascending, very soft.
  const notes = [440, 554, 660]
  notes.forEach((f, i) => setTimeout(() => tone({ freq: f, duration: 0.6, volume: 0.035, attack: 0.06, decay: 0.5 }), i * 110))
}

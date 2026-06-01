// Thin wrapper around the browser's SpeechRecognition API. Returns
// a small object with start / stop / supported and a per-event
// callback. Works in Chrome desktop + Android, iOS Safari ≥14.5,
// and other Chromium-derived browsers. Firefox is unsupported and
// will report `supported: false` so the UI can hide the button.
//
// Recognition runs in "continuous" mode so a single tap captures a
// long entry without re-arming on every pause. interimResults: true
// lets the UI show live partial transcription as the user speaks.
//
// onResult receives ({ transcript, isFinal }) chunks. Concatenate
// the final ones into the entry's body; show the interim ones as
// transient "live preview" text.
//
// onError receives a normalized error string the UI can surface.

const SR = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition)
  : null

export function isVoiceSupported() {
  return Boolean(SR)
}

export function createRecognizer({ onResult, onError, onEnd, lang = 'en-US' } = {}) {
  if (!SR) {
    return {
      supported: false,
      start: () => onError?.('Voice journaling needs Chrome or Safari (iOS 14.5+).'),
      stop:  () => {},
    }
  }
  const rec = new SR()
  rec.continuous = true
  rec.interimResults = true
  rec.lang = lang
  rec.maxAlternatives = 1

  rec.onresult = (event) => {
    // Walk only the new results since last callback. Mark each as
    // final or interim so the UI can stage them differently.
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const r = event.results[i]
      onResult?.({ transcript: r[0].transcript, isFinal: r.isFinal })
    }
  }
  rec.onerror = (event) => {
    const code = event?.error || 'unknown'
    const message = (
      code === 'not-allowed' || code === 'service-not-allowed'
        ? "Mic permission was declined. Enable it in your browser settings and try again."
      : code === 'no-speech'
        ? "Didn't pick up any words. Try again, a little closer to the mic."
      : code === 'audio-capture'
        ? "Couldn't find a microphone. Plug one in or try a different device."
      : code === 'network'
        ? "Voice recognition needs a connection. Check yours and try again."
      : `Couldn't transcribe (${code}). Try again.`
    )
    onError?.(message)
  }
  rec.onend = () => { onEnd?.() }

  return {
    supported: true,
    start: () => {
      try { rec.start() } catch (e) { onError?.(e?.message || 'Could not start recording.') }
    },
    stop: () => {
      try { rec.stop() } catch { /* noop */ }
    },
  }
}

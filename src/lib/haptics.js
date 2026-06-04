// Haptic feedback wrapper — a thin layer over @capacitor/haptics that
// silently no-ops on web. The taxonomy is deliberately small so the
// app uses haptics SPARSELY — every place we fire one should be a
// moment the user expects something physical. Overusing haptics
// (every tap, every scroll) breaks the haven posture and drains the
// battery; restraint is the design.
//
// Rules of use:
//   - hapticSoft:    selection / picker tap, mood pill on, gentle yes
//   - hapticMedium:  primary CTA tap, "Continue", "Save"
//   - hapticSuccess: completion / arrival — period start logged,
//                    onboarding finished, share invite accepted
//
// All calls are fire-and-forget. Errors are swallowed so a missing
// plugin or unsupported device never breaks the UI thread.

// Lazy-load both @capacitor/core AND the haptics plugin. Importing
// either statically would break web builds that don't have the
// packages installed yet. Each call awaits the resolve, returns null
// silently if anything is missing.
let _hapticsModulePromise = null
function getHapticsModule() {
  if (!_hapticsModulePromise) {
    _hapticsModulePromise = (async () => {
      try {
        const core = await import('@capacitor/core')
        if (!core?.Capacitor?.isNativePlatform?.()) return null
        return await import('@capacitor/haptics')
      } catch { return null }
    })()
  }
  return _hapticsModulePromise
}

export function hapticSoft() {
  getHapticsModule().then((m) => {
    if (!m) return
    m.Haptics.impact({ style: m.ImpactStyle.Light }).catch(() => {})
  })
}

export function hapticMedium() {
  getHapticsModule().then((m) => {
    if (!m) return
    m.Haptics.impact({ style: m.ImpactStyle.Medium }).catch(() => {})
  })
}

export function hapticSuccess() {
  getHapticsModule().then((m) => {
    if (!m) return
    m.Haptics.notification({ type: m.NotificationType.Success }).catch(() => {})
  })
}

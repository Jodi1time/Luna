import { useEffect } from 'react'

// Lock the page from scrolling when an overlay is open. Without this,
// touch/scroll/wheel events on the overlay backdrop can pass through
// to underlying content (especially on iOS Safari and some Chrome
// builds), so the user sees Home scrolling behind a "modal" that
// is supposed to be blocking.
//
// Strategy:
//   1. Save the body's current overflow + touch-action.
//   2. Pin them to 'hidden' / 'none' so nothing pans.
//   3. Restore on cleanup. Pin/unpin is keyed off `active` so an
//      overlay closing immediately frees the page back up.
//
// `<html>` and `<body>` already have `overflow: hidden` in index.css —
// belt + suspenders here, plus the touch-action that index.css
// doesn't set. Stackable: if two overlays open at once (e.g. Reflect
// practice + LunaChat), each gets its own ref count via a module-level
// counter so the LAST close is the one that actually unlocks.
let _locks = 0
let _origOverflow = ''
let _origTouchAction = ''
let _origOverscroll = ''

export function useScrollLock(active) {
  useEffect(() => {
    if (!active) return
    if (typeof document === 'undefined') return
    if (_locks === 0) {
      _origOverflow = document.body.style.overflow
      _origTouchAction = document.body.style.touchAction
      _origOverscroll = document.body.style.overscrollBehavior
      document.body.style.overflow = 'hidden'
      document.body.style.touchAction = 'none'
      document.body.style.overscrollBehavior = 'none'
    }
    _locks += 1
    return () => {
      _locks -= 1
      if (_locks <= 0) {
        _locks = 0
        document.body.style.overflow = _origOverflow
        document.body.style.touchAction = _origTouchAction
        document.body.style.overscrollBehavior = _origOverscroll
      }
    }
  }, [active])
}

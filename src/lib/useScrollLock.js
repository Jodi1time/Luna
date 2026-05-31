import { useEffect } from 'react'

// Lock the page from scrolling when an overlay is open.
//
// The body already has overflow:hidden (set in index.css), so locking
// `document.body` does almost nothing — the actual scrolling happens
// inside the .home-stage > <Screen> container which has overflowY:auto.
// To stop a touch/wheel/swipe in the dim area behind a modal from
// scrolling underlying content, we have to lock THAT scroller, not the
// body.
//
// Approach: when active, find every scrolling div in the page that is
// NOT inside an overlay (overlays mark themselves with
// data-luna-overlay="true"), record its current overflow style, and
// pin it to 'hidden'. On cleanup we restore.
//
// Also sets data-overlay-open on body so CSS can target it for any
// additional belt-and-suspenders rules. Ref-counted so stacked overlays
// (e.g. Reflect practice sheet + LunaChat) only unlock when the LAST
// one closes.
let _locks = 0
let _records = []  // [[element, originalOverflowY, originalOverflowX]]
let _origBodyOverflow = ''
let _origBodyTouchAction = ''

export function useScrollLock(active) {
  useEffect(() => {
    if (!active) return
    if (typeof document === 'undefined') return

    if (_locks === 0) {
      _origBodyOverflow = document.body.style.overflow
      _origBodyTouchAction = document.body.style.touchAction
      document.body.style.overflow = 'hidden'
      document.body.style.touchAction = 'none'
      document.body.setAttribute('data-overlay-open', 'true')

      // Find every scrollable element outside an overlay and lock it.
      // We re-scan each time because the DOM may have changed (new
      // screens mounted, etc.).
      const scrollables = document.querySelectorAll('div')
      _records = []
      scrollables.forEach((el) => {
        // Skip anything inside a luna overlay — those need to scroll.
        if (el.closest('[data-luna-overlay="true"]')) return
        const style = window.getComputedStyle(el)
        const scrolly = style.overflowY
        const scrollx = style.overflowX
        if (scrolly === 'auto' || scrolly === 'scroll' || scrollx === 'auto' || scrollx === 'scroll') {
          _records.push([el, el.style.overflowY, el.style.overflowX])
          el.style.overflowY = 'hidden'
          el.style.overflowX = 'hidden'
        }
      })
    }
    _locks += 1

    return () => {
      _locks -= 1
      if (_locks <= 0) {
        _locks = 0
        document.body.style.overflow = _origBodyOverflow
        document.body.style.touchAction = _origBodyTouchAction
        document.body.removeAttribute('data-overlay-open')
        _records.forEach(([el, y, x]) => {
          el.style.overflowY = y
          el.style.overflowX = x
        })
        _records = []
      }
    }
  }, [active])
}

import { createPortal } from 'react-dom'

// Renders children at document.body level, escaping any parent
// stacking context. Without this, our `position: fixed` overlays were
// being trapped inside the .home-stage > Screen scrolling container —
// so backdrop didn't cover the full viewport, the inner Screen could
// still be scrolled behind the modal, and on iOS Safari touches passed
// through to underlying content. Portaling out fixes all three.
//
// SSR-safe: returns null when document isn't available.
export default function Portal({ children }) {
  if (typeof document === 'undefined') return null
  return createPortal(children, document.body)
}

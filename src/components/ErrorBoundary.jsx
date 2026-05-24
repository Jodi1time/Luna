import { Component } from 'react'
import { T } from '../data/theme'
import { CTAButton } from './shared'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    // Hook for Sentry / other monitoring later
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      console.error('Luna error:', error, info)
    }
  }
  reset = () => {
    this.setState({ hasError: false, error: null })
  }
  reload = () => {
    window.location.reload()
  }
  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 28px', background: T.bg, color: T.text }}>
        <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 2, color: T.accent, fontWeight: 700, marginBottom: 14 }}>
          LUNA · UNEXPECTED ERROR
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 32, fontWeight: 500, letterSpacing: -0.6, lineHeight: 1.1, marginBottom: 14 }}>
          Something went wrong.
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 15, color: T.muted, marginBottom: 28, lineHeight: 1.55 }}>
          Your data is safe — this only affects the current screen. Try again, and if it keeps happening, reload Luna.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 320 }}>
          <CTAButton full onClick={this.reset}>TRY AGAIN</CTAButton>
          <button onClick={this.reload}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontFamily: T.sans, fontSize: 12, padding: 8 }}>
            Reload Luna
          </button>
        </div>
      </div>
    )
  }
}

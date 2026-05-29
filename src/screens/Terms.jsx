import { T } from '../data/theme'
import { Masthead, Eyebrow, Rule, Screen } from '../components/shared'
import useLuna from '../store/useLuna'

function H({ children }) {
  return (
    <div style={{ fontFamily: T.serif, fontSize: 20, fontWeight: 500, letterSpacing: -0.3, lineHeight: 1.2, marginTop: 24, marginBottom: 8 }}>
      {children}
    </div>
  )
}

function P({ children }) {
  return (
    <p style={{ fontFamily: T.serif, fontSize: 15.5, lineHeight: 1.6, margin: '0 0 12px 0', color: T.text }}>
      {children}
    </p>
  )
}

export default function Terms() {
  const back = useLuna((s) => s.back)
  return (
    <Screen padBottom={40}>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue="Terms" onBack={back} />
        <Eyebrow color={T.accent}>TERMS · EFFECTIVE 2026-05-29</Eyebrow>
        <div style={{ fontFamily: T.serif, fontSize: 32, fontWeight: 500, letterSpacing: -0.7, lineHeight: 1.05 }}>
          Terms of Service
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 16, lineHeight: 1.55, color: T.muted, marginTop: 12, fontStyle: 'italic' }}>
          The rules of the road for using Luna.
        </div>
        <Rule />

        <H>Not medical advice</H>
        <P>
          Luna is a tool for tracking and education. Nothing you see in the app constitutes a diagnosis, a treatment plan, or a substitute for care from a qualified clinician. If you have a concern about your health, talk to a doctor.
        </P>

        <H>Age</H>
        <P>
          You must be at least 13 years old to use Luna. Some jurisdictions require a higher minimum age. By continuing to use the app you confirm that you meet the applicable requirement where you live.
        </P>

        <H>Account responsibility</H>
        <P>
          Your account email and password are how you access your cycle data on any device. You are responsible for keeping them secure and for the activity that occurs under your account. If you forget your password, you can reset it from the sign-in screen using the email tied to your account.
        </P>

        <H>Subscription</H>
        <P>
          When Luna Pro becomes available, it is billed monthly or annually depending on the plan you choose. You can cancel at any time and will retain access until the end of the current billing period. We do not offer refunds for partial periods unless required by law.
        </P>

        <H>Acceptable use</H>
        <P>
          Do not attempt to reverse engineer, decompile, attack, scrape, or otherwise interfere with the service or its infrastructure. Do not use Luna to violate the law or to infringe on the rights of others.
        </P>

        <H>Termination</H>
        <P>
          We may suspend or terminate your access if you violate these terms or use the service in a way that poses a risk to other users or to us. You may delete your account at any time from Settings.
        </P>

        <H>Disclaimer and limitation of liability</H>
        <P>
          Luna is provided on an "as is" and "as available" basis without warranties of any kind, express or implied, including warranties of merchantability, fitness for a particular purpose, and non-infringement. To the maximum extent permitted by law, we are not liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the app.
        </P>

        <H>Governing law</H>
        <P>
          These terms are governed by the law of the jurisdiction in which Luna is incorporated (to be finalized before launch). Any dispute arising under these terms will be resolved exclusively in the courts of that jurisdiction, unless otherwise required by law.
        </P>

        <H>Changes</H>
        <P>
          We may update these terms from time to time. Continued use of Luna after a change takes effect constitutes acceptance of the updated terms. The effective date at the top of this page will always reflect the current version.
        </P>

        <H>Contact</H>
        <P>
          Reach us at privacy@luna.app (placeholder — to be replaced before launch).
        </P>

        <div style={{ height: 16 }} />
      </div>
    </Screen>
  )
}

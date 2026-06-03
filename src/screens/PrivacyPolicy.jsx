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

export default function PrivacyPolicy() {
  const back = useLuna((s) => s.back)
  return (
    <Screen padBottom={40}>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue="Privacy" onBack={back} />
        <Eyebrow color={T.accent}>Policy · effective 2026-05-30</Eyebrow>
        <div style={{ fontFamily: T.serif, fontSize: 32, fontWeight: 500, letterSpacing: -0.7, lineHeight: 1.05 }}>
          Privacy Policy
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 16, lineHeight: 1.55, color: T.muted, marginTop: 12, fontStyle: 'italic' }}>
          What we collect, what we do not, and where your data lives. Luna is a product of Gloria, a small independent company.
        </div>
        <Rule />

        <H>What we collect</H>
        <P>
          To run Luna we collect: the email address you sign up with, the cycle data you enter (period start dates, cycle length, daily logs including mood, symptoms, flow, basal body temperature, cervical mucus, sexual activity, and any notes you write), your display name, and the settings you toggle. We do not collect anything from your device that you have not chosen to enter into Luna.
        </P>

        <H>What we do not collect</H>
        <P>
          We do not collect your location, contacts, advertising identifiers, browsing history, device sensors, or any health data you have not entered yourself. There are no third-party analytics or advertising SDKs embedded in Luna.
        </P>

        <H>Where your data lives</H>
        <P>
          Your data is stored on servers operated by Supabase, our database provider, and is encrypted at rest using industry-standard infrastructure-level encryption. Access is gated by row-level security so that only the signed-in user can read or modify their own data. We transmit data between your device and our servers over TLS. Luna is technically able to decrypt your data on the server in order to provide the service to you, your devices, and any account-recovery flows you initiate.
        </P>

        <H>Optional local cache</H>
        <P>
          For speed, the app keeps a copy of your most recent data in your browser's local storage so it can render immediately on startup. This cache is cleared when you sign out or delete your account.
        </P>

        <H>Children</H>
        <P>
          Luna is intended for people 13 and older. We do not knowingly collect data from anyone younger. If you believe a child has used Luna, contact us and we will remove their account on request.
        </P>

        <H>Third parties</H>
        <P>
          We rely on three third-party services to operate Luna: Supabase for database and authentication, Sentry for error reporting (configured to strip likely-PII patterns before transmission), and Google Fonts for the typefaces used in the interface. We also send anonymous product analytics to PostHog by default — event names and category data only (for example, "log saved · 3 symptoms · BBT included"), never the content of what you logged, your name, email, or any identifier. You can switch this off in Settings → Privacy → Anonymous analytics. We do not use advertising networks, attribution SDKs, or social login providers.
        </P>

        <H>Your rights</H>
        <P>
          You can export your full data as a CSV file from Settings. You can permanently delete your account and all associated data from Settings. You can withdraw your consent at any time by deleting your account. To exercise any right not directly available in the app, contact us at the address below.
        </P>

        <H>Sharing with someone you choose</H>
        <P>
          Luna's Pro plan includes a "Share with someone" feature that lets you grant read-only access to your cycle data to another Luna account you choose — a partner, family member, doula, or friend. You select the scope (basic cycle picture, or full picture including logged symptoms), and the other person must accept the invite using a code you send them.
        </P>
        <P>
          What's shared depends on the scope you pick: the cycle picture is your phase, cycle day, period prediction, and fertile window. The full picture adds your logged symptoms, mood, flow, sleep, and BBT. <strong>Diary entries, journal photos, voice journaling, and saved articles are never shared, regardless of scope.</strong> The recipient cannot edit, log, or delete any of your data — they have read-only access only.
        </P>
        <P>
          You can revoke any active share instantly from Settings → Share with someone, and the recipient's access becomes blank. The recipient can also stop receiving the share from their side at any time. Deleting your account ends all shares you've created. We don't notify any third party of your activity without your explicit consent in the share setup.
        </P>

        <H>Law enforcement</H>
        <P>
          Because your data is stored on our servers in a form we can decrypt to provide the service to you, we may be compelled by valid legal process to disclose it. We will object to overbroad or unlawful requests, push for narrow scope where we are able, and notify affected users unless prohibited by law. We do not voluntarily share user data with anyone.
        </P>

        <H>Reproductive health</H>
        <P>
          We recognise that menstrual data carries specific legal and personal risk in jurisdictions where reproductive care is restricted. We try to limit collection to what Luna needs to work, never sell or share your data for marketing, never link it to advertising identifiers, and design our data retention so that account deletion is real and prompt. If you have an active concern, consider whether to track certain phases in Luna at all — the safest data is data that does not exist.
        </P>

        <H>Washington residents (MHMDA)</H>
        <P>
          If you are a Washington resident, we treat reproductive health data you enter as consumer health data under the My Health My Data Act. You can request access, deletion, or withdraw consent at any time using Settings, or by contacting us.
        </P>

        <H>EU / UK residents (GDPR &amp; UK GDPR)</H>
        <P>
          If you access Luna from the EU or UK, you have rights of access, rectification, erasure, restriction, portability, and objection under the GDPR / UK GDPR. You can exercise most of these in-app: export your data as CSV from Settings, edit any field directly, and delete your account (which permanently removes your data from our servers within 30 days). The lawful basis for processing your account email and authentication data is contract performance; for the cycle data you enter, it is your consent — which you can withdraw at any time by deleting your account or signing out and asking us to remove the data via the contact below.
        </P>
        <P>
          We are working toward an explicit, granular consent prompt on first use for EU / UK users specifically — covering analytics and error reporting — to satisfy ePrivacy requirements alongside GDPR. Until that prompt ships, EU / UK users can decline analytics and error reporting from Settings → Privacy at any time, and we will treat that as their consent decision. If you have a complaint, you may contact your local data protection authority.
        </P>

        <H>Changes to this policy</H>
        <P>
          If we change this policy materially, we will notify you by email if you have an account, and through an in-app notice. The effective date at the top of this page will always reflect the current version.
        </P>

        <H>Contact</H>
        <P>
          Reach us at privacy@gloria.app (placeholder — to be replaced before launch). The data controller for Luna is Gloria, registered at an address to be finalised before public launch.
        </P>

        <div style={{ marginTop: 24, paddingTop: 14, borderTop: `1px solid ${T.hair}`, fontSize: 11.5, color: T.muted, fontFamily: T.serif, fontStyle: 'italic', lineHeight: 1.55 }}>
          Luna is a product of Gloria. This policy describes our actual practices — consult your own counsel for legal advice.
        </div>
        <div style={{ height: 16 }} />
      </div>
    </Screen>
  )
}

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
        <Eyebrow color={T.accent}>POLICY · EFFECTIVE 2026-05-24</Eyebrow>
        <div style={{ fontFamily: T.serif, fontSize: 32, fontWeight: 500, letterSpacing: -0.7, lineHeight: 1.05 }}>
          Privacy Policy
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 16, lineHeight: 1.55, color: T.muted, marginTop: 12, fontStyle: 'italic' }}>
          What we collect, what we do not, and where your data lives.
        </div>
        <Rule />

        <H>What we collect</H>
        <P>
          If you choose to create an account, we store the email address you provide. We also store an encrypted vault blob that contains the cycle data you log inside Luna. We do not collect anything else from your device.
        </P>

        <H>What we do not collect</H>
        <P>
          We do not collect your readable cycle data, location, contacts, advertising identifiers, browsing history, device sensors, or any health data you have not entered yourself. There are no third-party analytics or advertising SDKs embedded in Luna.
        </P>

        <H>Where your data lives</H>
        <P>
          Your cycle data is encrypted on your device using AES-256-GCM. The encryption key is derived from your passcode using PBKDF2 and never leaves the device. We never see or transmit your passcode. If you create an account, your email address is stored by Supabase, our authentication provider. The encrypted vault blob does not leave your device today. When multi-device sync ships, the vault will be transmitted only in its encrypted form and we will still be unable to read it.
        </P>

        <H>Children</H>
        <P>
          Luna is intended for people 13 and older. We do not knowingly collect data from anyone younger. If you believe a child has used Luna, contact us and we will remove their account on request.
        </P>

        <H>Third parties</H>
        <P>
          We rely on two third-party services: Supabase for account authentication, and Google Fonts for the typefaces used in the interface. We do not use analytics platforms, advertising networks, attribution SDKs, crash reporters that send your content, or social login providers.
        </P>

        <H>Your rights</H>
        <P>
          You can export your data as a CSV file from Settings. You can delete all data on your device from Settings, and request account deletion using the same screen. You can withdraw your consent at any time by deleting your account or removing the app. To exercise any right not directly available in the app, contact us at the address below.
        </P>

        <H>Law enforcement</H>
        <P>
          Because we cannot decrypt your cycle data, we cannot comply with requests to share it. We retain only your account email and signup metadata, which may be subject to lawful process.
        </P>

        <H>Reproductive health</H>
        <P>
          Luna was built specifically so that we cannot be compelled to disclose your cycle data, because we cannot read it. We consider this an essential property of the product rather than a feature.
        </P>

        <H>Washington residents (MHMDA)</H>
        <P>
          If you are a Washington resident, we treat reproductive health data you enter as consumer health data under the My Health My Data Act. You can request access, deletion, or withdraw consent at any time using Settings, or by contacting us.
        </P>

        <H>Changes to this policy</H>
        <P>
          If we change this policy materially, we will notify you by email if you have an account, and through an in-app notice. The effective date at the top of this page will always reflect the current version.
        </P>

        <H>Contact</H>
        <P>
          Reach us at privacy@luna.app (placeholder — to be replaced before launch).
        </P>

        <div style={{ marginTop: 24, paddingTop: 14, borderTop: `1px solid ${T.hair}`, fontSize: 11.5, color: T.muted, fontFamily: T.sans, lineHeight: 1.5 }}>
          This policy describes Luna's actual practices. Consult your own counsel for legal advice.
        </div>
        <div style={{ height: 16 }} />
      </div>
    </Screen>
  )
}

import HelperShell from '../components/HelperShell'
import useLuna from '../store/useLuna'

// Low libido — common, undertalked, often dismissed. Helper holds
// the science (responsive vs spontaneous desire) AND surfaces the
// real frequent causes (BC, SSRIs, perimenopause, postpartum). Voice
// stays gentle but specific — no "spice up the bedroom" cliché.
export default function LowLibidoHelper() {
  const go = useLuna((s) => s.go)
  return (
    <HelperShell
      category="intimate"
      helperKey="lowLibido"
      title="Desire feels far away?"
      subtitle="It usually has a cause, and most of them are addressable."
      eyebrow="What's worth knowing first"
      actionLines={[
        "Responsive desire is the dominant pattern for most women across the lifespan — desire that shows up AFTER touch, kissing, or sexual thoughts begin, not before. If you've been waiting to 'feel like it' before initiating anything, you may be waiting for a kind of desire your body doesn't do much of. This is biology, not brokenness.",
        "Common dampeners with real evidence: hormonal birth control (especially combined pills — they raise SHBG, lowering free testosterone), SSRIs and SNRIs, breastfeeding (prolactin), perimenopause (falling estrogen), chronic stress, untreated pain, and certain blood pressure medications. If your libido shifted after starting a medication, that's a real signal — not in your head.",
        "What helps: longer warm-up time (the body needs ~20 minutes to fully prepare even when the mind is willing), removing pressure from any single encounter, scheduling intimacy when you have energy (the spontaneity romanticisation hurts women specifically), and treating any underlying pain or medication side effect.",
      ]}
      triage={[
        {
          key: 'shift',
          title: 'When did this start?',
          options: [
            { id: 'always', label: 'Always been this way' },
            { id: 'recent', label: 'Recently shifted' },
            { id: 'life-event', label: 'After something specific', sub: "BC, postpartum, perimeno" },
          ],
        },
        {
          key: 'pain',
          title: 'Is sex also painful?',
          options: [
            { id: 'no', label: 'No' },
            { id: 'sometimes', label: 'Sometimes' },
            { id: 'yes', label: 'Yes', sub: "Worth addressing" },
          ],
        },
      ]}
      escalation={{
        showWhen: ({ triage }) => triage.pain === 'yes' || triage.shift === 'life-event' || triage.shift === 'recent',
        lines: [
          "If sex is painful — at entry or deeper — that's its own thing, with its own treatments (pelvic floor PT, vaginal estrogen, treating any infection). Painful sex doesn't cause low libido; low libido caused by pain resolves when the pain does. Worth bringing up directly with a sex-positive gyn or pelvic floor physical therapist.",
          "If libido shifted after starting hormonal birth control, SSRIs, or another medication, ask your prescriber about alternatives. There ARE options. Many providers won't bring this up unless you do — the documented effects are real but underdiscussed in routine prescribing.",
        ],
        cta: { label: 'Open my talking points', onTap: () => go('cheatsheet') },
      }}
      helpedOptions={[
        { id: 'longer-warmup', label: 'Longer warm-up' },
        { id: 'scheduled', label: 'Scheduled time' },
        { id: 'lube', label: 'Lubricant' },
        { id: 'no-pressure', label: 'No-pressure rule' },
        { id: 'therapy', label: 'Therapy' },
        { id: 'med-review', label: 'Med review' },
      ]}
      bottomCopy="Low libido as a stand-alone problem to fix is the wrong framing. Low libido as a downstream signal — of meds, pain, life stage, stress — is the right one. Track when it shifts; the cause usually shows."
    />
  )
}

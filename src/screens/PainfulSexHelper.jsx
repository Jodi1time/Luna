import HelperShell from '../components/HelperShell'
import useLuna from '../store/useLuna'

// Painful sex prep — a screen that meets the user before, during, or
// after the difficult moment, gently. Written with the explicit
// understanding that this is one of the most under-discussed and most
// fixable problems in women's sexual health.
export default function PainfulSexHelper() {
  const go = useLuna((s) => s.go)
  return (
    <HelperShell
      helperKey="painful_sex"
      title="Sex has been hurting."
      subtitle="It's common, it's not your fault, and there's usually something to do."
      eyebrow="What helps right now"
      actionLines={[
        "Slow the start. The body needs about twenty minutes to fully prepare even when the mind feels ready — long pre-sex closeness (talking, touch, slowness) does more than any technique.",
        "Use a generous, body-safe lubricant. Silicone-based holds longer and stays slippery in water; water-based feels closest to natural and is condom-safe. Skip glycerin, parabens, scents, and warming/tingling products — those irritate sensitive tissue.",
        "If pain comes at the entrance, try lowering pressure and depth, or pause partway and breathe — the pelvic floor can tense without you noticing. Press a hand gently on your lower belly while exhaling; the muscles soften with the breath.",
        "If pain comes deep, change angle — side-lying or being on top often gives more control. Painful sex is information, not a failing.",
      ]}
      triage={[
        {
          key: 'where',
          title: 'Where does it hurt most?',
          options: [
            { id: 'entrance', label: 'At the entrance' },
            { id: 'deep',     label: 'Deeper' },
            { id: 'both',     label: 'Both' },
          ],
        },
        {
          key: 'pattern',
          title: 'Is this new or familiar?',
          options: [
            { id: 'new',      label: 'New', sub: 'Recent change' },
            { id: 'recurring',label: 'Recurring', sub: 'A pattern' },
            { id: 'always',   label: 'Always', sub: 'Most or all times' },
          ],
        },
      ]}
      escalation={{
        showWhen: ({ triage }) => Boolean(triage.pattern) && triage.pattern !== 'new',
        lines: [
          "Pain at the entrance that's persistent or recurring is worth seeing a sex-positive gynaecologist or pelvic floor physical therapist about. Vulvodynia, vestibulodynia, pelvic-floor tension, and vaginal dryness from hormonal change (perimenopause, postpartum, breastfeeding, SSRIs) are all real and treatable.",
          "Deep pain — especially if cyclical, worse around ovulation or your period — can point at endometriosis, fibroids, ovarian cysts, or a tilted uterus. Worth bringing concretely to a provider.",
          "Pelvic floor PT is the most under-suggested treatment for chronic painful sex. If a clinician sends you home with 'just relax' or 'try wine first', that's not enough — ask for a referral to a pelvic floor physical therapist directly.",
        ],
        cta: { label: 'Open my talking points', onTap: () => go('cheatsheet') },
      }}
      helpedOptions={[
        { id: 'lube',       label: 'More lube' },
        { id: 'warmup',     label: 'Longer warm-up' },
        { id: 'angle',      label: 'Different angle' },
        { id: 'breath',     label: 'Breathing' },
        { id: 'paused',     label: 'Paused' },
        { id: 'stopped',    label: 'Stopped tonight' },
      ]}
      resources={[
        { label: 'Pelvic floor PT directory', sub: 'Look for "pelvic floor physical therapy" + your area; many specialise in painful sex specifically.', detail: 'pelvicrehab.com (Herman & Wallace search tool)' },
        { label: 'International Pelvic Pain Society', sub: 'Patient resources, provider directory, peer-reviewed treatment info.', detail: 'pelvicpain.org' },
      ]}
      bottomCopy="Painful sex isn't a failing of yours or your partner's. It's biology, often very treatable biology, and worth more than the 'push through' advice most women get."
    />
  )
}

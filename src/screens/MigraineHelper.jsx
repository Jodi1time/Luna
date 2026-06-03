import HelperShell from '../components/HelperShell'
import useLuna from '../store/useLuna'

// Menstrual migraine — triggered by the sharp estrogen drop in the
// 1-3 days before your period, lands hardest day 1-2. The action card
// favours the prevention window (magnesium, NSAID-at-first-sign) and
// the escalation surfaces when migraines are frequent, severe, or
// have new neurological symptoms.
export default function MigraineHelper() {
  const go = useLuna((s) => s.go)
  return (
    <HelperShell
      category="urgent"
      helperKey="migraine"
      title="A migraine, today?"
      subtitle="Let's get ahead of it before the body has to."
      eyebrow="What helps right now"
      actionLines={[
        "If you've caught it early — first hint of aura, tightness behind the eyes, a familiar warning — take NSAIDs now. Ibuprofen 400-600mg or naproxen at first sign is more effective than the same dose taken when the headache has fully landed.",
        "Magnesium glycinate 400-600mg starting 3 days before your period and continuing through day 2 has RCT support for preventing menstrual migraines. Worth trying for three cycles to know if it works for your particular pattern.",
        "Cool, dim, quiet, water. The body is dilating blood vessels in your brain — your job is to lower every other stimulus. Sleep if you can; recovery sleep is part of the treatment.",
      ]}
      breath={{ label: 'Slow the breath — three minutes', pattern: { inhale: 4000, hold: 2000, exhale: 6000 } }}
      triage={[
        {
          key: 'timing',
          title: 'When does it usually land?',
          options: [
            { id: 'pre-period', label: 'Just before period', sub: "Day -1 to 2" },
            { id: 'ovulation', label: 'Around ovulation', sub: "Mid-cycle" },
            { id: 'random', label: 'No pattern yet', sub: "I'm still tracking" },
          ],
        },
        {
          key: 'intensity',
          title: 'How loud is it?',
          options: [
            { id: 'manageable', label: 'A throb', sub: "I can keep going" },
            { id: 'loud', label: 'Loud', sub: "Need to slow down" },
            { id: 'disabling', label: 'Disabling', sub: "Can't function" },
          ],
        },
      ]}
      escalation={{
        showWhen: ({ triage }) => triage.intensity === 'disabling' || triage.timing === 'pre-period',
        lines: [
          "Menstrual migraines that disable you for days each cycle deserve real treatment — not pushing through. Triptans (sumatriptan, rizatriptan) work specifically on the vascular pathway and a neurologist can prescribe an estrogen-stabilising approach (continuous BC, estradiol patch in the migraine window) that prevents them.",
          "Worth a same-day call if: new aura you've never had before, weakness or numbness on one side, vision loss, the 'worst headache of your life,' or a migraine with fever — those need to be looked at as soon as possible to rule out other causes.",
        ],
        cta: { label: 'Open my talking points', onTap: () => go('cheatsheet') },
      }}
      helpedOptions={[
        { id: 'nsaid', label: 'NSAID early' },
        { id: 'magnesium', label: 'Magnesium' },
        { id: 'dark-quiet', label: 'Dark room' },
        { id: 'water', label: 'Water' },
        { id: 'sleep', label: 'Sleep it off' },
        { id: 'triptan', label: 'Triptan' },
      ]}
      bottomCopy="Menstrual migraines aren't just bad headaches — they're a neurological event tied to the estrogen cliff. Track three cycles and the pattern usually shows itself."
    />
  )
}

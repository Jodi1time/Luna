import HelperShell from '../components/HelperShell'
import useLuna from '../store/useLuna'

// Anxiety nights — most commonly late-luteal hormonal anxiety,
// situational stress, or PMDD-pattern. The action card uses tools with
// the most evidence (paced breathing, grounding, magnesium) and leaves
// the heavy CBT work to the Reflect → reframe practice.
export default function AnxietyHelper() {
  const go = useLuna((s) => s.go)
  return (
    <HelperShell
      helperKey="anxiety"
      title="Anxiety, right now?"
      subtitle="Let's slow it down — one thing at a time."
      eyebrow="What helps right now"
      actionLines={[
        "Start with the body, not the thoughts. Three breaths in for four, out for seven — slower exhale than inhale is what tells the nervous system the storm is passing.",
        "Look around and name five things you can see, four you can touch, three you can hear, two you can smell, one you can taste. Grounding pulls the mind out of the loop.",
        "Magnesium glycinate before bed tonight, if you have some — it softens tomorrow. Cut caffeine after noon for the next few days; it lingers longer in your luteal phase than you'd think.",
      ]}
      breath={{ label: 'Breathe through it — two minutes', pattern: { inhale: 4000, hold: 1000, exhale: 7000 } }}
      triage={[
        {
          key: 'when',
          title: 'When does it usually land?',
          options: [
            { id: 'morning',  label: 'Mornings' },
            { id: 'evening',  label: 'Evenings' },
            { id: 'before-period', label: 'Before period' },
            { id: 'random',   label: 'Random' },
          ],
        },
        {
          key: 'intensity',
          title: 'How loud is it?',
          options: [
            { id: 'low',      label: 'A hum', sub: 'I can keep going' },
            { id: 'medium',   label: 'Insistent', sub: "Hard to focus" },
            { id: 'high',     label: 'Overwhelming', sub: "Stopping me" },
          ],
        },
      ]}
      escalation={{
        showWhen: ({ triage }) => triage.intensity === 'high' || triage.when === 'before-period',
        lines: [
          "If anxiety lands hard in the week before your period — three cycles in a row — that's a PMDD signature, and it's treatable. Aerobic exercise has the strongest RCT evidence; calcium 1200mg/day reduced PMS by ~48% in one trial; SSRI luteal-only dosing is a real protocol most providers don't suggest until asked.",
          "If anxiety is stopping you most days, or panic attacks have appeared in the past month, talk to a clinician this week — sooner if there's any thought of harm to yourself.",
        ],
        cta: { label: 'Open my talking points', onTap: () => go('cheatsheet') },
      }}
      helpedOptions={[
        { id: 'breath',     label: 'Breathing' },
        { id: 'grounding',  label: 'Grounding' },
        { id: 'magnesium',  label: 'Magnesium' },
        { id: 'walk',       label: 'A walk' },
        { id: 'cold-water', label: 'Cold water' },
        { id: 'someone',    label: 'Calling someone' },
      ]}
      bottomCopy="Anxiety is the body bracing for something that might not come. The body softens before the thought does — that's why we start there."
    />
  )
}

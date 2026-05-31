import HelperShell from '../components/HelperShell'

// Insomnia tonight — most commonly late-luteal hormonal sleep
// disruption, but also stress / caffeine / screens. Action card meets
// the user where she is at 2am, not in a sleep clinic next month.
export default function InsomniaHelper() {
  return (
    <HelperShell
      helperKey="insomnia"
      title="Awake — and shouldn't be."
      subtitle="A handful of small things will help. Pick one."
      eyebrow="What helps right now"
      actionLines={[
        "Get the room cooler — around 65°F if you can. The body needs a small temperature drop to fall asleep, and luteal-phase progesterone fights that.",
        "Magnesium glycinate (200–400mg) is well-supported, low-risk, and works within an hour for many people. If you have some, take it now with a small glass of water.",
        "Don't fight the wakefulness for more than 20 minutes. Get up, dim the lights, sit quietly somewhere boring — a chair, not the bed. Come back when sleep feels close.",
        "Tomorrow is allowed to be a softer day than you planned. Whatever you can move, move.",
      ]}
      breath={{ label: 'A breathing wind-down — two minutes', pattern: { inhale: 4000, hold: 1000, exhale: 7000 } }}
      triage={[
        {
          key: 'pattern',
          title: 'What kind of night is it?',
          options: [
            { id: 'falling',  label: 'Can\'t fall asleep' },
            { id: 'waking',   label: 'Woke up' },
            { id: 'restless', label: 'Restless' },
          ],
        },
      ]}
      escalation={{
        showWhen: ({ triage }) => Boolean(triage.pattern),
        lines: [
          "If this happens 3+ nights a week, or for more than a month, it stops being a phase and starts being its own thing worth investigating — sleep apnoea, thyroid, late-luteal PMDD-pattern insomnia, or simply a routine that's drifted.",
          "Sleep deprivation is the single largest amplifier of mood, cycle irregularity, and food cravings. Worth a conversation if it's becoming the norm.",
        ],
      }}
      helpedOptions={[
        { id: 'cool',       label: 'Cooler room' },
        { id: 'magnesium',  label: 'Magnesium' },
        { id: 'breath',     label: 'Breathing' },
        { id: 'no-screen',  label: 'Off screens' },
        { id: 'got-up',     label: 'Got up briefly' },
        { id: 'reading',    label: 'A boring book' },
      ]}
      bottomCopy="Insomnia is sometimes hormones, sometimes a thought that won't quiet, sometimes the body knowing tomorrow doesn't need to be perfect. All of those will pass."
    />
  )
}

import HelperShell from '../components/HelperShell'

// UTI tonight — a screen for the most common acute urinary moment a
// woman faces, with the playbook + the escalation criteria + the
// tracking that turns 3 episodes into "this needs a urology referral,
// not another antibiotic course".
export default function UTIHelper() {
  return (
    <HelperShell
      helperKey="uti"
      title="Burning. Already?"
      subtitle="Catch it early — here's the playbook."
      eyebrow="What helps right now"
      actionLines={[
        "Drink a tall glass of water now. Another before bed. Dilution alone is a real defence — the bacteria multiply more slowly in flow than in still urine.",
        "If you have D-mannose powder, 2g now and 2g again in eight hours. The evidence is strongest for E. coli UTIs (about 80% of them) and it works by blocking the bacteria from sticking to the bladder wall.",
        "Pee after sex tonight. Wear cotton underwear. Skip baths and scented wipes for a few days.",
        "If burning is still loud in the morning, this is same-day care — a clinician can prescribe nitrofurantoin or trimethoprim that knocks it down in a day or two.",
      ]}
      triage={[
        {
          key: 'severity',
          title: 'How does it feel right now?',
          options: [
            { id: 'mild',     label: 'Mild', sub: 'Catching it early' },
            { id: 'loud',     label: 'Loud', sub: 'Hard to ignore' },
            { id: 'severe',   label: 'Severe', sub: 'Or with blood' },
          ],
        },
      ]}
      escalation={{
        showWhen: ({ triage }) => triage.severity === 'severe',
        lines: [
          "Blood in your urine, a fever, back or flank pain, chills, or nausea — those mean the infection may be reaching your kidneys. Don't wait until morning. That's urgent care or an ER tonight.",
          "If you have 3+ UTIs in a year, that's not bad luck — it's a clinical pattern. Post-sex voiding, low-dose prophylactic antibiotics, vaginal estrogen for perimenopause, or immunoprophylaxis (in some countries) are real options. Ask for a urology referral, not just another script.",
        ],
      }}
      helpedOptions={[
        { id: 'water',      label: 'Water' },
        { id: 'd-mannose',  label: 'D-mannose' },
        { id: 'cranberry',  label: 'Cranberry' },
        { id: 'antibiotic', label: 'Antibiotic' },
        { id: 'clinician',  label: 'A clinician' },
        { id: 'rest',       label: 'Rest' },
      ]}
      resources={[
        { label: 'Same-day video visit', sub: 'Most insurance covers an online UTI consult — typically diagnosed and prescribed within 30 minutes.', detail: 'Search "online UTI treatment" + your insurance' },
      ]}
      bottomCopy="UTIs are common, treatable, and not a hygiene failing. The body is doing what bodies do."
    />
  )
}

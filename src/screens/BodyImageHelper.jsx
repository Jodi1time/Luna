import HelperShell from '../components/HelperShell'
import useLuna from '../store/useLuna'

// Body image dips that follow the cycle — bloating + jawline acne +
// progesterone water retention in late luteal can crash how you feel
// about your body. The helper names the cyclical biology so the
// feeling doesn't take itself as the truth. Goes carefully — the line
// between "luteal body-image dip" and "disordered eating signal" is
// real, and the helper points there when the pattern fits.
export default function BodyImageHelper() {
  const go = useLuna((s) => s.go)
  return (
    <HelperShell
      category="reflect"
      helperKey="bodyImage"
      title="Bad body day?"
      subtitle="The cycle has more to do with this than you'd think."
      eyebrow="What's actually happening"
      actionLines={[
        "Late luteal phase (the 5-7 days before your period) brings a measurable cluster: progesterone-driven water retention, slower digestion and bloating, breast tenderness, jawline acne from the testosterone-to-estrogen ratio shift. Your body is genuinely a different shape and texture this week — and the way you feel about it shifts with serotonin and dopamine dropping at the same time. The feeling is real; the conclusion 'this is what I look like now' usually isn't.",
        "What helps when the feeling is loud: cooler clothes (the body actually runs warmer in luteal — tight waistbands amplify the bloat-feeling more than the bloat does), magnesium for the water retention, gentle movement that's about how the body FEELS not how it looks, and reducing time in front of mirrors / scales / social media this week specifically. Three cycles of tracking will show you how short this part is.",
        "A specific reframe: your premenstrual body isn't a worse version of your follicular body. It's a different one, doing different work. If you've ever noticed feeling sharper / more confident around ovulation — that's the same cycle, working the other direction. Both are you.",
      ]}
      triage={[
        {
          key: 'timing',
          title: 'When does it usually hit?',
          options: [
            { id: 'luteal', label: 'Before period', sub: "Days -7 to 0" },
            { id: 'period', label: 'During period' },
            { id: 'random', label: 'No pattern' },
          ],
        },
        {
          key: 'depth',
          title: 'How heavy is it today?',
          options: [
            { id: 'passing', label: 'Passing', sub: "Frustration" },
            { id: 'loud', label: 'Loud', sub: "Hard to ignore" },
            { id: 'persistent', label: 'Persistent', sub: "Most days" },
          ],
        },
      ]}
      escalation={{
        showWhen: ({ triage }) => triage.depth === 'persistent' || (triage.timing === 'random' && triage.depth === 'loud'),
        lines: [
          "If body-image distress is most days — not following the cycle, not lifting when your period ends — that's worth a different kind of care than cycle literacy can give. A therapist who specializes in eating disorders or body-image work is the right room, even if you've never restricted food.",
          "Specific signals worth flagging to a provider: skipping meals to 'fix' how your body feels, exercising past tiredness to compensate for what you ate, avoiding mirrors or social situations, thoughts of body that take up most of the day. Eating disorder treatment is highly effective when caught early — and 'looking healthy' is not a reliable indicator. Most cases of disordered eating happen at normal weight.",
        ],
        cta: { label: 'Open my talking points', onTap: () => go('cheatsheet') },
      }}
      resources={[
        {
          label: 'National Eating Disorders Association (NEDA)',
          sub: 'Free, confidential support — call, text, or chat',
          detail: 'Call/text 988 · neda.org',
        },
        {
          label: 'ANAD (US — Association for Anorexia + Associated Disorders)',
          sub: 'Free peer support hotline',
          detail: '888-375-7767',
        },
      ]}
      helpedOptions={[
        { id: 'reframe', label: 'Reframe' },
        { id: 'comfort-clothes', label: 'Soft clothes' },
        { id: 'less-mirror', label: 'Less mirror time' },
        { id: 'less-social', label: 'Less social media' },
        { id: 'gentle-move', label: 'Gentle movement' },
        { id: 'someone', label: 'Talking to someone' },
      ]}
      bottomCopy="Your body's job this week isn't to look like your follicular body. It's to do the work the luteal phase asks of it. The mirror this week is not the truth about you."
    />
  )
}

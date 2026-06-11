# Luna — the retention dashboard

The numbers we live by. One dashboard in PostHog, checked weekly.
No paid acquisition until these earn it — pouring marketing money
into a leaky bucket is how underdogs die with good products.

All events are opt-in (`settings.analytics`), anonymous, and carry
shapes only — never log contents, never message text, never photos.

## Events (already instrumented)

| Event | Fired from | Props |
|---|---|---|
| `app_opened` | App.jsx on mount | — |
| `onboarding_completed` | Onboarding finish | `account_created` |
| `log_saved` | Log save | `has_mood`, `mood_count`, `symptom_count`, `has_flow`, … |
| `journal_entry_saved` | Journal | `has_text`, `photo_count` |
| `luna_chat_message_sent` | LunaChat | `turn` |
| `share_invite_created` | ShareWith | `scope` |
| `paywall_viewed` | Paywall | `native` |
| `pro_subscribed` | Paywall | `plan` |
| `analytics_opted_in` | Settings / PrivacyDashboard | — |

## The dashboard (create these insights in PostHog)

1. **D1 / D7 / D30 retention** — Retention insight. Cohort: users who
   fired `onboarding_completed`. Returning event: `app_opened`.
   - Category average D30 for cycle trackers is ~25–30%.
   - **Our bar: D30 ≥ 40%.** That number IS the fundraising deck.

2. **Cycle-2 survival** — Retention insight, same cohort, returning
   `app_opened`, viewed at weeks 5–8 after onboarding. This is the
   cliff where trackers die: she finished one full cycle — did she
   start a second? **Bar: ≥ 60% of D7-retained users.**

3. **Logging habit** — Trends insight: weekly unique users firing
   `log_saved` 3+ times (use "total events ≥ 3 per user per week").
   The single strongest leading indicator of long-term retention.

4. **Activation funnel** — Funnel insight:
   `onboarding_completed` → first `log_saved` (within 1 day)
   → `log_saved` on 3 distinct days (within 7 days).
   Each drop-off step is a product fix, not a marketing problem.

5. **Differentiator engagement** — Trends: weekly uniques for
   `luna_chat_message_sent`, `journal_entry_saved`,
   `share_invite_created`. Hypothesis to verify once data exists:
   users who touch ANY differentiator in week 1 retain materially
   better. If true, the first-week arc should steer toward them.

6. **Share loop** — `share_invite_created` count vs. accepted shares
   (add an `share_accepted` event to AcceptShare when this matters —
   post-launch). Every accepted share is an acquisition with zero CAC.

## Reading it

- Retention problems before D7 → onboarding/payoff problem.
- Retention problems at cycle 2 → prediction-accuracy/value problem.
- Strong logging but weak D30 → the app is a tool, not a companion —
  differentiator surfaces aren't landing.
- Never chase DAU for its own sake; Luna's promise is quiet. The
  honest target is weekly habit + cycle-2 survival, not streaks.

# Luna reminders and widgets spec

## Purpose

Luna should earn retention through usefulness, trust, and emotional intelligence. Widgets and reminders should extend that loop only after the daily experience is already worth returning to.

This spec defines what Luna should ship before any reminder or widget goes live, and how those features should behave once they do.

## Product rules

1. Reminders are opt-in.
2. Reminder copy must be phase-aware, private, and emotionally literate.
3. No streak pressure, guilt framing, or childish language.
4. Lock-screen copy must never reveal sensitive detail by default.
5. Widgets must be genuinely useful in one glance or one tap.
6. Low-data users must get calm, honest language instead of false precision.
7. Mode changes must preserve history. TTC, pregnancy, and cycle mode change framing, not ownership of prior logs.

## Daily loop first

Luna's retention engine is:

1. Home tells the truth about today.
2. Log is quick enough to finish in under a minute.
3. Luna turns the log into one useful reflection or next action.
4. The next return feels earned because the app noticed something real.

Before reminders or widgets ship, this loop should be solid for:

- standard cycle tracking
- low-data users
- TTC users
- pregnancy users
- PCOS users

## Reminder v1

### Reminder types

Only three reminder families should exist in v1:

1. `daily_check_in`
   - Goal: make logging easy when Luna has little context or when the user's recent pattern is unstable.
   - Example private copy: `A quiet check-in can help Luna read this week more clearly.`

2. `cycle_moment`
   - Goal: surface a meaningful phase change or expected period window.
   - Example private copy: `A new part of your cycle may be starting soon.`

3. `care_follow_through`
   - Goal: support a user-defined health intention that already exists in the app, such as a checkup they marked as unfinished or a visit note they started.
   - Example private copy: `There is one health note you may want to bring back into view.`

No weekly generic nudge. No re-engagement blast with no reason.

### Reminder triggers

#### Cycle mode

- `daily_check_in`
  - eligible if no log today
  - strongest when:
    - user is in first 3 cycles
    - predicted period is within 5 days
    - a previously-observed symptom cluster usually appears in the next 2 days

- `cycle_moment`
  - eligible for:
    - predicted period within 1-2 days
    - fertile window opening for users who explicitly want that framing
    - luteal or PMS window when Luna has enough prior evidence to say something useful

#### TTC mode

- replace generic fertile hype with calm timing support
- reminders should only mention fertile timing if the user explicitly turned TTC mode on
- example: `Your fertile window may be opening. If timing matters this month, this is a useful day to check in.`

#### Pregnancy mode

- reminders should focus on week changes and relevant tools
- examples:
  - `A new pregnancy week starts today.`
  - `Kick counting may matter more around this point.`

#### PCOS and helper-led use

- only trigger if Luna has enough data or the user explicitly started a helper flow
- examples:
  - `There may be a pattern worth bringing to your next visit.`
  - `That note for your appointment is still here when you want it.`

### Quiet-period behavior

If the user has been away:

- after 3 quiet days:
  - one gentle reminder at most
  - no mention of a streak or missed days
  - example: `When you feel ready, a small check-in can help Luna find the thread again.`

- after 14 quiet days:
  - do not intensify
  - switch to a softer re-entry message
  - example: `If your cycle has shifted, Luna can start fresh from wherever you are now.`

### Low-data behavior

If Luna does not know enough:

- never imply certainty
- use phrases like:
  - `still learning`
  - `this may help Luna read the week more clearly`
  - `a little more detail will make this more personal`

Avoid:

- `we noticed` unless a real repeated pattern exists
- predicted timing language beyond the model's confidence

### Privacy modes

Reminder settings should include:

1. `Off`
2. `Private`
   - lock-screen copy stays abstract
   - example: `A Luna note is waiting.`
3. `Clear`
   - user allows more explicit cycle wording
   - example: `Your period may be close.`

### Scheduling controls

V1 controls:

- reminder master toggle
- reminder style: `Private` / `Clear`
- preferred window:
  - morning
  - afternoon
  - evening
- quiet hours
- per-type toggles:
  - daily check-in
  - cycle moments
  - care follow-through

Do not ship fixed-time reminders with no user window.

## Widgets v1

Widgets come after reminder logic is trustworthy.

Only three widgets should ship first.

### 1. Today widget

Shows:

- phase or current mode
- one-line guidance
- discreet mode option

Examples:

- `Luteal phase. Softer energy today.`
- `Week 24. Kicks may start to matter more.`
- `TTC window may be opening.`

Tap target:

- goes straight to Home

### 2. Quick log widget

Shows:

- `Log today`
- optional one-tap mood entry if platform supports interactive widgets later

Tap target:

- opens directly into Log for today

### 3. Gentle note widget

Shows:

- sticky note or reflection prompt
- never exposes sensitive details by default

Tap target:

- opens Home or Reflect depending on source

### Widget privacy

Each widget needs:

- `Private` mode
  - abstract copy only
- `Clear` mode
  - explicit cycle wording allowed
- hide on locked screen if the OS supports it

## Trust and account rules

Before reminders/widgets ship:

1. Signed-in vs local-only storage must be explicit everywhere.
2. Share surfaces must clearly say what never gets shared.
3. Web users must be told that Luna does not yet provide a second in-app lock screen.
4. Any future reminder settings must not appear until actual delivery exists.

## Accessibility and performance

Reminder and widget work should meet these bars:

- voiceover labels for every widget state
- color is never the only signal
- reduced-motion-safe animations
- no heavy network dependency for first widget paint
- widget content cached locally
- notification scheduling work happens off the main interaction path

## Instrumentation

Track only product behavior, never cycle content.

Safe events:

- reminder_opt_in
- reminder_opt_out
- reminder_opened
- widget_opened
- widget_added
- reminder_type_enabled

Do not track reminder body text, note text, symptom names, or anything medically identifying.

## Implementation sequence

1. Finish trust-surface cleanup
   - signed-in vs local-only clarity
   - sharing clarity
   - lock-screen limitation copy

2. Build reminder decision engine
   - no UI yet
   - local rules only
   - copy library by lifecycle + privacy mode

3. Add reminder settings UI
   - only after delivery exists end to end

4. Test reminder behavior across:
   - cycle
   - TTC
   - pregnancy
   - PCOS
   - low-data
   - signed-out local-only

5. Ship Today widget

6. Ship Quick log widget

7. Ship Gentle note widget

## Definition of done

Luna is ready for reminders and widgets when:

- users can understand exactly why they got a reminder
- reminders never feel like guilt
- low-data users are not overpromised
- signed-out users are not misled about backup or sync
- privacy language remains true on lock screen, home screen, and share flows

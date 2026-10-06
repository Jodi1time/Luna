# PCOS care space — review handoff

Built on main commit `1fe53e12f5f6903ea170e8fee7183ba6368a23c9`.

## What changes

- A compact care-space entry appears after the greeting for users who selected PCOS (outside pregnancy mode).
- Pin one concern: skin, hair changes, energy, bleeding/cycles, treatment questions, or a personal focus. No weight-loss or fertility goal is required.
- Save a dated update with a feeling, daily-life impact, or note; any one is enough. Edit or delete earlier moments.
- A separate reflection form makes space for feelings without classifying them as symptoms or inferring causes.
- In-app follow-ups are opt-in, can be paused, and can be dismissed for today without creating a health record. No notifications or streaks were added.
- Appointment preparation includes only selected care moments; reflections start unselected. Questions and optional treatment/timeline records remain available. Review, edit, explicitly save, and download a plain-text draft.
- Keep existing PCOS tools available inside a disclosure instead of leading with a long clinical dashboard.

## Persistence and privacy boundaries

- Uses the existing `profiles.settings` field (`pcosCareSpace`) and local Zustand cache. No migration, new service, or new telemetry.
- New care writes, appointment questions, and edited drafts wait for account-write acknowledgement. Failed writes retain form text for retry. A missing profile or zero affected rows is an error, not success.
- Expected-user checks run before the profile update and before updating local state. New care writes share an in-flight guard.
- When Supabase is not configured, the UI explicitly says records are saved on this device only. With Supabase configured, a missing session cannot silently become a local-only success.
- The checked-in partner-share SQL does not expose `settings`. This is source inspection, not a verification of the deployed database policies. Records remain in the existing browser cache; do not describe this as end-to-end encryption.
- Removing an original record does not remove it from an already-saved appointment draft or a downloaded file. The UI states this.

## Verification

- `npm test`: 114 tests pass, including simulated component interactions and mocked persistence failures/account changes.
- `npm run build`: passes. Existing bundle-size and mixed static/dynamic-import warnings remain.
- Targeted lint passes for new care components, tests, helpers, cloud writes, and the store. The existing PCOS screen has an unchanged useMemo dependency warning.
- `git diff --check`: passes.
- jsdom is a pinned development dependency for interaction tests. It is not a production dependency. Removed a duplicate `test` script key; Vitest remains the effective runner.

## Required before production

1. Mobile visual and accessibility review: 320–430 px widths, keyboard, VoiceOver, long concern labels, zoom, bottom navigation, reduced motion. The browser runner failed to start in this workspace, so no real-browser pass is claimed.
2. With a dedicated test account, save → reload → sign out/in → verify on a second device. Test network failure and session expiry. No live account or database was changed during development.
3. Verify deployed owner-only profile RLS and that partner-sharing responses exclude care settings.
4. Check changes on two devices. The app's existing whole-settings writes are last-writer-wins; this branch does not add cross-device conflict resolution or an offline outbox. Other legacy settings/treatment/timeline saves still use their original optimistic save flow.
5. Review existing PCOS educational/clinical features separately with a qualified clinician. This feature records the person's words; it does not assess a medication, supplement, cause, diagnosis, or treatment.

Not deployed. The existing main-branch GitHub Pages workflow deploys after merge, so leave this branch unmerged until the above checks are complete.

## First validation session

Ask a tester to choose one concern, save a brief update, skip an optional follow-up, and prepare the notes they would want at an appointment. Check whether they can distinguish a reflection from a symptom record and understand what is included in a summary. Ask what felt useful or burdensome before adding more features. Do not collect their health text in product analytics.

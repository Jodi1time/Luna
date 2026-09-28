# Luna: PCOS care and visual polish

Base: `44e3e6daf588b5372286a740944f5bf4bd1bfc4a`.
Local branch: `improve/pcos-polish-september`.

## Implemented

- A PCOS companion on Today for people who have selected PCOS, and on the PCOS screen.
- Links to existing symptom logging and treatment history.
- A seven-day recap based on recorded entries, not invented patterns; missing days remain unknown.
- Saved appointment questions using the existing settings persistence mechanism.
- Editable conversation notes, with treatments included only by explicit selection, and text download.
- Consistent static action icons; a quieter calendar distinguishing logged periods from estimates; a lighter cycle wheel with explicit estimate language and keyboard interaction.
- Removed placeholder signal rows and an unsupported promise about prediction accuracy.

## Verification

Production build passes. 46 focused Vitest tests pass across careRecap, firstWeek and useCycle.
Targeted ESLint has no errors; Calendar has an existing dependency warning.
Browser validation could not complete: Chromium failed in this workspace. Saving across reload, downloading, mobile layout, accessibility interactions, and cloud synchronization are not verified end to end.

## Before release

### Full onboarding replacement

The active flow now uses `OnboardingFlow.jsx`: starting point → optional details → first-steps overview → account. The older Onboarding module is retained because EditSetup imports its reusable fields; it is no longer the first-run router target. Existing onboarding route names lead into the new flow.

After setup, the persisted FirstSteps guide appears at the top of Today. It opens actual logging, calendar, and PCOS/visit-note routes. Skipping or finishing the guide does not mark health actions complete. Settings includes a replay control. Existing users do not see the guide automatically.

Required manual checks: back/forward choices; blank health details; all optional goals; PCOS selection; rejected future dates; signed-in setup; successful signup with and without email confirmation; failed signup and failed profile save; guide routes, skip, replay and persistence. Refreshing or leaving setup currently resets the unsaved draft; passwords are never persisted. No guest mode was added. Profile and preference saves now happen together before onboarding completes. New validator tests plus the existing suite total 87 passing tests; production build and targeted lint pass. Browser and real authentication verification remain outstanding.

Run `npm ci`, `npm run dev`, and test at phone and desktop widths. Select PCOS in conditions, open the care space, save a question, reload, prepare/edit/download notes, and verify the treatment inclusion option. Test calendar date selection and keyboard use of the cycle wheel. Check non-PCOS and hormonal birth-control modes for regressions.

The existing app's clinical content and privacy/security implementation have not received a comprehensive audit. This is a focused first iteration, not a claim of medical validation or improved retention.

Prepared for a separate-branch push at the owner's request. No production deployment or merge is included. No AI coauthor credit was added.

## Logo concept

The approved rounded wordmark is installed from `public/brand/luna-rounded.png` in Welcome, onboarding and Today. It does not yet replace launcher icons. PCOS now includes optional symptom-row preferences, dated self-reported care events, and opt-in inclusion of those events in editable visit summaries. Treatment trackers archive and restore rather than deleting check-in history; archive dates are explicitly not medical stop dates. NHS and Monash resource links were checked September 27, 2026, not clinically reviewed by Luna. Current verification: 88 tests and production build pass; browser and live account flows remain unverified.

`public/brand/luna-wordmark-concept.png` is a new transparent-background logo concept, kept separate from the live branding. It was made with built-in image generation, using this direction: an editorial Luna serif wordmark paired with a simple crescent-like embracing arc, in deep burnt terracotta, clean vector-like contours, without extra text or medical symbols. It is a raster concept, not a vector master or trademark-cleared identity.

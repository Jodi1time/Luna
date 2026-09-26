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

Run `npm ci`, `npm run dev`, and test at phone and desktop widths. Select PCOS in conditions, open the care space, save a question, reload, prepare/edit/download notes, and verify the treatment inclusion option. Test calendar date selection and keyboard use of the cycle wheel. Check non-PCOS and hormonal birth-control modes for regressions.

The existing app's clinical content and privacy/security implementation have not received a comprehensive audit. This is a focused first iteration, not a claim of medical validation or improved retention.

Prepared for a separate-branch push at the owner's request. No production deployment or merge is included. No AI coauthor credit was added.

## Logo concept

`public/brand/luna-wordmark-concept.png` is a new transparent-background logo concept, kept separate from the live branding. It was made with built-in image generation, using this direction: an editorial Luna serif wordmark paired with a simple crescent-like embracing arc, in deep burnt terracotta, clean vector-like contours, without extra text or medical symbols. It is a raster concept, not a vector master or trademark-cleared identity.

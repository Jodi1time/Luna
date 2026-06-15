# Luna — screen-by-screen redesign (the structural pass)

Jodi's direction (2026-06): the app reads like "AI slop" not because it
lacks illustrations, but because it leans on decoration where it needs
**structural clarity** — hierarchy, states, functional typography, one
dominant action per screen. Linear/Things/Stripe look expensive with
almost no illustration. This is the plan to get there. Evolutionary,
not a reinvention — keep Luna's editorial soul, fix the product.

## Global rules (the new design law — enforce on every screen)

1. **Keep the editorial soul, but make utility text functional.** Serif
   (Newsreader) is for emotional moments: hero headlines, section
   titles, in-voice replies. **Labels, helper text, controls, legends,
   metadata → DM Sans, non-italic, higher contrast.** Decorative italic
   serif on functional copy is a top "trying too hard" tell.
2. **One dominant action per screen.** The next step is obvious; the
   rest support, never compete.
3. **Selected/active/predicted states are unmistakable** — never
   tint-alone. Pair tint with a filled control (check), weight, border,
   and a touch of elevation. (Done: onboarding `OptionCard`.)
4. **Reduce decorative friction.** Gradients/glow frame content, never
   blur it. Important controls out-anchor atmosphere.
5. **Consistent surfaces.** Radius from `T.radius`, elevation from
   `T.shadow`, never ad-hoc. Fewer simultaneous card styles per screen.
6. **Tighten spacing above the primary interaction**; one hero block +
   one supporting cluster before scroll.

## Status

- [x] **Foundation** — paper grain, layered elevation tokens, radius
      ramp, calmer card color, lit card edges. (`theme.js`, `index.css`)
- [x] **Onboarding selected states** — `OptionCard` rebuilt: filled
      check control, stronger surface/border, functional hint sans.
      Propagates to intent / priorities / conditions.
- [x] **Onboarding progress** — five busy chips → one clean bar
      (mono "STEP n / 5" + sans step name + filled track).
- [ ] Onboarding step 2 (last period) — calendar as hero, lift it up,
      stronger selected-day state, confirmation line under the title.
- [ ] Onboarding step 3 (cycle length) — demote the source footer,
      stronger irregular-row affordance.
- [ ] Onboarding payoff — tighten to a confident handoff, demote the
      quote card so the CTA leads.
- [ ] **Today/Home** — establish one main action near top; Talk/Share/
      Look-it-up become a clearly secondary row; fewer surfaces above
      the fold; functional utility text pass.
- [ ] **Navigation + center button** — center reads explicitly as "Log",
      stronger active-tab contrast.
- [ ] **Calendar** — compress header, segmented legend, stronger
      logged/predicted/selected states, summary strip under the month.
- [ ] **Patterns/Insights** — compact summary block above the wheel,
      reduce wheel footprint, insight card higher, shorter copy.
- [ ] **You/Settings** — functional group headers, right-aligned values,
      push low-frequency items to subpages.
- [ ] **Global type pass** — sweep utility text from italic serif to
      functional sans across all 65 routes (rule #1).

## Priority order

P1 — onboarding steps 1–4, Today, navigation + selected states.
P2 — Calendar, Patterns, Settings IA.
P3 — Landing refinements, payoff screen.

## Acceptance checklist (per screen)

- One dominant action visible before scroll.
- Functional text readable without relying on italics or faint contrast.
- Selected / active / predicted states unmistakable.
- Uncertainty communicated honestly (Calendar, Patterns).
- Reads as a confident product, not a styled poster.

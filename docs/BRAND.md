# Luna — Brand & Design System

The reference that keeps Luna from looking like "another indie app."
Every visual decision traces back to here. If a screen feels generic,
it has drifted from this document — bring it back.

The tokens live in code at `src/data/theme.js` (the `T` object) and
`src/data/sectionPalette.js`. This file is the *why*.

---

## 0. The one-line brief

> Luna feels like opening a **beautiful daily body ritual** — a premium
> wellness companion with cycle intelligence underneath, not a period
> tracker wearing nicer clothes.

If a surface could appear in a SaaS analytics tool, it is wrong. If it
could be a page in a beautifully art-directed magazine about the body,
skin, mood, energy, rest, and rhythm, it is right.

---

## 1. What makes it feel crafted (and what makes it feel like slop)

The difference between "$150k build" and "template with nice fonts" is
almost never the big idea — it's the execution details. Luna's bones
(editorial serif, warm cream, the moon) are premium. These are the
details that earn it:

**Crafted — do these**
- **Texture.** Real paper has grain. The app has a fixed film-grain
  overlay (`.paper-grain`) so light catches the surface. Flat digital
  cream is the single biggest "this is a webpage" tell.
- **Layered, warm, soft elevation.** Shadows are *two* stacked layers
  (a tight contact shadow + a wide diffuse ambient), warm-tinted
  near-black, never grey, never harsh. `T.shadow.*`.
- **A lit top edge.** Cards carry a 1px inner highlight (`.lit-edge`,
  baked into `.glass-card`) so they read as objects with a beveled
  edge, not printed rectangles.
- **Concentric radii.** An element inside a padded shell uses
  `concentric(outer, pad)` so the inner and outer curves stay
  parallel — the "machined hardware" look.
- **Macro-whitespace.** Generous breathing room. When unsure, add
  space. Cramped = cheap.
- **Type doing the work.** Hierarchy comes from the serif type ramp
  and space first; color second.

**Slop — avoid these (the tells that read as AI-generated)**
- Saturated pastel gradient cards, seven different colors, stacked down
  a feed. (Color must *punctuate*, not flood — see §4.)
- Single harsh grey drop shadows (`0 4px 12px rgba(0,0,0,0.3)`).
- Generic 1px solid grey borders everywhere.
- Inconsistent corner radii (4 here, 16 there, 22 below).
- Everything boxed in a card; card-inside-card-inside-card.
- Banned fonts: Inter, Roboto, Arial, Open Sans, Helvetica.
- Cramped, edge-to-edge density with no negative space.

---

## 2. Typography

| Role | Font | Size | Weight | Tracking |
|---|---|---|---|---|
| Display (heroes) | Newsreader | 40–48 | 500 | −1.4 |
| Title (screen H1) | Newsreader | 28–34 | 500 | −0.8 |
| Heading (section) | Newsreader | 20–22 | 500 | −0.4 |
| Body | Newsreader / DM Sans | 14–16 | 400 | 0 |
| Eyebrow / label | DM Mono | 10–11 | 600 | +1.4–1.6, UPPER |

- **Newsreader** (variable optical-size serif) carries all emotional and
  editorial weight. Italics are a feature — use them for warmth.
- **DM Mono** is the "machine" voice: labels, sources, counts, eyebrows.
  It signals precision and grounds the serif's softness.
- **DM Sans** only for dense functional UI (settings rows, fine print).
- **Hard floor: 11px** for any informational text (audience includes
  perimenopause users on small screens). Chart annotations may go 9.5.
- Display headlines should be **big and confident** with tight tracking.
  Editorial luxury shouts in the serif and whispers everywhere else.

---

## 3. Color

**Foundation**
- Room `#F7F2EA`, card `#FFFDF8`, subtle oat `#EDE5DA`, cocoa ink
  `#2B211C`, muted taupe `#74685E`. Brand accent **cocoa clay
  `#6B4739`**.
- The background warms ~2–3% across the day (time-of-day tint).
- The palette should read like luxury skincare: ivory, cream, oat,
  taupe, clay, cocoa, muted sage. Never candy, never neon.

**Section palette** — functional color-coding, not decoration. Seven
soft families, each mapped to *what a surface does* (`sectionPalette.js`):
reflect (oat clay), body (warm clay), read (muted sage), intimate
(soft rose), care (sand), urgent/support (earth rose), plan (taupe).

**The discipline (this is the part that was drifting)**
- Color **punctuates, it does not flood.** A category shows its
  identity through the **accent** (a thin border, a dot, an eyebrow, an
  icon) — *not* by turning the whole card into a saturated block.
- The tinted card background (`sectionPaper`) is a **whisper** over
  paper. Its loudness is one knob: `WASH` in `sectionPalette.js`.
  Higher = louder. It was softened from ~80% to ~65% because seven
  loud cards down a feed was the main "generic" signal.
- **Two-accent maximum per viewport.** If three+ section colors are
  fighting on one screen, the screen is too busy — calm it.
- Never neon, never candy, never glitter. Soft, warm, dusty.

---

## 4. Surfaces & elevation

- **Radius ramp** (`T.radius`): xs 4 (inputs/chips — stay crisp),
  sm 10, md 14 (standard cards), lg 20 (feature), xl 26 (hero: the
  cover, the AI thought). Nest with `concentric()`.
- **Elevation** (`T.shadow`): sm / md / lg, plus `ambient` for floating
  hero elements. Always layered, always warm. Reach for a token; don't
  hand-roll a new `box-shadow` per card.
- **Glass cards** (`.glass-card`) carry the lit edge + soft elevation by
  default — most cards get craft for free.
- **Double-bezel** for hero moments only: an outer shell (subtle bg +
  hairline + small padding + xl radius) holding an inner core with its
  own surface and a `concentric` radius. Reserve for the cover / payoff,
  not every card.

---

## 5. Motion

Already strong — keep it. Custom easing only (`--ease-out`,
`--ease-spring`, `--ease-in-out`, `--ease-drawer`); never `linear` or
default `ease`. Entrances fade-up with a small blur bridge. Ambient life
(breath, pulse, grain) is continuous and slow; entrance choreography
plays **once per session** (`lib/choreo.js`). All motion respects
`prefers-reduced-motion`. Physics over decoration: things have mass.

---

## 6. Product language

Primary navigation is a promise, not an org chart:

- **Today** — the daily ritual and right-now body story.
- **Check-in** — the one canonical place to log mood, energy, flow,
  symptoms, sleep, notes, and anything noticed.
- **Reflect** — the one canonical place to write, look back, and make
  meaning.
- **Insights** — patterns and trends, explained softly.
- **You** — account, privacy, preferences, and health profile.

Use **body**, **rhythm**, and **today** for lifestyle surfaces. Use
**cycle**, **period**, **ovulation**, and medical words when precision
matters. The rule is not to hide biology; it is to avoid making the
whole app feel clinical when the user came for care.

## 7. Iconography & imagery

- Icons: ultra-light precise line work, ~1.6 stroke, round caps. No
  thick filled icons, no Material/FontAwesome.
- **Illustration system** (`components/Illustrations.jsx`): the
  "celestial botanical" set — the moon and what grows under it.
  Stroke-led, themeable by accent, gently animated. Used at empty
  states, the onboarding reward, the share moment, and as the
  `MoonMark` signature on section headers.
- Illustration is supporting texture, not the brand's main visual
  world. Prefer editorial, material cues when possible: morning light,
  linen, ceramics, water, stone, journals, tea, skincare, movement, and
  real women. No cartoons, no mascot energy.
- The moon is Luna's throughline. When a surface needs a mark, it's a
  moon — never arbitrary.

---

## 8. Voice (visual)

Lowercase phase names. Italic-serif eyebrows for warmth; mono eyebrows
for precision. Source lines on medical claims, quiet. One idea per
surface, depth one tap away (HAVEN-NOT-CLASSROOM). The visual voice and
the written voice are the same person: calm, exact, never shouting,
never childish.

---

## 9. The pre-ship check (run this on any new screen)

- [ ] Sits on grain, not flat digital cream
- [ ] Radii come from `T.radius`; nested elements use `concentric()`
- [ ] Shadows come from `T.shadow` — layered, warm, soft
- [ ] ≤ 2 section colors competing in the viewport; color punctuates
- [ ] Display type is big and confident; ≥ 11px everywhere informational
- [ ] Generous whitespace — it breathes
- [ ] No card-in-card-in-card; no harsh grey shadow; no banned font
- [ ] Could this be a magazine page? (yes) Could it be a SaaS dashboard? (no)

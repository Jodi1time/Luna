// Birth-control-aware cycle model.
//
// Luna's natural-cycle math (useCycle.js) assumes a 28-ish-day
// estradiol/progesterone arc with predictable phases. That's wrong
// for most hormonal birth control users:
//   - Combined pill / patch / ring: ovulation suppressed; bleeding
//     is a withdrawal bleed during the placebo week, not a period
//   - Mini-pill: bleeding patterns are unpredictable; no real phases
//   - Hormonal IUD: ~50% have no periods after 6–12 months
//   - Implant: bleeding patterns vary widely; often amenorrhea
//   - Depo shot: usually amenorrhea after a few months; what matters
//     is the 12–13 week re-injection schedule, not a phase
//   - Copper IUD: natural cycle continues (often heavier)
//
// This helper returns a per-method model that drives the Home cover
// + the "next thing" prediction + which downstream surfaces should
// be suppressed (period CTAs, catch-up nudges, phase-tinted copy
// where it'd be misleading).
//
// Sources:
//   - ACOG Practice Bulletin 110 (combined hormonal contraception)
//   - ACOG Practice Bulletin 186 (LARCs — IUDs and implants)
//   - WHO Medical Eligibility Criteria
//   - Depo-Provera prescribing information (Pfizer)

const MS_PER_DAY = 86400000

// Returns days between two ISO dates (b - a). Negative if b is before a.
function daysBetween(aISO, bISO) {
  if (!aISO || !bISO) return null
  const a = new Date(aISO + 'T00:00:00')
  const b = new Date(bISO + 'T00:00:00')
  return Math.round((b - a) / MS_PER_DAY)
}

// Format a positive day count gently — "12 days" / "1 day" / "today".
function fmtDays(n) {
  if (n == null) return null
  if (n === 0) return 'today'
  if (n === 1) return 'in 1 day'
  return `in ${n} days`
}

function fmtAgo(n) {
  if (n == null) return null
  if (n === 0) return 'today'
  if (n === 1) return 'yesterday'
  if (n < 7) return `${n} days ago`
  if (n < 60) return `${Math.round(n / 7)} weeks ago`
  return `${Math.round(n / 30)} months ago`
}

// ─── The model ───────────────────────────────────────────────
//
// Returns an object:
//   {
//     kind: 'natural' | 'pillPack' | 'continuous' | 'injection' | 'iud-hormonal' | 'implant',
//     showNaturalPhases: boolean,
//     suppressPeriodPredictions: boolean,
//     wantsStartDate: boolean,
//     startDateLabel: string,           // copy for the date picker prompt
//     missingStartDate: boolean,        // true if we want a date and don't have one
//     cover: {                          // what to render on the Home cover
//       eyebrow: string,
//       bigNumber: number | string | null,
//       bigUnit: string,                // 'days' | 'weeks' | 'pack day' etc.
//       headline: string,               // e.g. "Pack week 2" or "Injection"
//       presence: string,               // the soft doula line under the big number
//     },
//     nextThing: null | {               // surfaces as its own card on Home
//       kind: 'next-shot' | 'next-placebo-week' | 'pack-start' | 'pattern-discovery',
//       eyebrow: string,
//       title: string,
//       body: string,
//       urgent: boolean,                // when something is overdue / risk-relevant
//     },
//   }
export function getBcCycleModel(birthControl, opts = {}) {
  const todayISO = opts.todayISO || new Date().toISOString().slice(0, 10)
  const method = birthControl?.method || 'none'
  const startDate = birthControl?.startDate || null

  // Natural cycle path — no BC OR copper IUD (which doesn't affect cycle
  // hormonally; we just flag heavier flow elsewhere).
  if (method === 'none' || method === 'copper-iud') {
    return {
      kind: 'natural',
      showNaturalPhases: true,
      suppressPeriodPredictions: false,
      wantsStartDate: false,
      missingStartDate: false,
      cover: null,           // Home uses its existing natural-cycle cover
      nextThing: null,
    }
  }

  // ── Combined pill / patch / ring ───────────────────────────
  // 28-day pack model: 21 active + 7 placebo. Withdrawal bleed
  // expected during the placebo week. We compute pack-day from
  // startDate (the day she opened her current pack). Phases are
  // suppressed because ovulation is suppressed.
  if (method === 'combined-pill' || method === 'patch' || method === 'ring') {
    if (!startDate) {
      return {
        kind: 'pillPack',
        showNaturalPhases: false,
        suppressPeriodPredictions: true,
        wantsStartDate: true,
        startDateLabel: 'When did your current pack start?',
        missingStartDate: true,
        cover: {
          eyebrow: bcShortLabel(method).toLowerCase(),
          bigNumber: null,
          bigUnit: '',
          headline: bcShortLabel(method),
          presence: 'Tell Luna when your current pack started — she\'ll track the pill-week and the next withdrawal bleed for you.',
        },
        nextThing: null,
      }
    }
    const daysIn = daysBetween(startDate, todayISO) ?? 0
    // Cycle pack-day within 1..28
    const packDay = ((daysIn % 28) + 28) % 28 + 1
    const week = Math.ceil(packDay / 7)
    const isPlacebo = packDay > 21
    const daysToPlacebo = isPlacebo ? null : 22 - packDay
    const daysToNextPack = 29 - packDay
    const headline = isPlacebo ? 'Placebo week' : `Pack week ${week}`
    const presence = isPlacebo
      ? 'A withdrawal bleed is expected this week — it\'s your body responding to the hormone drop, not a true period.'
      : 'Your hormones stay steady this week — ovulation is suppressed by the active pills.'
    return {
      kind: 'pillPack',
      showNaturalPhases: false,
      suppressPeriodPredictions: true,
      wantsStartDate: false,
      missingStartDate: false,
      cover: {
        eyebrow: `${bcShortLabel(method).toLowerCase()} · day ${packDay}`,
        bigNumber: packDay,
        bigUnit: 'pack day',
        headline,
        presence,
      },
      nextThing: isPlacebo
        ? {
            kind: 'pack-start',
            eyebrow: 'next pack',
            title: `Your next pack starts ${fmtDays(daysToNextPack)}`,
            body: 'Open the new pack on schedule — even if you\'re still bleeding. Skipping or delaying the first active pill drops protection.',
            urgent: daysToNextPack === 0,
          }
        : {
            kind: 'next-placebo-week',
            eyebrow: 'next withdrawal bleed',
            title: `Around ${fmtDays(daysToPlacebo)}`,
            body: 'Placebo week begins on pack day 22. The bleed during it is a withdrawal bleed, not a true period.',
            urgent: false,
          },
    }
  }

  // ── Injection (Depo-Provera) — most load-bearing case ──────
  // 12–13 weeks per shot. After ~12 weeks, contraceptive effectiveness
  // begins to drop; >15 weeks she's considered late and may need an
  // emergency reassessment + pregnancy test before re-injection.
  // Periods usually stop entirely within a few cycles of starting.
  if (method === 'shot') {
    if (!startDate) {
      return {
        kind: 'injection',
        showNaturalPhases: false,
        suppressPeriodPredictions: true,
        wantsStartDate: true,
        startDateLabel: 'When was your last injection?',
        missingStartDate: true,
        cover: {
          eyebrow: 'depo · injection',
          bigNumber: null,
          bigUnit: '',
          headline: 'Injection',
          presence: 'Tell Luna when your last shot was — she\'ll count down to your next one.',
        },
        nextThing: null,
      }
    }
    const daysSinceShot = daysBetween(startDate, todayISO) ?? 0
    const weeksSinceShot = Math.floor(daysSinceShot / 7)
    // Window: standard re-injection at 12 weeks; effective up to ~13;
    // late zone 13–15; overdue beyond 15.
    const NEXT_SHOT_DAYS = 84   // 12 weeks
    const LATE_DAYS = 91        // 13 weeks
    const OVERDUE_DAYS = 105    // 15 weeks
    const daysToNextShot = NEXT_SHOT_DAYS - daysSinceShot
    let nextThing
    if (daysSinceShot >= OVERDUE_DAYS) {
      nextThing = {
        kind: 'next-shot',
        eyebrow: 'overdue',
        title: 'Your next shot is overdue',
        body: `${weeksSinceShot} weeks since your last injection. Effectiveness has dropped. Call your provider — they\'ll likely want a pregnancy test before re-injection.`,
        urgent: true,
      }
    } else if (daysSinceShot >= LATE_DAYS) {
      nextThing = {
        kind: 'next-shot',
        eyebrow: 'a little late',
        title: 'Your next shot is past the window',
        body: 'You\'re past the 13-week mark. Most providers allow up to 15 weeks without re-protection. Book your re-injection soon.',
        urgent: true,
      }
    } else if (daysToNextShot <= 14) {
      nextThing = {
        kind: 'next-shot',
        eyebrow: 'a small heads-up',
        title: `Next shot ${fmtDays(daysToNextShot)}`,
        body: 'Worth booking your re-injection appointment now — they fill up. Standard schedule is every 12 weeks.',
        urgent: false,
      }
    } else {
      nextThing = {
        kind: 'next-shot',
        eyebrow: 'on schedule',
        title: `Next shot ${fmtDays(daysToNextShot)}`,
        body: 'Bleeding usually quiets entirely on the shot — that\'s expected and safe. If anything changes sharply, log it.',
        urgent: false,
      }
    }
    return {
      kind: 'injection',
      showNaturalPhases: false,
      suppressPeriodPredictions: true,
      wantsStartDate: false,
      missingStartDate: false,
      cover: {
        eyebrow: `depo · ${fmtAgo(daysSinceShot)}`,
        bigNumber: weeksSinceShot,
        bigUnit: weeksSinceShot === 1 ? 'week' : 'weeks',
        headline: 'Since your last shot',
        presence: daysSinceShot >= LATE_DAYS
          ? 'You\'re past the standard window — re-injection soon keeps you protected.'
          : 'On the shot, periods usually quiet over a few months. That\'s biology working — not something missing.',
      },
      nextThing,
    }
  }

  // ── Hormonal IUD (Mirena, Kyleena, Liletta, Skyla) ─────────
  // Periods get lighter or stop entirely within 6–12 months. No
  // predictable cycle. We track time-since-insertion and surface
  // that, plus a pattern-discovery nudge.
  if (method === 'hormonal-iud') {
    const daysSince = startDate ? daysBetween(startDate, todayISO) : null
    const monthsSince = daysSince != null ? Math.floor(daysSince / 30) : null
    return {
      kind: 'iud-hormonal',
      showNaturalPhases: false,
      suppressPeriodPredictions: true,
      wantsStartDate: !startDate,
      startDateLabel: 'When was your IUD inserted?',
      missingStartDate: !startDate,
      cover: {
        eyebrow: startDate ? `hormonal iud · ${fmtAgo(daysSince)}` : 'hormonal iud',
        bigNumber: monthsSince,
        bigUnit: monthsSince === 1 ? 'month' : 'months',
        headline: startDate ? 'Since insertion' : 'Hormonal IUD',
        presence: monthsSince != null && monthsSince >= 6
          ? 'Most people have very light or absent periods by now — that\'s expected. Spotting can still come and go.'
          : 'The first 6 months are the noisy ones — spotting, light bleeding, no rhythm. Your body is settling.',
      },
      nextThing: {
        kind: 'pattern-discovery',
        eyebrow: 'your pattern',
        title: 'Log what you notice — Luna learns your version',
        body: 'Hormonal IUD patterns are personal. Spotting days, cramps, mood shifts — logging them builds your own map, not a generic prediction.',
        urgent: false,
      },
    }
  }

  // ── Implant (Nexplanon) ────────────────────────────────────
  // Bleeding varies wildly — about a third get amenorrhea, a third
  // get light irregular spotting, a third get prolonged bleeding.
  // Lasts 3 years.
  if (method === 'implant') {
    const daysSince = startDate ? daysBetween(startDate, todayISO) : null
    const monthsSince = daysSince != null ? Math.floor(daysSince / 30) : null
    const daysToReplace = startDate ? (365 * 3) - daysSince : null
    let nextThing = null
    if (daysToReplace != null && daysToReplace <= 90 && daysToReplace > 0) {
      nextThing = {
        kind: 'pattern-discovery',
        eyebrow: 'a small heads-up',
        title: `Your implant expires in ${Math.round(daysToReplace / 30)} months`,
        body: 'Worth booking the removal + replacement now. Protection ends at the 3-year mark.',
        urgent: daysToReplace <= 30,
      }
    } else if (daysToReplace != null && daysToReplace <= 0) {
      nextThing = {
        kind: 'pattern-discovery',
        eyebrow: 'overdue',
        title: 'Your implant has expired',
        body: 'Past the 3-year mark — protection has lapsed. Book a replacement appointment.',
        urgent: true,
      }
    }
    return {
      kind: 'implant',
      showNaturalPhases: false,
      suppressPeriodPredictions: true,
      wantsStartDate: !startDate,
      startDateLabel: 'When was your implant inserted?',
      missingStartDate: !startDate,
      cover: {
        eyebrow: startDate ? `implant · ${fmtAgo(daysSince)}` : 'implant',
        bigNumber: monthsSince,
        bigUnit: monthsSince === 1 ? 'month' : 'months',
        headline: startDate ? 'Since insertion' : 'Implant',
        presence: 'Bleeding patterns on the implant are wildly individual. About a third have no bleeding at all; the rest see spotting that defies a schedule. Your pattern is yours to discover.',
      },
      nextThing,
    }
  }

  // ── Mini-pill (progestin-only) ─────────────────────────────
  // Strict 3-hour window for effectiveness. Bleeding is unpredictable
  // — spotting, irregular cycles, sometimes amenorrhea.
  if (method === 'mini-pill') {
    return {
      kind: 'continuous',
      showNaturalPhases: false,
      suppressPeriodPredictions: true,
      wantsStartDate: false,
      missingStartDate: false,
      cover: {
        eyebrow: 'mini-pill',
        bigNumber: null,
        bigUnit: '',
        headline: 'Mini-pill',
        presence: 'On the mini-pill, bleeding patterns can be all over — spotting, irregular cycles, sometimes none. Take it at the same time every day; the 3-hour window matters.',
      },
      nextThing: {
        kind: 'pattern-discovery',
        eyebrow: 'your pattern',
        title: 'Your bleeding is your own',
        body: 'There\'s no scheduled bleed on the mini-pill. Log what you notice — Luna builds your individual map instead of guessing.',
        urgent: false,
      },
    }
  }

  // Fallback — unknown method, treat as natural to be safe.
  return {
    kind: 'natural',
    showNaturalPhases: true,
    suppressPeriodPredictions: false,
    wantsStartDate: false,
    missingStartDate: false,
    cover: null,
    nextThing: null,
  }
}

// Short labels for cover eyebrows — keeps "Combined pill" short.
function bcShortLabel(method) {
  if (method === 'combined-pill') return 'Combined pill'
  if (method === 'patch') return 'Patch'
  if (method === 'ring') return 'Ring'
  if (method === 'mini-pill') return 'Mini-pill'
  if (method === 'hormonal-iud') return 'Hormonal IUD'
  if (method === 'copper-iud') return 'Copper IUD'
  if (method === 'implant') return 'Implant'
  if (method === 'shot') return 'Injection'
  return ''
}

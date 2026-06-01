import { PHASES } from '../data/lunaData'
import { T } from '../data/theme'

// Map each article to the phase it most relates to. Drives the
// accent color used by both Library (card stripe + tag color) and
// the Article reader (drop cap, progress bar, source pill, flourish).
// Articles without a natural phase home use the default accent.
export const ARTICLE_PHASE = {
  pmdd:                  'luteal',
  iron:                  'menstrual',
  endo:                  'menstrual',
  pcos:                  'follicular',
  cravings:              'luteal',
  exercise:              'ovulation',
  basics:                null,
  privacy:               null,
  'anatomy-cervix':      null,
  'anatomy-corpus-luteum': 'luteal',
  'anatomy-discharge':   'ovulation',
}

export function articlePhaseId(id) {
  return ARTICLE_PHASE[id] || null
}

export function articleAccent(id) {
  const phaseId = ARTICLE_PHASE[id]
  return phaseId ? PHASES[phaseId].color : T.accent
}

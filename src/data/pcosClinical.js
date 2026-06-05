// PCOS clinical reference data — bloodwork panels + medications +
// supplements. Drives the Bloodwork tracker and Medications screens.
//
// Sources used throughout (cited inline on each entry):
//   - International PCOS Guideline 2023 (Teede et al., Hum Reprod)
//   - Endocrine Society Clinical Practice Guideline (Legro 2013, JCEM)
//   - ACOG Practice Bulletin 194
//   - Cochrane Reviews (inositol, metformin, letrozole — cited per item)
//   - JCEM (GLP-1 in PCOS, AMH ranges)
//   - LabCorp / Quest reference ranges (for general female adult ranges
//     — PCOS-specific context layered on top)
//
// Ranges are presented as "typical female adult" — we never say
// "normal vs abnormal," because a PCOS user's testosterone of 70
// ng/dL isn't "abnormal," it's the diagnostic signal. Luna's job
// is to give her the range AND the PCOS-specific context next to
// the number, in plain English.

// ─── Bloodwork panels ─────────────────────────────────────────
//
// Each panel:
//   id        — stable internal id
//   name      — display name
//   category  — 'hormones' | 'metabolic' | 'thyroid' | 'ovarian'
//   defaultUnit — most common US unit
//   altUnits  — supported alternative units (for international users)
//   range     — { low, high, unit } typical female adult reference
//   pcosNote  — what this reading means in PCOS specifically
//   source    — citation
//   convert   — optional fn to normalize alt-unit reading to defaultUnit
export const BLOODWORK_PANELS = [
  // ── Hormones ────────────────────────────────────────────────
  {
    id: 'total-testosterone',
    name: 'Total testosterone',
    category: 'hormones',
    defaultUnit: 'ng/dL',
    altUnits: ['nmol/L'],
    range: { low: 15, high: 70, unit: 'ng/dL' },
    pcosNote: 'PCOS often shows total testosterone in the upper end of the female range or just above (60–110 ng/dL). It is one of the three Rotterdam criteria. Worth pairing with free testosterone + SHBG.',
    source: 'Endocrine Society Clinical Practice Guideline',
    convert: (v, fromUnit) => fromUnit === 'nmol/L' ? +(v * 28.84).toFixed(1) : v,
  },
  {
    id: 'free-testosterone',
    name: 'Free testosterone',
    category: 'hormones',
    defaultUnit: 'pg/mL',
    altUnits: ['pmol/L'],
    range: { low: 0.6, high: 6.8, unit: 'pg/mL' },
    pcosNote: 'Free testosterone is the biologically active portion. PCOS often shows elevated free T even when total T looks "fine" — especially when SHBG is low.',
    source: 'Endocrine Society Clinical Practice Guideline',
    convert: (v, fromUnit) => fromUnit === 'pmol/L' ? +(v / 3.467).toFixed(2) : v,
  },
  {
    id: 'dheas',
    name: 'DHEA-S',
    category: 'hormones',
    defaultUnit: 'µg/dL',
    altUnits: ['µmol/L'],
    range: { low: 35, high: 430, unit: 'µg/dL' },
    pcosNote: 'DHEA-S is an adrenal androgen — elevated readings can point to an adrenal contribution to PCOS or to a separate adrenal condition. Worth checking when hirsutism is prominent.',
    source: 'International PCOS Guideline 2023',
    convert: (v, fromUnit) => fromUnit === 'µmol/L' ? +(v * 36.84).toFixed(1) : v,
  },
  {
    id: 'shbg',
    name: 'SHBG',
    category: 'hormones',
    defaultUnit: 'nmol/L',
    altUnits: [],
    range: { low: 18, high: 144, unit: 'nmol/L' },
    pcosNote: 'Sex Hormone Binding Globulin. Low SHBG amplifies free testosterone — so low SHBG is a meaningful PCOS finding even when total T is normal. Insulin resistance suppresses SHBG.',
    source: 'Endocrine Society; LabCorp reference',
  },
  {
    id: 'amh',
    name: 'AMH',
    category: 'ovarian',
    defaultUnit: 'ng/mL',
    altUnits: ['pmol/L'],
    range: { low: 1.0, high: 4.0, unit: 'ng/mL' },
    pcosNote: 'Anti-Müllerian Hormone reflects ovarian follicle count. PCOS often shows AMH 5–12 ng/mL — well above the general female reference — because of the high count of small immature follicles. Not diagnostic alone but a strong supporting signal.',
    source: 'International PCOS Guideline 2023',
    convert: (v, fromUnit) => fromUnit === 'pmol/L' ? +(v / 7.14).toFixed(2) : v,
  },

  // ── Metabolic ──────────────────────────────────────────────
  {
    id: 'fasting-glucose',
    name: 'Fasting glucose',
    category: 'metabolic',
    defaultUnit: 'mg/dL',
    altUnits: ['mmol/L'],
    range: { low: 70, high: 99, unit: 'mg/dL' },
    pcosNote: '100–125 mg/dL is prediabetes territory; ≥126 is diabetes. PCOS roughly quadruples lifetime type-2 diabetes risk, so trending this annually matters. Pair with fasting insulin for HOMA-IR.',
    source: 'ADA; International PCOS Guideline 2023',
    convert: (v, fromUnit) => fromUnit === 'mmol/L' ? +(v * 18.02).toFixed(1) : v,
  },
  {
    id: 'fasting-insulin',
    name: 'Fasting insulin',
    category: 'metabolic',
    defaultUnit: 'µIU/mL',
    altUnits: ['pmol/L'],
    range: { low: 2, high: 19.6, unit: 'µIU/mL' },
    pcosNote: 'Most PCOS care guidelines now recommend fasting insulin alongside glucose to catch insulin resistance early — fasting insulin > 10 with normal glucose often signals it. Lab "normal" can run to 25; PCOS context wants < 10 ideally.',
    source: 'Endocrine Society; JCEM PCOS reviews',
    convert: (v, fromUnit) => fromUnit === 'pmol/L' ? +(v / 6.945).toFixed(2) : v,
  },
  {
    id: 'hba1c',
    name: 'HbA1c',
    category: 'metabolic',
    defaultUnit: '%',
    altUnits: ['mmol/mol'],
    range: { low: 4.0, high: 5.6, unit: '%' },
    pcosNote: '5.7–6.4% is prediabetes; ≥6.5% is diabetes. HbA1c shows 3-month average blood sugar — a single fasting reading misses spikes. Annual is standard PCOS care.',
    source: 'ADA Standards of Care',
    convert: (v, fromUnit) => fromUnit === 'mmol/mol' ? +((v + 23.5) / 10.93).toFixed(2) : v,
  },

  // ── Thyroid ────────────────────────────────────────────────
  {
    id: 'tsh',
    name: 'TSH',
    category: 'thyroid',
    defaultUnit: 'mIU/L',
    altUnits: [],
    range: { low: 0.4, high: 4.0, unit: 'mIU/L' },
    pcosNote: 'Thyroid issues mimic PCOS symptoms (irregular cycles, fatigue, hair changes). Always check TSH alongside PCOS bloodwork — Hashimoto\'s and PCOS commonly co-occur.',
    source: 'American Thyroid Association',
  },
  {
    id: 'free-t4',
    name: 'Free T4',
    category: 'thyroid',
    defaultUnit: 'ng/dL',
    altUnits: ['pmol/L'],
    range: { low: 0.8, high: 1.8, unit: 'ng/dL' },
    pcosNote: 'Pair with TSH. Free T4 catches secondary hypothyroidism that TSH alone misses.',
    source: 'American Thyroid Association',
    convert: (v, fromUnit) => fromUnit === 'pmol/L' ? +(v / 12.87).toFixed(2) : v,
  },
  {
    id: 'prolactin',
    name: 'Prolactin',
    category: 'hormones',
    defaultUnit: 'ng/mL',
    altUnits: ['µg/L'],
    range: { low: 4, high: 23, unit: 'ng/mL' },
    pcosNote: 'High prolactin can mimic PCOS (irregular cycles, milky discharge). Worth ruling out — if elevated, MRI to check for a pituitary cause.',
    source: 'Endocrine Society',
  },
]

// Group panels by category for the bloodwork screen layout.
export function bloodworkByCategory() {
  const groups = { hormones: [], metabolic: [], thyroid: [], ovarian: [] }
  for (const p of BLOODWORK_PANELS) {
    if (!groups[p.category]) groups[p.category] = []
    groups[p.category].push(p)
  }
  return groups
}

export function getPanel(id) {
  return BLOODWORK_PANELS.find((p) => p.id === id) || null
}

// ─── HOMA-IR ──────────────────────────────────────────────────
// Auto-compute insulin resistance index when both fasting glucose
// and fasting insulin readings are present. HOMA-IR > 2.5 generally
// flags insulin resistance in PCOS context (some sources use 1.9).
//   US units (glucose mg/dL): HOMA-IR = (insulin × glucose) / 405
//   SI units (glucose mmol/L): HOMA-IR = (insulin × glucose) / 22.5
// Returns a number, or null if either input is missing/invalid.
export function homaIR({ glucose, glucoseUnit = 'mg/dL', insulin }) {
  const g = Number(glucose), i = Number(insulin)
  if (!Number.isFinite(g) || !Number.isFinite(i) || g <= 0 || i <= 0) return null
  const divisor = glucoseUnit === 'mmol/L' ? 22.5 : 405
  return +(g * i / divisor).toFixed(2)
}

export function homaIRReading(score) {
  if (score == null) return null
  if (score < 1.9) return { label: 'within range', kind: 'ok' }
  if (score < 2.5) return { label: 'borderline insulin resistance', kind: 'borderline' }
  return { label: 'insulin resistance', kind: 'flag' }
}

// ─── Medications + supplements ───────────────────────────────
//
// Curated PCOS-relevant treatments. Each:
//   id          — stable id
//   name        — display
//   kind        — 'rx' | 'supplement' | 'bc'
//   purpose     — short why-she-might-take-it (one line)
//   evidence    — 1-3 sourced bullets
//   sideEffects — common ones to watch (informational, not alarming)
//   timeline    — when she'd expect effects ("3–6 months")
//   source      — citation
//   defaultDose — common starting dose (optional, informational)
//   notes       — optional extra
export const PCOS_MEDICATIONS = [
  // ── Supplements (highest evidence for PCOS first) ──────────
  {
    id: 'inositol',
    name: 'Inositol (myo + d-chiro, 40:1)',
    kind: 'supplement',
    purpose: 'Insulin sensitivity + restoring ovulation',
    evidence: [
      'Cochrane review: comparable to metformin for restoring ovulation in PCOS',
      'Lowers fasting insulin and improves HOMA-IR',
      'Often improves cycle regularity over 3–6 months',
    ],
    sideEffects: ['Mild GI (gas, loose stools) at higher doses — start low'],
    timeline: '3–6 months for full effect; cycle changes often within 8–12 weeks',
    source: 'Cochrane Review 2023; JCEM',
    defaultDose: '4g myo + 100mg d-chiro daily, split AM/PM',
  },
  {
    id: 'vitamin-d',
    name: 'Vitamin D',
    kind: 'supplement',
    purpose: 'Common deficiency in PCOS; supports insulin and ovulation',
    evidence: [
      'Most PCOS users are vitamin D insufficient (< 30 ng/mL)',
      'Repletion improves insulin sensitivity in deficient patients',
    ],
    sideEffects: ['Rare at typical doses; very high doses can elevate calcium'],
    timeline: '8–12 weeks to raise serum 25(OH)D',
    source: 'Endocrine Society; J Clin Endocrinol Metab',
    defaultDose: '1000–4000 IU daily depending on serum level',
  },
  {
    id: 'nac',
    name: 'N-Acetyl Cysteine (NAC)',
    kind: 'supplement',
    purpose: 'Antioxidant; some evidence for ovulation + insulin support',
    evidence: [
      'May improve ovulation rates in PCOS, especially combined with letrozole',
      'Antioxidant + glutathione precursor — supports liver in PCOS',
    ],
    sideEffects: ['Mild GI; rarely a sulfur-y taste'],
    timeline: '8–12 weeks for ovulation effect',
    source: 'Cochrane Review (NAC for PCOS)',
    defaultDose: '600–1200 mg twice daily',
  },
  {
    id: 'omega3',
    name: 'Omega-3 (fish or algae oil)',
    kind: 'supplement',
    purpose: 'Anti-inflammatory; small improvements in androgens + lipids',
    evidence: [
      'Modest reductions in testosterone + LDL in PCOS trials',
      'Useful adjunct, not primary therapy',
    ],
    sideEffects: ['Fishy aftertaste; takes 4–6 weeks to clear'],
    timeline: '8–12 weeks for measurable change',
    source: 'JCEM reviews',
    defaultDose: '1–2g combined EPA + DHA daily',
  },
  {
    id: 'magnesium',
    name: 'Magnesium (glycinate)',
    kind: 'supplement',
    purpose: 'Sleep, insulin, cramps — PCOS users often run low',
    evidence: [
      'Magnesium supplementation modestly improves insulin sensitivity',
      'Glycinate form is gentler on the gut than oxide',
    ],
    sideEffects: ['Loose stools at high doses (especially oxide form)'],
    timeline: '2–4 weeks for sleep effect',
    source: 'Nutrients (Magnesium in PCOS)',
    defaultDose: '200–400 mg in the evening',
  },

  // ── Prescription (most evidence-supported PCOS Rx first) ───
  {
    id: 'metformin',
    name: 'Metformin',
    kind: 'rx',
    purpose: 'Insulin sensitizer — restores ovulation, lowers androgens',
    evidence: [
      'First-line for insulin resistance in PCOS',
      'Modest weight effect; bigger metabolic effect',
      'Often restores cycle regularity within 3–6 months',
    ],
    sideEffects: ['GI (nausea, loose stools) — usually settles in 2–4 weeks; XR form is easier'],
    timeline: '3–6 months for cycle and metabolic effects',
    source: 'Endocrine Society; ACOG Practice Bulletin 194',
    defaultDose: '500 mg with dinner, titrate up to 1500–2000 mg/day',
  },
  {
    id: 'spironolactone',
    name: 'Spironolactone',
    kind: 'rx',
    purpose: 'Anti-androgen — eases acne + hirsutism',
    evidence: [
      'Strong evidence for adult hormonal acne (especially jawline)',
      'Reduces hirsutism over 6 months',
      'Often combined with hormonal birth control (do not use alone if pregnancy is possible)',
    ],
    sideEffects: ['Frequent urination early on; possible breast tenderness; check potassium periodically'],
    timeline: '3 months for acne; 6 months for hair growth',
    source: 'AAD; ACOG Practice Bulletin 194',
    defaultDose: '50–200 mg/day',
    notes: 'Avoided in pregnancy — talk to your doctor about contraception if applicable.',
  },
  {
    id: 'glp1',
    name: 'GLP-1 (semaglutide / tirzepatide)',
    kind: 'rx',
    purpose: 'Newer in PCOS: improves insulin, ovulation, symptom load',
    evidence: [
      'Early PCOS evidence is promising — meaningful improvements in insulin sensitivity and ovulation',
      'Stronger metabolic effect than metformin in many users',
      'Not yet first-line in PCOS guidelines but increasingly used off-label',
    ],
    sideEffects: ['GI (nausea, slow gastric emptying); reflux; ramp slowly'],
    timeline: '8–12 weeks for measurable PCOS-relevant effects',
    source: 'JCEM 2023 (GLP-1 in PCOS reviews)',
    defaultDose: 'Dose schedule depends on agent; titrated by prescriber',
    notes: 'Stop before trying to conceive (washout per prescriber). Never combine with metformin without medical guidance.',
  },
  {
    id: 'letrozole',
    name: 'Letrozole (Femara)',
    kind: 'rx',
    purpose: 'First-line ovulation induction for PCOS-related infertility',
    evidence: [
      'NEJM 2014: letrozole produces more live births than Clomid for PCOS users trying to conceive',
      'Lower multiples rate than Clomid',
      'Now first-line per ACOG and Endocrine Society for PCOS ovulation induction',
    ],
    sideEffects: ['Hot flashes, fatigue, headache during the 5-day window'],
    timeline: 'Used in cycles when TTC; ovulation typically within 5–10 days of last pill',
    source: 'Legro et al., NEJM 2014; ACOG; Endocrine Society',
    defaultDose: '2.5–7.5 mg/day on cycle days 3–7',
  },

  // ── Birth control (PCOS-friendly formulations) ─────────────
  {
    id: 'combined-bc',
    name: 'Combined hormonal birth control',
    kind: 'bc',
    purpose: 'Cycle regulation + androgen suppression (acne, hirsutism)',
    evidence: [
      'Drospirenone-containing pills have anti-androgen activity (e.g., Yaz, Yasmin)',
      'Regulates cycles; protects against endometrial buildup from long cycles',
      'Lowers ovarian cancer risk',
    ],
    sideEffects: ['Spotting; mood changes; mild VTE risk increase (rare); blood pressure check needed'],
    timeline: '1–3 months for cycle stabilization; 3–6 for skin',
    source: 'ACOG Practice Bulletin 110',
    notes: 'Stop before trying to conceive. Not a treatment for the underlying PCOS — managing symptoms while you take it.',
  },
]

export function getMedication(id) {
  return PCOS_MEDICATIONS.find((m) => m.id === id) || null
}

// Group medications by kind for the picker UI.
export function medicationsByKind() {
  const groups = { supplement: [], rx: [], bc: [] }
  for (const m of PCOS_MEDICATIONS) {
    if (!groups[m.kind]) groups[m.kind] = []
    groups[m.kind].push(m)
  }
  return groups
}

export const MEDICATION_KIND_LABEL = {
  supplement: 'Supplements',
  rx: 'Prescriptions',
  bc: 'Birth control',
}

// ─── Helpers for the screens ──────────────────────────────────

// Read a value against a panel's range. Returns 'below' | 'within' |
// 'above'. Used only for visual color cues — never to call a value
// "abnormal" in copy. Range interpretation in PCOS is contextual.
export function readingPosition(panel, value, unit) {
  if (!panel?.range) return null
  const v = panel.convert && unit !== panel.defaultUnit
    ? panel.convert(value, unit)
    : Number(value)
  if (!Number.isFinite(v)) return null
  if (v < panel.range.low) return 'below'
  if (v > panel.range.high) return 'above'
  return 'within'
}

// Format a reading for display (with unit).
export function fmtReading(value, unit) {
  if (value == null || value === '') return '—'
  return `${value} ${unit || ''}`.trim()
}

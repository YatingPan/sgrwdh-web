/**
 * Single source of truth for timeline visuals so the main timeline
 * page, the author detail page, and the work detail page all use the
 * same shapes, colours, patterns and uncertainty conventions.
 *
 * Encoding:
 *   - Colour            ← author's language (Greek / Latin / Other)
 *   - Period type       ← shape:
 *       Lifespan        : solid filled rectangle (full opacity)
 *       Composition     : rectangle filled with dense diagonal hatching
 *                         (Pattern B from the design preview: 3.5px,
 *                         stroke-width 1.4)
 *       Coverage        : symbolic bracket   |———|   (a vertical end
 *                         cap on each side joined by a solid horizontal
 *                         line; no fill).
 *   - Uncertainty       ← faded continuation in the same hue:
 *       Lifespan / Composition : the bar extends through the
 *           uncertainty range at ~30 % opacity, with the certain core
 *           drawn on top at full opacity. The two layers share rounded
 *           outer ends so the bar reads as a single shape that simply
 *           "darkens" in the certain core (no visible seam).
 *       Coverage : dashed line in the same hue extends outward from
 *           each bracket toward the earliest / latest possible bound.
 *
 * Both the SVG-based main /timeline view and the HTML/CSS detail-page
 * timelines consume the same constants so the two views are visually
 * consistent.
 */

import type { Period } from './types'
import { formatYear } from './utils'

export type PeriodType =
  | 'Author Lifespan'
  | 'Work Composition Period'
  | 'Work Coverage Period'

export type Language = 'Greek' | 'Latin' | 'Other'

export interface LanguagePalette {
  /** Solid colour for lifespan bars, composition stripes and coverage brackets / lines. */
  dark: string
  /** ~30 % alpha of `dark`, used as the uncertainty overlay for lifespan and as the
   *  background of the composition hatch (so the hatching reads against a pale tint
   *  of the same hue). */
  faded: string
  /** A very light tint of the language colour — used as the background fill of the
   *  composition hatch pattern. */
  patternBg: string
}

export const languagePalette: Record<Language, LanguagePalette> = {
  Greek: { dark: '#dc2626', faded: '#dc26264D', patternBg: '#fee2e2' },
  Latin: { dark: '#2563eb', faded: '#2563eb4D', patternBg: '#dbeafe' },
  Other: { dark: '#475569', faded: '#4755694D', patternBg: '#e2e8f0' },
}

export function asLanguage(language: string | null | undefined): Language {
  if (language === 'Greek' || language === 'Latin' || language === 'Other') return language
  return 'Other'
}

/** ── Composition hatch parameters (Pattern B from design preview) ────────
 *  Used by both the SVG `<pattern>` defs in the main timeline and the
 *  CSS `repeating-linear-gradient` in detail-page timelines. */
export const HATCH = {
  /** Stripe period in pixels. */
  period: 3.5,
  /** Stripe (line) thickness in pixels. */
  stroke: 1.4,
  /** Rotation of the stripes in degrees. */
  angle: 45,
}

/** Build a CSS `repeating-linear-gradient` matching Pattern B for HTML rendering. */
export function compositionHatchCss(language: Language): string {
  const p = languagePalette[language]
  // The visible stripe ends at HATCH.stroke; the rest of the period is patternBg.
  return `repeating-linear-gradient(${HATCH.angle}deg,
    ${p.dark} 0 ${HATCH.stroke}px,
    ${p.patternBg} ${HATCH.stroke}px ${HATCH.period}px)`
}

export interface PeriodBounds {
  /** earliest plausible start year */
  se: number
  /** latest plausible start year   (start is definite when se === sl) */
  sl: number
  /** earliest plausible end year   (end   is definite when ee === el) */
  ee: number
  /** latest plausible end year */
  el: number
  startIsDefinite: boolean
  endIsDefinite: boolean
}

export function periodBounds(p: Period): PeriodBounds | null {
  const se = p.start_year_earliest ?? p.start_year_latest
  const sl = p.start_year_latest ?? p.start_year_earliest
  const ee = p.end_year_earliest ?? p.end_year_latest
  const el = p.end_year_latest ?? p.end_year_earliest
  if (se === null || sl === null || ee === null || el === null) return null
  return {
    se,
    sl,
    ee,
    el,
    startIsDefinite: se === sl,
    endIsDefinite: ee === el,
  }
}

/** Format a bound as either a single year or "c. earliest – latest". */
export function formatBound(earliest: number, latest: number): string {
  if (earliest === latest) return formatYear(earliest)
  return `c. ${formatYear(earliest)} – ${formatYear(latest)}`
}

/** Compact one-liner for tooltips. */
export function describePeriod(p: Period): string {
  const b = periodBounds(p)
  if (!b) return ''
  return `${formatBound(b.se, b.sl)} → ${formatBound(b.ee, b.el)}`
}

export const periodLabel: Record<PeriodType, string> = {
  'Author Lifespan': 'Lifespan',
  'Work Composition Period': 'Composition',
  'Work Coverage Period': 'Coverage',
}

export const languageLabel: Record<Language, string> = {
  Greek: 'Greek',
  Latin: 'Latin',
  Other: 'Other',
}

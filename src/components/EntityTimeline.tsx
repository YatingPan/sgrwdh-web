'use client'

import Link from 'next/link'
import {
  Language,
  PeriodType,
  asLanguage,
  compositionHatchCss,
  formatBound,
  languagePalette,
  periodBounds,
  periodLabel,
} from '@/lib/timeline-style'
import { Period } from '@/lib/types'
import { renderDbMarkup, stripHtml } from '@/lib/utils'

/**
 * Inline timeline used on author and work detail pages. Visual
 * conventions are shared with the main /timeline page so a viewer can
 * carry the same mental model across the site:
 *
 *   - Lifespan    : solid bar in the language colour
 *   - Composition : bar filled with dense diagonal hatching (Pattern B)
 *   - Coverage    : bracket symbol  |———|   (no fill, just lines)
 *   - Uncertainty : same colour, faded — for lifespan/composition the
 *                   bar extends through the uncertain range at ~30 %
 *                   opacity with the certain core drawn on top at full
 *                   opacity (one continuous shape, no visible seam);
 *                   for coverage the brackets are joined to the
 *                   earliest / latest bound with a dashed line.
 *
 * Dates are always visible in the right-hand column — no hover needed.
 */

export interface EntityTimelineRow {
  /** UI label, may contain <i>...</i> markup. */
  label: string
  /** Optional link target — clicking the label goes here. */
  href?: string
  /** Language whose palette to use for this row. */
  language: Language
  periods: Period[]
}

interface Props {
  rows: EntityTimelineRow[]
  /** Optional fixed range; otherwise auto-fit to data. */
  minYear?: number
  maxYear?: number
}

export default function EntityTimeline({ rows, minYear, maxYear }: Props) {
  const allYears = rows
    .flatMap((r) => r.periods)
    .flatMap((p) => [
      p.start_year_earliest,
      p.start_year_latest,
      p.end_year_earliest,
      p.end_year_latest,
    ])
    .filter((y): y is number => y !== null)

  if (!allYears.length) return null

  const min = minYear ?? Math.min(...allYears) - 20
  const max = maxYear ?? Math.max(...allYears) + 20
  const range = max - min || 1
  const toPercent = (year: number) => ((year - min) / range) * 100

  return (
    <div className="bg-card rounded-lg border border-border p-4 space-y-4">
      <TimeAxis min={min} max={max} />

      {rows.map((row, ri) => (
        <div key={ri} className="space-y-2">
          <div className="flex items-baseline gap-2">
            {row.href ? (
              <Link
                href={row.href}
                className="text-sm font-semibold text-primary hover:text-accent font-serif"
                dangerouslySetInnerHTML={{ __html: renderDbMarkup(row.label) }}
              />
            ) : (
              <span
                className="text-sm font-semibold text-foreground font-serif"
                dangerouslySetInnerHTML={{ __html: renderDbMarkup(row.label) }}
              />
            )}
          </div>

          {row.periods.map((period, pi) => (
            <PeriodRow
              key={pi}
              period={period}
              language={row.language}
              toPercent={toPercent}
            />
          ))}
        </div>
      ))}

      <Legend />
    </div>
  )
}

function TimeAxis({ min, max }: { min: number; max: number }) {
  const range = max - min || 1
  const tickInterval = range > 800 ? 200 : range > 400 ? 100 : range > 150 ? 50 : 25
  const firstTick = Math.ceil(min / tickInterval) * tickInterval
  const ticks: number[] = []
  for (let t = firstTick; t <= max; t += tickInterval) ticks.push(t)

  return (
    <div className="relative h-5 text-[10px] text-muted">
      <div className="absolute bottom-0 left-0 right-0 h-px bg-border/70" />
      {ticks.map((t) => {
        const pct = ((t - min) / range) * 100
        return (
          <div key={t} className="absolute bottom-0" style={{ left: `${pct}%` }}>
            <div className="w-px h-1.5 bg-border" />
            <span className="absolute -translate-x-1/2 top-2 whitespace-nowrap">
              {t < 0 ? `${Math.abs(t)} BCE` : `${t} CE`}
            </span>
          </div>
        )
      })}
    </div>
  )
}

interface PeriodRowProps {
  period: Period
  language: Language
  toPercent: (y: number) => number
}

function PeriodRow({ period, language, toPercent }: PeriodRowProps) {
  const b = periodBounds(period)
  if (!b) return null

  const seP = toPercent(b.se)
  const slP = toPercent(b.sl)
  const eeP = toPercent(b.ee)
  const elP = toPercent(b.el)
  const startTxt = formatBound(b.se, b.sl)
  const endTxt = formatBound(b.ee, b.el)
  const periodLbl = periodLabel[period.period_type as PeriodType]

  return (
    <div className="flex items-center gap-3">
      <div className="text-[11px] text-muted w-28 shrink-0">{periodLbl}</div>
      <div className="relative h-5 flex-1">
        <PeriodBar
          periodType={period.period_type as PeriodType}
          language={language}
          seP={seP}
          slP={slP}
          eeP={eeP}
          elP={elP}
        />
      </div>
      <div className="text-[11px] text-muted shrink-0 text-right tabular-nums whitespace-nowrap">
        {startTxt} → {endTxt}
      </div>
    </div>
  )
}

interface PeriodBarProps {
  periodType: PeriodType
  language: Language
  seP: number
  slP: number
  eeP: number
  elP: number
}

function PeriodBar({ periodType, language, seP, slP, eeP, elP }: PeriodBarProps) {
  const palette = languagePalette[language]

  if (periodType === 'Work Coverage Period') {
    return (
      <CoverageBar palette={palette} seP={seP} slP={slP} eeP={eeP} elP={elP} />
    )
  }

  // Lifespan & Composition: continuous overlap of [faint full span] +
  // [solid certain core]. The two layers share the same vertical band so
  // they read as one bar that simply darkens through the certain core.
  const isComposition = periodType === 'Work Composition Period'
  const fullW = Math.max(0, elP - seP)
  const coreW = Math.max(0, eeP - slP)

  const barHeight = 12 // px
  const top = (20 - barHeight) / 2 // center within the 20px row

  // For composition we use the same hatched fill on both layers but the
  // outer one is rendered at reduced opacity to mark uncertainty. For
  // lifespan we use solid fill on both layers, ditto.
  const fill = isComposition ? compositionHatchCss(language) : palette.dark
  const radius = 3

  return (
    <div className="absolute inset-x-0" style={{ top }}>
      {/* Outer faint span — full possible range, rounded ends */}
      {fullW > 0 && (
        <div
          className="absolute rounded"
          style={{
            top: 0,
            height: barHeight,
            left: `${seP}%`,
            width: `${fullW}%`,
            background: fill,
            opacity: 0.40,
            borderRadius: radius,
          }}
        />
      )}
      {/* Inner solid core — sharp edges so it merges with the outer band */}
      {coreW > 0 && (
        <div
          className="absolute"
          style={{
            top: 0,
            height: barHeight,
            left: `${slP}%`,
            width: `${coreW}%`,
            background: fill,
          }}
        />
      )}
    </div>
  )
}

/** Coverage symbol  |———|  with optional dashed extensions. */
function CoverageBar({
  palette,
  seP,
  slP,
  eeP,
  elP,
}: {
  palette: { dark: string }
  seP: number
  slP: number
  eeP: number
  elP: number
}) {
  const c = palette.dark
  const lineY = 50 // % within the 20px container → at y=10px
  const capHalf = 5 // bracket cap extends ±5px from the line
  const startExtension = slP - seP
  const endExtension = elP - eeP

  return (
    <>
      {/* Dashed extension on the left (uncertain start) */}
      {startExtension > 0.001 && (
        <div
          className="absolute"
          style={{
            left: `${seP}%`,
            width: `${startExtension}%`,
            top: `calc(${lineY}% - 0.75px)`,
            height: 1.5,
            background: `repeating-linear-gradient(to right, ${c} 0 4px, transparent 4px 7px)`,
            opacity: 0.55,
          }}
        />
      )}
      {/* Left bracket cap */}
      <div
        className="absolute"
        style={{
          left: `${slP}%`,
          width: 2,
          top: `calc(${lineY}% - ${capHalf}px)`,
          height: capHalf * 2,
          background: c,
          transform: 'translateX(-1px)',
        }}
      />
      {/* Solid horizontal connector through the certain coverage */}
      <div
        className="absolute"
        style={{
          left: `${slP}%`,
          width: `${Math.max(0, eeP - slP)}%`,
          top: `calc(${lineY}% - 0.75px)`,
          height: 1.5,
          background: c,
        }}
      />
      {/* Right bracket cap */}
      <div
        className="absolute"
        style={{
          left: `${eeP}%`,
          width: 2,
          top: `calc(${lineY}% - ${capHalf}px)`,
          height: capHalf * 2,
          background: c,
          transform: 'translateX(-1px)',
        }}
      />
      {/* Dashed extension on the right (uncertain end) */}
      {endExtension > 0.001 && (
        <div
          className="absolute"
          style={{
            left: `${eeP}%`,
            width: `${endExtension}%`,
            top: `calc(${lineY}% - 0.75px)`,
            height: 1.5,
            background: `repeating-linear-gradient(to right, ${c} 0 4px, transparent 4px 7px)`,
            opacity: 0.55,
          }}
        />
      )}
    </>
  )
}

function Legend() {
  return (
    <div className="pt-2 border-t border-border/50 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted items-center">
      <span className="flex items-center gap-1.5">
        <span className="inline-block w-4 h-2.5 rounded" style={{ background: languagePalette.Greek.dark }} />
        Greek
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block w-4 h-2.5 rounded" style={{ background: languagePalette.Latin.dark }} />
        Latin
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block w-4 h-2.5 rounded" style={{ background: languagePalette.Other.dark }} />
        Other
      </span>
      <span className="text-border">|</span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block w-5 h-2.5 rounded" style={{ background: languagePalette.Latin.dark }} />
        Lifespan
      </span>
      <span className="flex items-center gap-1.5">
        <span
          className="inline-block w-5 h-2.5 rounded"
          style={{ background: compositionHatchCss('Latin') }}
        />
        Composition
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block relative" style={{ width: 22, height: 10 }}>
          <span className="absolute" style={{ left: 0, top: 0, width: 1.5, height: 10, background: languagePalette.Latin.dark }} />
          <span className="absolute" style={{ left: 0, top: 4, width: 22, height: 1.5, background: languagePalette.Latin.dark }} />
          <span className="absolute" style={{ right: 0, top: 0, width: 1.5, height: 10, background: languagePalette.Latin.dark }} />
        </span>
        Coverage
      </span>
      <span className="text-border">|</span>
      <span className="text-muted">Faint = uncertainty</span>
    </div>
  )
}

/** Helper for callers that want to suppress empty rows. */
export function isRowEmpty(row: EntityTimelineRow): boolean {
  return !row.periods.some((p) => periodBounds(p) !== null)
}

/** Strip HTML for cases where a plain string is needed. */
export function rowPlainLabel(row: EntityTimelineRow): string {
  return stripHtml(row.label)
}

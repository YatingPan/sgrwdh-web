'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import * as d3 from 'd3'
import { Author, Period, Work } from '@/lib/types'
import { formatYear } from '@/lib/utils'
import {
  HATCH,
  Language,
  PeriodType,
  asLanguage,
  formatBound,
  languagePalette,
  periodBounds,
  periodLabel,
} from '@/lib/timeline-style'

/**
 * Main /timeline view. Visual conventions match the inline timelines
 * on author / work detail pages:
 *
 *   - Colour      ← author's language (Greek / Latin / Other)
 *   - Lifespan    : solid filled bar (full opacity) over its certain
 *                   core, sitting inside a faint full-span band that
 *                   marks the uncertainty extents — drawn as one
 *                   continuous shape so there is no visible seam.
 *   - Composition : same overlap technique but the fill is the dense
 *                   diagonal hatching of Pattern B in the language
 *                   colour.
 *   - Coverage    : symbolic bracket  |———|  with optional dashed
 *                   extensions on either side for uncertainty.
 */

interface TimelineProps {
  authors: Author[]
  periods: Period[]
  works: Work[]
}

interface Filters {
  language: 'All' | 'Greek' | 'Latin' | 'Other'
  showLifespans: boolean
  showComposition: boolean
  showCoverage: boolean
  search: string
  yearRange: [number, number]
}

const ROW_HEIGHT = 38
const LABEL_WIDTH = 180
const MARGIN = { top: 36, right: 20, bottom: 36, left: 0 }

const CENTURIES = [
  { label: '8th BCE', range: [-800, -700] as [number, number] },
  { label: '7th BCE', range: [-700, -600] as [number, number] },
  { label: '6th BCE', range: [-600, -500] as [number, number] },
  { label: '5th BCE', range: [-500, -400] as [number, number] },
  { label: '4th BCE', range: [-400, -300] as [number, number] },
  { label: '3rd BCE', range: [-300, -200] as [number, number] },
  { label: '2nd BCE', range: [-200, -100] as [number, number] },
  { label: '1st BCE', range: [-100, 0] as [number, number] },
  { label: '1st CE', range: [0, 100] as [number, number] },
  { label: '2nd CE', range: [100, 200] as [number, number] },
  { label: '3rd CE', range: [200, 300] as [number, number] },
]

interface Tip {
  kind: 'lifespan' | 'composition' | 'coverage'
  authorId: string
  workId?: string
  period: Period
}

/** One composition-hatch pattern per language. Coverage no longer uses a
 *  pattern (it's drawn as a bracket symbol). */
const HATCH_IDS: Record<Language, string> = {
  Greek: 'sgrwdh-h-greek',
  Latin: 'sgrwdh-h-latin',
  Other: 'sgrwdh-h-other',
}

export default function Timeline({ authors, periods, works }: TimelineProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const [filters, setFilters] = useState<Filters>({
    language: 'All',
    showLifespans: true,
    showComposition: true,
    showCoverage: true,
    search: '',
    yearRange: [-800, 800],
  })

  const lifespanMap = useMemo(() => {
    const map: Record<string, Period> = {}
    for (const p of periods) {
      if (p.period_type === 'Author Lifespan') map[p.corresponding_id] = p
    }
    return map
  }, [periods])

  const authorWorksMap = useMemo(() => {
    const map: Record<string, Work[]> = {}
    for (const w of works) {
      if (w.author_id) {
        if (!map[w.author_id]) map[w.author_id] = []
        map[w.author_id].push(w)
      }
    }
    return map
  }, [works])

  const workById = useMemo(() => {
    const m: Record<string, Work> = {}
    for (const w of works) m[w.id] = w
    return m
  }, [works])

  const periodsByCorrId = useMemo(() => {
    const m: Record<string, Period[]> = {}
    for (const p of periods) {
      if (!m[p.corresponding_id]) m[p.corresponding_id] = []
      m[p.corresponding_id].push(p)
    }
    return m
  }, [periods])

  const filteredAuthors = useMemo(() => {
    return authors
      .filter((a) => {
        if (filters.language !== 'All' && asLanguage(a.language) !== filters.language) return false
        if (
          filters.search &&
          !a.author_name.toLowerCase().includes(filters.search.toLowerCase())
        )
          return false
        const ls = lifespanMap[a.id]
        if (ls) {
          const start = ls.start_year_earliest ?? ls.start_year_latest ?? -9999
          const end = ls.end_year_latest ?? ls.end_year_earliest ?? 9999
          if (end < filters.yearRange[0] || start > filters.yearRange[1]) return false
        }
        return true
      })
      .sort((a, b) => {
        const aStart =
          lifespanMap[a.id]?.start_year_earliest ?? lifespanMap[a.id]?.start_year_latest ?? 0
        const bStart =
          lifespanMap[b.id]?.start_year_earliest ?? lifespanMap[b.id]?.start_year_latest ?? 0
        return aStart - bStart
      })
  }, [authors, filters, lifespanMap])

  function jumpToCentury(range: [number, number]) {
    const padding = 30
    setFilters((f) => ({ ...f, yearRange: [range[0] - padding, range[1] + padding] }))
  }

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth
    const svgHeight = filteredAuthors.length * ROW_HEIGHT + MARGIN.top + MARGIN.bottom
    const chartLeft = LABEL_WIDTH
    const chartRight = width - MARGIN.right

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('width', width).attr('height', svgHeight)

    // ── Composition hatch patterns (Pattern B, one per language) ──
    const defs = svg.append('defs')
    ;(['Greek', 'Latin', 'Other'] as Language[]).forEach((lang) => {
      const palette = languagePalette[lang]
      const p = defs
        .append('pattern')
        .attr('id', HATCH_IDS[lang])
        .attr('width', HATCH.period)
        .attr('height', HATCH.period)
        .attr('patternUnits', 'userSpaceOnUse')
        .attr('patternTransform', `rotate(${HATCH.angle})`)
      // Light tint background so the stripes have something to read against
      p.append('rect')
        .attr('width', HATCH.period)
        .attr('height', HATCH.period)
        .attr('fill', palette.patternBg)
      p.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', 0)
        .attr('y2', HATCH.period)
        .attr('stroke', palette.dark)
        .attr('stroke-width', HATCH.stroke)
    })

    const xScale = d3.scaleLinear().domain(filters.yearRange).range([chartLeft, chartRight])

    const g = svg.append('g')

    // ── Axes ──
    const xAxisTop = d3.axisTop(xScale).tickFormat((d) => {
      const v = d.valueOf()
      return v < 0 ? `${Math.abs(v)} BCE` : `${v} CE`
    })
    g.append('g')
      .attr('transform', `translate(0, ${MARGIN.top})`)
      .call(xAxisTop)
      .selectAll('text')
      .style('font-size', '10px')
      .style('fill', '#6b7280')

    const xAxisBottom = d3.axisBottom(xScale).tickFormat((d) => {
      const v = d.valueOf()
      return v < 0 ? `${Math.abs(v)} BCE` : `${v} CE`
    })
    g.append('g')
      .attr('transform', `translate(0, ${svgHeight - MARGIN.bottom})`)
      .call(xAxisBottom)
      .selectAll('text')
      .style('font-size', '10px')
      .style('fill', '#6b7280')

    // ── Grid lines ──
    const ticks = xScale.ticks()
    g.selectAll('.grid-line')
      .data(ticks)
      .enter()
      .append('line')
      .attr('x1', (d) => xScale(d))
      .attr('x2', (d) => xScale(d))
      .attr('y1', MARGIN.top)
      .attr('y2', svgHeight - MARGIN.bottom)
      .attr('stroke', '#e5e2dc')
      .attr('stroke-dasharray', '2,4')

    // ── Per-author rows ──
    filteredAuthors.forEach((author, i) => {
      const yTop = MARGIN.top + i * ROW_HEIGHT
      const yMid = yTop + ROW_HEIGHT / 2
      const lang = asLanguage(author.language)
      const palette = languagePalette[lang]

      if (i % 2 === 0) {
        g.append('rect')
          .attr('x', chartLeft)
          .attr('y', yTop)
          .attr('width', chartRight - chartLeft)
          .attr('height', ROW_HEIGHT)
          .attr('fill', '#f5f3f0')
          .attr('opacity', 0.5)
      }

      // language accent dot
      g.append('circle')
        .attr('cx', 12)
        .attr('cy', yMid)
        .attr('r', 4)
        .attr('fill', palette.dark)

      const maxLabelChars = 22
      const displayName =
        author.author_name.length > maxLabelChars
          ? author.author_name.slice(0, maxLabelChars - 1) + '…'
          : author.author_name
      g.append('text')
        .attr('x', LABEL_WIDTH - 8)
        .attr('y', yMid + 3)
        .attr('text-anchor', 'end')
        .style('font-size', '11px')
        .style('fill', '#2c2c2a')
        .style('cursor', 'pointer')
        .text(displayName)
        .on('click', () => router.push(`/authors/${author.id}`))
        .append('title')
        .text(author.author_name)

      // Vertical layout within a row:
      //   y_top + 4 .. + 16   → Lifespan      (h = 12)
      //   y_top + 20 .. + 26  → Composition   (h = 6)
      //   y_top + 30 .. + 36  → Coverage      (cap height 6, line at +33)
      const lifespanY = yTop + 4
      const lifespanH = 12
      const compositionY = yTop + 20
      const compositionH = 6
      const coverageMidY = yTop + 33
      const coverageCapHalf = 4

      // ── Lifespan ──
      const ls = lifespanMap[author.id]
      if (ls && filters.showLifespans) {
        drawFilledBar({
          period: ls,
          y: lifespanY,
          h: lifespanH,
          fill: palette.dark,
          rx: 2,
          tip: { kind: 'lifespan', authorId: author.id, period: ls },
        })
      }

      // ── Works ──
      const aw = authorWorksMap[author.id] || []
      aw.forEach((work) => {
        const wps = periodsByCorrId[work.id] || []
        wps.forEach((wp) => {
          if (wp.period_type === 'Work Composition Period' && filters.showComposition) {
            drawFilledBar({
              period: wp,
              y: compositionY,
              h: compositionH,
              fill: `url(#${HATCH_IDS[lang]})`,
              rx: 1,
              tip: { kind: 'composition', authorId: author.id, workId: work.id, period: wp },
            })
          }
          if (wp.period_type === 'Work Coverage Period' && filters.showCoverage) {
            drawCoverageBracket({
              period: wp,
              midY: coverageMidY,
              capHalf: coverageCapHalf,
              color: palette.dark,
              tip: { kind: 'coverage', authorId: author.id, workId: work.id, period: wp },
            })
          }
        })
      })

      /** Draw a filled bar (lifespan or composition) using the overlap
       *  technique: outer faint full-span rect (rounded ends) + inner
       *  solid core (sharp edges) on top. The two layers share the same
       *  vertical band so they read as one continuous bar. */
      function drawFilledBar({
        period,
        y,
        h,
        fill,
        rx,
        tip,
      }: {
        period: Period
        y: number
        h: number
        fill: string
        rx: number
        tip: Tip
      }) {
        const b = periodBounds(period)
        if (!b) return

        const xse = xScale(b.se)
        const xsl = xScale(b.sl)
        const xee = xScale(b.ee)
        const xel = xScale(b.el)
        const fullW = Math.max(1, xel - xse)
        const coreW = Math.max(1, xee - xsl)

        const group = g.append('g').style('cursor', 'pointer')

        // Outer faint full-span (rounded)
        group
          .append('rect')
          .attr('class', 'period-bar-outer')
          .attr('x', xse)
          .attr('y', y)
          .attr('width', fullW)
          .attr('height', h)
          .attr('fill', fill)
          .attr('opacity', 0.40)
          .attr('rx', rx)

        // Inner solid core (sharp)
        group
          .append('rect')
          .attr('class', 'period-bar-core')
          .attr('x', xsl)
          .attr('y', y)
          .attr('width', coreW)
          .attr('height', h)
          .attr('fill', fill)

        attachInteractions(group, tip, y, h, fullW, xse)
      }

      /** Draw the |———| coverage bracket symbol with optional dashed
       *  extensions toward the earliest / latest possible bound. */
      function drawCoverageBracket({
        period,
        midY,
        capHalf,
        color,
        tip,
      }: {
        period: Period
        midY: number
        capHalf: number
        color: string
        tip: Tip
      }) {
        const b = periodBounds(period)
        if (!b) return

        const xse = xScale(b.se)
        const xsl = xScale(b.sl)
        const xee = xScale(b.ee)
        const xel = xScale(b.el)

        const group = g.append('g').style('cursor', 'pointer')

        // Dashed extension on the left (uncertain start)
        if (xsl - xse > 0.5) {
          group
            .append('line')
            .attr('x1', xse)
            .attr('x2', xsl)
            .attr('y1', midY)
            .attr('y2', midY)
            .attr('stroke', color)
            .attr('stroke-width', 1.5)
            .attr('stroke-dasharray', '4,3')
            .attr('opacity', 0.55)
        }
        // Left bracket cap
        group
          .append('line')
          .attr('x1', xsl)
          .attr('x2', xsl)
          .attr('y1', midY - capHalf)
          .attr('y2', midY + capHalf)
          .attr('stroke', color)
          .attr('stroke-width', 2)
        // Solid horizontal connector through the certain core
        group
          .append('line')
          .attr('x1', xsl)
          .attr('x2', xee)
          .attr('y1', midY)
          .attr('y2', midY)
          .attr('stroke', color)
          .attr('stroke-width', 1.5)
        // Right bracket cap
        group
          .append('line')
          .attr('x1', xee)
          .attr('x2', xee)
          .attr('y1', midY - capHalf)
          .attr('y2', midY + capHalf)
          .attr('stroke', color)
          .attr('stroke-width', 2)
        // Dashed extension on the right (uncertain end)
        if (xel - xee > 0.5) {
          group
            .append('line')
            .attr('x1', xee)
            .attr('x2', xel)
            .attr('y1', midY)
            .attr('y2', midY)
            .attr('stroke', color)
            .attr('stroke-width', 1.5)
            .attr('stroke-dasharray', '4,3')
            .attr('opacity', 0.55)
        }

        attachInteractions(
          group,
          tip,
          midY - capHalf,
          capHalf * 2,
          Math.max(1, xel - xse),
          xse
        )
      }

      /** Common hover/click target overlaid on a period's full visual span. */
      function attachInteractions(
        group: d3.Selection<SVGGElement, unknown, null, undefined>,
        tip: Tip,
        hitY: number,
        hitH: number,
        hitW: number,
        hitX: number
      ) {
        const onMove = (event: MouseEvent) => moveTooltip(event)
        const onClick = () => {
          if (tip.kind === 'lifespan') router.push(`/authors/${tip.authorId}`)
          else router.push(`/works/${tip.workId!}`)
        }
        group
          .append('rect')
          .attr('x', hitX)
          .attr('y', hitY)
          .attr('width', hitW)
          .attr('height', hitH)
          .attr('fill', 'transparent')
          .on('mouseover', (event) => showTooltip(event, tip))
          .on('mousemove', onMove)
          .on('mouseout', hideTooltip)
          .on('click', onClick)
      }
    })

    function showTooltip(event: MouseEvent, tip: Tip) {
      const tooltip = tooltipRef.current
      if (!tooltip) return
      const author = authors.find((a) => a.id === tip.authorId)
      if (!author) return
      const work = tip.workId ? workById[tip.workId] : null
      const lang = asLanguage(author.language)
      const accent = languagePalette[lang].dark
      const lifespan = lifespanMap[author.id]
      const aw = authorWorksMap[author.id] || []

      const subjectHtml = work
        ? `<div class="text-xs text-gray-500">${tipKindLabel(tip.kind)} of</div>
           <div class="font-bold text-base font-serif" style="color:#1e3a5f">${escapeHtml(stripTags(work.work_title))}</div>
           <div class="text-xs text-gray-600 mt-0.5">by <span style="color:${accent}">●</span> ${escapeHtml(author.author_name)}</div>`
        : `<div class="text-xs text-gray-500">${tipKindLabel(tip.kind)} of</div>
           <div class="font-bold text-base font-serif" style="color:#1e3a5f"><span style="color:${accent}">●</span> ${escapeHtml(author.author_name)}</div>
           ${author.language ? `<div class="text-[10px] text-gray-500 mt-0.5">${author.language}</div>` : ''}`

      const b = periodBounds(tip.period)
      const dateLine = b
        ? `<div class="mt-2 text-xs"><span class="text-gray-500">${tipKindLabel(tip.kind)}:</span> <strong>${formatBound(b.se, b.sl)}</strong> → <strong>${formatBound(b.ee, b.el)}</strong></div>`
        : ''

      let contextHtml = ''
      if (work && lifespan) {
        const lb = periodBounds(lifespan)
        if (lb)
          contextHtml = `<div class="text-[11px] text-gray-500 mt-1">Author lifespan: ${formatBound(lb.se, lb.sl)} → ${formatBound(lb.ee, lb.el)}</div>`
      } else if (!work && aw.length > 0) {
        const items = aw
          .slice(0, 4)
          .map((w) => `<li class="truncate">${escapeHtml(stripTags(w.work_title))}</li>`)
          .join('')
        const more = aw.length > 4 ? `<li class="text-gray-400">+${aw.length - 4} more</li>` : ''
        contextHtml = `<ul class="mt-2 text-[11px] text-gray-600 list-disc list-inside space-y-0.5">${items}${more}</ul>`
      }

      tooltip.innerHTML = `
        ${subjectHtml}
        ${dateLine}
        ${contextHtml}
        <div class="mt-2 text-[10px] text-gray-400 italic">Click to open</div>
      `
      tooltip.style.display = 'block'
      positionTooltip(event)
    }

    function moveTooltip(event: MouseEvent) {
      positionTooltip(event)
    }

    function positionTooltip(event: MouseEvent) {
      const tooltip = tooltipRef.current
      if (!tooltip) return
      const x = event.clientX + 14
      const y = event.clientY - 10
      const maxX = window.innerWidth - 340
      const maxY = window.innerHeight - tooltip.offsetHeight - 10
      tooltip.style.left = `${Math.min(x, maxX)}px`
      tooltip.style.top = `${Math.min(y, maxY)}px`
    }

    function hideTooltip() {
      const tooltip = tooltipRef.current
      if (tooltip) tooltip.style.display = 'none'
    }
  }, [filteredAuthors, filters, lifespanMap, authorWorksMap, periodsByCorrId, workById, authors, router])

  return (
    <div>
      {/* ── Toolbar ── */}
      <div className="bg-card border border-border rounded-lg p-4 mb-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Language:</span>
          {(['All', 'Greek', 'Latin', 'Other'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setFilters((f) => ({ ...f, language: lang }))}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                filters.language === lang
                  ? 'bg-primary text-white'
                  : 'border border-border hover:bg-primary/5'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1 text-xs">
            <input
              type="checkbox"
              checked={filters.showLifespans}
              onChange={(e) => setFilters((f) => ({ ...f, showLifespans: e.target.checked }))}
            />
            Lifespans
          </label>
          <label className="flex items-center gap-1 text-xs">
            <input
              type="checkbox"
              checked={filters.showComposition}
              onChange={(e) => setFilters((f) => ({ ...f, showComposition: e.target.checked }))}
            />
            Composition
          </label>
          <label className="flex items-center gap-1 text-xs">
            <input
              type="checkbox"
              checked={filters.showCoverage}
              onChange={(e) => setFilters((f) => ({ ...f, showCoverage: e.target.checked }))}
            />
            Coverage
          </label>
        </div>

        <input
          type="text"
          placeholder="Search author..."
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          className="text-xs border border-border rounded-md px-2 py-1 bg-card w-36"
        />
      </div>

      {/* ── Century jump buttons ── */}
      <div className="bg-card border border-border rounded-lg p-3 mb-4">
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs font-medium text-muted mr-1 self-center">Jump to:</span>
          {CENTURIES.map((c) => (
            <button
              key={c.label}
              onClick={() => jumpToCentury(c.range)}
              className="px-2.5 py-1 text-xs rounded border border-border hover:bg-primary hover:text-white hover:border-primary transition-colors"
            >
              {c.label}
            </button>
          ))}
          <button
            onClick={() => setFilters((f) => ({ ...f, yearRange: [-800, 800] }))}
            className="px-2.5 py-1 text-xs rounded border border-border hover:bg-muted/20 transition-colors ml-1"
          >
            Reset
          </button>
        </div>
      </div>

      {/* ── Year range slider ── */}
      <div className="bg-card border border-border rounded-lg p-4 mb-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-foreground w-24">
            {formatYear(filters.yearRange[0])}
          </span>
          <input
            type="range"
            min={-800}
            max={800}
            value={filters.yearRange[0]}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                yearRange: [parseInt(e.target.value), f.yearRange[1]],
              }))
            }
            className="flex-1"
          />
          <input
            type="range"
            min={-800}
            max={800}
            value={filters.yearRange[1]}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                yearRange: [f.yearRange[0], parseInt(e.target.value)],
              }))
            }
            className="flex-1"
          />
          <span className="text-sm font-medium text-foreground w-24 text-right">
            {formatYear(filters.yearRange[1])}
          </span>
        </div>
      </div>

      {/* ── SVG container ── */}
      <div ref={containerRef} className="overflow-x-auto bg-card border border-border rounded-lg">
        <svg ref={svgRef} className="min-w-[800px]" />
      </div>

      {/* ── Tooltip ── */}
      <div
        ref={tooltipRef}
        className="fixed z-50 bg-white border border-border rounded-lg shadow-xl p-4 pointer-events-none"
        style={{ display: 'none', maxWidth: '320px' }}
      />

      {/* ── Legend ── */}
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-xs text-muted items-center">
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
            style={{
              background: `repeating-linear-gradient(${HATCH.angle}deg,
                ${languagePalette.Latin.dark} 0 ${HATCH.stroke}px,
                ${languagePalette.Latin.patternBg} ${HATCH.stroke}px ${HATCH.period}px)`,
            }}
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
    </div>
  )
}

function tipKindLabel(kind: 'lifespan' | 'composition' | 'coverage') {
  const map: Record<typeof kind, PeriodType> = {
    lifespan: 'Author Lifespan',
    composition: 'Work Composition Period',
    coverage: 'Work Coverage Period',
  }
  return periodLabel[map[kind]]
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string
  )
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, '')
}

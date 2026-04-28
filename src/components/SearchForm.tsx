'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ChevronDown,
  ChevronUp,
  Filter,
  Search as SearchIcon,
  X,
} from 'lucide-react'

/**
 * Combined free-text + faceted filter form. The state is persisted in
 * the URL so:
 *   - results are bookmark-able / shareable
 *   - the back button restores the previous search
 *   - the underlying /search page renders SSR-friendly results from
 *     the same params
 *
 * Free-text input is debounced (300 ms) so we don't push a new URL on
 * every keystroke. Filter changes commit immediately.
 */

interface InitialState {
  q: string
  languages: string[]
  sourceTypes: string[]
  yearMin: number | undefined
  yearMax: number | undefined
  hasTmId: boolean
  hasCiris: boolean
  fragmentary: 'yes' | 'no' | undefined
}

interface Props {
  initial: InitialState
  availableSourceTypes: string[]
}

const LANGUAGES = ['Greek', 'Latin', 'Other']

export default function SearchForm({
  initial,
  availableSourceTypes,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [q, setQ] = useState(initial.q)
  const [languages, setLanguages] = useState<string[]>(initial.languages)
  const [sourceTypes, setSourceTypes] = useState<string[]>(initial.sourceTypes)
  const [yearMin, setYearMin] = useState<string>(
    initial.yearMin === undefined ? '' : String(initial.yearMin)
  )
  const [yearMax, setYearMax] = useState<string>(
    initial.yearMax === undefined ? '' : String(initial.yearMax)
  )
  const [hasTmId, setHasTmId] = useState(initial.hasTmId)
  const [hasCiris, setHasCiris] = useState(initial.hasCiris)
  const [fragmentary, setFragmentary] = useState<'any' | 'yes' | 'no'>(
    initial.fragmentary ?? 'any'
  )

  const [filtersOpen, setFiltersOpen] = useState(
    initial.languages.length > 0 ||
      initial.sourceTypes.length > 0 ||
      initial.yearMin !== undefined ||
      initial.yearMax !== undefined ||
      initial.hasTmId ||
      initial.hasCiris ||
      initial.fragmentary !== undefined
  )

  // Build the active URL params and push them.
  const pushParams = useMemo(
    () =>
      (next: Partial<InitialState> & { qOverride?: string }) => {
        const params = new URLSearchParams()
        params.set('mode', 'standard')
        const qVal = next.qOverride ?? q
        if (qVal) params.set('q', qVal)
        const langs = next.languages ?? languages
        if (langs.length) params.set('lang', langs.join(','))
        const sts = next.sourceTypes ?? sourceTypes
        if (sts.length) params.set('source_type', sts.join(','))
        const ymi = next.yearMin ?? (yearMin === '' ? undefined : Number(yearMin))
        const yma = next.yearMax ?? (yearMax === '' ? undefined : Number(yearMax))
        if (ymi !== undefined && Number.isFinite(ymi)) params.set('year_min', String(ymi))
        if (yma !== undefined && Number.isFinite(yma)) params.set('year_max', String(yma))
        const tm = next.hasTmId ?? hasTmId
        if (tm) params.set('has_tm', '1')
        const ci = next.hasCiris ?? hasCiris
        if (ci) params.set('has_ciris', '1')
        const fr = next.fragmentary ?? (fragmentary === 'any' ? undefined : fragmentary)
        if (fr) params.set('frag', fr)
        router.replace(`/search?${params.toString()}`, { scroll: false })
      },
    [q, languages, sourceTypes, yearMin, yearMax, hasTmId, hasCiris, fragmentary, router]
  )

  // Debounce text input
  const debounceRef = useRef<number | null>(null)
  function onQueryChange(next: string) {
    setQ(next)
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => {
      pushParams({ qOverride: next })
    }, 300)
  }

  // Re-sync state if URL changes externally (e.g., browser back).
  useEffect(() => {
    const queryQ = searchParams.get('q') ?? ''
    if (queryQ !== q) setQ(queryQ)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  function toggleLang(lang: string) {
    const next = languages.includes(lang)
      ? languages.filter((l) => l !== lang)
      : [...languages, lang]
    setLanguages(next)
    pushParams({ languages: next })
  }

  function toggleSourceType(t: string) {
    const next = sourceTypes.includes(t) ? sourceTypes.filter((x) => x !== t) : [...sourceTypes, t]
    setSourceTypes(next)
    pushParams({ sourceTypes: next })
  }

  function clearAll() {
    setQ('')
    setLanguages([])
    setSourceTypes([])
    setYearMin('')
    setYearMax('')
    setHasTmId(false)
    setHasCiris(false)
    setFragmentary('any')
    router.replace('/search?mode=standard', { scroll: false })
  }

  const activeFilterCount =
    (languages.length > 0 ? 1 : 0) +
    (sourceTypes.length > 0 ? 1 : 0) +
    (yearMin !== '' || yearMax !== '' ? 1 : 0) +
    (hasTmId ? 1 : 0) +
    (hasCiris ? 1 : 0) +
    (fragmentary !== 'any' ? 1 : 0)

  return (
    <div className="space-y-3">
      {/* ── Free-text query ── */}
      <div className="relative">
        <SearchIcon
          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
          size={18}
        />
        <input
          type="text"
          value={q}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') pushParams({})
          }}
          placeholder="Search authors, works, sources… (e.g. aug, fragments, Bithynia)"
          className="w-full pl-11 pr-24 py-3.5 rounded-lg border border-border bg-card text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          autoFocus
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {q && (
            <button
              onClick={() => onQueryChange('')}
              className="p-1.5 rounded hover:bg-muted/10 text-muted"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ── Filter toggle row ── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
        >
          {filtersOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          <Filter size={14} />
          Advanced filters
          {activeFilterCount > 0 && (
            <span className="bg-primary text-white text-xs font-medium px-2 py-0.5 rounded-full">
              {activeFilterCount} active
            </span>
          )}
        </button>
        {(q || activeFilterCount > 0) && (
          <button
            onClick={clearAll}
            className="text-xs text-muted hover:text-accent underline underline-offset-2"
          >
            Clear all
          </button>
        )}
      </div>

      {/* ── Filter panel ── */}
      {filtersOpen && (
        <div className="bg-card border border-border rounded-lg p-5 grid sm:grid-cols-2 gap-x-6 gap-y-5 text-sm">
          {/* Language */}
          <div>
            <p className="text-xs font-semibold text-foreground mb-2">Language</p>
            <div className="flex flex-wrap gap-1.5">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  onClick={() => toggleLang(lang)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                    languages.includes(lang)
                      ? 'bg-primary text-white border-primary'
                      : 'border-border hover:border-primary/50 text-foreground'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* Year range */}
          <div>
            <p className="text-xs font-semibold text-foreground mb-2">
              Year range
              <span className="font-normal text-muted ml-1">
                (negative = BCE, e.g. -200 to 100)
              </span>
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={yearMin}
                onChange={(e) => setYearMin(e.target.value)}
                onBlur={() =>
                  pushParams({
                    yearMin: yearMin === '' ? undefined : Number(yearMin),
                  })
                }
                placeholder="from"
                className="w-24 px-2 py-1.5 rounded border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
              <span className="text-muted">–</span>
              <input
                type="number"
                value={yearMax}
                onChange={(e) => setYearMax(e.target.value)}
                onBlur={() =>
                  pushParams({
                    yearMax: yearMax === '' ? undefined : Number(yearMax),
                  })
                }
                placeholder="to"
                className="w-24 px-2 py-1.5 rounded border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Fragmentary */}
          <div>
            <p className="text-xs font-semibold text-foreground mb-2">Fragmentary works</p>
            <div className="flex gap-1.5">
              {(['any', 'yes', 'no'] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    setFragmentary(opt)
                    pushParams({ fragmentary: opt === 'any' ? undefined : opt })
                  }}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                    fragmentary === opt
                      ? 'bg-primary text-white border-primary'
                      : 'border-border hover:border-primary/50 text-foreground'
                  }`}
                >
                  {opt === 'any' ? 'Any' : opt === 'yes' ? 'Fragmentary' : 'Complete'}
                </button>
              ))}
            </div>
          </div>

          {/* External identifiers */}
          <div>
            <p className="text-xs font-semibold text-foreground mb-2">External identifiers</p>
            <div className="flex flex-col gap-1.5">
              <label className="inline-flex items-center gap-2 text-xs text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasTmId}
                  onChange={(e) => {
                    setHasTmId(e.target.checked)
                    pushParams({ hasTmId: e.target.checked })
                  }}
                />
                Has Trismegistos ID
              </label>
              <label className="inline-flex items-center gap-2 text-xs text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasCiris}
                  onChange={(e) => {
                    setHasCiris(e.target.checked)
                    pushParams({ hasCiris: e.target.checked })
                  }}
                />
                Has CIRIS link
              </label>
            </div>
          </div>

          {/* Source type */}
          {availableSourceTypes.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-foreground mb-2">Source type</p>
              <div className="flex flex-wrap gap-1.5">
                {availableSourceTypes.map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleSourceType(t)}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                      sourceTypes.includes(t)
                        ? 'bg-primary text-white border-primary'
                        : 'border-border hover:border-primary/50 text-foreground'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

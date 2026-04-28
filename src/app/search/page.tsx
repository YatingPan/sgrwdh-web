import Link from 'next/link'
import { Search as SearchIcon, Sparkles } from 'lucide-react'
import {
  availableCurators,
  availableSourceTypes,
  searchAll,
} from '@/lib/data-store'
import SearchForm from '@/components/SearchForm'
import SearchResults from '@/components/SearchResults'
import SearchChat from '@/components/SearchChat'

/**
 * Unified search page with two modes:
 *
 *  - Standard (default) — free-text query box AND faceted filter panel.
 *    Matches across authors, works and sources. URL-driven so users can
 *    bookmark / share specific searches.
 *
 *  - Ask AI — natural-language conversational interface. Uses the same
 *    keyword search for retrieval and DeepSeek (when an API key is
 *    configured) to compose a sourced narrative answer.
 */

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

function readArrayParam(value: string | string[] | undefined): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value.flatMap((v) => v.split(',')).map((s) => s.trim()).filter(Boolean)
  return value.split(',').map((s) => s.trim()).filter(Boolean)
}

function readNumberParam(value: string | string[] | undefined): number | undefined {
  if (!value || Array.isArray(value)) return undefined
  const n = parseInt(value, 10)
  return Number.isFinite(n) ? n : undefined
}

export default async function SearchPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const mode = sp.mode === 'ai' ? 'ai' : 'standard'

  const initialState = {
    q: typeof sp.q === 'string' ? sp.q : '',
    languages: readArrayParam(sp.lang),
    curators: readArrayParam(sp.curator),
    sourceTypes: readArrayParam(sp.source_type),
    yearMin: readNumberParam(sp.year_min),
    yearMax: readNumberParam(sp.year_max),
    hasTmId: sp.has_tm === '1',
    hasCiris: sp.has_ciris === '1',
    fragmentary:
      sp.frag === 'yes' || sp.frag === 'no'
        ? (sp.frag as 'yes' | 'no')
        : undefined,
  }

  // For Standard mode, run the search server-side so the result list is
  // SSR'd (good for indexing + works without JS).
  const standardResults =
    mode === 'standard'
      ? searchAll({
          q: initialState.q,
          languages: initialState.languages,
          curators: initialState.curators,
          sourceTypes: initialState.sourceTypes,
          yearMin: initialState.yearMin,
          yearMax: initialState.yearMax,
          hasTmId: initialState.hasTmId,
          hasCiris: initialState.hasCiris,
          fragmentary: initialState.fragmentary,
        })
      : null

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4 mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary font-serif">Search</h1>
        <ModeToggle mode={mode} q={initialState.q} />
      </div>

      {mode === 'standard' && (
        <>
          <SearchForm
            initial={initialState}
            availableCurators={availableCurators}
            availableSourceTypes={availableSourceTypes}
          />
          {standardResults && (
            <div className="mt-6">
              <SearchResults results={standardResults} />
            </div>
          )}
        </>
      )}

      {mode === 'ai' && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-primary/5">
            <p className="text-sm text-foreground/80 leading-relaxed">
              Ask a question in plain language — for example,{' '}
              <em>"Which Latin authors lived in the 1st century BCE?"</em> The
              system will search the database and compose a sourced answer.
            </p>
          </div>
          <SearchChat initialQuery={initialState.q} />
        </div>
      )}
    </div>
  )
}

function ModeToggle({ mode, q }: { mode: 'standard' | 'ai'; q: string }) {
  const qParam = q ? `&q=${encodeURIComponent(q)}` : ''
  return (
    <div className="inline-flex bg-card border border-border rounded-full p-1 text-sm shadow-sm">
      <Link
        href={`/search?mode=standard${qParam}`}
        className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full transition-colors ${
          mode === 'standard'
            ? 'bg-primary text-white shadow'
            : 'text-muted hover:text-foreground'
        }`}
      >
        <SearchIcon size={14} />
        Standard
      </Link>
      <Link
        href={`/search?mode=ai${qParam}`}
        className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full transition-colors ${
          mode === 'ai'
            ? 'bg-accent text-white shadow'
            : 'text-muted hover:text-foreground'
        }`}
      >
        <Sparkles size={14} />
        Ask AI
      </Link>
    </div>
  )
}

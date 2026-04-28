export const revalidate = 3600

import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getAuthorById,
  getWorksByAuthorId,
  getPeriodsByCorrespondingId,
  getSourcesByCorrespondingId,
  getSourcesByCorrespondingIds,
} from '@/lib/data-store'
import { renderDbMarkup, formatYear, stripHtml } from '@/lib/utils'
import ExternalLinks from '@/components/ExternalLinks'
import EntityTimeline, { EntityTimelineRow } from '@/components/EntityTimeline'
import { asLanguage } from '@/lib/timeline-style'
import SourceList from '@/components/SourceList'
import CopyButton from '@/components/CopyButton'
import CiteButton from '@/components/CiteButton'
import { ChevronRight, BookOpen, Library } from 'lucide-react'

export default async function AuthorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const author = getAuthorById(id)
  if (!author) notFound()

  const a = author

  const typedWorks = getWorksByAuthorId(id)
  const authorPeriods = getPeriodsByCorrespondingId(id)
  const authorSources = getSourcesByCorrespondingId(id)

  const workIds = typedWorks.map((w) => w.id)
  const workSources = getSourcesByCorrespondingIds(workIds)

  // Build per-work period buckets so the timeline can show one row per work
  const workPeriodsByWorkId: Record<string, typeof authorPeriods> = {}
  for (const w of typedWorks) {
    workPeriodsByWorkId[w.id] = getPeriodsByCorrespondingId(w.id)
  }

  const allSources = [...authorSources, ...workSources]

  // Compute lifespan string from periods
  const lifespan = authorPeriods.find((p) => p.period_type === 'Author Lifespan')
  const lifespanStr = lifespan
    ? `c. ${formatYear(lifespan.start_year_earliest ?? lifespan.start_year_latest)}–${formatYear(lifespan.end_year_latest ?? lifespan.end_year_earliest)}`
    : null

  const fragmentaryCount = typedWorks.filter((w) => w.is_fragmentary).length

  // Build EntityTimeline rows: one for the author + one per work
  const lang = asLanguage(a.language)
  const timelineRows: EntityTimelineRow[] = []
  if (authorPeriods.length > 0) {
    timelineRows.push({
      label: a.author_name,
      language: lang,
      periods: authorPeriods.filter((p) => p.period_type === 'Author Lifespan'),
    })
  }
  for (const work of typedWorks) {
    const wp = workPeriodsByWorkId[work.id] || []
    if (wp.length > 0) {
      timelineRows.push({
        label: work.work_title,
        href: `/works/${work.id}`,
        language: lang,
        periods: wp,
      })
    }
  }

  // Source type counts
  const sourceTypeCounts: Record<string, number> = {}
  allSources.forEach((s) => {
    sourceTypeCounts[s.source_type] = (sourceTypeCounts[s.source_type] || 0) + 1
  })

  const bgColor = a.language === 'Greek' ? 'bg-greek' : a.language === 'Latin' ? 'bg-latin' : 'bg-muted'
  const initials = a.author_name.charAt(0).toUpperCase()
  const stableUri = `${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'https://sgrwdh.org' : ''}/authors/${a.id}`

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted mb-6">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight size={14} />
        <Link href="/authors" className="hover:text-foreground">Authors</Link>
        <ChevronRight size={14} />
        <span className="text-foreground">{a.author_name}</span>
      </nav>

      {/* ─── Top Info Card ─── */}
      <div className="bg-card rounded-lg border border-border p-6 shadow-sm mb-8">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div
            className={`w-20 h-20 rounded-full ${bgColor} flex items-center justify-center shrink-0`}
          >
            <span className="text-white text-3xl font-serif font-bold">{initials}</span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-primary font-serif leading-tight">
                  {a.author_name}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono bg-background text-muted px-2 py-0.5 rounded border border-border">
                    {a.id}
                  </span>
                  {a.language && (
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        a.language === 'Greek'
                          ? 'bg-greek/10 text-greek'
                          : a.language === 'Latin'
                            ? 'bg-latin/10 text-latin'
                            : 'bg-muted/10 text-muted'
                      }`}
                    >
                      {a.language}
                    </span>
                  )}
                  {lifespanStr && (
                    <span className="text-sm text-muted">{lifespanStr}</span>
                  )}
                </div>

                {/* Metadata line */}
                <div className="mt-2 text-sm text-muted flex flex-wrap items-center gap-2">
                  {a.language && <span>{a.language}</span>}
                </div>
              </div>
            </div>

            {/* Divider */}
            <hr className="my-4 border-border" />

            {/* External links row */}
            <div className="flex flex-wrap items-center gap-3">
              <ExternalLinks tmUri={a.tm_uri} tmId={a.tm_id} cirisUrl={a.ciris_url} />
            </div>

            {/* Stable URI */}
            <div className="mt-3 flex items-center gap-2 text-sm text-muted">
              <span className="font-mono text-xs truncate">{stableUri}</span>
              <CopyButton text={stableUri} />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Biography ─── */}
      {a.life && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-primary font-serif mb-4">Biography</h2>
          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div
              className="text-foreground leading-[1.8] font-serif text-lg"
              dangerouslySetInnerHTML={{ __html: renderDbMarkup(a.life) }}
            />
          </div>
        </section>
      )}

      {/* ─── Inline Timeline ─── */}
      {timelineRows.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-primary font-serif mb-4">Timeline</h2>
          <EntityTimeline rows={timelineRows} />
        </section>
      )}

      {/* ─── Two-column: Works + Sources ─── */}
      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Left: Works */}
        <section>
          <h2 className="text-2xl font-bold text-primary font-serif mb-4 flex items-center gap-2">
            <BookOpen size={20} />
            Works
          </h2>
          {typedWorks.length > 0 ? (
            <div className="space-y-3">
              {typedWorks.map((work) => (
                <Link
                  key={work.id}
                  href={`/works/${work.id}`}
                  className="block bg-card rounded-lg border border-border p-4 hover:shadow-md hover:border-primary/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3
                      className="font-serif text-base font-bold text-primary"
                      dangerouslySetInnerHTML={{ __html: renderDbMarkup(work.work_title) }}
                    />
                    <div className="flex gap-1.5 shrink-0">
                      {work.is_fragmentary && (
                        <span className="text-[11px] bg-muted/10 text-muted px-2 py-0.5 rounded-full">
                          Fragmentary
                        </span>
                      )}
                    </div>
                  </div>
                  {work.synopsis && (
                    <p className="mt-1.5 text-sm text-foreground/70 leading-relaxed">
                      {stripHtml(work.synopsis).slice(0, 100)}
                      {work.synopsis.length > 100 ? '...' : ''}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-muted text-sm">No works recorded.</p>
          )}
        </section>

        {/* Right: Sources */}
        <section>
          {allSources.length > 0 ? (
            <SourceList sources={allSources} />
          ) : (
            <>
              <h2 className="text-2xl font-bold text-primary font-serif mb-4 flex items-center gap-2">
                <Library size={20} />
                Sources
              </h2>
              <p className="text-muted text-sm">No sources recorded.</p>
            </>
          )}
        </section>
      </div>

      {/* ─── Bottom Stats ─── */}
      <section>
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Works count */}
          <div className="bg-card rounded-lg border border-border p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <BookOpen size={16} className="text-primary" />
              <span className="text-sm font-semibold text-primary">Works</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{typedWorks.length}</p>
            {typedWorks.length > 0 && (
              <p className="text-xs text-muted mt-1">
                {fragmentaryCount} fragmentary, {typedWorks.length - fragmentaryCount} complete
              </p>
            )}
          </div>

          {/* Sources count */}
          <div className="bg-card rounded-lg border border-border p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Library size={16} className="text-primary" />
              <span className="text-sm font-semibold text-primary">Sources</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{allSources.length}</p>
            {allSources.length > 0 && (
              <p className="text-xs text-muted mt-1">
                {Object.entries(sourceTypeCounts).map(([type, count]) => (
                  <span key={type}>{count} {type.toLowerCase()}{count > 1 ? 's' : ''} </span>
                ))}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ─── Cite ─── */}
      <div className="mt-8 pt-6 border-t border-border flex justify-center">
        <CiteButton name={a.author_name} path={`/authors/${a.id}`} />
      </div>
    </div>
  )
}

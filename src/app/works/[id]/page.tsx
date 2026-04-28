export const revalidate = 3600

import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getWorkById,
  getPartsByWorkId,
  getPeriodsByCorrespondingId,
  getSourcesByCorrespondingId,
  getAuthorById,
} from '@/lib/data-store'
import { Work } from '@/lib/types'
import { renderDbMarkup, stripHtml } from '@/lib/utils'
import ExternalLinks from '@/components/ExternalLinks'
import EntityTimeline, { EntityTimelineRow } from '@/components/EntityTimeline'
import { asLanguage } from '@/lib/timeline-style'
import SourceList from '@/components/SourceList'
import CiteButton from '@/components/CiteButton'
import CollapsiblePart from '@/components/CollapsiblePart'
import QuotedCitation from '@/components/QuotedCitation'
import { ChevronRight, BookOpen, ScrollText } from 'lucide-react'

export default async function WorkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const work = getWorkById(id)
  if (!work) notFound()

  const w = work as Work & { authors?: { author_name: string; language?: string } }

  const typedParts = getPartsByWorkId(id)
  const typedPeriods = getPeriodsByCorrespondingId(id)
  const typedSources = getSourcesByCorrespondingId(id)

  // Pull the author's lifespan so the timeline can show this work in
  // its biographical context.
  const author = w.author_id ? getAuthorById(w.author_id) : null
  const authorLifespan = w.author_id
    ? getPeriodsByCorrespondingId(w.author_id).filter(
        (p) => p.period_type === 'Author Lifespan'
      )
    : []

  const lang = asLanguage(author?.language)
  const timelineRows: EntityTimelineRow[] = []
  if (author && authorLifespan.length > 0) {
    timelineRows.push({
      label: author.author_name,
      href: `/authors/${author.id}`,
      language: lang,
      periods: authorLifespan,
    })
  }
  if (typedPeriods.length > 0) {
    timelineRows.push({
      label: w.work_title,
      language: lang,
      periods: typedPeriods,
    })
  }

  // Parse quoting information into list items (split by semicolons)
  const quotingItems = w.quoting_information
    ? w.quoting_information.split(/;\s*/).filter(Boolean)
    : []

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted mb-6">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight size={14} />
        <Link href="/works" className="hover:text-foreground">Works</Link>
        <ChevronRight size={14} />
        <span className="text-foreground" dangerouslySetInnerHTML={{ __html: renderDbMarkup(w.work_title) }} />
      </nav>

      {/* ─── Top Info Card ─── */}
      <div className="bg-card rounded-lg border border-border p-6 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1
              className="text-3xl sm:text-4xl font-bold text-primary font-serif leading-tight"
              dangerouslySetInnerHTML={{ __html: renderDbMarkup(w.work_title) }}
            />

            {w.authors?.author_name && (
              <p className="mt-2 text-lg text-muted">
                by{' '}
                {w.author_id ? (
                  <Link
                    href={`/authors/${w.author_id}`}
                    className="text-primary hover:text-accent font-medium transition-colors"
                  >
                    {w.authors.author_name}
                  </Link>
                ) : (
                  <span
                    className="text-foreground font-medium"
                    title="This author is not catalogued as an Author entry in the database."
                  >
                    {w.authors.author_name}
                  </span>
                )}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono bg-background text-muted px-2 py-0.5 rounded border border-border">
                {w.id}
              </span>
              {w.is_fragmentary && (
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full border border-dashed border-latin/50 text-latin bg-latin/5">
                  Fragmentary
                </span>
              )}
            </div>

            {/* Divider */}
            <hr className="my-4 border-border" />

            {/* External links */}
            <ExternalLinks tmUri={w.tm_uri} tmId={w.tm_id} cirisUrl={w.ciris_url} />
          </div>
        </div>
      </div>

      {/* ─── Synopsis ─── */}
      {w.synopsis && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-primary font-serif mb-4 flex items-center gap-2">
            <BookOpen size={20} />
            Synopsis
          </h2>
          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div
              className="text-foreground leading-[1.8] font-serif text-lg"
              dangerouslySetInnerHTML={{ __html: renderDbMarkup(w.synopsis) }}
            />
          </div>
        </section>
      )}

      {/* ─── Quoting Information ─── */}
      {quotingItems.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-primary font-serif mb-4 flex items-center gap-2">
            <ScrollText size={20} />
            Quoted In
          </h2>
          <p className="text-xs text-muted mb-3">
            Standard scholarly abbreviations (Oxford Classical Dictionary
            convention). Hover-readable expansions follow each entry where
            available.
          </p>
          <ul className="space-y-2">
            {quotingItems.map((item, i) => (
              <li key={i} className="pl-4 border-l-2 border-accent">
                <QuotedCitation raw={item} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ─── Timeline ─── */}
      {timelineRows.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-primary font-serif mb-4">Timeline</h2>
          <EntityTimeline rows={timelineRows} />
        </section>
      )}

      {/* ─── Parts of this Work ─── */}
      {typedParts.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-primary font-serif mb-4">
            Parts of this Work
            <span className="ml-2 text-sm font-normal text-muted">({typedParts.length})</span>
          </h2>
          <div className="space-y-2">
            {typedParts.map((part) => (
              <CollapsiblePart
                key={part.id}
                id={part.id}
                title={part.work_title}
                synopsis={part.synopsis}
                quotingInfo={part.quoting_information}
              />
            ))}
          </div>
        </section>
      )}

      {/* ─── Sources ─── */}
      {typedSources.length > 0 && (
        <section className="mb-8">
          <SourceList sources={typedSources} />
        </section>
      )}

      {/* ─── Cite ─── */}
      <div className="mt-8 pt-6 border-t border-border flex justify-center">
        <CiteButton name={stripHtml(w.work_title)} path={`/works/${w.id}`} />
      </div>
    </div>
  )
}

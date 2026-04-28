import Link from 'next/link'
import { dataAnomalies, getAuthorById, getWorkById } from '@/lib/data-store'
import { stripHtml } from '@/lib/utils'

/**
 * Data quality dashboard. Lists anomalies detected in the source files
 * (xlsx + accdb under /human_lemma) without rewriting them — the
 * principle is to stay faithful to what the human curators recorded
 * and to surface problems for them to fix at the source.
 */

const KIND_LABELS: Record<string, { label: string; blurb: string }> = {
  'work-author-not-in-db': {
    label: 'Work has no matching Author entry',
    blurb:
      "The work title references a classical author who is not present in the Authors table. We render the work without an Author link — the author's name is shown as plain text.",
  },
  'composition-equals-lifespan': {
    label: 'Composition period equals author lifespan',
    blurb:
      "The work's composition span matches the author's full lifespan, which is implausible (an author cannot be writing from birth). Likely the lifespan dates were copied into the composition fields.",
  },
  'composition-outside-lifespan': {
    label: 'Composition lies outside the author lifespan',
    blurb:
      'The work was supposedly composed before the author was born or many years after their death. Either the lifespan or the composition dates need correcting.',
  },
  'work-without-author-link': {
    label: 'Work is unlinked',
    blurb: 'No author could be inferred from the work title.',
  },
}

export default function DataQualityPage() {
  // Group anomalies by kind for a digestible view
  const grouped = dataAnomalies.reduce<Record<string, typeof dataAnomalies>>(
    (acc, a) => {
      ;(acc[a.kind] ||= []).push(a)
      return acc
    },
    {}
  )

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-2 font-serif">
        Data Quality Report
      </h1>
      <p className="text-muted mb-8 leading-relaxed max-w-3xl">
        SGRWDH visualises the source data faithfully — when a record looks
        wrong we flag it here rather than silently fixing it. Each entry
        below points back to the source file (Qiao Zixin / Jin Ziyan /
        Jolenta Wong) so the curator can decide whether to correct it.
      </p>

      {dataAnomalies.length === 0 && (
        <div className="bg-card border border-border rounded-lg p-6 text-center text-muted">
          No anomalies detected.
        </div>
      )}

      {Object.entries(grouped).map(([kind, items]) => {
        const meta = KIND_LABELS[kind] ?? { label: kind, blurb: '' }
        return (
          <section key={kind} className="mb-10">
            <h2 className="text-xl font-bold text-primary font-serif mb-1">
              {meta.label}{' '}
              <span className="text-muted text-base font-normal">({items.length})</span>
            </h2>
            {meta.blurb && (
              <p className="text-sm text-muted mb-4 leading-relaxed max-w-3xl">{meta.blurb}</p>
            )}
            <ul className="space-y-2">
              {items.map((it, i) => (
                <li
                  key={i}
                  className="bg-card border border-border rounded-md p-3 text-sm flex flex-col sm:flex-row sm:items-start gap-2"
                >
                  <div className="flex-1 leading-relaxed">{it.message}</div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    {it.workId && <RecordChip kind="work" id={it.workId} />}
                    {it.authorId && <RecordChip kind="author" id={it.authorId} />}
                    {it.workId && <CuratorChip workId={it.workId} />}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

function RecordChip({ kind, id }: { kind: 'work' | 'author'; id: string }) {
  const href = kind === 'work' ? `/works/${id}` : `/authors/${id}`
  const label = stripHtml(
    kind === 'work'
      ? getWorkById(id)?.work_title || id
      : getAuthorById(id)?.author_name || id
  )
  const truncated = label.length > 40 ? label.slice(0, 37) + '…' : label
  return (
    <Link
      href={href}
      className="text-xs font-mono px-2 py-0.5 rounded border border-border bg-background text-accent hover:text-primary hover:border-primary/30 transition-colors"
      title={label}
    >
      {id} · {truncated}
    </Link>
  )
}

function CuratorChip({ workId }: { workId: string }) {
  const work = getWorkById(workId)
  if (!work?.creator) return null
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-muted/10 text-muted border border-border">
      curator: {work.creator}
    </span>
  )
}

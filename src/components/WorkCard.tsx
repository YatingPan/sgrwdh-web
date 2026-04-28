import Link from 'next/link'
import { Work } from '@/lib/types'
import { renderDbMarkup, stripHtml, truncate } from '@/lib/utils'

interface WorkCardProps {
  work: Work
}

export default function WorkCard({ work }: WorkCardProps) {
  return (
    <Link
      href={`/works/${work.id}`}
      className="block bg-card rounded-lg border border-border p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group"
    >
      <div className="flex items-start justify-between gap-2">
        <h3
          className="text-lg font-bold text-primary group-hover:text-accent transition-colors font-serif leading-tight"
          dangerouslySetInnerHTML={{ __html: renderDbMarkup(work.work_title) }}
        />
        <div className="flex gap-1.5 shrink-0">
          {work.is_fragmentary && (
            <span className="text-xs bg-muted/10 text-muted px-2 py-0.5 rounded-full">
              Fragmentary
            </span>
          )}
        </div>
      </div>

      {work.authors?.author_name && (
        <p className="mt-1 text-sm text-muted">
          by {work.authors.author_name}
        </p>
      )}

      <p className="mt-2 text-sm text-foreground/80 leading-relaxed">
        {truncate(stripHtml(work.synopsis || ''), 100)}
      </p>

      <span className="mt-2 inline-block text-xs font-mono bg-background text-muted px-1.5 py-0.5 rounded">
        {work.id}
      </span>
    </Link>
  )
}

import Link from 'next/link'
import { Author, Period } from '@/lib/types'
import { formatYear, truncate, stripHtml } from '@/lib/utils'
import { ExternalLink } from 'lucide-react'

interface AuthorCardProps {
  author: Author
  period?: Period
}

export default function AuthorCard({ author, period }: AuthorCardProps) {
  const dateRange = period
    ? `${formatYear(period.start_year_earliest ?? period.start_year_latest)} – ${formatYear(period.end_year_latest ?? period.end_year_earliest)}`
    : null

  const hasTm = author.tm_uri || author.tm_id
  const hasCiris = author.ciris_url

  return (
    <Link
      href={`/authors/${author.id}`}
      className="block bg-card rounded-lg border border-border p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-bold text-primary group-hover:text-accent transition-colors font-serif leading-tight">
          {author.author_name}
        </h3>
        <span
          className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
            author.language === 'Greek'
              ? 'bg-greek/10 text-greek'
              : author.language === 'Latin'
                ? 'bg-latin/10 text-latin'
                : 'bg-muted/10 text-muted'
          }`}
        >
          {author.language || 'Unknown'}
        </span>
      </div>

      {dateRange && (
        <p className="mt-1 text-sm text-muted">{dateRange}</p>
      )}

      <p className="mt-2 text-sm text-foreground/80 leading-relaxed">
        {truncate(stripHtml(author.life || ''), 80)}
      </p>

      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs font-mono bg-background text-muted px-1.5 py-0.5 rounded">
          {author.id}
        </span>
        {hasTm && (
          <span className="inline-flex items-center gap-1 text-xs text-muted">
            TM <ExternalLink size={10} />
          </span>
        )}
        {hasCiris && (
          <span className="inline-flex items-center gap-1 text-xs text-muted">
            CIRIS <ExternalLink size={10} />
          </span>
        )}
      </div>
    </Link>
  )
}

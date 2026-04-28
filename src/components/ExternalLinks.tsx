import { ExternalLink } from 'lucide-react'

interface ExternalLinksProps {
  tmUri?: string | null
  tmId?: string | null
  cirisUrl?: string | null
  size?: 'sm' | 'md'
}

export default function ExternalLinks({ tmUri, tmId, cirisUrl, size = 'md' }: ExternalLinksProps) {
  const hasTm = tmUri || tmId
  const hasCiris = cirisUrl
  if (!hasTm && !hasCiris) return null

  const btnClass =
    size === 'sm'
      ? 'inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-border hover:bg-primary/5 transition-colors text-muted hover:text-foreground'
      : 'inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border border-border hover:bg-primary/5 transition-colors text-muted hover:text-foreground'

  const tmHref = tmUri
    ? (tmUri.startsWith('http') ? tmUri : `https://${tmUri}`)
    : `https://www.trismegistos.org/author/${tmId}`

  return (
    <div className="flex flex-wrap gap-2">
      {hasTm && (
        <a href={tmHref} target="_blank" rel="noopener noreferrer" className={btnClass}>
          TM <ExternalLink size={size === 'sm' ? 10 : 12} />
        </a>
      )}
      {hasCiris && (
        <a
          href={cirisUrl.startsWith('http') ? cirisUrl : `https://${cirisUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className={btnClass}
        >
          CIRIS <ExternalLink size={size === 'sm' ? 10 : 12} />
        </a>
      )}
    </div>
  )
}

import { expandCitation } from '@/lib/classical-abbreviations'
import { renderDbMarkup } from '@/lib/utils'

/**
 * Render a single Quoted-In abbreviation with its expansion. The
 * abbreviation stays as the headline (so scholars can scan the list),
 * and the expansion sits underneath in muted type. If the
 * abbreviation isn't in our lookup table we just show the original.
 */
export default function QuotedCitation({ raw }: { raw: string }) {
  const expanded = expandCitation(raw)
  return (
    <div className="leading-relaxed">
      <div
        className="text-foreground"
        dangerouslySetInnerHTML={{ __html: renderDbMarkup(raw) }}
      />
      {expanded && (
        <div className="text-xs text-muted mt-0.5 italic">{expanded.display}</div>
      )}
    </div>
  )
}

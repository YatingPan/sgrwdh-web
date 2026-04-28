import { Source } from '@/lib/types'
import { renderDbMarkup } from '@/lib/utils'
import { ExternalLink } from 'lucide-react'

interface SourceListProps {
  sources: Source[]
}

const groupOrder = ['Edition', 'Commentary', 'Bibliography', 'Original Text + Translation', 'Translation']
const groupLabels: Record<string, string> = {
  'Edition': 'Editions',
  'Commentary': 'Commentaries',
  'Bibliography': 'Bibliographies',
  'Original Text + Translation': 'Texts & Translations',
  'Translation': 'Translations',
}

export default function SourceList({ sources }: SourceListProps) {
  if (!sources.length) return null

  const grouped = groupOrder.reduce<Record<string, Source[]>>((acc, type) => {
    const items = sources.filter((s) => s.source_type === type)
    if (items.length) acc[type] = items
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-primary font-serif">Sources</h2>
      {Object.entries(grouped).map(([type, items]) => (
        <div key={type}>
          <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-2">
            {groupLabels[type] || type}
          </h3>
          <ul className="space-y-2">
            {items.map((source) => (
              <li
                key={source.id}
                className="text-sm text-foreground leading-relaxed pl-4 border-l-2 border-border"
              >
                {source.source_information ? (
                  <span dangerouslySetInnerHTML={{ __html: renderDbMarkup(source.source_information) }} />
                ) : null}
                {source.free_internet_resource_url && (
                  <a
                    href={source.free_internet_resource_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 ml-2 text-accent hover:underline"
                  >
                    <ExternalLink size={12} />
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

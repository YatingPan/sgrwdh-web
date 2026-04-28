import Link from 'next/link'
import { Library, BookOpen, Users } from 'lucide-react'
import type { SearchResults as Results } from '@/lib/data-store'
import { renderDbMarkup, stripHtml } from '@/lib/utils'

/**
 * Renders the grouped results of a search across authors, works and
 * sources. Server component; takes a `SearchResults` payload as input.
 */
export default function SearchResults({ results }: { results: Results }) {
  const { authors, works, sources, totals, query } = results
  const grandTotal = totals.authors + totals.works + totals.sources

  if (grandTotal === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-10 text-center text-muted">
        <p className="font-medium">
          {query
            ? `No matches for "${query}".`
            : 'Set a query or pick filters to see results.'}
        </p>
        <p className="text-xs mt-2">
          Try a shorter form (e.g. <code>aug</code>), or remove some filters.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Found <strong className="text-foreground">{grandTotal}</strong> match
        {grandTotal === 1 ? '' : 'es'}
        {query ? (
          <>
            {' '}for <strong className="text-foreground">"{query}"</strong>
          </>
        ) : null}
        .
      </p>

      {authors.length > 0 && (
        <Group icon={<Users size={18} />} label="Authors" total={totals.authors}>
          {authors.map((hit) => (
            <Link
              key={hit.item.id}
              href={`/authors/${hit.item.id}`}
              className="block bg-card border border-border rounded-lg p-4 hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-serif font-bold text-primary text-lg leading-snug">
                    {hit.item.author_name}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="font-mono bg-background text-muted px-1.5 py-0.5 rounded border border-border">
                      {hit.item.id}
                    </span>
                    {hit.item.language && (
                      <span
                        className={`px-1.5 py-0.5 rounded-full font-medium ${
                          hit.item.language === 'Greek'
                            ? 'bg-greek/10 text-greek'
                            : hit.item.language === 'Latin'
                              ? 'bg-latin/10 text-latin'
                              : 'bg-muted/10 text-muted'
                        }`}
                      >
                        {hit.item.language}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {hit.snippets[0] && (
                <p className="mt-2 text-sm text-foreground/75 leading-relaxed">
                  <span className="text-[10px] uppercase tracking-wider text-muted mr-1.5">
                    {hit.snippets[0].field}
                  </span>
                  {hit.snippets[0].text}
                </p>
              )}
            </Link>
          ))}
        </Group>
      )}

      {works.length > 0 && (
        <Group icon={<BookOpen size={18} />} label="Works" total={totals.works}>
          {works.map((hit) => (
            <Link
              key={hit.item.id}
              href={`/works/${hit.item.id}`}
              className="block bg-card border border-border rounded-lg p-4 hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <h3
                className="font-serif font-bold text-primary text-base leading-snug"
                dangerouslySetInnerHTML={{ __html: renderDbMarkup(hit.item.work_title) }}
              />
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="font-mono bg-background text-muted px-1.5 py-0.5 rounded border border-border">
                  {hit.item.id}
                </span>
                {hit.item.authors?.author_name && (
                  <span className="text-muted">
                    by {hit.item.authors.author_name}
                  </span>
                )}
                {hit.item.is_fragmentary && (
                  <span className="px-1.5 py-0.5 rounded-full bg-muted/10 text-muted">
                    Fragmentary
                  </span>
                )}
              </div>
              {hit.snippets[0] && (
                <p className="mt-2 text-sm text-foreground/75 leading-relaxed">
                  <span className="text-[10px] uppercase tracking-wider text-muted mr-1.5">
                    {hit.snippets[0].field}
                  </span>
                  {hit.snippets[0].text}
                </p>
              )}
            </Link>
          ))}
        </Group>
      )}

      {sources.length > 0 && (
        <Group icon={<Library size={18} />} label="Sources" total={totals.sources}>
          {sources.map((hit) => {
            const corrId = hit.item.corresponding_id
            const linkHref = corrId.startsWith('A')
              ? `/authors/${corrId}`
              : corrId.startsWith('W')
                ? `/works/${corrId}`
                : null
            return (
              <div
                key={hit.item.id}
                className="bg-card border border-border rounded-lg p-4"
              >
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <span className="text-xs font-medium text-accent">
                    {hit.item.source_type}
                  </span>
                  {linkHref && (
                    <Link
                      href={linkHref}
                      className="text-xs text-muted hover:text-accent underline"
                    >
                      {corrId}
                      {hit.item.entity && (
                        <>
                          {' · '}
                          {stripHtml(
                            (hit.item.entity as { author_name?: string; work_title?: string })
                              .author_name ??
                              (hit.item.entity as { author_name?: string; work_title?: string })
                                .work_title ??
                              ''
                          )}
                        </>
                      )}
                    </Link>
                  )}
                </div>
                <p
                  className="mt-1.5 text-sm text-foreground/85 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: renderDbMarkup(hit.item.source_information || ''),
                  }}
                />
                {hit.item.free_internet_resource_url && (
                  <a
                    href={hit.item.free_internet_resource_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-block text-xs text-accent hover:underline break-all"
                  >
                    {hit.item.free_internet_resource_url}
                  </a>
                )}
              </div>
            )
          })}
        </Group>
      )}
    </div>
  )
}

function Group({
  icon,
  label,
  total,
  children,
}: {
  icon: React.ReactNode
  label: string
  total: number
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-primary">{icon}</span>
        <h2 className="text-lg font-serif font-bold text-primary">{label}</h2>
        <span className="text-xs text-muted">({total})</span>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">{children}</div>
    </section>
  )
}

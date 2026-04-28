import { Period } from '@/lib/types'
import {
  getPeriodsByCorrespondingIds,
  searchAuthors,
} from '@/lib/data-store'
import AuthorCard from '@/components/AuthorCard'
import AuthorsFilter from './AuthorsFilter'

export default async function AuthorsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const language = (params.language as string) || 'all'
  const search = (params.q as string) || ''
  const page = parseInt((params.page as string) || '1', 10)
  const perPage = 24

  const { authors, total } = searchAuthors({
    language,
    query: search,
    page,
    perPage,
  })

  const lifespans = getPeriodsByCorrespondingIds(authors.map((a) => a.id)).filter(
    (p) => p.period_type === 'Author Lifespan'
  )
  const periodMap = lifespans.reduce<Record<string, Period>>((acc, p) => {
    acc[p.corresponding_id] = p
    return acc
  }, {})

  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-8 font-serif">Authors</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filter sidebar */}
        <div className="lg:w-64 shrink-0">
          <AuthorsFilter currentLanguage={language} currentSearch={search} />
        </div>

        {/* Cards grid */}
        <div className="flex-1">
          {authors.length > 0 ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {authors.map((author) => (
                <AuthorCard
                  key={author.id}
                  author={author}
                  period={periodMap[author.id]}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted">
              No authors found matching your criteria.
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <a
                  key={p}
                  href={`/authors?page=${p}${language !== 'all' ? `&language=${language}` : ''}${search ? `&q=${search}` : ''}`}
                  className={`px-3 py-1.5 rounded-md text-sm ${
                    p === page
                      ? 'bg-primary text-white'
                      : 'border border-border hover:bg-primary/5'
                  }`}
                >
                  {p}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

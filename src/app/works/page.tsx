import { searchWorks } from '@/lib/data-store'
import WorkCard from '@/components/WorkCard'
import WorksFilter from './WorksFilter'

export default async function WorksPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const fragmentaryRaw = (params.fragmentary as string) || 'all'
  const fragmentary = (['yes', 'no', 'all'].includes(fragmentaryRaw)
    ? fragmentaryRaw
    : 'all') as 'yes' | 'no' | 'all'
  const search = (params.q as string) || ''
  const page = parseInt((params.page as string) || '1', 10)
  const perPage = 24

  const { works, total } = searchWorks({
    fragmentary,
    query: search,
    page,
    perPage,
  })

  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-8 font-serif">Works</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-64 shrink-0">
          <WorksFilter currentFragmentary={fragmentaryRaw} currentSearch={search} />
        </div>

        <div className="flex-1">
          {works.length > 0 ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {works.map((work) => (
                <WorkCard key={work.id} work={work} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted">
              No works found matching your criteria.
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <a
                  key={p}
                  href={`/works?page=${p}${fragmentaryRaw !== 'all' ? `&fragmentary=${fragmentaryRaw}` : ''}${search ? `&q=${search}` : ''}`}
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

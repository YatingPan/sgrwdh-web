export default function WorksLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="h-10 w-36 bg-border/50 rounded animate-pulse mb-2" />
      <div className="h-5 w-56 bg-border/30 rounded animate-pulse mb-8" />

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-64 shrink-0 space-y-4">
          <div className="h-10 bg-border/30 rounded animate-pulse" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 bg-border/20 rounded animate-pulse" />
            ))}
          </div>
        </div>

        <div className="flex-1 grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card rounded-lg border border-border p-5">
              <div className="flex justify-between">
                <div className="h-6 w-28 bg-border/40 rounded animate-pulse" />
                <div className="h-5 w-20 bg-border/30 rounded-full animate-pulse" />
              </div>
              <div className="h-4 w-20 bg-border/20 rounded animate-pulse mt-2" />
              <div className="space-y-2 mt-3">
                <div className="h-3 bg-border/20 rounded animate-pulse" />
                <div className="h-3 w-2/3 bg-border/20 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

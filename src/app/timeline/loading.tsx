export default function TimelineLoading() {
  return (
    <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="h-10 w-44 bg-border/50 rounded animate-pulse mb-2" />
      <div className="h-5 w-80 bg-border/30 rounded animate-pulse mb-6" />

      {/* Toolbar skeleton */}
      <div className="bg-card border border-border rounded-lg p-4 mb-4 flex flex-wrap gap-4">
        {[80, 120, 160, 100].map((w, i) => (
          <div key={i} className="h-8 bg-border/20 rounded animate-pulse" style={{ width: w }} />
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="bg-card border border-border rounded-lg p-4 h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted mt-3">Loading timeline data...</p>
        </div>
      </div>
    </div>
  )
}

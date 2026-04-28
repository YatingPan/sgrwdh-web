export const revalidate = 3600

import { Author, Period, Work } from '@/lib/types'
import { getTimelineData } from '@/lib/cached-queries'
import Timeline from '@/components/Timeline'

export default async function TimelinePage() {
  const { authors, periods, works } = await getTimelineData()

  return (
    <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-2 font-serif">
        Timeline
      </h1>
      <p className="text-muted mb-6">
        Explore authors and works across time. Hover for details, click to navigate.
      </p>

      <Timeline
        authors={authors as Author[]}
        periods={periods as Period[]}
        works={works as Work[]}
      />
    </div>
  )
}

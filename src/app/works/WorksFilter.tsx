'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Search } from 'lucide-react'

interface WorksFilterProps {
  currentFragmentary: string
  currentSearch: string
}

export default function WorksFilter({
  currentFragmentary,
  currentSearch,
}: WorksFilterProps) {
  const router = useRouter()
  const [search, setSearch] = useState(currentSearch)

  function navigate(frag: string, q: string) {
    const params = new URLSearchParams()
    if (frag !== 'all') params.set('fragmentary', frag)
    if (q) params.set('q', q)
    router.push(`/works?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <label className="text-sm font-semibold text-foreground block mb-2">Search</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') navigate(currentFragmentary, search)
            }}
            placeholder="Work title..."
            className="w-full pl-9 pr-3 py-2 rounded-md border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Fragmentary filter */}
      <div>
        <label className="text-sm font-semibold text-foreground block mb-2">Fragmentary</label>
        <div className="space-y-1">
          {['all', 'yes', 'no'].map((f) => (
            <button
              key={f}
              onClick={() => navigate(f, search)}
              className={`block w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                currentFragmentary === f
                  ? 'bg-primary text-white'
                  : 'hover:bg-primary/5 text-foreground'
              }`}
            >
              {f === 'all' ? 'All' : f === 'yes' ? 'Fragmentary Only' : 'Complete Only'}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

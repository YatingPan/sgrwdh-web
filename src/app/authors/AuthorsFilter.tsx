'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Search } from 'lucide-react'

interface AuthorsFilterProps {
  currentLanguage: string
  currentSearch: string
}

export default function AuthorsFilter({ currentLanguage, currentSearch }: AuthorsFilterProps) {
  const router = useRouter()
  const [search, setSearch] = useState(currentSearch)

  function navigate(lang: string, q: string) {
    const params = new URLSearchParams()
    if (lang !== 'all') params.set('language', lang)
    if (q) params.set('q', q)
    router.push(`/authors?${params.toString()}`)
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
              if (e.key === 'Enter') navigate(currentLanguage, search)
            }}
            placeholder="Author name..."
            className="w-full pl-9 pr-3 py-2 rounded-md border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Language filter */}
      <div>
        <label className="text-sm font-semibold text-foreground block mb-2">Language</label>
        <div className="space-y-1">
          {['all', 'Greek', 'Latin', 'Other'].map((lang) => (
            <button
              key={lang}
              onClick={() => navigate(lang, search)}
              className={`block w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                currentLanguage === lang
                  ? 'bg-primary text-white'
                  : 'hover:bg-primary/5 text-foreground'
              }`}
            >
              {lang === 'all' ? 'All Languages' : lang}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { renderDbMarkup } from '@/lib/utils'

interface CollapsiblePartProps {
  id: string
  title: string
  synopsis: string | null
  quotingInfo: string | null
}

export default function CollapsiblePart({ id, title, synopsis, quotingInfo }: CollapsiblePartProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 p-4 text-left hover:bg-primary/5 transition-colors"
      >
        {open ? <ChevronDown size={16} className="text-muted shrink-0" /> : <ChevronRight size={16} className="text-muted shrink-0" />}
        <h3
          className="font-serif font-bold text-primary flex-1"
          dangerouslySetInnerHTML={{ __html: renderDbMarkup(title) }}
        />
        <span className="text-xs font-mono bg-background text-muted px-1.5 py-0.5 rounded shrink-0">
          {id}
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-0 border-t border-border/50">
          {synopsis && (
            <div
              className="mt-3 text-sm text-foreground/80 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderDbMarkup(synopsis) }}
            />
          )}
          {quotingInfo && (
            <p className="mt-2 text-xs text-muted">{quotingInfo}</p>
          )}
        </div>
      )}
    </div>
  )
}

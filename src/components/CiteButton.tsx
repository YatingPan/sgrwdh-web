'use client'

import { useState } from 'react'
import { Quote, Copy, Check, X } from 'lucide-react'

interface CiteButtonProps {
  name: string
  path: string
}

export default function CiteButton({ name, path }: CiteButtonProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const url = `https://sgrwdh.vercel.app${path}`
  const citation = `SGRWDH Database. "${name}." Accessed ${today}. ${url}.`

  async function handleCopy() {
    await navigator.clipboard.writeText(citation)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border border-border hover:bg-primary/5 transition-colors text-muted hover:text-foreground"
      >
        <Quote size={14} />
        Cite this entry
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setOpen(false)}>
          <div
            className="bg-card rounded-lg border border-border shadow-xl p-6 max-w-lg w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-primary font-serif">Cite this Entry</h3>
              <button onClick={() => setOpen(false)} className="text-muted hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-muted mb-2 uppercase tracking-wider font-semibold">Chicago Style</p>
            <div className="bg-background rounded border border-border p-4 text-sm text-foreground leading-relaxed font-serif">
              {citation}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy to clipboard'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

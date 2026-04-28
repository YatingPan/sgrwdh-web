'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Send, Loader2, User, Bot, Sparkles, Database } from 'lucide-react'

interface SourceEntry {
  id: string
  author_name?: string
  work_title?: string
  similarity?: number
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: SourceEntry[]
  searchMethod?: string
  apiStatus?: 'ok' | 'no-key' | 'error' | 'network' | 'empty'
  apiMessage?: string
}

const presetQuestions = [
  'Who were the earliest Greek historians?',
  'Which authors wrote about the Punic Wars?',
  'Show me all fragmentary works',
  'What sources are available for Hecataeus?',
]

export default function SearchChat({ initialQuery }: { initialQuery?: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState(initialQuery || '')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const hasInitialized = useRef(false)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (initialQuery && !hasInitialized.current) {
      hasInitialized.current = true
      handleSend(initialQuery)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery])

  async function handleSend(query?: string) {
    const q = (query || input).trim()
    if (!q || loading) return

    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: q }])
    setLoading(true)

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      })
      const data = await res.json()
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer || 'No response generated.',
          sources: data.sources || [],
          searchMethod: data.searchMethod,
          apiStatus: data.apiStatus,
          apiMessage: data.apiMessage,
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'An error occurred. Please try again.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col">
      {/* Messages area */}
      <div className="px-4 py-6 space-y-6">
        {messages.length === 0 && (
          <div className="text-center py-12 sm:py-16">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles size={28} className="text-primary" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-primary font-serif mb-2">
              Ask SGRWDH a question
            </h2>
            <p className="text-muted mb-2">Database retrieval + AI narrative</p>
            <p className="text-xs text-muted/70 mb-8">
              Try natural language. The AI answers from the database and cites entry IDs.
            </p>
            <div className="grid sm:grid-cols-2 gap-3 max-w-xl mx-auto">
              {presetQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="text-left text-sm bg-card border border-border rounded-lg p-4 hover:border-primary/30 hover:shadow-sm transition-all text-foreground group"
                >
                  <span className="text-muted group-hover:text-primary transition-colors">→</span>{' '}
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                <Bot size={16} className="text-primary" />
              </div>
            )}
            <div
              className={`max-w-2xl rounded-lg p-4 ${
                msg.role === 'user'
                  ? 'bg-primary text-white'
                  : 'bg-card border border-border'
              }`}
            >
              {/* Search method badge */}
              {msg.role === 'assistant' && msg.searchMethod && (
                <div className="flex items-center gap-1.5 mb-2">
                  <Database size={11} className="text-muted" />
                  <span className="text-[10px] text-muted uppercase tracking-wider">
                    {msg.searchMethod}
                  </span>
                </div>
              )}

              {/* API status banner — only show when AI is degraded */}
              {msg.role === 'assistant' &&
                msg.apiStatus &&
                msg.apiStatus !== 'ok' &&
                msg.apiMessage && (
                  <div className="mb-3 flex items-start gap-2 rounded border border-amber-300/50 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900">
                    <span className="font-semibold">⚠ AI narrative unavailable:</span>
                    <span>{msg.apiMessage}</span>
                  </div>
                )}

              <div
                className="text-sm leading-relaxed whitespace-pre-wrap"
                dangerouslySetInnerHTML={{
                  __html: msg.content
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(
                      /\[(.*?)\]\((.*?)\)/g,
                      '<a href="$2" class="underline text-accent hover:text-accent/80">$1</a>'
                    )
                    .replace(/\n/g, '<br/>'),
                }}
              />

              {/* Referenced entries */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted mb-2">Referenced entries:</p>
                  <div className="flex flex-wrap gap-2">
                    {msg.sources.map((s) => (
                      <Link
                        key={s.id}
                        href={
                          s.id.startsWith('A')
                            ? `/authors/${s.id}`
                            : `/works/${s.id}`
                        }
                        className="inline-flex items-center gap-1 text-xs bg-background border border-border rounded px-2 py-1 hover:border-primary/30 transition-colors"
                      >
                        <span className="font-mono text-muted">{s.id}</span>
                        <span className="text-foreground">
                          {s.author_name || s.work_title}
                        </span>
                        {s.similarity !== undefined && s.similarity > 0 && (
                          <span className="text-[10px] text-muted ml-1">
                            {(s.similarity * 100).toFixed(0)}%
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-1">
                <User size={16} className="text-accent" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Bot size={16} className="text-primary" />
            </div>
            <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-muted" />
              <span className="text-xs text-muted">Searching database & generating answer...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border bg-card px-4 py-3">
        <div className="max-w-3xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Ask about classical authors and works..."
            className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            disabled={loading}
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

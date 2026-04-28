import { searchAll } from '@/lib/data-store'
import type { Author, Work } from '@/lib/types'

/**
 * AI search endpoint.
 *
 * Pipeline:
 *   1. Run our own keyword search across authors / works / sources to
 *      retrieve up to 8 candidates from each category (the "retrieval"
 *      half of RAG).
 *   2. If a DEEPSEEK_API_KEY is configured, send the user's question +
 *      the retrieved candidates to DeepSeek and stream back a sourced
 *      narrative answer.
 *   3. Otherwise (or if the API call fails), fall back to a
 *      deterministic structured summary built from the candidates and
 *      surface a clear `apiStatus` field so the UI can tell the user
 *      *why* the AI half is unavailable.
 *
 * As the database grows, retrieval can be swapped to vector-based
 * (BGE-M3 / OpenAI embeddings) without changing the answer-generation
 * code; the `searchAll()` -> candidates -> LLM contract stays the same.
 */

interface AiSource {
  id: string
  author_name?: string
  work_title?: string
  similarity?: number
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { query?: unknown }
  const query = typeof body.query === 'string' ? body.query.trim() : ''
  if (!query) {
    return Response.json({ error: 'Query is required' }, { status: 400 })
  }

  // Try a strict AND match first — that gives focused hits for short
  // queries like "aug". If nothing comes back we widen to OR so a
  // natural-language phrase ("Roman historians of the Punic Wars") still
  // pulls in plausible context for the LLM to summarise from.
  let retrieved = searchAll({ q: query, limit: 8 })
  if (retrieved.totals.authors + retrieved.totals.works + retrieved.totals.sources < 3) {
    retrieved = searchAll({ q: query, limit: 8, mode: 'or' })
  }

  const candidateAuthors: AiSource[] = retrieved.authors.map((h) => ({
    id: h.item.id,
    author_name: h.item.author_name,
  }))
  const candidateWorks: AiSource[] = retrieved.works.map((h) => ({
    id: h.item.id,
    work_title: h.item.work_title,
  }))
  const sources: AiSource[] = [...candidateAuthors, ...candidateWorks]

  // Build a compact context for the LLM
  const context = JSON.stringify({
    authors: retrieved.authors.map((h) => ({
      id: h.item.id,
      name: h.item.author_name,
      language: h.item.language,
      life: trimText((h.item as Author).life, 600),
    })),
    works: retrieved.works.map((h) => ({
      id: h.item.id,
      title: stripTags((h.item as Work).work_title),
      author: (h.item as Work).authors?.author_name,
      synopsis: trimText((h.item as Work).synopsis, 600),
      fragmentary: (h.item as Work).is_fragmentary,
    })),
    sources: retrieved.sources.slice(0, 4).map((h) => ({
      type: h.item.source_type,
      info: trimText(h.item.source_information, 200),
      for: h.item.corresponding_id,
    })),
  })

  const deepseekKey = process.env.DEEPSEEK_API_KEY

  // No API key — we still return a useful answer, just deterministic.
  if (!deepseekKey || deepseekKey === 'sk-placeholder' || deepseekKey === '') {
    const answer = composeStructuredAnswer(query, retrieved)
    return Response.json({
      answer,
      sources,
      apiStatus: 'no-key',
      apiMessage:
        'AI narrative is disabled (no DEEPSEEK_API_KEY configured). Showing a structured summary instead.',
      searchMethod: 'keyword',
    })
  }

  try {
    const upstream = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${deepseekKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: `User question: ${query}\n\nDatabase results (retrieved via keyword search):\n${context}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    })

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => '')
      return Response.json({
        answer: composeStructuredAnswer(query, retrieved),
        sources,
        apiStatus: 'error',
        apiMessage: `DeepSeek API returned ${upstream.status}: ${trimText(errText, 200) || 'no body'}. Falling back to a structured summary.`,
        searchMethod: 'keyword',
      })
    }

    const data = (await upstream.json()) as {
      choices?: { message?: { content?: string } }[]
    }
    const answer = data.choices?.[0]?.message?.content
    if (!answer) {
      return Response.json({
        answer: composeStructuredAnswer(query, retrieved),
        sources,
        apiStatus: 'empty',
        apiMessage: 'DeepSeek returned an empty response. Falling back to a structured summary.',
        searchMethod: 'keyword',
      })
    }

    return Response.json({
      answer,
      sources,
      apiStatus: 'ok',
      searchMethod: 'keyword + AI',
    })
  } catch (err) {
    return Response.json({
      answer: composeStructuredAnswer(query, retrieved),
      sources,
      apiStatus: 'network',
      apiMessage: `Could not reach DeepSeek (${(err as Error).message ?? 'network error'}). Falling back to a structured summary.`,
      searchMethod: 'keyword',
    })
  }
}

const SYSTEM_PROMPT = `You are a research assistant for SGRWDH (Sources of the Greco-Roman World — Digital Humanities).
You answer based ONLY on the database results provided in each request.
Always cite the entry IDs (e.g. A1, W2) inline with [Entry-ID] markdown links so the user can click through.
If the database does not contain relevant results, say so honestly and suggest a related search.
Keep answers focused, in markdown, and under 250 words.`

function composeStructuredAnswer(
  query: string,
  retrieved: ReturnType<typeof searchAll>
): string {
  const total = retrieved.authors.length + retrieved.works.length + retrieved.sources.length
  if (total === 0) {
    return `No matches in the database for **${query}**. Try a shorter form (e.g. \`aug\`), or browse the [Authors](/authors) and [Works](/works) pages.`
  }
  const parts: string[] = []
  if (retrieved.authors.length) {
    parts.push(
      `**${retrieved.authors.length} author${retrieved.authors.length > 1 ? 's' : ''}**: ` +
        retrieved.authors
          .slice(0, 5)
          .map((h) => `[${h.item.author_name}](/authors/${h.item.id})`)
          .join(', ')
    )
  }
  if (retrieved.works.length) {
    parts.push(
      `**${retrieved.works.length} work${retrieved.works.length > 1 ? 's' : ''}**: ` +
        retrieved.works
          .slice(0, 5)
          .map((h) => `[${stripTags(h.item.work_title)}](/works/${h.item.id})`)
          .join(', ')
    )
  }
  if (retrieved.sources.length) {
    parts.push(`**${retrieved.sources.length} source citation${retrieved.sources.length > 1 ? 's' : ''}** matched.`)
  }
  return parts.join('\n\n')
}

function trimText(s: string | null | undefined, max: number): string {
  if (!s) return ''
  if (s.length <= max) return s
  return s.slice(0, max) + '…'
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, '')
}

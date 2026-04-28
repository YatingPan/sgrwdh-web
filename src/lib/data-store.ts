import dataset from '@/data/dataset.json'
import type { Author, Work, PartOfWork, Period, Source } from './types'

// ────────────────────────────────────────────────────────────
// Raw shape of dataset.json (subset of the type above — the
// extraction script does not produce author_id / language /
// genre / is_fragmentary; we infer those below).
// ────────────────────────────────────────────────────────────

interface RawAuthor {
  id: string
  author_name: string
  life: string | null
  ciris_url: string | null
  tm_id: string | null
  tm_uri: string | null
  creator: string | null
}

interface RawWork {
  id: string
  work_title: string
  synopsis: string | null
  quoting_information: string | null
  ciris_url: string | null
  tm_id: string | null
  tm_uri: string | null
  creator: string | null
}

interface RawPart {
  id: string
  work_title: string
  synopsis: string | null
  quoting_information: string | null
  ciris_url: string | null
  tm_id: string | null
  tm_uri: string | null
  creator: string | null
}

interface RawPeriod {
  corresponding_id: string
  period_type: string
  start_year_earliest: number | null
  start_year_latest: number | null
  end_year_earliest: number | null
  end_year_latest: number | null
}

interface RawSource {
  corresponding_id: string
  source_type: string
  source_information: string | null
  free_internet_resource_url: string | null
}

interface Dataset {
  authors: RawAuthor[]
  works: RawWork[]
  parts: RawPart[]
  periods: RawPeriod[]
  sources: RawSource[]
}

const raw = dataset as Dataset

// ────────────────────────────────────────────────────────────
// Inferred fields
// ────────────────────────────────────────────────────────────

const STOP_TOKENS = new Set([
  'the', 'of', 'a', 'an', 'and', 'in', 'to', 'his', 'her',
  'son', 'father', 'st', 'nd', 'rd', 'th',
])

/** Strip HTML and normalize whitespace for searching. */
function plainText(s: string | null | undefined): string {
  if (!s) return ''
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

/** Pull matchable name tokens from a string (cognomen / gentilicium /
 *  work-title prefix). Tokens of length >= 3 are kept so that scholarly
 *  abbreviations like "Vell.", "Plin.", "Apul." remain matchable; one-
 *  and two-letter praenomen abbreviations ("L.", "M.", "Q.") are dropped. */
function nameTokens(s: string): string[] {
  return s
    .replace(/<[^>]+>/g, ' ')
    .split(/[\s,. ]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !STOP_TOKENS.has(t.toLowerCase()))
}

/** Length of the longest case-insensitive prefix shared by two tokens. */
function commonPrefixLen(a: string, b: string): number {
  const al = a.toLowerCase()
  const bl = b.toLowerCase()
  let i = 0
  while (i < al.length && i < bl.length && al[i] === bl[i]) i++
  return i
}

/** How well two name tokens match. The 4-char threshold rules out
 *  incidental 3-letter overlaps (e.g. "Sex." against "Sextus"); 3-char
 *  tokens still match if one is a full prefix of the other (so "App."
 *  matches "Appian"). */
function nameMatchScore(workToken: string, authorToken: string): number {
  const cpl = commonPrefixLen(workToken, authorToken)
  if (cpl >= 4) return cpl
  if (
    cpl >= 3 &&
    (workToken.toLowerCase().startsWith(authorToken.toLowerCase()) ||
      authorToken.toLowerCase().startsWith(workToken.toLowerCase()))
  ) {
    return cpl
  }
  return 0
}

/** Infer a work's author from a name reference in the work title. We
 *  pick the author whose name shares the longest prefix with any token
 *  in the *first chunk* of the work title (text before the first comma
 *  or period — that is where the author reference conventionally
 *  appears, e.g. "Apul. Met." or "Augustus, Memoirs"). When no author
 *  in the database matches we return null — we deliberately do NOT
 *  fall back to numeric-ID adjacency, because the source files do not
 *  guarantee that A_n and W_n refer to the same person (e.g. Jin's
 *  W140 "Augustus, Memoirs" vs A140 "Calpurnius Piso"). */
function inferAuthorId(work: RawWork, authors: RawAuthor[]): string | null {
  const title = plainText(work.work_title)
  const firstChunk = title.split(/[,.]/)[0] ?? ''
  const workToks = nameTokens(firstChunk)
  if (workToks.length === 0) return null

  let best: { id: string; score: number } | null = null
  for (const a of authors) {
    const aToks = nameTokens(a.author_name)
    let score = 0
    for (const wt of workToks) {
      for (const at of aToks) {
        score += nameMatchScore(wt, at)
      }
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { id: a.id, score }
    }
  }
  return best ? best.id : null
}

/** Heuristic language inference from biography text. */
function inferLanguage(life: string | null): string {
  const t = plainText(life).toLowerCase()
  if (!t) return 'Other'
  if (/\bgreek\b/.test(t) && !/\broman\b/.test(t)) return 'Greek'
  if (/\broman\b|\blatin\b|\baugust|\btrajan\b|\bemperor\b/.test(t)) return 'Latin'
  if (/\bgreek\b/.test(t)) return 'Greek'
  return 'Other'
}

/** Heuristic: a work is fragmentary if synopsis mentions fragments / lost. */
function inferFragmentary(synopsis: string | null): boolean {
  const t = plainText(synopsis).toLowerCase()
  if (!t) return false
  return /\b(fragment|fragments|fragmentary|survives only|lost work|preserved (only )?in)\b/.test(t)
}

/** Pull a plain-text author label out of a work title for cases where the
 *  work has no matching author in the database (so we still tell the
 *  reader "by Augustus" without offering a dead link). The convention in
 *  the source data is that the author reference sits in the first
 *  comma-separated chunk of the title, e.g. "Augustus, <i>Memoirs</i>"
 *  → "Augustus", "Plin. <i>Nat.</i>" → "Plin.". Returns null when the
 *  title is just the work name (no comma / period before the title). */
function authorLabelFromTitle(title: string): string | null {
  const plain = plainText(title)
  // Only treat as author reference if there's a comma or period in the
  // first 40 chars — that's where the citation form puts it.
  const m = plain.match(/^([^,.]{2,40})[,.]/)
  if (!m) return null
  const candidate = m[1].trim()
  if (candidate.length < 2) return null
  return candidate
}

// ────────────────────────────────────────────────────────────
// Build enriched in-memory tables
// ────────────────────────────────────────────────────────────

const isoTimestamp = (n: number) => new Date(n).toISOString()
const baseTime = Date.UTC(2024, 0, 1) // deterministic created_at

const authors: Author[] = raw.authors
  .filter((a) => a.author_name)
  .map((a, i) => ({
    id: a.id,
    author_name: a.author_name,
    life: a.life,
    ciris_url: a.ciris_url,
    tm_id: a.tm_id,
    tm_uri: a.tm_uri,
    creator: a.creator,
    language: inferLanguage(a.life),
    created_at: isoTimestamp(baseTime + i * 1000),
  }))

const authorById = new Map(authors.map((a) => [a.id, a]))

const works: Work[] = raw.works
  .filter((w) => w.work_title)
  .map((w, i) => {
    const author_id = inferAuthorId(w, raw.authors)
    const linkedName = author_id
      ? authorById.get(author_id)?.author_name || ''
      : ''
    // When the work has no matching author in the database we still
    // expose a plain-text label so the detail page can show "by
    // Augustus" without a broken link.
    const fallbackLabel = author_id ? null : authorLabelFromTitle(w.work_title)
    return {
      id: w.id,
      work_title: w.work_title,
      synopsis: w.synopsis,
      quoting_information: w.quoting_information,
      ciris_url: w.ciris_url,
      tm_id: w.tm_id,
      tm_uri: w.tm_uri,
      creator: w.creator,
      author_id,
      genre: null,
      is_fragmentary: inferFragmentary(w.synopsis),
      created_at: isoTimestamp(baseTime + i * 1000),
      authors: author_id
        ? { author_name: linkedName }
        : fallbackLabel
          ? { author_name: fallbackLabel }
          : undefined,
    }
  })

const parts: PartOfWork[] = raw.parts
  .filter((p) => p.work_title)
  .map((p, i) => ({
    id: p.id,
    work_title: p.work_title,
    synopsis: p.synopsis,
    quoting_information: p.quoting_information,
    ciris_url: p.ciris_url,
    tm_id: p.tm_id,
    tm_uri: p.tm_uri,
    creator: p.creator,
    work_id: null, // Source files have no work_id linkage and the parts table is empty
    created_at: isoTimestamp(baseTime + i * 1000),
  }))

const periods: Period[] = raw.periods.map((p, i) => ({
  id: i + 1,
  corresponding_id: p.corresponding_id,
  period_type: p.period_type as Period['period_type'],
  start_year_earliest: p.start_year_earliest,
  start_year_latest: p.start_year_latest,
  end_year_earliest: p.end_year_earliest,
  end_year_latest: p.end_year_latest,
}))

const sources: Source[] = raw.sources.map((s, i) => ({
  id: i + 1,
  corresponding_id: s.corresponding_id,
  source_type: s.source_type,
  source_information: s.source_information,
  free_internet_resource_url: s.free_internet_resource_url,
}))

// ────────────────────────────────────────────────────────────
// Indexes
// ────────────────────────────────────────────────────────────

const workById = new Map(works.map((w) => [w.id, w]))
const partById = new Map(parts.map((p) => [p.id, p]))

function indexBy<T, K extends string | number>(
  items: T[],
  keyFn: (item: T) => K | null | undefined
): Map<K, T[]> {
  const m = new Map<K, T[]>()
  for (const it of items) {
    const k = keyFn(it)
    if (k == null) continue
    let arr = m.get(k)
    if (!arr) { arr = []; m.set(k, arr) }
    arr.push(it)
  }
  return m
}

const worksByAuthorId = indexBy(works, (w) => w.author_id)
const periodsByCorrId = indexBy(periods, (p) => p.corresponding_id)
const sourcesByCorrId = indexBy(sources, (s) => s.corresponding_id)

// ────────────────────────────────────────────────────────────
// Query API
// ────────────────────────────────────────────────────────────

export interface AuthorSearch {
  language?: string
  query?: string
  page?: number
  perPage?: number
}

export interface WorkSearch {
  genre?: string
  fragmentary?: 'yes' | 'no' | 'all'
  query?: string
  page?: number
  perPage?: number
}

export function getStats() {
  return {
    total_authors: authors.length,
    total_works: works.length,
    total_parts: parts.length,
    total_sources: sources.length,
    total_periods: periods.length,
  }
}

export function getAllAuthors(): Author[] {
  return authors
}

export function getAuthorById(id: string): Author | null {
  return authorById.get(id) ?? null
}

export function searchAuthors({
  language = 'all',
  query = '',
  page = 1,
  perPage = 24,
}: AuthorSearch) {
  let filtered = authors
  if (language && language !== 'all') {
    filtered = filtered.filter((a) => (a.language || 'Other') === language)
  }
  if (query) {
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean)
    filtered = filtered.filter((a) =>
      tokens.every(
        (t) =>
          a.author_name.toLowerCase().includes(t) ||
          (a.life || '').toLowerCase().includes(t)
      )
    )
  }
  const sorted = [...filtered].sort((a, b) => a.author_name.localeCompare(b.author_name))
  const start = (page - 1) * perPage
  return {
    authors: sorted.slice(start, start + perPage),
    total: sorted.length,
  }
}

export function getRecentAuthors(limit: number): Author[] {
  return [...authors]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit)
}

export function getAllWorks(): Work[] {
  return works
}

export function getWorkById(id: string): Work | null {
  return workById.get(id) ?? null
}

export function getWorksByAuthorId(authorId: string): Work[] {
  return [...(worksByAuthorId.get(authorId) || [])].sort((a, b) =>
    a.work_title.localeCompare(b.work_title)
  )
}

export function searchWorks({
  genre = 'all',
  fragmentary = 'all',
  query = '',
  page = 1,
  perPage = 24,
}: WorkSearch) {
  let filtered = works
  if (genre && genre !== 'all') {
    filtered = filtered.filter((w) => w.genre === genre)
  }
  if (fragmentary === 'yes') {
    filtered = filtered.filter((w) => w.is_fragmentary)
  } else if (fragmentary === 'no') {
    filtered = filtered.filter((w) => !w.is_fragmentary)
  }
  if (query) {
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean)
    filtered = filtered.filter((w) =>
      tokens.every(
        (t) =>
          w.work_title.toLowerCase().includes(t) ||
          (w.synopsis || '').toLowerCase().includes(t)
      )
    )
  }
  const sorted = [...filtered].sort((a, b) => a.work_title.localeCompare(b.work_title))
  const start = (page - 1) * perPage
  return {
    works: sorted.slice(start, start + perPage),
    total: sorted.length,
  }
}

export function getPartsByWorkId(workId: string): PartOfWork[] {
  return parts.filter((p) => p.work_id === workId)
}

export function getPartById(id: string): PartOfWork | null {
  return partById.get(id) ?? null
}

export function getAllPeriods(): Period[] {
  return periods
}

export function getPeriodsByCorrespondingId(id: string): Period[] {
  return periodsByCorrId.get(id) || []
}

export function getPeriodsByCorrespondingIds(ids: string[]): Period[] {
  const out: Period[] = []
  for (const id of ids) {
    const list = periodsByCorrId.get(id)
    if (list) out.push(...list)
  }
  return out
}

export function getAuthorLifespanPeriods(): Period[] {
  return periods.filter((p) => p.period_type === 'Author Lifespan')
}

export function getSourcesByCorrespondingId(id: string): Source[] {
  return sourcesByCorrId.get(id) || []
}

export function getSourcesByCorrespondingIds(ids: string[]): Source[] {
  const out: Source[] = []
  for (const id of ids) {
    const list = sourcesByCorrId.get(id)
    if (list) out.push(...list)
  }
  return out
}

export const availableLanguages = Array.from(
  new Set(authors.map((a) => a.language || 'Other'))
).sort()

export const availableGenres = Array.from(
  new Set(works.map((w) => w.genre).filter((g): g is string => !!g))
).sort()

export const availableCurators = Array.from(
  new Set(
    [
      ...authors.map((a) => a.creator),
      ...works.map((w) => w.creator),
    ].filter((c): c is string => !!c)
  )
).sort()

export const availableSourceTypes = Array.from(
  new Set(sources.map((s) => s.source_type).filter((t): t is string => !!t))
).sort()

// ────────────────────────────────────────────────────────────
// Unified search across all entity types
// ────────────────────────────────────────────────────────────

export interface SearchFilters {
  /** Free-text query, AND-combined token match across multiple fields. */
  q?: string
  /** 'Greek' | 'Latin' | 'Other' | undefined (any) */
  languages?: string[]
  /** Inclusive year range filter against author lifespans / work composition. */
  yearMin?: number
  yearMax?: number
  /** Curator filter — match the entity's `creator` field (allows "starts with"). */
  curators?: string[]
  /** Only entries with a Trismegistos ID. */
  hasTmId?: boolean
  /** Only entries with a CIRIS URL. */
  hasCiris?: boolean
  /** Works only: 'yes' | 'no' | undefined (any). */
  fragmentary?: 'yes' | 'no'
  /** Filter sources by source_type. */
  sourceTypes?: string[]
  /** Limit how many results per group are returned (after relevance ranking). */
  limit?: number
}

export interface SearchHit<T> {
  item: T
  score: number
  /** Indexes of the matched fields and a small surrounding snippet. */
  snippets: { field: string; text: string }[]
}

export interface SearchResults {
  query: string
  authors: SearchHit<Author>[]
  works: SearchHit<Work>[]
  sources: SearchHit<Source & { entity?: Author | Work }>[]
  totals: {
    authors: number
    works: number
    sources: number
  }
}

/** Lowercase + strip HTML for matching. */
function searchable(s: string | null | undefined): string {
  if (!s) return ''
  return s.replace(/<[^>]+>/g, ' ').toLowerCase()
}

/** Extract a short snippet around the first occurrence of any token. */
function snippet(text: string, tokens: string[], maxLen = 140): string {
  if (!text) return ''
  const lower = text.toLowerCase()
  let pos = -1
  for (const t of tokens) {
    const i = lower.indexOf(t)
    if (i >= 0 && (pos < 0 || i < pos)) pos = i
  }
  if (pos < 0) {
    return text.slice(0, maxLen) + (text.length > maxLen ? '…' : '')
  }
  const start = Math.max(0, pos - 30)
  const end = Math.min(text.length, pos + maxLen - 30)
  return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '')
}

/** Common English / Latin "filler" tokens dropped from the query so
 *  natural-language phrases ("Roman historians of the Punic Wars") still
 *  return matches. These are NOT dropped from the indexed text —
 *  searching for "of" alone still works if you really want it. */
const QUERY_STOP_WORDS = new Set([
  'the', 'of', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'with', 'by', 'from', 'about', 'as', 'is', 'are', 'was', 'were', 'be',
  'who', 'what', 'which', 'when', 'where', 'how', 'why',
])

function tokenizeQuery(q: string): string[] {
  return q
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.replace(/[^a-z0-9'-]/g, ''))
    .filter((t) => t.length >= 2 && !QUERY_STOP_WORDS.has(t))
}

/** Score how strongly a record matches the query tokens. By default we
 *  require every token to be present (AND); set `mode: 'or'` to use a
 *  looser OR match (any token contributes to the score). The OR mode is
 *  useful for AI-mode retrieval where we want a wider context window
 *  even if the user's phrasing is approximate. */
function scoreTokens(
  fields: { weight: number; text: string }[],
  tokens: string[],
  mode: 'and' | 'or' = 'and'
): number {
  if (tokens.length === 0) return 1
  let total = 0
  let matched = 0
  for (const tok of tokens) {
    let bestField = 0
    for (const f of fields) {
      if (f.text.includes(tok)) {
        const startBoost = f.text.startsWith(tok) ? 2 : 1
        const fieldScore = f.weight * startBoost
        if (fieldScore > bestField) bestField = fieldScore
      }
    }
    if (bestField > 0) {
      matched++
      total += bestField
    } else if (mode === 'and') {
      return 0 // any missing token in AND mode → no match
    }
  }
  return mode === 'or' && matched === 0 ? 0 : total
}

/** Get the lifespan / composition years for range-filter purposes. */
function entityYears(id: string): { min: number | null; max: number | null } {
  const ps = periodsByCorrId.get(id) || []
  const ys = ps
    .flatMap((p) => [
      p.start_year_earliest,
      p.start_year_latest,
      p.end_year_earliest,
      p.end_year_latest,
    ])
    .filter((y): y is number => y !== null)
  if (ys.length === 0) return { min: null, max: null }
  return { min: Math.min(...ys), max: Math.max(...ys) }
}

function matchesYearRange(id: string, yearMin?: number, yearMax?: number): boolean {
  if (yearMin === undefined && yearMax === undefined) return true
  const { min, max } = entityYears(id)
  if (min === null || max === null) return true // no period info → don't filter out
  if (yearMin !== undefined && max < yearMin) return false
  if (yearMax !== undefined && min > yearMax) return false
  return true
}

/** Run a unified search across authors, works and sources. The free-text
 *  query is AND-combined across tokens (with stop words dropped); filters
 *  are AND-combined with the query. Each category is sorted by relevance
 *  score (descending).
 *
 *  Pass `mode: 'or'` to fall back to OR-matching when even AND is too
 *  strict — used by AI-mode retrieval to gather broader context. */
export function searchAll(
  filters: SearchFilters & { mode?: 'and' | 'or' }
): SearchResults {
  const q = (filters.q ?? '').trim()
  const tokens = q.length === 0 ? [] : tokenizeQuery(q)
  const matchMode = filters.mode ?? 'and'
  const limit = filters.limit ?? 50

  const langSet = filters.languages?.length ? new Set(filters.languages) : null
  const curatorSet = filters.curators?.length ? new Set(filters.curators) : null
  const sourceTypeSet = filters.sourceTypes?.length ? new Set(filters.sourceTypes) : null

  // ── Authors ──
  const authorHits: SearchHit<Author>[] = []
  for (const a of authors) {
    if (langSet && !langSet.has(a.language || 'Other')) continue
    if (curatorSet && !curatorMatches(a.creator, curatorSet)) continue
    if (filters.hasTmId && !a.tm_id) continue
    if (filters.hasCiris && !a.ciris_url) continue
    if (!matchesYearRange(a.id, filters.yearMin, filters.yearMax)) continue

    const score = scoreTokens(
      [
        { weight: 5, text: searchable(a.author_name) },
        { weight: 1, text: searchable(a.life) },
      ],
      tokens,
      matchMode
    )
    if (score === 0) continue

    const snippets: { field: string; text: string }[] = []
    if (a.life && tokens.length) {
      const s = snippet(a.life.replace(/<[^>]+>/g, ''), tokens)
      if (s) snippets.push({ field: 'Biography', text: s })
    }
    authorHits.push({ item: a, score, snippets })
  }

  // ── Works ──
  const workHits: SearchHit<Work>[] = []
  for (const w of works) {
    // Apply work-side filters
    if (filters.fragmentary === 'yes' && !w.is_fragmentary) continue
    if (filters.fragmentary === 'no' && w.is_fragmentary) continue
    if (filters.hasTmId && !w.tm_id) continue
    if (filters.hasCiris && !w.ciris_url) continue
    if (curatorSet && !curatorMatches(w.creator, curatorSet)) continue
    // Language filter via the linked author
    if (langSet) {
      if (!w.author_id) continue
      const linked = authorById.get(w.author_id)
      if (!linked || !langSet.has(linked.language || 'Other')) continue
    }
    if (!matchesYearRange(w.id, filters.yearMin, filters.yearMax)) continue

    const score = scoreTokens(
      [
        { weight: 5, text: searchable(w.work_title) },
        { weight: 1, text: searchable(w.synopsis) },
        { weight: 1, text: searchable(w.quoting_information) },
      ],
      tokens,
      matchMode
    )
    if (score === 0) continue

    const snippets: { field: string; text: string }[] = []
    if (w.synopsis && tokens.length) {
      const s = snippet(w.synopsis.replace(/<[^>]+>/g, ''), tokens)
      if (s) snippets.push({ field: 'Synopsis', text: s })
    }
    workHits.push({ item: w, score, snippets })
  }

  // ── Sources ──
  const sourceHits: SearchHit<Source & { entity?: Author | Work }>[] = []
  for (const s of sources) {
    if (sourceTypeSet && !sourceTypeSet.has(s.source_type)) continue
    // Inherit filters from the linked entity where possible
    const author = authorById.get(s.corresponding_id)
    const work = workById.get(s.corresponding_id)
    const entity = author ?? work
    if (langSet) {
      const lang =
        author?.language ??
        (work?.author_id ? authorById.get(work.author_id)?.language : undefined) ??
        'Other'
      if (!langSet.has(lang)) continue
    }
    if (curatorSet && entity && !curatorMatches(entity.creator, curatorSet)) continue

    const score = scoreTokens(
      [
        { weight: 1, text: searchable(s.source_information) },
        { weight: 2, text: searchable(s.source_type) },
      ],
      tokens,
      matchMode
    )
    if (score === 0) continue

    const snippets: { field: string; text: string }[] = []
    if (s.source_information && tokens.length) {
      const sn = snippet(s.source_information.replace(/<[^>]+>/g, ''), tokens)
      if (sn) snippets.push({ field: s.source_type, text: sn })
    }
    sourceHits.push({ item: { ...s, entity }, score, snippets })
  }

  authorHits.sort((a, b) => b.score - a.score)
  workHits.sort((a, b) => b.score - a.score)
  sourceHits.sort((a, b) => b.score - a.score)

  return {
    query: q,
    authors: authorHits.slice(0, limit),
    works: workHits.slice(0, limit),
    sources: sourceHits.slice(0, limit),
    totals: {
      authors: authorHits.length,
      works: workHits.length,
      sources: sourceHits.length,
    },
  }
}

function curatorMatches(creator: string | null | undefined, set: Set<string>): boolean {
  if (!creator) return false
  // Curator field can be a comma-separated list (e.g. "Jin Ziyan, Jolenta Wong");
  // match if any individual curator is in the requested set.
  const parts = creator.split(/[,;]/).map((s) => s.trim()).filter(Boolean)
  return parts.some((p) => set.has(p))
}

// ────────────────────────────────────────────────────────────
// Data quality report
// ────────────────────────────────────────────────────────────

export interface DataAnomaly {
  /** Stable id for grouping similar issues. */
  kind:
    | 'work-author-not-in-db'
    | 'composition-equals-lifespan'
    | 'composition-outside-lifespan'
    | 'work-without-author-link'
  workId?: string
  authorId?: string
  message: string
  detail?: string
}

/** Detect anomalies in the source data so the website can list them
 *  honestly (rather than silently fabricating links or hiding the
 *  problem). The report is computed once at module load. */
function detectAnomalies(): DataAnomaly[] {
  const out: DataAnomaly[] = []

  for (const w of works) {
    const titleLabel = plainText(w.work_title)

    if (!w.author_id) {
      const inferred = authorLabelFromTitle(w.work_title)
      out.push({
        kind: 'work-author-not-in-db',
        workId: w.id,
        message: `${w.id} "${titleLabel}" — author "${inferred ?? '?'}" is not recorded as an Author entry; work shown without an Author link.`,
      })
      continue
    }

    const author = authorById.get(w.author_id)
    if (!author) continue

    const lifespan = (periodsByCorrId.get(author.id) || []).find(
      (p) => p.period_type === 'Author Lifespan'
    )
    const composition = (periodsByCorrId.get(w.id) || []).find(
      (p) => p.period_type === 'Work Composition Period'
    )
    if (!lifespan || !composition) continue

    const lse = lifespan.start_year_earliest ?? lifespan.start_year_latest
    const lel = lifespan.end_year_latest ?? lifespan.end_year_earliest
    const cse = composition.start_year_earliest ?? composition.start_year_latest
    const cel = composition.end_year_latest ?? composition.end_year_earliest

    if (lse !== null && lel !== null && cse === lse && cel === lel) {
      out.push({
        kind: 'composition-equals-lifespan',
        workId: w.id,
        authorId: author.id,
        message: `${w.id} "${titleLabel}" — composition period equals the author's full lifespan (${lse}/${lel}). Likely a copy-paste from the lifespan field; composition usually covers a much shorter window.`,
      })
    } else if (cse !== null && lel !== null && cse < (lse ?? cse)) {
      out.push({
        kind: 'composition-outside-lifespan',
        workId: w.id,
        authorId: author.id,
        message: `${w.id} "${titleLabel}" — composition starts (${cse}) before the author was born (${lse}).`,
      })
    } else if (cel !== null && lel !== null && cel > lel + 5) {
      out.push({
        kind: 'composition-outside-lifespan',
        workId: w.id,
        authorId: author.id,
        message: `${w.id} "${titleLabel}" — composition ends (${cel}) more than 5 years after the author's death (${lel}).`,
      })
    }
  }

  return out
}

export const dataAnomalies: DataAnomaly[] = detectAnomalies()

import {
  getAllAuthors,
  getAllPeriods,
  getAllWorks,
  getAuthorLifespanPeriods,
  getRecentAuthors,
  getStats as getStatsRaw,
} from './data-store'

/**
 * Cached query helpers for ISR (Incremental Static Regeneration).
 *
 * The site is now backed by an in-memory dataset loaded from
 * src/data/dataset.json (extracted from human-collected lemmata
 * via scripts/extract-real-data.ps1). The cache wrappers are
 * preserved so existing callers and Next's revalidation tags
 * keep working.
 */

export async function getHomePageData() {
  const allAuthors = getAllAuthors()
  const allWorks = getAllWorks()
  return {
    authorCount: allAuthors.length,
    workCount: allWorks.length,
    sourceCount: getStatsRaw().total_sources,
    recentAuthors: getRecentAuthors(6),
    allPeriods: getAuthorLifespanPeriods(),
    allAuthors: allAuthors.map((a) => ({ id: a.id, language: a.language })),
  }
}

export async function getTimelineData() {
  return {
    authors: getAllAuthors(),
    periods: getAllPeriods(),
    works: getAllWorks(),
  }
}

export async function getStats() {
  return getStatsRaw()
}

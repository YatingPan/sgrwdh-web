import { Period } from './types'

export function formatYear(year: number | null): string {
  if (year === null) return '?'
  if (year < 0) return `${Math.abs(year)} BCE`
  return `${year} CE`
}

export function formatPeriod(period: Period): string {
  const start = period.start_year_earliest ?? period.start_year_latest
  const end = period.end_year_latest ?? period.end_year_earliest
  return `${formatYear(start)} – ${formatYear(end)}`
}

/** 将数据库中的 <i>text</i> 和 <b>text</b> 转为 HTML */
export function renderDbMarkup(text: string): string {
  return text
    .replace(/<i>(.*?)<\/i>/g, '<em>$1</em>')
    .replace(/<b>(.*?)<\/b>/g, '<strong>$1</strong>')
}

/** Strip HTML tags for plain text display (e.g. truncation) */
export function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, '')
}

/** Truncate text to a given number of characters */
export function truncate(text: string | null, maxLength: number): string {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '...'
}

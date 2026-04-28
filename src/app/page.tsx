export const revalidate = 3600

import Link from 'next/link'
import { Search, Users, BookOpen, Library, Calendar } from 'lucide-react'
import { Author, Period } from '@/lib/types'
import { getHomePageData } from '@/lib/cached-queries'
import AuthorCard from '@/components/AuthorCard'
import LanguagePieChart from '@/components/LanguagePieChart'
import CenturyBarChart from '@/components/CenturyBarChart'

function yearToCentury(year: number): string {
  if (year < 0) {
    const c = Math.ceil(Math.abs(year) / 100)
    const suffix = c === 1 ? 'st' : c === 2 ? 'nd' : c === 3 ? 'rd' : 'th'
    return `${c}${suffix} BCE`
  }
  const c = Math.ceil(year / 100) || 1
  const suffix = c === 1 ? 'st' : c === 2 ? 'nd' : c === 3 ? 'rd' : 'th'
  return `${c}${suffix} CE`
}

function centurySortKey(label: string): number {
  const match = label.match(/(\d+)(st|nd|rd|th)\s+(BCE|CE)/)
  if (!match) return 0
  const num = parseInt(match[1])
  return match[3] === 'BCE' ? -num : num
}

export default async function HomePage() {
  const { authorCount, workCount, sourceCount, recentAuthors, allPeriods, allAuthors } =
    await getHomePageData()

  const periodMap = (allPeriods as Period[]).reduce<Record<string, Period>>(
    (acc, p) => {
      acc[p.corresponding_id] = p
      return acc
    },
    {}
  )

  // Language distribution for pie chart
  const langCounts: Record<string, number> = {}
  for (const a of allAuthors as { id: string; language: string | null }[]) {
    const lang = a.language || 'Other'
    langCounts[lang] = (langCounts[lang] || 0) + 1
  }
  const pieData = Object.entries(langCounts).map(([name, value]) => ({ name, value }))

  // Century distribution for bar chart
  const authorLangMap: Record<string, string> = {}
  for (const a of allAuthors as { id: string; language: string | null }[]) {
    authorLangMap[a.id] = a.language || 'Other'
  }

  const centuryMap: Record<string, { Greek: number; Latin: number; Other: number }> = {}
  for (const p of allPeriods as Period[]) {
    const year = p.start_year_earliest ?? p.start_year_latest
    if (year === null) continue
    const century = yearToCentury(year)
    if (!centuryMap[century]) centuryMap[century] = { Greek: 0, Latin: 0, Other: 0 }
    const lang = authorLangMap[p.corresponding_id] || 'Other'
    const key = lang === 'Greek' ? 'Greek' : lang === 'Latin' ? 'Latin' : 'Other'
    centuryMap[century][key]++
  }

  const barData = Object.entries(centuryMap)
    .map(([century, counts]) => ({ century, ...counts }))
    .sort((a, b) => centurySortKey(a.century) - centurySortKey(b.century))

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `repeating-linear-gradient(
              90deg,
              #1e3a5f 0px, #1e3a5f 1px, transparent 1px, transparent 60px
            ),
            repeating-linear-gradient(
              0deg,
              #1e3a5f 0px, #1e3a5f 1px, transparent 1px, transparent 60px
            )`,
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary tracking-tight">
              Sources of the Greco-Roman World
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted leading-relaxed">
              A structured database of classical authors, works, and their historical context
            </p>

            <form action="/search" className="mt-10 max-w-xl mx-auto">
              <div className="relative">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                  size={20}
                />
                <input
                  type="text"
                  name="q"
                  placeholder="Search authors, works, or ask a question..."
                  className="w-full pl-12 pr-4 py-4 rounded-lg border border-border bg-card text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-base"
                />
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<Users size={24} />} value={String(authorCount)} label="Authors" />
          <StatCard icon={<BookOpen size={24} />} value={String(workCount)} label="Works" />
          <StatCard icon={<Library size={24} />} value={String(sourceCount)} label="Sources" />
          <StatCard
            icon={<Calendar size={24} />}
            value="800 BCE – 800 CE"
            label="Time Span"
          />
        </div>
      </section>

      {/* Database Overview Charts */}
      {(pieData.length > 0 || barData.length > 0) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-3xl font-bold text-primary mb-8">Database Overview</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {pieData.length > 0 && <LanguagePieChart data={pieData} />}
            {barData.length > 0 && <CenturyBarChart data={barData} />}
          </div>
        </section>
      )}

      {/* Recently Added Authors */}
      {recentAuthors.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-primary">Recently Added</h2>
            <Link href="/authors" className="text-accent font-medium hover:underline text-sm">
              View all authors &rarr;
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(recentAuthors as Author[]).map((author) => (
              <AuthorCard key={author.id} author={author} period={periodMap[author.id]} />
            ))}
          </div>
        </section>
      )}

      {/* Quick Links */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <h2 className="text-3xl font-bold text-primary mb-8">Explore the Database</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <QuickLink
            href="/authors"
            title="Browse Authors"
            desc="Explore Greek and Latin authors from the archaic to late imperial period."
          />
          <QuickLink
            href="/works"
            title="Browse Works"
            desc="Discover literary works spanning historiography, poetry, philosophy, and more."
          />
          <QuickLink
            href="/timeline"
            title="Timeline Visualization"
            desc="See authors and works plotted across time with interactive D3.js charts."
          />
        </div>
      </section>

      {/* About Preview */}
      <section className="bg-primary/5 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-primary mb-6">About the Project</h2>
            <p className="text-foreground leading-relaxed mb-4">
              SGRWDH (Sources of the Greco-Roman World and Digital Humanities) is a collaborative
              research project building a structured, machine-readable database of classical
              authors and their works. The project leverages agent-assisted data curation to
              systematically catalog Greek and Roman literary sources.
            </p>
            <p className="text-muted leading-relaxed mb-6">
              A collaboration between Hendrikus van Wijlick, Wenyi Shang, and Yating Pan.
            </p>
            <Link href="/about" className="text-accent font-medium hover:underline">
              Learn more about the project &rarr;
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: string
  label: string
}) {
  return (
    <div className="bg-card rounded-lg border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="text-primary mb-2">{icon}</div>
      <div className="text-2xl font-bold text-foreground font-serif">{value}</div>
      <div className="text-sm text-muted">{label}</div>
    </div>
  )
}

function QuickLink({
  href,
  title,
  desc,
}: {
  href: string
  title: string
  desc: string
}) {
  return (
    <Link
      href={href}
      className="block bg-card rounded-lg border border-border p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group"
    >
      <h3 className="text-xl font-bold text-primary group-hover:text-accent transition-colors font-serif">
        {title}
      </h3>
      <p className="mt-2 text-muted text-sm leading-relaxed">{desc}</p>
    </Link>
  )
}

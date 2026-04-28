import Link from 'next/link'
import { ExternalLink } from 'lucide-react'

const externalLinks = [
  { label: 'Trismegistos', href: 'https://www.trismegistos.org' },
  { label: 'CIRIS', href: 'https://ciris.bbaw.de' },
  { label: 'GitHub', href: 'https://github.com' },
]

const contributors = [
  {
    name: 'Hendrikus van Wijlick',
    href: 'https://www.history.pku.edu.cn/jszy/HendrikusAntoniusvanWijlick/498a3de738b9411aaa8f26e2940948fa.htm',
  },
  {
    name: 'Wenyi Shang',
    href: 'https://cehd.missouri.edu/person/wenyi-shang/',
  },
  {
    name: 'Yating Pan',
    href: 'https://pkudh.org/member/yating.html',
  },
]

export default function Footer() {
  return (
    <footer className="bg-primary text-white/80 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm space-y-1">
            <p>
              SGRWDH —{' '}
              {contributors.map((c, i) => (
                <span key={c.name}>
                  <a
                    href={c.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-white/30 underline-offset-2 hover:text-white"
                  >
                    {c.name}
                  </a>
                  {i < contributors.length - 1 ? ', ' : ''}
                </span>
              ))}
            </p>
            <p className="text-white/50 text-xs">
              Data license:{' '}
              <a
                href="https://creativecommons.org/licenses/by-sa/4.0/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white/70"
              >
                CC BY-SA 4.0
              </a>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/about#citation" className="text-sm hover:text-white transition-colors">
              How to Cite
            </Link>
            {externalLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm hover:text-white transition-colors flex items-center gap-1"
              >
                {link.label}
                <ExternalLink size={12} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

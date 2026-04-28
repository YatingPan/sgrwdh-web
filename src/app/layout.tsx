import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: {
    default: 'SGRWDH — Greco-Roman Authors Database',
    template: '%s | SGRWDH',
  },
  description:
    'Sources of the Greco-Roman World and Digital Humanities: a structured database of classical authors, works, and their historical context.',
  keywords: [
    'classical studies',
    'Greek',
    'Roman',
    'digital humanities',
    'ancient history',
    'historiography',
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col pt-16" suppressHydrationWarning>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}

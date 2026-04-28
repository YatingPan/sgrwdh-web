import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <h1 className="text-6xl font-bold text-primary font-serif mb-4">404</h1>
      <p className="text-xl text-muted mb-8">
        This page could not be found — perhaps it was lost like a fragment of Ennius.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
      >
        Return Home
      </Link>
    </div>
  )
}

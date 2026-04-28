import type { NextRequest } from 'next/server'

/**
 * HTTP Basic Auth gate for the whole site.
 *
 * - Active only when `SITE_PASSWORD` is set as an environment variable.
 *   This means local `npm run dev` (where you typically don't set it)
 *   stays open, while a Vercel deployment with the var set is locked.
 *
 * - Username defaults to "sgrwdh" but can be overridden with
 *   `SITE_USERNAME`.
 *
 * - On wrong / missing credentials we return 401 with a
 *   `WWW-Authenticate: Basic` header, which makes the browser show its
 *   native login dialog. After a successful login the browser caches
 *   the credentials for the rest of the session, so collaborators only
 *   type the password once per browser.
 *
 * Note: Basic Auth is base64-encoded but not encrypted — the actual
 * encryption is provided by Vercel's HTTPS. This is enough to keep
 * casual visitors out, not to defend against a determined attacker.
 *
 * Next.js 16 renamed the `middleware` file to `proxy`; the export is
 * also called `proxy`. Functionality is unchanged.
 */

const REALM = 'SGRWDH (private preview)'

export function proxy(request: NextRequest) {
  const expectedPassword = process.env.SITE_PASSWORD
  const expectedUsername = process.env.SITE_USERNAME ?? 'sgrwdh'

  // Site is open when no password is configured (e.g. local dev).
  if (!expectedPassword) return

  const auth = request.headers.get('authorization')
  if (auth?.startsWith('Basic ')) {
    let decoded = ''
    try {
      decoded = atob(auth.slice(6))
    } catch {
      // malformed header; fall through to 401
    }
    const sep = decoded.indexOf(':')
    if (sep > 0) {
      const u = decoded.slice(0, sep)
      const p = decoded.slice(sep + 1)
      if (u === expectedUsername && p === expectedPassword) {
        return // authorized — let the request through
      }
    }
  }

  return new Response('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': `Basic realm="${REALM}", charset="UTF-8"`,
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}

export const config = {
  // Apply to every page, but skip Next.js internals + static assets so
  // CSS/JS/images load before the user authenticates.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

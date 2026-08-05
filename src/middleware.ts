import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This is a personal prototype using RealTruck's real branding, deployed
// to a public Vercel URL — this gate exists so a stray link never reaches
// someone outside the intended audience, not to withstand a determined
// attacker. See /site-login for the entry form.
const PUBLIC_PATHS = ['/site-login', '/api/site-login', '/api/webhooks', '/robots.txt']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  const sitePassword = process.env.SITE_PASSWORD
  // No gate configured (e.g. local dev without the env var set) — don't
  // lock anyone out of their own machine.
  if (!sitePassword) {
    return NextResponse.next()
  }

  if (request.cookies.get('site_access')?.value === sitePassword) {
    return NextResponse.next()
  }

  const loginUrl = new URL('/site-login', request.url)
  loginUrl.searchParams.set('next', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}

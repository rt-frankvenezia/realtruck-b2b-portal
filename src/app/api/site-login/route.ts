import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const formData = await request.formData()
  const password = formData.get('password')
  const next = (formData.get('next') as string) || '/'

  const expected = process.env.SITE_PASSWORD
  if (!expected || password !== expected) {
    const url = new URL('/site-login', request.url)
    url.searchParams.set('error', '1')
    url.searchParams.set('next', next)
    return NextResponse.redirect(url, { status: 303 })
  }

  const response = NextResponse.redirect(new URL(next, request.url), { status: 303 })
  // Not hashed — this is a low-stakes "keep this off Google and out of
  // strangers' hands" gate, not a real auth system. Matches the "mocked
  // secure" posture already used elsewhere in this prototype.
  response.cookies.set('site_access', expected, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
  return response
}

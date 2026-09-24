import { NextRequest, NextResponse } from 'next/server'
import { DEMO_USERS } from '@/lib/mock/session'

export async function POST(req: NextRequest) {
  const { userId } = await req.json()
  const valid = DEMO_USERS.find((u) => u.id === userId)
  if (!valid) return NextResponse.json({ error: 'Invalid user' }, { status: 400 })

  const res = NextResponse.json({ ok: true })
  res.cookies.set('demo_user', userId, {
    path: '/',
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 7,
  })
  return res
}

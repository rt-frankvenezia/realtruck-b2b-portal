import { cache } from 'react'
import { cookies } from 'next/headers'
import { DEMO_USERS } from '@/lib/mock/session'
import type { Tables } from '@/lib/database.types'

export type CurrentUser = {
  authId: string
  email: string
  profile: Tables<'users'>
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const cookieStore = await cookies()
  const userId = cookieStore.get('demo_user')?.value ?? DEMO_USERS[0].id

  const demoUser = DEMO_USERS.find((u) => u.id === userId) ?? DEMO_USERS[0]

  const { USERS } = await import('@/lib/mock/fixtures')
  const profile = USERS.find((u) => u.id === demoUser.id)
  if (!profile) return null

  return {
    authId: demoUser.id,
    email: demoUser.email,
    profile: profile as Tables<'users'>,
  }
})

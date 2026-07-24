import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/lib/database.types'

export type CurrentUser = {
  authId: string
  email: string
  profile: Tables<'users'>
}

// Cached per-request: the dealer route tree calls this from two nested
// layouts (outer auth/header, inner account sidebar) plus the page itself.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
  if (!profile) return null

  return { authId: user.id, email: user.email ?? profile.email, profile }
})

export function portalPathForRole(role: Tables<'users'>['role']): string {
  switch (role) {
    case 'realtruck_admin':
      return '/admin'
    case 'dealer_admin':
    case 'location_admin':
    case 'staff':
      return '/dealer'
    case 'customer':
      return '/account'
  }
}

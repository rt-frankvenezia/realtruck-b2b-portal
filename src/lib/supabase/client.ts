import { createMockClient } from '@/lib/mock/client'
import { DEMO_USERS } from '@/lib/mock/session'

export function createClient(): any {
  let userId = DEMO_USERS[0].id
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/demo_user=([^;]+)/)
    if (match) userId = match[1]
  }
  return createMockClient(userId)
}

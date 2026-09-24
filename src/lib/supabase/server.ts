import { cookies } from 'next/headers'
import { createMockClient } from '@/lib/mock/client'
import { DEMO_USERS } from '@/lib/mock/session'

export async function createClient(): Promise<any> {
  const cookieStore = await cookies()
  const userId = cookieStore.get('demo_user')?.value ?? DEMO_USERS[0].id
  return createMockClient(userId)
}

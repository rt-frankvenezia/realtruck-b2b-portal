import { createMockClient } from '@/lib/mock/client'
import { DEMO_USERS } from '@/lib/mock/session'

// In mock mode the admin client has the same fixture-backed behaviour as the
// regular server client — service-role bypass is irrelevant with no database.
export function createAdminClient(): any {
  return createMockClient(DEMO_USERS[0].id)
}

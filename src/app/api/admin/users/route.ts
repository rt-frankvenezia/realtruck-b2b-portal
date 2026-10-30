import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { FIXTURE_MAP } from '@/lib/mock/client'

// Creating a real login requires the service role (auth.admin.*), which the
// browser client can never hold — so this has to be a server route, not a
// direct RLS-gated table insert like the rest of the admin CRUD. Mirrors
// enforce_user_role_rules and CreateUserDialog's availableRoles-by-creator.
const ASSIGNABLE_ROLES_BY_CREATOR: Record<string, string[]> = {
  realtruck_admin: ['realtruck_admin', 'dealer_admin', 'location_admin', 'staff'],
  dealer_admin: ['dealer_admin', 'location_admin', 'staff'],
  location_admin: ['location_admin', 'staff'],
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: caller } = await supabase.from('users').select('role, company_id').eq('id', user.id).single()
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const { email, name, role, companyId, locationIds } = body ?? {}

  if (typeof email !== 'string' || typeof name !== 'string' || typeof role !== 'string') {
    return NextResponse.json({ error: 'email, name, and role are required' }, { status: 400 })
  }

  const allowedRoles = ASSIGNABLE_ROLES_BY_CREATOR[caller.role]
  if (!allowedRoles) {
    return NextResponse.json({ error: 'Not authorized to create users' }, { status: 403 })
  }
  if (!allowedRoles.includes(role)) {
    return NextResponse.json({ error: `${caller.role} cannot create a ${role} user` }, { status: 403 })
  }
  if (caller.role !== 'realtruck_admin' && companyId !== caller.company_id) {
    return NextResponse.json({ error: 'You can only create users within your own company' }, { status: 403 })
  }

  // location_admin can only assign a new user to locations they themselves manage.
  if (caller.role === 'location_admin' && Array.isArray(locationIds) && locationIds.length > 0) {
    const { data: ownLocations } = await supabase.from('user_locations').select('location_id').eq('user_id', user.id)
    const ownLocationIds = new Set((ownLocations ?? []).map((l: any) => l.location_id))
    if (locationIds.some((id: string) => !ownLocationIds.has(id))) {
      return NextResponse.json({ error: 'You can only assign users to your own locations' }, { status: 403 })
    }
  }

  const now = new Date().toISOString()
  const userId = crypto.randomUUID()
  const tempPassword = crypto.randomUUID()

  const usersArr = FIXTURE_MAP['users']
  if (!usersArr) return NextResponse.json({ error: 'users table not found' }, { status: 500 })

  usersArr.push({
    id: userId,
    email,
    name,
    role,
    company_id: companyId ?? null,
    status: 'active',
    created_at: now,
    updated_at: now,
  })

  if (Array.isArray(locationIds) && locationIds.length > 0) {
    const userLocArr = FIXTURE_MAP['user_locations']
    if (userLocArr) {
      for (const locationId of locationIds) {
        userLocArr.push({ id: crypto.randomUUID(), user_id: userId, location_id: locationId, created_at: now })
      }
    }
  }

  revalidatePath('/admin', 'layout')
  return NextResponse.json({ ok: true, userId, tempPassword })
}

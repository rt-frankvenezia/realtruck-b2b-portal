import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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
    const ownLocationIds = new Set((ownLocations ?? []).map((l) => l.location_id))
    if (locationIds.some((id: string) => !ownLocationIds.has(id))) {
      return NextResponse.json({ error: 'You can only assign users to your own locations' }, { status: 403 })
    }
  }

  const admin = createAdminClient()
  const tempPassword = crypto.randomUUID()

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { name, role, company_id: companyId ?? null },
  })

  if (createError) return NextResponse.json({ error: createError.message }, { status: 400 })

  if (Array.isArray(locationIds) && locationIds.length > 0) {
    const rows = locationIds.map((locationId: string) => ({ user_id: created.user.id, location_id: locationId }))
    const { error: locError } = await admin.from('user_locations').insert(rows)
    if (locError) return NextResponse.json({ error: locError.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true, userId: created.user.id, tempPassword })
}

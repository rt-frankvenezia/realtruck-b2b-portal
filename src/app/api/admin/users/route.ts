import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Creating a real login requires the service role (auth.admin.*), which the
// browser client can never hold — so this has to be a server route, not a
// direct RLS-gated table insert like the rest of the admin CRUD.
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

  // Mirror enforce_user_role_rules: dealer_admin can only create staff in
  // their own company; only realtruck_admin can create anything else.
  if (caller.role === 'dealer_admin') {
    if (role !== 'staff' || companyId !== caller.company_id) {
      return NextResponse.json({ error: 'dealer_admin can only invite staff within their own company' }, { status: 403 })
    }
  } else if (caller.role !== 'realtruck_admin') {
    return NextResponse.json({ error: 'Not authorized to create users' }, { status: 403 })
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

import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Building2, CheckCircle2, MapPin } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserStatusSelect } from '@/components/admin/UserStatusSelect'
import { USER_ROLE_LABEL, ROLE_PERMISSIONS, formatDate } from '@/lib/status-labels'

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: user }, { data: userLocations }] = await Promise.all([
    supabase.from('users').select('*, companies!users_company_id_fkey(id, name)').eq('id', id).maybeSingle(),
    supabase.from('user_locations').select('locations(id, name)').eq('user_id', id),
  ])

  if (!user) notFound()

  // dealer_admin's scope is their whole company's locations (not a narrow
  // assignment); location_admin/staff only have what's in user_locations.
  let assignedLocations: { id: string; name: string }[] = []
  if (user.role === 'dealer_admin' && user.company_id) {
    const { data: companyLocations } = await supabase.from('locations').select('id, name').eq('company_id', user.company_id).order('name')
    assignedLocations = companyLocations ?? []
  } else {
    assignedLocations = (userLocations ?? []).flatMap((row) => (row.locations ? [row.locations] : []))
  }

  const permissions = ROLE_PERMISSIONS[user.role]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{user.name}</h1>
          <p className="text-muted-foreground">
            {USER_ROLE_LABEL[user.role]} {user.companies ? `at ${user.companies.name}` : ''}
          </p>
        </div>
        <UserStatusSelect userId={user.id} status={user.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <Field label="Email" value={user.email} />
            <Field label="Phone" value={user.phone_number} />
            <Field label="Created" value={formatDate(user.created_at)} />
            <Field label="Last Login" value={user.last_login_at ? formatDate(user.last_login_at) : 'Never'} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Access & Permissions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            {user.companies && (
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Company</p>
                <div className="flex items-center gap-2 rounded-md border p-2">
                  <Building2 size={16} className="text-muted-foreground" />
                  <span className="font-medium">{user.companies.name}</span>
                </div>
              </div>
            )}

            {assignedLocations.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Assigned Locations ({assignedLocations.length})</p>
                <div className="flex flex-col gap-2">
                  {assignedLocations.map((loc) => (
                    <div key={loc.id} className="flex items-center gap-2 rounded-md border p-2">
                      <MapPin size={16} className="text-muted-foreground" />
                      <span>{loc.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Permissions</p>
              <div className="flex flex-col gap-2">
                {permissions.map((p) => (
                  <div key={p.title} className="rounded-md border border-blue-200 bg-blue-50 p-3">
                    <div className="flex items-center gap-2 font-medium text-blue-900">
                      <CheckCircle2 size={16} />
                      {p.title}
                    </div>
                    <p className="mt-0.5 text-muted-foreground">{p.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p>{value || '—'}</p>
    </div>
  )
}

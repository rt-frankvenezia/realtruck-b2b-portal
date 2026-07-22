import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserStatusSelect } from '@/components/admin/UserStatusSelect'
import { USER_ROLE_LABEL, formatDate } from '@/lib/status-labels'

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: user }, { data: assignedLocations }] = await Promise.all([
    supabase.from('users').select('*, companies!users_company_id_fkey(name)').eq('id', id).maybeSingle(),
    supabase.from('user_locations').select('locations(id, name)').eq('user_id', id),
  ])

  if (!user) notFound()

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

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Email</p>
            <p>{user.email}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Phone</p>
            <p>{user.phone_number ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Last Login</p>
            <p>{user.last_login_at ? formatDate(user.last_login_at) : 'Never'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Created</p>
            <p>{formatDate(user.created_at)}</p>
          </div>
        </CardContent>
      </Card>

      {user.role === 'location_admin' && (
        <Card>
          <CardHeader>
            <CardTitle>Assigned Locations</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {(assignedLocations ?? []).length > 0 ? (
              <ul className="flex flex-col gap-1">
                {(assignedLocations ?? []).map((row) => (
                  <li key={row.locations?.id}>{row.locations?.name}</li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No locations assigned.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CreateUserDialog } from '@/components/admin/CreateUserDialog'
import { USER_ROLE_LABEL, USER_STATUS_LABEL, USER_STATUS_VARIANT } from '@/lib/status-labels'

export default async function DealerTeamPage() {
  const user = await getCurrentUser()
  const supabase = await createClient()
  if (!user?.profile.company_id) return null

  const [{ data: allUsers }, { data: locations }, { data: ownLocations }] = await Promise.all([
    supabase.from('users').select('*').eq('company_id', user.profile.company_id).order('name'),
    supabase.from('locations').select('id, name, company_id').eq('company_id', user.profile.company_id),
    supabase.from('user_locations').select('location_id').eq('user_id', user.authId),
  ])

  const restrictToLocationIds = user.profile.role === 'location_admin' ? (ownLocations ?? []).map((l) => l.location_id) : undefined

  // users_select RLS grants company-wide visibility to every dealer role
  // (edit rights, not view rights, are what's actually scoped) — but the
  // prototype's UserList.tsx only *displays* users sharing one of a
  // location_admin's assigned locations, so filter for that here.
  let users = allUsers ?? []
  if (user.profile.role === 'location_admin') {
    const { data: locationUserRows } = await supabase
      .from('user_locations')
      .select('user_id')
      .in('location_id', restrictToLocationIds ?? [])
    const visibleIds = new Set((locationUserRows ?? []).map((r) => r.user_id))
    users = users.filter((u) => visibleIds.has(u.id))
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Team</h1>
          <p className="text-muted-foreground">
            {user.profile.role === 'location_admin' ? 'Users at your assigned locations.' : 'Everyone at your dealership.'}
          </p>
        </div>
        <CreateUserDialog
          creatorRole={user.profile.role}
          companies={[{ id: user.profile.company_id, name: '' }]}
          locations={(locations ?? []).map((l) => ({ id: l.id, name: l.name, company_id: l.company_id }))}
          defaultCompanyId={user.profile.company_id}
          restrictToLocationIds={restrictToLocationIds}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <Link href={`/dealer/team/${u.id}`} className="font-medium hover:underline">
                      {u.name}
                    </Link>
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{USER_ROLE_LABEL[u.role]}</TableCell>
                  <TableCell>
                    <Badge variant={USER_STATUS_VARIANT[u.status]}>{USER_STATUS_LABEL[u.status]}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No team members yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

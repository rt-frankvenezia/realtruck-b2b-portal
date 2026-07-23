import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CreateUserDialog } from '@/components/admin/CreateUserDialog'
import { SortableHeader } from '@/components/admin/SortableHeader'
import { USER_ROLE_LABEL, USER_STATUS_LABEL, USER_STATUS_VARIANT } from '@/lib/status-labels'
import type { Database } from '@/lib/database.types'

type UserRole = Database['public']['Enums']['user_role']
type UserStatus = Database['public']['Enums']['user_status']

const ROLE_FILTERS: { label: string; value: UserRole | 'all' }[] = [
  { label: 'All Roles', value: 'all' },
  { label: 'RealTruck Admin', value: 'realtruck_admin' },
  { label: 'Dealer Admin', value: 'dealer_admin' },
  { label: 'Location Admin', value: 'location_admin' },
  { label: 'Staff', value: 'staff' },
  { label: 'Customer', value: 'customer' },
]

const STATUS_FILTERS: { label: string; value: UserStatus | 'all' }[] = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Invited', value: 'invited' },
  { label: 'Disabled', value: 'disabled' },
]

const ADMIN_ROLES: UserRole[] = ['realtruck_admin', 'dealer_admin', 'location_admin']

type UserRow = {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  companies: { name: string } | null
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; status?: string; sort?: string; dir?: string }>
}) {
  const { q, role, status, sort, dir } = await searchParams
  const supabase = await createClient()
  const [{ data: users }, { data: companies }, { data: locations }, { data: userLocations }] = await Promise.all([
    supabase.from('users').select('*, companies!users_company_id_fkey(name)').order('name'),
    supabase.from('companies').select('id, name').order('name'),
    supabase.from('locations').select('id, name, company_id').order('name'),
    supabase.from('user_locations').select('user_id, locations(name)'),
  ])

  const locationsByUser = new Map<string, string[]>()
  for (const row of userLocations ?? []) {
    if (!row.locations) continue
    const list = locationsByUser.get(row.user_id) ?? []
    list.push(row.locations.name)
    locationsByUser.set(row.user_id, list)
  }

  const activeRole = (ROLE_FILTERS.find((f) => f.value === role)?.value ?? 'all') as UserRole | 'all'
  const activeStatus = (STATUS_FILTERS.find((f) => f.value === status)?.value ?? 'all') as UserStatus | 'all'

  let filtered = (users ?? []).filter((u) => {
    if (activeRole !== 'all' && u.role !== activeRole) return false
    if (activeStatus !== 'all' && u.status !== activeStatus) return false
    if (q && !`${u.name} ${u.email} ${u.companies?.name ?? ''}`.toLowerCase().includes(q.toLowerCase())) return false
    return true
  })

  const ACCESSORS: Record<string, (u: UserRow) => string> = {
    name: (u) => u.name.toLowerCase(),
    email: (u) => u.email.toLowerCase(),
    role: (u) => u.role,
    company: (u) => u.companies?.name.toLowerCase() ?? '',
    status: (u) => u.status,
  }
  if (sort && ACCESSORS[sort]) {
    const acc = ACCESSORS[sort]
    filtered = [...filtered].sort((a, b) => {
      const av = acc(a)
      const bv = acc(b)
      return av < bv ? -1 : av > bv ? 1 : 0
    })
    if (dir === 'desc') filtered.reverse()
  }

  const stats = {
    total: users?.length ?? 0,
    active: users?.filter((u) => u.status === 'active').length ?? 0,
    pendingInvites: users?.filter((u) => u.status === 'invited').length ?? 0,
    admins: users?.filter((u) => ADMIN_ROLES.includes(u.role)).length ?? 0,
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="text-muted-foreground">Manage all users across all dealer companies.</p>
        </div>
        <CreateUserDialog creatorRole="realtruck_admin" companies={companies ?? []} locations={locations ?? []} />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Active Users</CardDescription>
            <CardTitle className="text-3xl">{stats.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Pending Invites</CardDescription>
            <CardTitle className="text-3xl">{stats.pendingInvites}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Admin Users</CardDescription>
            <CardTitle className="text-3xl">{stats.admins}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <form className="flex gap-2">
        <Input name="q" defaultValue={q} placeholder="Search by name, email, or company..." className="max-w-md" />
        {role && <input type="hidden" name="role" value={role} />}
        {status && <input type="hidden" name="status" value={status} />}
      </form>

      <div className="flex flex-wrap items-center gap-2">
        {ROLE_FILTERS.map((f) => {
          const params = new URLSearchParams()
          if (f.value !== 'all') params.set('role', f.value)
          if (status) params.set('status', status)
          const href = params.size > 0 ? `/admin/users?${params.toString()}` : '/admin/users'
          return (
            <Link
              key={f.value}
              href={href}
              className={`rounded-full px-3 py-1 text-sm ${
                activeRole === f.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {f.label}
            </Link>
          )
        })}
        <span className="mx-1 text-muted-foreground">|</span>
        {STATUS_FILTERS.map((f) => {
          const params = new URLSearchParams()
          if (role) params.set('role', role)
          if (f.value !== 'all') params.set('status', f.value)
          const href = params.size > 0 ? `/admin/users?${params.toString()}` : '/admin/users'
          return (
            <Link
              key={f.value}
              href={href}
              className={`rounded-full px-3 py-1 text-sm ${
                activeStatus === f.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {f.label}
            </Link>
          )
        })}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortableHeader column="name" label="User Name" />
                </TableHead>
                <TableHead>
                  <SortableHeader column="email" label="Email" />
                </TableHead>
                <TableHead>
                  <SortableHeader column="role" label="Role" />
                </TableHead>
                <TableHead>
                  <SortableHeader column="company" label="Company" />
                </TableHead>
                <TableHead>Location(s)</TableHead>
                <TableHead>
                  <SortableHeader column="status" label="Status" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <Link href={`/admin/users/${u.id}`} className="font-medium hover:underline">
                      {u.name}
                    </Link>
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{USER_ROLE_LABEL[u.role]}</TableCell>
                  <TableCell>{u.companies?.name ?? '—'}</TableCell>
                  <TableCell>{(locationsByUser.get(u.id) ?? []).join(', ') || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={USER_STATUS_VARIANT[u.status]}>{USER_STATUS_LABEL[u.status]}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No users match your search.
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

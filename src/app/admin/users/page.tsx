import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CreateUserDialog } from '@/components/admin/CreateUserDialog'
import { USER_ROLE_LABEL, USER_STATUS_LABEL, USER_STATUS_VARIANT } from '@/lib/status-labels'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const [{ data: users }, { data: companies }, { data: locations }] = await Promise.all([
    supabase.from('users').select('*, companies!users_company_id_fkey(name)').order('name'),
    supabase.from('companies').select('id, name').order('name'),
    supabase.from('locations').select('id, name, company_id').order('name'),
  ])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="text-muted-foreground">Every account across every role.</p>
        </div>
        <CreateUserDialog creatorRole="realtruck_admin" companies={companies ?? []} locations={locations ?? []} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(users ?? []).map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <Link href={`/admin/users/${u.id}`} className="font-medium hover:underline">
                      {u.name}
                    </Link>
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.companies?.name ?? '—'}</TableCell>
                  <TableCell>{USER_ROLE_LABEL[u.role]}</TableCell>
                  <TableCell>
                    <Badge variant={USER_STATUS_VARIANT[u.status]}>{USER_STATUS_LABEL[u.status]}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

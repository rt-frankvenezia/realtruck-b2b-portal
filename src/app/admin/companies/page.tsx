import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CreateCompanyDialog } from '@/components/admin/CreateCompanyDialog'
import { SortableHeader } from '@/components/admin/SortableHeader'
import { COMPANY_STATUS_LABEL, COMPANY_STATUS_VARIANT } from '@/lib/status-labels'
import type { Database, Tables } from '@/lib/database.types'

type CompanyStatus = Database['public']['Enums']['company_status']

const STATUS_FILTERS: { label: string; value: CompanyStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Pending Provisioning', value: 'pending_provisioning' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Closed', value: 'closed' },
]

export default async function AdminCompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; sort?: string; dir?: string }>
}) {
  const { q, status, sort, dir } = await searchParams
  const supabase = await createClient()
  const [{ data: companies }, { data: locationCounts }, { data: userCounts }] = await Promise.all([
    supabase.from('companies').select('*').order('name'),
    supabase.from('locations').select('company_id'),
    supabase.from('users').select('company_id'),
  ])

  const locationCountByCompany = new Map<string, number>()
  for (const l of locationCounts ?? []) {
    locationCountByCompany.set(l.company_id, (locationCountByCompany.get(l.company_id) ?? 0) + 1)
  }
  const userCountByCompany = new Map<string, number>()
  for (const u of userCounts ?? []) {
    if (u.company_id) userCountByCompany.set(u.company_id, (userCountByCompany.get(u.company_id) ?? 0) + 1)
  }

  const activeStatus = (STATUS_FILTERS.find((f) => f.value === status)?.value ?? 'all') as CompanyStatus | 'all'
  let filtered = (companies ?? []).filter((c) => {
    if (activeStatus !== 'all' && c.status !== activeStatus) return false
    if (q && !`${c.name} ${c.code}`.toLowerCase().includes(q.toLowerCase())) return false
    return true
  })

  const ACCESSORS: Record<string, (c: Tables<'companies'>) => string | number> = {
    name: (c) => c.name.toLowerCase(),
    code: (c) => c.code.toLowerCase(),
    status: (c) => c.status,
    locations: (c) => locationCountByCompany.get(c.id) ?? 0,
    users: (c) => userCountByCompany.get(c.id) ?? 0,
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
    total: companies?.length ?? 0,
    active: companies?.filter((c) => c.status === 'active').length ?? 0,
    totalLocations: locationCounts?.length ?? 0,
    totalUsers: userCounts?.filter((u) => u.company_id).length ?? 0,
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Companies</h1>
          <p className="text-muted-foreground">Dealer organizations across the network.</p>
        </div>
        <CreateCompanyDialog />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Total Companies</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Active Companies</CardDescription>
            <CardTitle className="text-3xl">{stats.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total Locations</CardDescription>
            <CardTitle className="text-3xl">{stats.totalLocations}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-3xl">{stats.totalUsers}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <form className="flex gap-2">
        <Input name="q" defaultValue={q} placeholder="Search by company name or code..." className="max-w-md" />
        {status && <input type="hidden" name="status" value={status} />}
      </form>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value === 'all' ? '/admin/companies' : `/admin/companies?status=${f.value}`}
            className={`rounded-full px-3 py-1 text-sm ${
              activeStatus === f.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortableHeader column="name" label="Name" />
                </TableHead>
                <TableHead>
                  <SortableHeader column="code" label="Code" />
                </TableHead>
                <TableHead>
                  <SortableHeader column="status" label="Status" />
                </TableHead>
                <TableHead>
                  <SortableHeader column="locations" label="Locations" />
                </TableHead>
                <TableHead>
                  <SortableHeader column="users" label="Users" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((company) => (
                <TableRow key={company.id}>
                  <TableCell>
                    <Link href={`/admin/companies/${company.id}`} className="font-medium hover:underline">
                      {company.name}
                    </Link>
                  </TableCell>
                  <TableCell>{company.code}</TableCell>
                  <TableCell>
                    <Badge variant={COMPANY_STATUS_VARIANT[company.status]}>{COMPANY_STATUS_LABEL[company.status]}</Badge>
                  </TableCell>
                  <TableCell>{locationCountByCompany.get(company.id) ?? 0}</TableCell>
                  <TableCell>{userCountByCompany.get(company.id) ?? 0}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No companies match your search.
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

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CreateCompanyDialog } from '@/components/admin/CreateCompanyDialog'
import { COMPANY_STATUS_LABEL, COMPANY_STATUS_VARIANT } from '@/lib/status-labels'

export default async function AdminCompaniesPage() {
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Companies</h1>
          <p className="text-muted-foreground">Dealer organizations across the network.</p>
        </div>
        <CreateCompanyDialog />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Locations</TableHead>
                <TableHead>Users</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(companies ?? []).map((company) => (
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
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CompanyStatusSelect } from '@/components/admin/CompanyStatusSelect'
import { LocationStatusSelect } from '@/components/admin/LocationStatusSelect'
import { LocationApprovalDialog } from '@/components/admin/LocationApprovalDialog'
import { CompanyPricingGroupSelect } from '@/components/admin/CompanyPricingGroupSelect'
import { CreateLocationDialog } from '@/components/admin/CreateLocationDialog'
import { CreateUserDialog } from '@/components/admin/CreateUserDialog'
import { USER_ROLE_LABEL, USER_STATUS_LABEL, USER_STATUS_VARIANT } from '@/lib/status-labels'

export default async function AdminCompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: company }, { data: locations }, { data: users }, { data: pricingGroups }] = await Promise.all([
    supabase.from('companies').select('*').eq('id', id).maybeSingle(),
    supabase.from('locations').select('*').eq('company_id', id).order('name'),
    supabase.from('users').select('*').eq('company_id', id).order('name'),
    supabase.from('pricing_groups').select('id, name').order('name'),
  ])

  if (!company) notFound()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{company.name}</h1>
          <p className="text-muted-foreground">Code: {company.code}</p>
        </div>
        <CompanyStatusSelect companyId={company.id} status={company.status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Billing Address</p>
            <p>{[company.billing_address, company.billing_city, company.billing_state].filter(Boolean).join(', ') || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">A.R.E. Dealer</p>
            <p>{company.is_are_dealer ? 'Yes' : 'No'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Pricing Group</p>
            <CompanyPricingGroupSelect companyId={company.id} pricingGroupId={company.pricing_group_id} pricingGroups={pricingGroups ?? []} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Locations</CardTitle>
          <CreateLocationDialog companyId={company.id} />
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>City / State</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(locations ?? []).map((location) => (
                <TableRow key={location.id}>
                  <TableCell className="font-medium">{location.name}</TableCell>
                  <TableCell>{location.code}</TableCell>
                  <TableCell>{[location.city, location.state].filter(Boolean).join(', ') || '—'}</TableCell>
                  <TableCell>
                    {location.status === 'pending_approval' ? (
                      <LocationApprovalDialog locationId={location.id} companyIsActive={company.status === 'active'} />
                    ) : (
                      <LocationStatusSelect locationId={location.id} status={location.status} />
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {(locations ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No locations yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Users</CardTitle>
          <CreateUserDialog
            creatorRole="realtruck_admin"
            companies={[{ id: company.id, name: company.name }]}
            locations={(locations ?? []).map((l) => ({ id: l.id, name: l.name, company_id: l.company_id }))}
            defaultCompanyId={company.id}
          />
        </CardHeader>
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
              {(users ?? []).map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <Link href={`/admin/users/${u.id}`} className="font-medium hover:underline">
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
              {(users ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No users yet.
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

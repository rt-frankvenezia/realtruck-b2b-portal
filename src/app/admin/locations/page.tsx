import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { LocationStatusSelect } from '@/components/admin/LocationStatusSelect'
import { LocationApprovalDialog } from '@/components/admin/LocationApprovalDialog'

export default async function AdminLocationsPage() {
  const supabase = await createClient()
  const { data: locations } = await supabase
    .from('locations')
    .select('*, companies(id, name, status)')
    .order('name')

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Locations</h1>
        <p className="text-muted-foreground">Every dealer location across the network.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>City / State</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(locations ?? []).map((location) => (
                <TableRow key={location.id}>
                  <TableCell className="font-medium">{location.name}</TableCell>
                  <TableCell>
                    {location.companies && (
                      <Link href={`/admin/companies/${location.companies.id}`} className="hover:underline">
                        {location.companies.name}
                      </Link>
                    )}
                  </TableCell>
                  <TableCell>{[location.city, location.state].filter(Boolean).join(', ') || '—'}</TableCell>
                  <TableCell>
                    {location.status === 'pending_approval' ? (
                      <LocationApprovalDialog locationId={location.id} companyIsActive={location.companies?.status === 'active'} />
                    ) : (
                      <LocationStatusSelect locationId={location.id} status={location.status} />
                    )}
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

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CreateLocationDialog } from '@/components/admin/CreateLocationDialog'
import { LOCATION_STATUS_LABEL, LOCATION_STATUS_VARIANT } from '@/lib/status-labels'
import { Badge } from '@/components/ui/badge'

export default async function DealerLocationsPage() {
  const user = await getCurrentUser()
  const supabase = await createClient()

  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .eq('company_id', user?.profile.company_id ?? '')
    .order('name')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Locations</h1>
          <p className="text-muted-foreground">
            {user?.profile.role === 'location_admin' ? 'Your assigned locations.' : 'Every location at your dealership.'}
          </p>
        </div>
        {user?.profile.company_id && <CreateLocationDialog companyId={user.profile.company_id} />}
      </div>

      <Card>
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
                  <TableCell>
                    <Link href={`/dealer/locations/${location.id}`} className="font-medium hover:underline">
                      {location.name}
                    </Link>
                  </TableCell>
                  <TableCell>{location.code}</TableCell>
                  <TableCell>{[location.city, location.state].filter(Boolean).join(', ') || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={LOCATION_STATUS_VARIANT[location.status]}>{LOCATION_STATUS_LABEL[location.status]}</Badge>
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
    </div>
  )
}

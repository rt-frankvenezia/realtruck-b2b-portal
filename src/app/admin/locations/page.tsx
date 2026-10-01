import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { LocationStatusSelect } from '@/components/admin/LocationStatusSelect'
import { LocationApprovalDialog } from '@/components/admin/LocationApprovalDialog'
import type { Database } from '@/lib/database.types'

const PANEL = 'overflow-hidden rounded border border-[#d5d5d5] bg-white'
const PANEL_HEADER = 'bg-[#1E1E1E] px-4 py-3'

type LocationStatus = Database['public']['Enums']['location_status']

const STATUS_FILTERS: { label: string; value: LocationStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending Approval', value: 'pending_approval' },
  { label: 'Active', value: 'active' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Closed', value: 'closed' },
]

export default async function AdminLocationsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: statusParam } = await searchParams
  const activeFilter = (STATUS_FILTERS.find((f) => f.value === statusParam)?.value ?? 'all') as LocationStatus | 'all'

  const supabase = await createClient()
  const { data: allLocations } = await supabase.from('locations').select('*, companies(id, name, status)').order('name')

  // Pending-approval locations always sort first regardless of filter, matching the prototype's LocationList.
  const sorted = [...(allLocations ?? [])].sort((a, b) => {
    if (a.status === 'pending_approval' && b.status !== 'pending_approval') return -1
    if (b.status === 'pending_approval' && a.status !== 'pending_approval') return 1
    return 0
  })
  const locations = activeFilter === 'all' ? sorted : sorted.filter((l) => l.status === activeFilter)

  const stats = {
    total: allLocations?.length ?? 0,
    pending: allLocations?.filter((l) => l.status === 'pending_approval').length ?? 0,
    active: allLocations?.filter((l) => l.status === 'active').length ?? 0,
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Locations</h1>
        <p className="text-muted-foreground">Every dealer location across the network.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className={PANEL}>
          <div className={PANEL_HEADER}>
            <p className="text-sm text-white/70">Pending Approval</p>
            <h2 className="font-semibold text-white text-3xl">{stats.pending}</h2>
          </div>
        </div>
        <div className={PANEL}>
          <div className={PANEL_HEADER}>
            <p className="text-sm text-white/70">Active</p>
            <h2 className="font-semibold text-white text-3xl">{stats.active}</h2>
          </div>
        </div>
        <div className={PANEL}>
          <div className={PANEL_HEADER}>
            <p className="text-sm text-white/70">Total</p>
            <h2 className="font-semibold text-white text-3xl">{stats.total}</h2>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {STATUS_FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value === 'all' ? '/admin/locations' : `/admin/locations?status=${f.value}`}
            className={`rounded-full px-3 py-1 text-sm ${
              activeFilter === f.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className={PANEL}>
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
              {locations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell>
                    <Link href={`/dealer/locations/${location.id}`} className="font-medium hover:underline">
                      {location.name}
                    </Link>
                  </TableCell>
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
      </div>
    </div>
  )
}

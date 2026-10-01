import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { LocationAddressForm } from '@/components/dealer/LocationAddressForm'
import { LocationPricingOverride } from '@/components/dealer/LocationPricingOverride'
import { LOCATION_STATUS_LABEL, LOCATION_STATUS_VARIANT } from '@/lib/status-labels'
import type { Database } from '@/lib/database.types'

const PANEL = 'overflow-hidden rounded border border-[#d5d5d5] bg-white'
const PANEL_HEADER = 'bg-[#1E1E1E] px-4 py-3'
const PANEL_BODY = 'p-4'

export default async function DealerLocationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: location }, { data: assignedAdmins }] = await Promise.all([
    supabase.from('locations').select('*, companies(name, installation_pricing, supported_tiers)').eq('id', id).maybeSingle(),
    supabase.from('user_locations').select('users(id, name, email, status)').eq('location_id', id),
  ])

  if (!location) notFound()

  const companyDefaults = {
    installation_pricing: (location.companies?.installation_pricing as Record<string, number>) ?? {},
    supported_tiers: (location.companies?.supported_tiers as Database['public']['Enums']['installation_tier'][]) ?? [],
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{location.name}</h1>
          <p className="text-muted-foreground">Code: {location.code}</p>
        </div>
        <Badge variant={LOCATION_STATUS_VARIANT[location.status]}>{LOCATION_STATUS_LABEL[location.status]}</Badge>
      </div>

      {location.status === 'pending_approval' && (
        <div className={PANEL}>
          <div className="p-4 text-sm text-muted-foreground">
            This location is awaiting approval by RealTruck. A RealTruck admin needs to assign a location code and
            activate it before it can be used.
          </div>
        </div>
      )}

      <div className={PANEL}>
        <div className={PANEL_HEADER}>
          <h2 className="font-semibold text-white">Address &amp; Contact</h2>
          <p className="text-sm text-white/70">
            Location code, status, and regional sales manager are managed by RealTruck.
          </p>
        </div>
        <div className={PANEL_BODY}>
          <LocationAddressForm location={location} />
        </div>
      </div>

      <div className={PANEL}>
        <div className={PANEL_HEADER}>
          <h2 className="font-semibold text-white">Installation Pricing</h2>
          <p className="text-sm text-white/70">Override your company&apos;s default installation pricing for this location.</p>
        </div>
        <div className={PANEL_BODY}>
          <LocationPricingOverride location={location} companyDefaults={companyDefaults} companyName={location.companies?.name ?? 'your company'} />
        </div>
      </div>

      <div className={PANEL}>
        <div className={PANEL_HEADER}>
          <h2 className="font-semibold text-white">Assigned Location Admins</h2>
        </div>
        <div className="text-sm p-4">
          {(assignedAdmins ?? []).length > 0 ? (
            <ul className="flex flex-col gap-1">
              {(assignedAdmins ?? []).map((row) => (
                <li key={row.users?.id}>
                  {row.users?.name} — {row.users?.email}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">
              No location admins assigned yet. Assign them from the Team page.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

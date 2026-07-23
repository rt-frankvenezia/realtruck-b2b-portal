import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LocationAddressForm } from '@/components/dealer/LocationAddressForm'
import { LocationPricingOverride } from '@/components/dealer/LocationPricingOverride'
import { LOCATION_STATUS_LABEL, LOCATION_STATUS_VARIANT } from '@/lib/status-labels'
import type { Database } from '@/lib/database.types'

export default async function DealerLocationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: location }, { data: assignedAdmins }] = await Promise.all([
    supabase.from('locations').select('*, companies(installation_pricing, supported_tiers)').eq('id', id).maybeSingle(),
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
        <Card>
          <CardContent className="text-sm text-muted-foreground">
            This location is awaiting approval by RealTruck. A RealTruck admin needs to assign a location code and
            activate it before it can be used.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Address & Contact</CardTitle>
          <CardDescription>
            Location code, status, and regional sales manager are managed by RealTruck.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LocationAddressForm location={location} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Installation Pricing</CardTitle>
          <CardDescription>Override your company&apos;s default installation pricing for this location.</CardDescription>
        </CardHeader>
        <CardContent>
          <LocationPricingOverride location={location} companyDefaults={companyDefaults} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assigned Location Admins</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
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
        </CardContent>
      </Card>
    </div>
  )
}

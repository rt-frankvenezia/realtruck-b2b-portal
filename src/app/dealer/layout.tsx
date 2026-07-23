import { redirect } from 'next/navigation'
import { Home, MessageSquareQuote, Package, Wrench, DollarSign, ShieldCheck, Building2, MapPin, Users, Layers } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { SiteHeader } from '@/components/marketing/SiteHeader'
import { PortalSidebar, type PortalNavItem } from '@/components/portal/PortalSidebar'
import { INSTALLATIONS_ENABLED } from '@/lib/feature-flags'

// realtruck_admin is allowed in here too (not just dealer_admin/location_admin/
// staff) so RT admin can reuse the same rich quote/installation detail pages
// (e.g. linked from /admin/quotes) instead of duplicating them — RLS already
// gives realtruck_admin full visibility regardless of company scoping.
const DEALER_ROLES = ['dealer_admin', 'location_admin', 'staff', 'realtruck_admin'] as const

export default async function DealerLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!DEALER_ROLES.includes(user.profile.role as (typeof DEALER_ROLES)[number])) {
    redirect('/')
  }

  const role = user.profile.role
  const iconProps = { size: 20, strokeWidth: 2 }

  // Header company/location context — realtruck_admin has no company of
  // their own, so this stays undefined for them.
  let companyName: string | undefined
  let locationLabel: string | undefined
  if (role !== 'realtruck_admin' && user.profile.company_id) {
    const supabase = await createClient()
    const { data: company } = await supabase.from('companies').select('name').eq('id', user.profile.company_id).maybeSingle()
    companyName = company?.name ?? undefined

    if (role === 'location_admin') {
      const { data: assignment } = await supabase
        .from('user_locations')
        .select('locations(city, state)')
        .eq('user_id', user.authId)
        .limit(1)
        .maybeSingle()
      const loc = assignment?.locations
      if (loc) locationLabel = [loc.city, loc.state].filter(Boolean).join(', ')
    } else {
      const { data: loc } = await supabase
        .from('locations')
        .select('city, state')
        .eq('company_id', user.profile.company_id)
        .eq('status', 'active')
        .order('name')
        .limit(1)
        .maybeSingle()
      if (loc) locationLabel = [loc.city, loc.state].filter(Boolean).join(', ')
    }
  }
  const items: PortalNavItem[] = [
    { href: '/dealer', label: 'Dashboard', description: 'Overview & insights', icon: <Home {...iconProps} />, exact: true },
    { href: '/dealer/quotes', label: 'Quotes', description: 'Customer leads', icon: <MessageSquareQuote {...iconProps} /> },
    { href: '/dealer/orders', label: 'Order History', description: 'Orders from RealTruck', icon: <Package {...iconProps} /> },
    ...(INSTALLATIONS_ENABLED
      ? [
          { href: '/dealer/installations', label: 'Installations', description: 'Track & verify installs', icon: <Wrench {...iconProps} /> },
          ...(role !== 'staff'
            ? [{ href: '/dealer/payouts', label: 'Payouts', description: 'Installation earnings', icon: <DollarSign {...iconProps} /> }]
            : []),
        ]
      : []),
    { href: '/dealer/warranties', label: 'Warranties', description: 'Product warranties', icon: <ShieldCheck {...iconProps} /> },
    { href: '/dealer/resources', label: 'Resources & Tools', description: 'Marketing materials', icon: <Layers {...iconProps} /> },
    // company/location/user self-service — dealer_admin gets all three,
    // location_admin gets locations+users (scoped to their assignment),
    // staff and realtruck_admin (no company of their own) get none of
    // these here — RT admin manages every dealer from /admin instead.
    ...(role === 'dealer_admin'
      ? [{ href: '/dealer/company', label: 'Company', description: 'Your dealership profile', icon: <Building2 {...iconProps} /> }]
      : []),
    ...(role === 'dealer_admin' || role === 'location_admin'
      ? [
          { href: '/dealer/locations', label: 'Locations', description: 'Manage your locations', icon: <MapPin {...iconProps} /> },
          { href: '/dealer/team', label: 'Team', description: 'Manage your users', icon: <Users {...iconProps} /> },
        ]
      : []),
  ]

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader
        variant={role === 'realtruck_admin' ? 'admin' : 'dealer'}
        userEmail={user.profile.email}
        userName={user.profile.name}
        companyName={companyName}
        locationLabel={locationLabel}
      />
      <div className="mx-auto max-w-[1440px] px-8 py-8">
        <div className="flex gap-8">
          <PortalSidebar title="My Account" items={items} />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  )
}

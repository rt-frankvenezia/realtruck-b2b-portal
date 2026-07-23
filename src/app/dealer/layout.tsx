import { redirect } from 'next/navigation'
import { Home, MessageSquareQuote, Wrench, DollarSign, ShieldCheck, Building2, MapPin, Users } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { SiteHeader } from '@/components/marketing/SiteHeader'
import { PortalSidebar, type PortalNavItem } from '@/components/portal/PortalSidebar'

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
  const items: PortalNavItem[] = [
    { href: '/dealer', label: 'Dashboard', description: 'Overview & insights', icon: <Home {...iconProps} />, exact: true },
    { href: '/dealer/quotes', label: 'Quotes', description: 'Customer leads', icon: <MessageSquareQuote {...iconProps} /> },
    { href: '/dealer/installations', label: 'Installations', description: 'Track & verify installs', icon: <Wrench {...iconProps} /> },
    ...(role !== 'staff'
      ? [{ href: '/dealer/payouts', label: 'Payouts', description: 'Installation earnings', icon: <DollarSign {...iconProps} /> }]
      : []),
    { href: '/dealer/warranties', label: 'Warranties', description: 'Product warranties', icon: <ShieldCheck {...iconProps} /> },
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
      <SiteHeader variant={role === 'realtruck_admin' ? 'admin' : 'dealer'} userEmail={user.profile.email} />
      <div className="mx-auto max-w-[1440px] px-8 py-8">
        <div className="flex gap-8">
          <PortalSidebar title={role === 'realtruck_admin' ? 'Admin Portal' : 'Dealer Portal'} items={items} />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  )
}

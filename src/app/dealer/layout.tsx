import { redirect } from 'next/navigation'
import { Home, MessageSquareQuote, Wrench, DollarSign, ShieldCheck, Building2, MapPin, Users } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { SiteHeader } from '@/components/marketing/SiteHeader'
import { PortalSidebar, type PortalNavItem } from '@/components/portal/PortalSidebar'

const DEALER_ROLES = ['dealer_admin', 'location_admin', 'staff'] as const

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
    // company/location/user management — dealer_admin gets all three,
    // location_admin gets locations+users (scoped to their assignment),
    // staff gets none, per RoleContext.tsx's per-role `sections` list.
    ...(role === 'dealer_admin'
      ? [{ href: '/dealer/company', label: 'Company', description: 'Your dealership profile', icon: <Building2 {...iconProps} /> }]
      : []),
    ...(role !== 'staff'
      ? [
          { href: '/dealer/locations', label: 'Locations', description: 'Manage your locations', icon: <MapPin {...iconProps} /> },
          { href: '/dealer/team', label: 'Team', description: 'Manage your users', icon: <Users {...iconProps} /> },
        ]
      : []),
  ]

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader variant="dealer" userEmail={user.profile.email} />
      <div className="mx-auto max-w-[1440px] px-8 py-8">
        <div className="flex gap-8">
          <PortalSidebar title="Dealer Portal" items={items} />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  )
}

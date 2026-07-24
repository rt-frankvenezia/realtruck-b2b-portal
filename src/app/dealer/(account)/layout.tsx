import { redirect } from 'next/navigation'
import { Home, MessageSquareQuote, Package, Wrench, DollarSign, ShieldCheck, Building2, MapPin, Users, Layers, CreditCard, Wallet, Receipt } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { PortalSidebar, type PortalNavItem } from '@/components/portal/PortalSidebar'
import { INSTALLATIONS_ENABLED } from '@/lib/feature-flags'
import { hasFinancialPermission } from '@/lib/financial-permissions'

export default async function DealerAccountLayout({ children }: { children: React.ReactNode }) {
  // Already validated by the outer /dealer layout; getCurrentUser is
  // request-cached so this doesn't re-hit the database.
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const role = user.profile.role
  const iconProps = { size: 20, strokeWidth: 2 }

  // Once a dealer is actually set up on credit terms, the application
  // itself is no longer an action they need — Financial Overview (or
  // Invoices, for location_admin) supersedes it. "Set up" means an active
  // or on-hold credit account exists, same condition Part A's checkout
  // uses to decide whether to offer Pay on Terms at all.
  let hasCreditTerms = false
  if (role !== 'realtruck_admin' && user.profile.company_id) {
    const supabase = await createClient()
    const { data: account } = await supabase
      .from('credit_accounts')
      .select('id')
      .eq('company_id', user.profile.company_id)
      .in('status', ['active', 'on_hold'])
      .maybeSingle()
    hasCreditTerms = Boolean(account)
  }

  const items: PortalNavItem[] = [
    { href: '/dealer', label: 'Dashboard', description: 'Overview & insights', icon: <Home {...iconProps} />, exact: true },
    { href: '/dealer/quotes', label: 'Quotes', description: 'Customer leads', icon: <MessageSquareQuote {...iconProps} /> },
    { href: '/dealer/orders', label: 'Order History', description: 'Orders from RealTruck', icon: <Package {...iconProps} /> },
    // Financial visibility follows financial-permissions.ts, not role
    // directly — currently only dealer_admin has submit_credit_application/
    // view_credit_status, but gating on the capability keeps this correct
    // if that mapping ever changes.
    ...(!hasCreditTerms && (hasFinancialPermission(role, 'submit_credit_application') || hasFinancialPermission(role, 'view_credit_status'))
      ? [{ href: '/dealer/credit', label: 'Credit Application', description: 'Apply for payment terms', icon: <CreditCard {...iconProps} /> }]
      : []),
    // A user with the full financial-overview capability gets the
    // Overview hub (which itself links to Invoices/Statements); a user
    // who can only view invoices (location_admin) gets a direct Invoices
    // link instead of a hub page they're not allowed to see, so they're
    // never left with no way into the invoices they ARE scoped to.
    ...(hasFinancialPermission(role, 'view_credit_summary')
      ? [{ href: '/dealer/financial', label: 'Financial Overview', description: 'Credit, invoices & statements', icon: <Wallet {...iconProps} /> }]
      : hasFinancialPermission(role, 'view_invoices')
        ? [{ href: '/dealer/financial/invoices', label: 'Invoices', description: 'Invoices for your location', icon: <Receipt {...iconProps} /> }]
        : []),
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
    <div className="flex gap-8">
      <PortalSidebar title="My Account" items={items} />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  )
}

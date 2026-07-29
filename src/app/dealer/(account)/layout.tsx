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

  // Single nav entry covering both "apply for terms" and "manage active
  // terms" — collapses what used to be two separate items (Credit
  // Application + Financial Overview/Invoices) that could both appear at
  // once and both point at the same "apply for terms" CTA for a company
  // with no credit account yet. Destination/label depend on financial
  // permission + hasCreditTerms; the destination pages themselves already
  // handle every state correctly (CreditApplicationStatusView covers every
  // application status, Financial Overview shows the apply-CTA empty
  // state) — this only fixes which single item points at them.
  const canSeeCreditSummary = hasFinancialPermission(role, 'view_credit_summary')
  const canApplyOrSeeStatus = hasFinancialPermission(role, 'submit_credit_application') || hasFinancialPermission(role, 'view_credit_status')
  const canSeeInvoicesOnly = hasFinancialPermission(role, 'view_invoices')

  const creditInvoicesNavItem: PortalNavItem | null = canSeeCreditSummary
    ? {
        href: hasCreditTerms ? '/dealer/financial' : '/dealer/credit',
        label: 'Credit & Invoices',
        description: hasCreditTerms ? 'Credit, invoices & statements' : 'Apply for payment terms',
        icon: <Wallet {...iconProps} />,
      }
    : canApplyOrSeeStatus
      ? { href: '/dealer/credit', label: 'Credit & Invoices', description: 'Apply for payment terms', icon: <CreditCard {...iconProps} /> }
      : canSeeInvoicesOnly
        // Not gated on hasCreditTerms: that check queries credit_accounts
        // under the user's own session, and credit_accounts_select RLS
        // only allows dealer_admin/realtruck_admin to read it at all — for
        // location_admin the query silently returns no rows regardless of
        // the real account status, so hasCreditTerms is unreliable here.
        // location_admin always gets the Invoices destination when they
        // have the permission, same as before this nav consolidation.
        ? { href: '/dealer/financial/invoices', label: 'Credit & Invoices', description: 'Invoices for your location', icon: <Receipt {...iconProps} /> }
        : null

  const items: PortalNavItem[] = [
    { href: '/dealer', label: 'Dashboard', description: 'Overview & insights', icon: <Home {...iconProps} />, exact: true },
    { href: '/dealer/quotes', label: 'Quotes', description: 'Customer leads', icon: <MessageSquareQuote {...iconProps} /> },
    { href: '/dealer/orders', label: 'Order History', description: 'Orders from RealTruck', icon: <Package {...iconProps} /> },
    ...(creditInvoicesNavItem ? [creditInvoicesNavItem] : []),
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

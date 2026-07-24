import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { SiteHeader } from '@/components/marketing/SiteHeader'
import { DealerCartProvider } from '@/components/dealer/DealerCartContext'

// realtruck_admin is allowed in here too (not just dealer_admin/location_admin/
// staff) so RT admin can reuse the same rich quote/installation detail pages
// (e.g. linked from /admin/quotes) instead of duplicating them — RLS already
// gives realtruck_admin full visibility regardless of company scoping.
const DEALER_ROLES = ['dealer_admin', 'location_admin', 'staff', 'realtruck_admin'] as const

// Outer shell: auth + header only. The "My Account" sidebar is added by the
// nested (account) route group's own layout — /dealer/shop/** deliberately
// sits outside that group so shopping pages render full-width, matching
// the storefront rather than the account area (per user feedback: the
// left nav is only for My Account pages, not categories/products/cart/
// checkout). DealerCartProvider lives here (not just under shop/) so the
// header's cart icon can show a live item count from any dealer page.
export default async function DealerLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!DEALER_ROLES.includes(user.profile.role as (typeof DEALER_ROLES)[number])) {
    redirect('/')
  }

  const role = user.profile.role

  // Header company/location context — realtruck_admin has no company of
  // their own, so this stays undefined for them.
  let companyName: string | undefined
  let locationLabel: string | undefined
  let shopCategories: { name: string; slug: string }[] | undefined
  if (role !== 'realtruck_admin' && user.profile.company_id) {
    const supabase = await createClient()
    const { data: company } = await supabase.from('companies').select('name').eq('id', user.profile.company_id).maybeSingle()
    companyName = company?.name ?? undefined

    const { data: categories } = await supabase.from('product_categories').select('name, slug').order('sort_order')
    shopCategories = categories ?? []

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

  return (
    <div className="min-h-screen bg-white">
      <DealerCartProvider>
        <SiteHeader
          variant={role === 'realtruck_admin' ? 'admin' : 'dealer'}
          userEmail={user.profile.email}
          userName={user.profile.name}
          companyName={companyName}
          locationLabel={locationLabel}
          shopCategories={shopCategories}
          showDealerCart={role !== 'realtruck_admin'}
        />
        <div className="mx-auto max-w-[1440px] px-8 py-8">{children}</div>
      </DealerCartProvider>
    </div>
  )
}

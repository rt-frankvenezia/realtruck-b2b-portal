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

// Outer shell: header only, auth is now OPTIONAL here — /dealer/shop/**
// (category/product browsing) is deliberately public, matching a real
// storefront, with dealer pricing/purchasing gated behind login on those
// pages themselves. This is safe to loosen at this level because every
// *other* /dealer/* page lives under the (account) route group, which has
// its own independent auth guard in dealer/(account)/layout.tsx — nothing
// but shop/** actually loses protection here.
export default async function DealerLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (user && !DEALER_ROLES.includes(user.profile.role as (typeof DEALER_ROLES)[number])) {
    redirect('/')
  }

  const role = user?.profile.role

  // Header company/location context — realtruck_admin and anonymous
  // visitors have no company of their own, so this stays undefined.
  let companyName: string | undefined
  let locationLabel: string | undefined
  const supabase = await createClient()

  // Public regardless of auth state (product_categories_select_public RLS
  // policy) — the header's Categories dropdown works the same for everyone.
  const { data: categories } = await supabase.from('product_categories').select('name, slug').order('sort_order')
  const shopCategories = categories ?? []

  if (user && role !== 'realtruck_admin' && user.profile.company_id) {
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

  return (
    <div className="min-h-screen bg-white">
      <DealerCartProvider>
        <SiteHeader
          variant={role === 'realtruck_admin' ? 'admin' : 'dealer'}
          userEmail={user?.profile.email}
          userName={user?.profile.name}
          companyName={companyName}
          locationLabel={locationLabel}
          shopCategories={shopCategories}
          showDealerCart={Boolean(user) && role !== 'realtruck_admin'}
        />
        <div className="mx-auto max-w-[1440px] px-8 py-8">{children}</div>
      </DealerCartProvider>
    </div>
  )
}

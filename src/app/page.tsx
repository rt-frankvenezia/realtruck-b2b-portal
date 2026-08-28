import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Building2, DollarSign, FolderOpen, Megaphone, MessageSquareQuote, Receipt, Search, Tag, Truck, Wallet } from 'lucide-react'
import { getCurrentUser, type CurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { SiteHeader } from '@/components/marketing/SiteHeader'
import { LoginForm } from '@/components/marketing/LoginForm'
import { Button } from '@/components/ui/button'
import { ProductCard } from '@/components/dealer/ProductCard'
import { RecentlyViewedSection } from '@/components/dealer/RecentlyViewedSection'
import { WhyChooseUsSection, CategoriesSection, FaqSection } from '@/components/marketing/HomepageMarketingSections'

export default async function HomePage() {
  const user = await getCurrentUser()

  // This homepage is dealer/admin-focused (matches the reference screenshot's
  // "dealer program" framing) — customers keep their existing behavior of
  // landing straight on their order history, not part of this page's scope.
  if (user?.profile.role === 'customer') {
    redirect('/account')
  }

  const isRealtruckAdmin = user?.profile.role === 'realtruck_admin'
  const showDealerPricing = Boolean(user)
  const supabase = await createClient()

  // Public regardless of auth state (product_categories_select_public RLS
  // policy) — the header's Categories dropdown works the same for everyone,
  // logged in or not.
  const { data: categoriesForHeader } = await supabase.from('product_categories').select('name, slug').order('sort_order')
  const shopCategories = categoriesForHeader ?? []

  // realtruck_admin has no wholesale-catalog context of their own (no
  // company placing orders), so the catalog section is skipped for them
  // exactly as before — everyone else (including anonymous visitors, now
  // that browsing is public) gets it. Newest Arrivals is only used by the
  // logged-out state (logged-in dealers get Recently Viewed instead), so
  // it's only fetched when there's no user, not wasted on every dealer
  // homepage load.
  let categories: Parameters<typeof CategoriesSection>[0]['categories'] = []
  if (!isRealtruckAdmin) {
    categories = await fetchCategoriesWithCounts(supabase)
  }

  if (!user) {
    const newestProducts = isRealtruckAdmin ? [] : await fetchNewestProducts(supabase, showDealerPricing)
    return <LoggedOutHome shopCategories={shopCategories} categories={categories} newestProducts={newestProducts} />
  }

  return <LoggedInHome user={user} shopCategories={shopCategories} categories={categories} showDealerPricing={showDealerPricing} />
}

type HeaderCategory = { name: string; slug: string }
type CatalogCategories = Parameters<typeof CategoriesSection>[0]['categories']
type NewestProducts = Awaited<ReturnType<typeof fetchNewestProducts>>

function LoggedOutHome({
  shopCategories,
  categories,
  newestProducts,
}: {
  shopCategories: HeaderCategory[]
  categories: CatalogCategories
  newestProducts: NewestProducts
}) {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader variant="dealer" context="account" shopCategories={shopCategories} />

      <div className="bg-[#1c1c1e] py-20 text-white">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-8 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-[#FFC60B]">Dealer Program</p>
            <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">
              America&apos;s Largest <span className="text-[#FFC60B]">Dealer Program</span>
            </h1>
            <p className="mt-4 max-w-xl text-neutral-300">
              Order wholesale accessories at your dealer pricing, manage credit terms and invoices, and track every
              order from one portal.
            </p>
            <Button size="lg" className="mt-6 bg-[#FFC60B] font-semibold text-[#1c1c1e] hover:bg-[#e5b109]" render={<a href="#login" />} nativeButton={false}>
              Access Your Dealer Account
            </Button>
          </div>
          <div id="login">
            <LoginForm />
          </div>
        </div>
      </div>

      <CategoriesSection categories={categories} />
      <NewestArrivalsSection products={newestProducts} showDealerPricing={false} />
      <WhyChooseUsSection />
      <FaqSection />
    </div>
  )
}

// href omitted = decorative, rendered but not a real link (SKU Lookup,
// Promotions, Announcements have no backing feature yet — same posture as
// the Order Portal sidebar item: looks completely normal, just not
// wrapped in a Link, no muted/dimmed treatment or "external" indicator).
type QuickLink = { href?: string; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }

const DEALER_QUICK_LINKS: QuickLink[] = [
  { href: '/dealer/orders', label: 'Order History', icon: Receipt },
  { href: '/dealer/resources', label: 'Dealer Resources', icon: FolderOpen },
  { label: 'SKU Lookup', icon: Search },
  { label: 'Promotions', icon: Tag },
  { label: 'Announcements', icon: Megaphone },
]

const ADMIN_QUICK_LINKS: QuickLink[] = [
  { href: '/admin', label: 'Admin Dashboard', icon: Wallet },
  { href: '/admin/companies', label: 'Companies', icon: Building2 },
  { href: '/admin/quotes', label: 'Quotes', icon: MessageSquareQuote },
  { href: '/admin/pricing-groups', label: 'Pricing Groups', icon: DollarSign },
]

const FITMENT_YEARS = Array.from({ length: 10 }, (_, i) => 2026 - i)
const FITMENT_MAKES = ['Ford', 'Chevrolet', 'GMC', 'Ram', 'Toyota', 'Nissan']
const FITMENT_MODELS = ['F-150', 'Silverado 1500', 'Sierra 1500', 'Ram 1500', 'Tundra', 'Titan']
const FITMENT_BEDS = ['5.5 ft Bed', '6.5 ft Bed', '8 ft Bed']

// Represented per user request, not functional — this catalog has no
// structured vehicle-fitment data (products just have a free-text
// specifications.fit string), so there's nothing real to filter by yet.
// "Shop Now" honestly goes to the real shop rather than pretending to
// apply a filter.
function VehicleFitmentWidget() {
  return (
    <div className="mt-6 flex flex-col gap-4 rounded-lg bg-white p-5 text-[#1c1c1e] sm:flex-row sm:items-end">
      <div className="flex items-start gap-2 sm:pr-4">
        <Truck size={20} className="mt-0.5 shrink-0" />
        <div>
          <div className="text-sm font-bold">Select Your Vehicle</div>
          <div className="text-xs text-muted-foreground">Guarantees parts fitment</div>
        </div>
      </div>
      <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
        <FitmentSelect label="Year" options={FITMENT_YEARS.map(String)} />
        <FitmentSelect label="Make" options={FITMENT_MAKES} />
        <FitmentSelect label="Model" options={FITMENT_MODELS} />
        <FitmentSelect label="Bed" options={FITMENT_BEDS} />
      </div>
      <Button render={<Link href="/dealer/shop" />} nativeButton={false} className="bg-[#FFC60B] font-semibold text-[#1c1c1e] hover:bg-[#e5b109]">
        Shop Now
      </Button>
    </div>
  )
}

function FitmentSelect({ label, options }: { label: string; options: string[] }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase text-muted-foreground">{label}</span>
      <select className="rounded-md border px-2 py-1.5 text-sm" defaultValue={options[0]}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

async function LoggedInHome({
  user,
  shopCategories,
  categories,
  showDealerPricing,
}: {
  user: CurrentUser
  shopCategories: HeaderCategory[]
  categories: CatalogCategories
  showDealerPricing: boolean
}) {
  const role = user.profile.role
  const isRealtruckAdmin = role === 'realtruck_admin'
  const supabase = await createClient()

  let companyName: string | undefined
  if (!isRealtruckAdmin && user.profile.company_id) {
    const { data: company } = await supabase.from('companies').select('name').eq('id', user.profile.company_id).maybeSingle()
    companyName = company?.name ?? undefined
  }

  const quickLinks = isRealtruckAdmin ? ADMIN_QUICK_LINKS : DEALER_QUICK_LINKS

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader
        variant={isRealtruckAdmin ? 'admin' : 'dealer'}
        context="account"
        userEmail={user.profile.email}
        userName={user.profile.name}
        companyName={companyName}
        shopCategories={shopCategories}
      />

      <div className="bg-[#1c1c1e] py-14 text-white">
        <div className="mx-auto max-w-[1440px] px-8">
          <h1 className="text-3xl font-bold">Welcome back, {user.profile.name}</h1>
          <p className="mt-1 text-neutral-300">{companyName ?? 'RealTruck Admin'}</p>

          {!isRealtruckAdmin && <VehicleFitmentWidget />}

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {quickLinks.map(({ href, label, icon: Icon }) =>
              href ? (
                <Link key={label} href={href} className="rounded-lg border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10">
                  <Icon size={20} className="text-[#FFC60B]" />
                  <div className="mt-2 text-sm font-semibold">{label}</div>
                </Link>
              ) : (
                <div key={label} className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <Icon size={20} className="text-[#FFC60B]" />
                  <div className="mt-2 text-sm font-semibold">{label}</div>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {!isRealtruckAdmin && (
        <>
          <RecentlyViewedSection showDealerPricing={showDealerPricing} />
          <CategoriesSection categories={categories} />
        </>
      )}

      <WhyChooseUsSection />
      <FaqSection />
    </div>
  )
}

function NewestArrivalsSection({ products, showDealerPricing }: { products: NewestProducts; showDealerPricing: boolean }) {
  if (products.length === 0) return null
  return (
    <section className="mx-auto max-w-[1440px] px-8 py-14">
      <h2 className="mb-6 text-2xl font-bold text-[#1c1c1e]">Newest Arrivals</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            categorySlug={product.product_categories?.slug ?? ''}
            showDealerPricing={showDealerPricing}
          />
        ))}
      </div>
    </section>
  )
}

async function fetchCategoriesWithCounts(supabase: Awaited<ReturnType<typeof createClient>>) {
  // catalog_products_public works for both anonymous and authenticated
  // sessions and the count itself isn't sensitive, so this query doesn't
  // need to branch on auth state the way pricing does.
  const { data } = await supabase.from('product_categories').select('id, name, slug, catalog_products_public(count)').order('sort_order')
  return data ?? []
}

async function fetchNewestProducts(supabase: Awaited<ReturnType<typeof createClient>>, showDealerPricing: boolean) {
  const { data } = await (showDealerPricing
    ? supabase.from('catalog_products').select('*, product_categories(slug)').order('created_at', { ascending: false }).limit(3)
    : supabase.from('catalog_products_public').select('*, product_categories(slug)').order('created_at', { ascending: false }).limit(3))
  return data ?? []
}

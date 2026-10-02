import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { ArrowRight, Building2, DollarSign, FolderOpen, MessageSquareQuote, Receipt, Search, Tag, Truck, Wallet } from 'lucide-react'
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

      <div className="relative overflow-hidden bg-[#1c1c1e] py-28 text-white">
        {/* Hero background image */}
        <Image
          src="/hero-trucks.jpg"
          alt=""
          fill
          className="object-cover object-center"
          style={{ filter: 'brightness(0.35) contrast(1.05)' }}
          priority
        />
        {/* Gradient: fully opaque black on left (text side), semi-transparent on right */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1c1c1e] from-40% via-[#1c1c1e]/80 to-[#1c1c1e]/55" />
        {/* Yellow left accent bar */}
        <div className="absolute inset-y-0 left-0 w-1.5 bg-[#FFC60B]" />

        <div className="relative mx-auto grid max-w-[1440px] gap-10 px-8 lg:grid-cols-[1.3fr_1fr] lg:items-center">
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
// Promotions have no backing feature yet — same posture as the Order Portal
// sidebar item: looks completely normal, just not wrapped in a Link).
type QuickLink = {
  href?: string
  label: string
  description: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}

const DEALER_QUICK_LINKS: QuickLink[] = [
  { href: '/dealer/orders',    label: 'Order History',    description: 'View and track your recent orders',    icon: Receipt },
  { href: '/dealer/quotes',    label: 'Quotes',           description: 'Manage A.R.E. cap leads',              icon: MessageSquareQuote },
  {                            label: 'SKU Lookup',       description: 'Find applications for any part',       icon: Search },
  {                            label: 'Dealer Resources', description: 'Marketing assets and sell sheets',     icon: FolderOpen },
  {                            label: 'Promotions',       description: 'Current deals and marketing materials', icon: Tag },
]

const ADMIN_QUICK_LINKS: QuickLink[] = [
  { href: '/admin',                  label: 'Admin Dashboard', description: 'Overview and activity',          icon: Wallet },
  { href: '/admin/companies',        label: 'Companies',       description: 'Manage dealer accounts',         icon: Building2 },
  { href: '/admin/quotes',           label: 'Quotes',          description: 'Review A.R.E. quotes',           icon: MessageSquareQuote },
  { href: '/admin/pricing-groups',   label: 'Pricing Groups',  description: 'Configure dealer price tiers',   icon: DollarSign },
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
    <div className="mt-6 flex items-stretch overflow-hidden rounded-lg bg-white text-[#1c1c1e]">
      {/* Left label */}
      <div className="flex items-center gap-3 border-r border-gray-200 px-5 py-4">
        <Truck size={18} className="shrink-0 text-gray-500" />
        <div>
          <div className="text-xs font-bold uppercase tracking-wide">Select Your Vehicle</div>
          <div className="text-[11px] text-gray-400">Guarantees parts fitment</div>
        </div>
      </div>
      {/* Selects — no border, divided by hairlines */}
      <div className="flex flex-1 divide-x divide-gray-200">
        <FitmentSelect options={FITMENT_YEARS.map(String)} />
        <FitmentSelect options={FITMENT_MAKES} />
        <FitmentSelect options={FITMENT_MODELS} />
        <FitmentSelect options={FITMENT_BEDS} />
      </div>
      {/* CTA */}
      <div className="flex items-center px-3">
        <Button render={<Link href="/dealer/shop" />} nativeButton={false} className="whitespace-nowrap bg-[#FFC60B] font-bold text-[#1c1c1e] hover:bg-[#e5b109]">
          Shop Now
        </Button>
      </div>
    </div>
  )
}

function FitmentSelect({ options }: { options: string[] }) {
  return (
    <select
      className="w-full cursor-pointer appearance-none bg-transparent px-4 py-4 text-sm font-medium outline-none"
      defaultValue={options[0]}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
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

      <div className="relative overflow-hidden bg-[#1c1c1e] py-24 text-white">
        {/* Hero background image */}
        <Image
          src="/hero-trucks.jpg"
          alt=""
          fill
          className="object-cover object-center"
          style={{ filter: 'brightness(0.35) contrast(1.05)' }}
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1c1c1e] from-30% via-[#1c1c1e]/75 to-[#1c1c1e]/50" />
        <div className="absolute inset-y-0 left-0 w-1.5 bg-[#FFC60B]" />

        <div className="relative mx-auto max-w-[1440px] px-8">
          <h1 className="text-3xl font-bold">Welcome back, {user.profile.name}</h1>
          <p className="mt-1 text-neutral-300">{companyName ?? 'RealTruck Admin'}</p>

          {!isRealtruckAdmin && <VehicleFitmentWidget />}

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
            {quickLinks.map(({ href, label, description, icon: Icon }) => {
              const inner = (
                <>
                  <div className="mb-3 flex justify-center">
                    <Icon size={22} className="text-[#FFC60B]" />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-white">{label}</span>
                    <ArrowRight size={13} className="shrink-0 text-white/50" />
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-white/50">{description}</p>
                </>
              )
              return href ? (
                <Link key={label} href={href} className="rounded-lg border border-white/10 bg-white/10 p-5 transition-colors hover:bg-white/15">
                  {inner}
                </Link>
              ) : (
                <div key={label} className="rounded-lg border border-white/10 bg-white/10 p-5">
                  {inner}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {!isRealtruckAdmin && (
        <>
          <RecentlyViewedSection userId={user.profile.id} showDealerPricing={showDealerPricing} />
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

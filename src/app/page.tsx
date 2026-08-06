import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Building2, CreditCard, DollarSign, MessageSquareQuote, Package, Receipt, ShieldCheck, Wallet } from 'lucide-react'
import { getCurrentUser, type CurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { hasFinancialPermission } from '@/lib/financial-permissions'
import { SiteHeader } from '@/components/marketing/SiteHeader'
import { LoginForm } from '@/components/marketing/LoginForm'
import { Button } from '@/components/ui/button'
import { ProductCard } from '@/components/dealer/ProductCard'
import { WhyChooseUsSection, CategoriesSection, FaqSection } from '@/components/marketing/HomepageMarketingSections'

export default async function HomePage() {
  const user = await getCurrentUser()

  // This homepage is dealer/admin-focused (matches the reference screenshot's
  // "dealer program" framing) — customers keep their existing behavior of
  // landing straight on their order history, not part of this page's scope.
  if (user?.profile.role === 'customer') {
    redirect('/account')
  }

  if (!user) {
    return <LoggedOutHome />
  }

  return <LoggedInHome user={user} />
}

function LoggedOutHome() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader variant="dealer" context="account" />

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

      <WhyChooseUsSection />
      <CategoriesSection />
      <FaqSection />
    </div>
  )
}

type QuickLink = { href: string; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }

function dealerQuickLinks(role: CurrentUser['profile']['role'], hasCreditTerms: boolean): QuickLink[] {
  const canSeeCredit =
    hasFinancialPermission(role, 'view_credit_summary') ||
    hasFinancialPermission(role, 'submit_credit_application') ||
    hasFinancialPermission(role, 'view_credit_status') ||
    hasFinancialPermission(role, 'view_invoices')

  return [
    { href: '/dealer', label: 'Dashboard', icon: Building2 },
    { href: '/dealer/shop', label: 'Shop', icon: Package },
    { href: '/dealer/orders', label: 'Order History', icon: Receipt },
    canSeeCredit
      ? { href: hasCreditTerms ? '/dealer/financial' : '/dealer/credit', label: 'Credit & Invoices', icon: CreditCard }
      : { href: '/dealer/warranties', label: 'Warranties', icon: ShieldCheck },
  ]
}

const ADMIN_QUICK_LINKS: QuickLink[] = [
  { href: '/admin', label: 'Admin Dashboard', icon: Wallet },
  { href: '/admin/companies', label: 'Companies', icon: Building2 },
  { href: '/admin/quotes', label: 'Quotes', icon: MessageSquareQuote },
  { href: '/admin/pricing-groups', label: 'Pricing Groups', icon: DollarSign },
]

async function LoggedInHome({ user }: { user: CurrentUser }) {
  const role = user.profile.role
  const isRealtruckAdmin = role === 'realtruck_admin'
  const supabase = await createClient()

  let companyName: string | undefined
  let categories: Parameters<typeof CategoriesSection>[0]['categories']
  let newestProducts: Awaited<ReturnType<typeof fetchNewestProducts>> = []
  let hasCreditTerms = false

  if (!isRealtruckAdmin && user.profile.company_id) {
    const companyId = user.profile.company_id
    const [{ data: company }, { data: cats }, products, { data: creditAccount }] = await Promise.all([
      supabase.from('companies').select('name').eq('id', companyId).maybeSingle(),
      supabase.from('product_categories').select('id, name, slug, catalog_products(count)').order('sort_order'),
      fetchNewestProducts(supabase),
      supabase.from('credit_accounts').select('id').eq('company_id', companyId).in('status', ['active', 'on_hold']).maybeSingle(),
    ])
    companyName = company?.name ?? undefined
    categories = cats ?? []
    newestProducts = products
    hasCreditTerms = Boolean(creditAccount)
  }

  const quickLinks = isRealtruckAdmin ? ADMIN_QUICK_LINKS : dealerQuickLinks(role, hasCreditTerms)

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader
        variant={isRealtruckAdmin ? 'admin' : 'dealer'}
        context="account"
        userEmail={user.profile.email}
        userName={user.profile.name}
        companyName={companyName}
      />

      <div className="bg-[#1c1c1e] py-14 text-white">
        <div className="mx-auto max-w-[1440px] px-8">
          <h1 className="text-3xl font-bold">Welcome back, {user.profile.name}</h1>
          <p className="mt-1 text-neutral-300">{companyName ?? 'RealTruck Admin'}</p>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {quickLinks.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="rounded-lg border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10">
                <Icon size={20} className="text-[#FFC60B]" />
                <div className="mt-2 text-sm font-semibold">{label}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {!isRealtruckAdmin && (
        <>
          <CategoriesSection categories={categories} />
          {newestProducts.length > 0 && (
            <section className="mx-auto max-w-[1440px] px-8 py-14">
              <h2 className="mb-6 text-2xl font-bold text-[#1c1c1e]">Newest Arrivals</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {newestProducts.map((product) => (
                  <ProductCard key={product.id} product={product} categorySlug={product.product_categories?.slug ?? ''} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <WhyChooseUsSection />
      <FaqSection />
    </div>
  )
}

async function fetchNewestProducts(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase
    .from('catalog_products')
    .select('*, product_categories(slug)')
    .order('created_at', { ascending: false })
    .limit(3)
  return data ?? []
}

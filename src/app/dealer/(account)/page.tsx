import Link from 'next/link'
import Image from 'next/image'
import { AlertTriangle, ArrowRight, CreditCard, FileText, Info, Megaphone, Package, Receipt, ShoppingCart } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { hasFinancialPermission } from '@/lib/financial-permissions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AnnouncementsPanel } from '@/components/dealer/AnnouncementsPanel'
import { getAnnouncements } from '@/lib/announcements'

const PANEL = 'overflow-hidden rounded border border-[#d5d5d5] bg-white'
const PANEL_HEADER = 'bg-[#1E1E1E] px-4 py-3'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { InstallationKPIDashboard } from '@/components/shared/InstallationKPIDashboard'
import { OrderProgressStepper } from '@/components/shared/OrderProgressStepper'
import {
  formatCurrency,
  formatDate,
  CREDIT_APPLICATION_STATUS_LABEL,
  CREDIT_APPLICATION_STATUS_VARIANT,
  INVOICE_STATUS_LABEL,
  INVOICE_STATUS_VARIANT,
  QUOTE_STATUS_LABEL,
  QUOTE_STATUS_VARIANT,
} from '@/lib/status-labels'
import { INSTALLATIONS_ENABLED } from '@/lib/feature-flags'

function quoteDisplayNum(id: string): string {
  const n = parseInt(id.split('-').pop() ?? '0', 16)
  return `26-${71000 + (n % 1000)}`
}

export default async function DealerDashboardPage() {
  const user = await getCurrentUser()
  const supabase = await createClient()
  const role = user?.profile.role
  const companyId = user?.profile.company_id ?? null

  // Determine dealer type — mirrors the layout's logic so dashboard widgets
  // match what the nav exposes.
  let isAreDealer = false
  let creditEligible = !companyId // RT admin (no company) sees everything
  let companyName: string | undefined
  if (companyId) {
    const { data: company } = await supabase
      .from('companies')
      .select('name, is_are_dealer, credit_eligible')
      .eq('id', companyId)
      .maybeSingle()
    companyName = company?.name ?? undefined
    isAreDealer = Boolean(company?.is_are_dealer)
    creditEligible = !isAreDealer || Boolean(company?.credit_eligible)
  }

  const showCreditCard =
    creditEligible &&
    Boolean(companyId) &&
    role !== undefined &&
    (hasFinancialPermission(role, 'view_credit_summary') ||
      hasFinancialPermission(role, 'submit_credit_application') ||
      hasFinancialPermission(role, 'view_credit_status'))
  const showInvoicesCard = creditEligible && Boolean(companyId) && role !== undefined && hasFinancialPermission(role, 'view_invoices')

  const [{ data: kpi }, { data: recentOrders }, { data: creditAccount }, { data: invoiceRows }, { data: recentQuotes }] =
    await Promise.all([
      INSTALLATIONS_ENABLED ? supabase.rpc('installation_kpi_metrics') : Promise.resolve({ data: null }),
      creditEligible && companyId
        ? supabase.from('product_orders').select('*').eq('company_id', companyId).order('order_date', { ascending: false }).limit(3)
        : Promise.resolve({ data: null }),
      showCreditCard
        ? supabase
            .from('credit_accounts')
            .select('available_credit, credit_limit, past_due_balance, credit_hold_status')
            .eq('company_id', companyId!)
            .in('status', ['active', 'on_hold'])
            .maybeSingle()
        : Promise.resolve({ data: null }),
      showInvoicesCard
        ? supabase
            .from('invoices')
            .select('id, invoice_number, due_date, remaining_balance, status')
            .eq('company_id', companyId!)
            .in('status', ['open', 'past_due'])
            .order('due_date', { ascending: true })
        : Promise.resolve({ data: null }),
      isAreDealer && companyId
        ? supabase
            .from('quotes')
            .select('id, customer_name, vehicle_year, vehicle_make, vehicle_model, status, created_at')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false })
            .limit(3)
        : Promise.resolve({ data: null }),
    ])
  const metrics = kpi?.[0]

  let latestApplication: { status: keyof typeof CREDIT_APPLICATION_STATUS_LABEL; reference_number: string } | null = null
  if (showCreditCard && !creditAccount) {
    const { data } = await supabase
      .from('credit_applications')
      .select('status, reference_number')
      .eq('company_id', companyId!)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    latestApplication = data
  }

  const invoices = invoiceRows ?? []
  const totalDue = invoices.reduce((sum, inv) => sum + inv.remaining_balance, 0)
  const pastDueCount = invoices.filter((inv) => inv.status === 'past_due').length

  const announcements = companyId
    ? getAnnouncements(isAreDealer, creditEligible)
    : []

  const dealerTypeLabel = isAreDealer && creditEligible
    ? 'A.R.E. + Transactional Dealer'
    : isAreDealer
    ? 'A.R.E. Dealer'
    : creditEligible && companyId
    ? 'Transactional Dealer'
    : undefined

  const firstName = user?.profile.name?.split(' ')[0] ?? user?.profile.name

  return (
    <div className="flex flex-col gap-6">
      {/* ── Hero Banner ──────────────────────────────────────────── */}
      {companyId && (
        <div className="relative -mx-8 -mt-8 mb-2 overflow-hidden">
          <Image
            src="/products/mx4/mx4-05.jpg"
            alt=""
            width={1440}
            height={400}
            className="h-[340px] w-full object-cover object-top"
            priority
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/82" />
          {/* Warm yellow glow from left */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#FFC60B]/10 via-transparent to-transparent" />
          {/* Yellow left accent bar */}
          <div className="absolute inset-y-0 left-0 w-1.5 bg-[#FFC60B]" />

          {/* Content */}
          <div className="absolute inset-0 flex flex-col justify-between px-10 py-8">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#FFC60B]">
                Dealer Portal
              </p>
              <h1 className="text-4xl font-bold leading-tight text-white">
                Welcome back, {firstName}
              </h1>
              {(companyName || dealerTypeLabel) && (
                <p className="mt-1.5 text-sm text-white/55">
                  {[companyName, dealerTypeLabel].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>

            {/* Quick-action tiles */}
            <div className="flex flex-wrap gap-3">
              {isAreDealer && (
                <HeroTile href="/dealer/quotes" label="Quotes" description="Manage A.R.E. quotes" icon={<FileText size={16} />} />
              )}
              {companyId && (
                <HeroTile href="/dealer/shop" label="Shop Catalog" description="Browse 1M+ accessories" icon={<ShoppingCart size={16} />} />
              )}
              {creditEligible && companyId && (
                <HeroTile href="/dealer/orders" label="Order History" description="View and track orders" icon={<Package size={16} />} />
              )}
              {showCreditCard && (
                <HeroTile href="/dealer/financial" label="Financial" description="Credit &amp; invoices" icon={<CreditCard size={16} />} />
              )}
              <HeroTile href="/dealer/announcements" label="Announcements" description="News and updates" icon={<Megaphone size={16} />} />
            </div>
          </div>
        </div>
      )}

      <AnnouncementsPanel announcements={announcements} limit={4} />

      {(showCreditCard || showInvoicesCard) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {showCreditCard && <CreditStatusCard account={creditAccount} application={latestApplication} />}
          {showInvoicesCard && <InvoicesDueCard invoices={invoices} totalDue={totalDue} pastDueCount={pastDueCount} />}
        </div>
      )}

      {INSTALLATIONS_ENABLED && metrics && (
        <InstallationKPIDashboard
          metrics={metrics}
          showPayouts={user?.profile.role !== 'staff'}
          showMacro={user?.profile.role === 'realtruck_admin'}
        />
      )}

      {creditEligible && (recentOrders ?? []).length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Orders</h2>
            <Link href="/dealer/orders" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="flex flex-col gap-4">
            {(recentOrders ?? []).map((order) => (
              <div key={order.id} className={PANEL}>
                <div className="flex items-center justify-between gap-4 p-6">
                  <div className="flex-1">
                    <OrderProgressStepper status={order.status} />
                    <p className="mt-2 text-sm text-muted-foreground">
                      {order.order_number} · {formatDate(order.order_date)} {order.customer_name ? `· ${order.customer_name}` : ''}
                    </p>
                  </div>
                  <Button size="sm" render={<Link href={`/dealer/orders/${order.id}`} />} nativeButton={false}>
                    View Order
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isAreDealer && (recentQuotes ?? []).length > 0 && (
        <div className={PANEL}>
          <div className={`${PANEL_HEADER} flex items-center justify-between`}>
            <span className="text-sm font-semibold text-white">Recent Quotes</span>
            <Link href="/dealer/quotes" className="text-xs text-white/60 hover:text-white">
              View all
            </Link>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#f0f0f0] bg-[#fafafa]">
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Quote ID</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Customer</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Vehicle</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f0]">
              {(recentQuotes ?? []).map((q) => (
                <tr key={q.id}>
                  <td className="px-4 py-3">
                    <Link href={`/dealer/quotes/${q.id}`} className="text-sm font-medium text-primary hover:underline">
                      {quoteDisplayNum(q.id)}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={QUOTE_STATUS_VARIANT[q.status]}>{QUOTE_STATUS_LABEL[q.status]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm">{q.customer_name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {q.vehicle_year} {q.vehicle_make} {q.vehicle_model}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(q.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function HeroTile({
  href,
  label,
  description,
  icon,
}: {
  href: string
  label: string
  description: string
  icon: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="flex min-w-[160px] items-center gap-3 rounded-lg border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm transition-colors hover:bg-white/18"
    >
      <span className="shrink-0 text-[#FFC60B]">{icon}</span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="truncate text-xs text-white/55">{description}</p>
      </div>
      <ArrowRight size={13} className="ml-auto shrink-0 text-white/35" />
    </Link>
  )
}

function CreditStatusCard({
  account,
  application,
}: {
  account: { available_credit: number | null; credit_limit: number; past_due_balance: number; credit_hold_status: string } | null
  application: { status: keyof typeof CREDIT_APPLICATION_STATUS_LABEL; reference_number: string } | null
}) {
  if (account) {
    const availableCredit = account.available_credit ?? 0
    const pastDue = account.past_due_balance > 0
    const onHold = account.credit_hold_status !== 'none'

    return (
      <div className={PANEL}>
        <div className="flex flex-col gap-3 p-6">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground">
            Available Credit
            <Tooltip>
              <TooltipTrigger className="inline-flex text-muted-foreground/70 hover:text-foreground" aria-label="How available credit is calculated">
                <Info size={13} />
              </TooltipTrigger>
              <TooltipContent side="top" align="start" className="normal-case">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between gap-4"><span>Credit limit</span><span>{formatCurrency(account.credit_limit)}</span></div>
                  <div className="flex justify-between gap-4 border-t border-border/50 pt-1 font-semibold"><span>Available credit</span><span>{formatCurrency(availableCredit)}</span></div>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className={`text-2xl font-bold ${availableCredit <= 0 ? 'text-destructive' : ''}`}>{formatCurrency(availableCredit)}</div>
          {onHold && (
            <p className="flex items-center gap-1.5 text-sm text-destructive">
              <AlertTriangle size={14} /> Account on hold
            </p>
          )}
          {!onHold && pastDue && (
            <p className="flex items-center gap-1.5 text-sm text-destructive">
              <AlertTriangle size={14} /> Past-due balance: {formatCurrency(account.past_due_balance)}
            </p>
          )}
          <Link href="/dealer/financial" className="text-sm text-primary hover:underline">
            View Financial Overview
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={PANEL}>
      <div className="flex flex-col gap-3 p-6">
        <div className="text-xs font-semibold uppercase text-muted-foreground">Credit Terms</div>
        {application ? (
          <>
            <div className="flex items-center gap-2">
              <Badge variant={CREDIT_APPLICATION_STATUS_VARIANT[application.status]}>{CREDIT_APPLICATION_STATUS_LABEL[application.status]}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Reference {application.reference_number}</p>
            <Link href="/dealer/credit" className="text-sm text-primary hover:underline">
              View Application
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">Not set up for credit terms yet. Apply to order on Net terms instead of by card.</p>
            <Button size="sm" render={<Link href="/dealer/credit" />} nativeButton={false} className="w-fit">
              <CreditCard size={16} />
              Apply for Terms
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

function InvoicesDueCard({
  invoices,
  totalDue,
  pastDueCount,
}: {
  invoices: { id: string; invoice_number: string; due_date: string; remaining_balance: number; status: keyof typeof INVOICE_STATUS_LABEL }[]
  totalDue: number
  pastDueCount: number
}) {
  return (
    <div className={PANEL}>
      <div className="flex flex-col gap-3 p-6">
        <div className="text-xs font-semibold uppercase text-muted-foreground">Invoices Due</div>
        {invoices.length === 0 ? (
          <p className="text-sm text-muted-foreground">No open invoices.</p>
        ) : (
          <>
            <div className="text-2xl font-bold">{formatCurrency(totalDue)}</div>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Receipt size={14} />
              {invoices.length} open invoice{invoices.length === 1 ? '' : 's'} · nearest due {formatDate(invoices[0].due_date)}
              {pastDueCount > 0 && (
                <Badge variant={INVOICE_STATUS_VARIANT.past_due}>
                  {pastDueCount} past due
                </Badge>
              )}
            </p>
          </>
        )}
        <Link href="/dealer/financial/invoices" className="text-sm text-primary hover:underline">
          View Invoices
        </Link>
      </div>
    </div>
  )
}

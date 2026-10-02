import Link from 'next/link'
import { AlertTriangle, CreditCard, Info, Megaphone, Receipt } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { hasFinancialPermission } from '@/lib/financial-permissions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

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

type Announcement = { date: string; title: string; tag: string }

const ANNOUNCEMENTS_ARE: Announcement[] = [
  { date: '2026-10-01', title: 'New A.R.E. MX-Series now available for 2025 Toyota Tacoma — order lead time 6–8 weeks', tag: 'Product' },
  { date: '2026-09-22', title: 'Q4 lead response goal: acknowledge all new leads within 24 hours of submission', tag: 'Operations' },
  { date: '2026-09-10', title: '3D Configurator update: eight new exterior colors added for MX and DS Series', tag: 'Tools' },
  { date: '2026-08-28', title: 'Warranty registration now requires online submission within 30 days of installation', tag: 'Policy' },
]

const ANNOUNCEMENTS_TRANSACTIONAL: Announcement[] = [
  { date: '2026-10-01', title: 'October promotional pricing is now active — check your pricing group for current discounts', tag: 'Pricing' },
  { date: '2026-09-25', title: 'Standard shipping lead times: 5–7 business days through Q4 2026', tag: 'Shipping' },
  { date: '2026-09-18', title: 'New SKUs added: UnderCover Elite LX Hard Cover lineup for 2025 Ford F-150', tag: 'Product' },
  { date: '2026-09-05', title: 'Net 30 payment terms renewal — contact your rep if your annual credit review is approaching', tag: 'Billing' },
]

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
  if (companyId) {
    const { data: company } = await supabase
      .from('companies')
      .select('is_are_dealer, credit_eligible')
      .eq('id', companyId)
      .maybeSingle()
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

  // Announcements scoped by dealer type; combined dealers get both lists merged and sorted
  const announcements: Announcement[] = companyId
    ? isAreDealer && creditEligible
      ? [...ANNOUNCEMENTS_ARE, ...ANNOUNCEMENTS_TRANSACTIONAL]
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, 5)
      : isAreDealer
      ? ANNOUNCEMENTS_ARE
      : ANNOUNCEMENTS_TRANSACTIONAL
    : [] // RT admin sees no dealer-specific announcements

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome back, {user?.profile.name}</h1>
        <p className="text-muted-foreground">Here&apos;s what&apos;s happening across your dealership.</p>
      </div>

      {announcements.length > 0 && (
        <div className={PANEL}>
          <div className={`${PANEL_HEADER} flex items-center justify-between`}>
            <span className="flex items-center gap-2 text-sm font-semibold text-white">
              <Megaphone size={15} />
              Announcements
            </span>
            <span className="text-xs text-white/40">From RealTruck</span>
          </div>
          <div className="divide-y divide-[#f0f0f0]">
            {announcements.map((ann, i) => (
              <div key={i} className="flex items-start gap-4 px-4 py-3">
                <span className="w-24 shrink-0 pt-0.5 text-xs text-muted-foreground">{formatDate(ann.date)}</span>
                <span className="flex-1 text-sm">{ann.title}</span>
                <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {ann.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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

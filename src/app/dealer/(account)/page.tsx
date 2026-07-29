import Link from 'next/link'
import { AlertTriangle, CreditCard, Info, Receipt } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { hasFinancialPermission } from '@/lib/financial-permissions'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
} from '@/lib/status-labels'
import { INSTALLATIONS_ENABLED } from '@/lib/feature-flags'

export default async function DealerDashboardPage() {
  const user = await getCurrentUser()
  const supabase = await createClient()
  const role = user?.profile.role
  const companyId = user?.profile.company_id ?? null

  const showCreditCard =
    Boolean(companyId) &&
    role !== undefined &&
    (hasFinancialPermission(role, 'view_credit_summary') ||
      hasFinancialPermission(role, 'submit_credit_application') ||
      hasFinancialPermission(role, 'view_credit_status'))
  const showInvoicesCard = Boolean(companyId) && role !== undefined && hasFinancialPermission(role, 'view_invoices')

  const [{ data: kpi }, { data: recentOrders }, { data: creditAccount }, { data: invoiceRows }] = await Promise.all([
    INSTALLATIONS_ENABLED ? supabase.rpc('installation_kpi_metrics') : Promise.resolve({ data: null }),
    supabase.from('product_orders').select('*').order('order_date', { ascending: false }).limit(3),
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome back, {user?.profile.name}</h1>
        <p className="text-muted-foreground">Here&apos;s what&apos;s happening across your dealership.</p>
      </div>

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

      {(recentOrders ?? []).length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Orders</h2>
            <Link href="/dealer/orders" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="flex flex-col gap-4">
            {(recentOrders ?? []).map((order) => (
              <Card key={order.id}>
                <CardContent className="flex items-center justify-between gap-4 pt-6">
                  <div className="flex-1">
                    <OrderProgressStepper status={order.status} />
                    <p className="mt-2 text-sm text-muted-foreground">
                      {order.order_number} · {formatDate(order.order_date)} {order.customer_name ? `· ${order.customer_name}` : ''}
                    </p>
                  </div>
                  <Button size="sm" render={<Link href={`/dealer/orders/${order.id}`} />} nativeButton={false}>
                    View Order
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
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
      <Card>
        <CardContent className="flex flex-col gap-3 pt-6">
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
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-6">
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
      </CardContent>
    </Card>
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
    <Card>
      <CardContent className="flex flex-col gap-3 pt-6">
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
      </CardContent>
    </Card>
  )
}

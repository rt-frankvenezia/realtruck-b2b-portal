import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, Clock, CreditCard, Info, Receipt, Wallet } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { hasFinancialPermission } from '@/lib/financial-permissions'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  formatCurrency,
  formatDate,
  CREDIT_HOLD_STATUS_LABEL,
  PAYMENT_TERMS_LABEL,
  INVOICE_STATUS_LABEL,
  INVOICE_STATUS_VARIANT,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_VARIANT,
} from '@/lib/status-labels'

type RecentActivityItem = {
  kind: 'invoice' | 'payment'
  date: string
  href: string
  title: string
  amount: number
  status: string
}

export default async function FinancialOverviewPage() {
  const user = await getCurrentUser()
  if (!user || !user.profile.company_id) redirect('/dealer')
  if (!hasFinancialPermission(user.profile.role, 'view_credit_summary')) redirect('/dealer')

  const supabase = await createClient()
  const { data: account, error } = await supabase
    .from('credit_accounts')
    .select('*')
    .eq('company_id', user.profile.company_id)
    .maybeSingle()

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold">Financial Overview</h1>
        <Alert variant="destructive">
          <AlertDescription>Data temporarily unavailable. Please try again shortly.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!account || account.status === 'inactive') {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold">Financial Overview</h1>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <CreditCard size={32} className="text-muted-foreground" />
            <div className="max-w-md">
              <p className="font-semibold">You don&apos;t have active credit terms yet.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Apply for credit terms to unlock invoices, statements, and payment tools here.
              </p>
            </div>
            <Button render={<Link href="/dealer/credit" />} nativeButton={false}>
              Apply for Terms
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const availableCredit = account.available_credit ?? 0
  const approachingLimit = account.credit_limit > 0 && availableCredit / account.credit_limit < 0.15 && availableCredit > 0
  const insufficientCredit = availableCredit <= 0
  const onHold = account.status === 'on_hold' || account.credit_hold_status !== 'none'
  const pastDue = account.past_due_balance > 0
  const processing = account.pending_payment_amount > 0

  const [{ data: nextDueInvoice }, { data: recentInvoices }, { data: recentPayments }] = await Promise.all([
    supabase
      .from('invoices')
      .select('due_date')
      .eq('company_id', user.profile.company_id)
      .in('status', ['open', 'past_due'])
      .order('due_date', { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('invoices')
      .select('id, invoice_number, status, remaining_balance, invoice_date')
      .eq('company_id', user.profile.company_id)
      .order('invoice_date', { ascending: false })
      .limit(5),
    supabase
      .from('payments')
      .select('id, payment_reference, status, total_amount, submitted_at')
      .eq('company_id', user.profile.company_id)
      .order('submitted_at', { ascending: false })
      .limit(5),
  ])

  const activity: RecentActivityItem[] = [
    ...(recentInvoices ?? []).map((inv) => ({
      kind: 'invoice' as const,
      date: inv.invoice_date,
      href: `/dealer/financial/invoices/${inv.id}`,
      title: `Invoice ${inv.invoice_number}`,
      amount: inv.remaining_balance,
      status: inv.status,
    })),
    ...(recentPayments ?? []).map((p) => ({
      kind: 'payment' as const,
      date: p.submitted_at,
      href: `/dealer/financial/payments/${p.id}`,
      title: `Payment ${p.payment_reference}`,
      amount: p.total_amount,
      status: p.status,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Financial Overview</h1>
        <p className="text-muted-foreground">Last updated {formatDate(account.last_synced_at)}</p>
      </div>

      {onHold && (
        <Alert variant="destructive">
          <AlertTriangle size={16} />
          <AlertDescription>
            <span className="font-semibold">Credit hold: </span>
            {account.credit_hold_message ?? `This account is on hold (${CREDIT_HOLD_STATUS_LABEL[account.credit_hold_status]}).`}
          </AlertDescription>
        </Alert>
      )}
      {!onHold && pastDue && (
        <Alert variant="destructive">
          <AlertTriangle size={16} />
          <AlertDescription>You have a past-due balance of {formatCurrency(account.past_due_balance)}.</AlertDescription>
        </Alert>
      )}
      {!onHold && insufficientCredit && (
        <Alert variant="destructive">
          <AlertTriangle size={16} />
          <AlertDescription>You have no available credit remaining. New terms orders will not be accepted until your balance is reduced.</AlertDescription>
        </Alert>
      )}
      {!onHold && !insufficientCredit && approachingLimit && (
        <Alert>
          <AlertTriangle size={16} />
          <AlertDescription>You&apos;re approaching your credit limit — {formatCurrency(availableCredit)} remaining.</AlertDescription>
        </Alert>
      )}
      {processing && (
        <Alert>
          <Clock size={16} />
          <AlertDescription>A payment is currently processing and has not yet been applied to your balance.</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="flex flex-col gap-6 pt-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <SummaryStat label="Outstanding Balance" value={formatCurrency(account.outstanding_balance)} />
            <SummaryStat
              label="Available Credit"
              value={formatCurrency(availableCredit)}
              emphasis={insufficientCredit ? 'destructive' : 'default'}
              tooltip={
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between gap-4"><span>Credit limit</span><span>{formatCurrency(account.credit_limit)}</span></div>
                  <div className="flex justify-between gap-4"><span>Less: open invoice balance</span><span>−{formatCurrency(account.outstanding_balance)}</span></div>
                  <div className="flex justify-between gap-4"><span>Less: unbilled order exposure</span><span>−{formatCurrency(account.unbilled_order_exposure)}</span></div>
                  <div className="flex justify-between gap-4 border-t border-border/50 pt-1 font-semibold"><span>Available credit</span><span>{formatCurrency(availableCredit)}</span></div>
                </div>
              }
            />
            <SummaryStat label="Credit Limit" value={formatCurrency(account.credit_limit)} />
          </div>

          <div className="grid grid-cols-1 gap-4 border-t pt-4 sm:grid-cols-3">
            <DetailRow label="Next Payment Due" value={nextDueInvoice ? formatDate(nextDueInvoice.due_date) : '—'} />
            <DetailRow
              label="Past-Due Balance"
              value={formatCurrency(account.past_due_balance)}
              emphasis={pastDue ? 'destructive' : 'default'}
            />
            {processing && <DetailRow label="Pending Payments" value={formatCurrency(account.pending_payment_amount)} />}
          </div>

          <div className="flex flex-wrap gap-3 border-t pt-4">
            {hasFinancialPermission(user.profile.role, 'pay_invoices') && (
              <Button render={<Link href="/dealer/financial/payments/new" />} nativeButton={false}>
                Make a Payment
              </Button>
            )}
            <Button variant="outline" render={<Link href="/dealer/financial/invoices" />} nativeButton={false}>
              View Invoices
            </Button>
            <Button variant="outline" render={<Link href="/dealer/financial/statements" />} nativeButton={false}>
              Statements
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent Activity</h2>
            {hasFinancialPermission(user.profile.role, 'view_payments') && (
              <Link href="/dealer/financial/payments" className="text-sm text-primary hover:underline">
                View Payment History
              </Link>
            )}
          </div>
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent invoices or payments yet.</p>
          ) : (
            <div className="flex flex-col divide-y">
              {activity.map((item) => (
                <Link key={`${item.kind}-${item.href}`} href={item.href} className="flex items-center justify-between gap-4 py-3 hover:bg-muted/40">
                  <div className="flex items-center gap-3">
                    {item.kind === 'invoice' ? <Receipt size={18} className="text-muted-foreground" /> : <Wallet size={18} className="text-muted-foreground" />}
                    <div>
                      <div className="text-sm font-semibold">{item.title}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(item.date)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={item.kind === 'invoice' ? INVOICE_STATUS_VARIANT[item.status as keyof typeof INVOICE_STATUS_LABEL] : PAYMENT_STATUS_VARIANT[item.status as keyof typeof PAYMENT_STATUS_LABEL]}>
                      {item.kind === 'invoice' ? INVOICE_STATUS_LABEL[item.status as keyof typeof INVOICE_STATUS_LABEL] : PAYMENT_STATUS_LABEL[item.status as keyof typeof PAYMENT_STATUS_LABEL]}
                    </Badge>
                    <span className="w-24 text-right text-sm font-semibold">{formatCurrency(item.amount)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <h2 className="font-semibold">Account Details</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <DetailRow label="Payment Terms" value={account.payment_terms ? PAYMENT_TERMS_LABEL[account.payment_terms] : '—'} />
            <DetailRow label="Credit Hold Status" value={CREDIT_HOLD_STATUS_LABEL[account.credit_hold_status]} />
            <DetailRow label="Effective Date" value={formatDate(account.effective_date)} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryStat({
  label,
  value,
  emphasis = 'default',
  tooltip,
}: {
  label: string
  value: string
  emphasis?: 'default' | 'destructive'
  tooltip?: ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground">
        {label}
        {tooltip && (
          <Tooltip>
            <TooltipTrigger
              className="inline-flex text-muted-foreground/70 hover:text-foreground"
              aria-label={`How ${label.toLowerCase()} is calculated`}
            >
              <Info size={13} />
            </TooltipTrigger>
            <TooltipContent side="top" align="start" className="normal-case">
              {tooltip}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className={`mt-1 text-2xl font-bold ${emphasis === 'destructive' ? 'text-destructive' : ''}`}>{value}</div>
    </div>
  )
}

function DetailRow({ label, value, emphasis = 'default' }: { label: string; value: string; emphasis?: 'default' | 'destructive' }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase text-muted-foreground">{label}</div>
      <div className={`font-medium ${emphasis === 'destructive' ? 'text-destructive' : ''}`}>{value}</div>
    </div>
  )
}

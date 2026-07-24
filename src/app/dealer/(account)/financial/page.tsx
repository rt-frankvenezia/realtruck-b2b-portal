import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, Clock, CreditCard, FileText, Info, Landmark, Receipt, Wallet } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { hasFinancialPermission } from '@/lib/financial-permissions'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatCurrency, formatDate, PAYMENT_TERMS_LABEL, CREDIT_HOLD_STATUS_LABEL } from '@/lib/status-labels'

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
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
        <SummaryCard label="Credit Limit" value={formatCurrency(account.credit_limit)} />
        <SummaryCard label="Outstanding Balance" value={formatCurrency(account.outstanding_balance)} />
        <SummaryCard label="Past-Due Balance" value={formatCurrency(account.past_due_balance)} emphasis={pastDue ? 'destructive' : 'default'} />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <h2 className="font-semibold">Account Details</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <DetailRow label="Payment Terms" value={account.payment_terms ? PAYMENT_TERMS_LABEL[account.payment_terms] : '—'} />
            <DetailRow label="Unbilled Order Exposure" value={formatCurrency(account.unbilled_order_exposure)} />
            <DetailRow label="Pending Payments" value={formatCurrency(account.pending_payment_amount)} />
            <DetailRow label="Credit Hold Status" value={CREDIT_HOLD_STATUS_LABEL[account.credit_hold_status]} />
            <DetailRow label="Effective Date" value={formatDate(account.effective_date)} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Button variant="outline" className="h-auto justify-start gap-3 p-4" render={<Link href="/dealer/financial/invoices" />} nativeButton={false}>
          <Receipt size={20} />
          <div className="text-left">
            <div className="font-semibold">View Invoices</div>
            <div className="text-xs text-muted-foreground">Open, past-due, and paid invoices</div>
          </div>
        </Button>
        {hasFinancialPermission(user.profile.role, 'pay_invoices') && (
          <Button variant="outline" className="h-auto justify-start gap-3 p-4" render={<Link href="/dealer/financial/payments/new" />} nativeButton={false}>
            <Wallet size={20} />
            <div className="text-left">
              <div className="font-semibold">Make a Payment</div>
              <div className="text-xs text-muted-foreground">Pay open invoices by ACH</div>
            </div>
          </Button>
        )}
        {hasFinancialPermission(user.profile.role, 'view_payments') && (
          <Button variant="outline" className="h-auto justify-start gap-3 p-4" render={<Link href="/dealer/financial/payments" />} nativeButton={false}>
            <Receipt size={20} />
            <div className="text-left">
              <div className="font-semibold">Payment History</div>
              <div className="text-xs text-muted-foreground">Track submitted, processing, and applied payments</div>
            </div>
          </Button>
        )}
        {hasFinancialPermission(user.profile.role, 'manage_bank_accounts') && (
          <Button variant="outline" className="h-auto justify-start gap-3 p-4" render={<Link href="/dealer/financial/bank-accounts" />} nativeButton={false}>
            <Landmark size={20} />
            <div className="text-left">
              <div className="font-semibold">Bank Accounts</div>
              <div className="text-xs text-muted-foreground">Manage accounts used for ACH payments</div>
            </div>
          </Button>
        )}
        <Button variant="outline" className="h-auto justify-start gap-3 p-4" render={<Link href="/dealer/financial/statements" />} nativeButton={false}>
          <FileText size={20} />
          <div className="text-left">
            <div className="font-semibold">Statements</div>
            <div className="text-xs text-muted-foreground">Generate and download account statements</div>
          </div>
        </Button>
      </div>
    </div>
  )
}

function SummaryCard({
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
    <Card>
      <CardContent className="pt-6">
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
      </CardContent>
    </Card>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  )
}

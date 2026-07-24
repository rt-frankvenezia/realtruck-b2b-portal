import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { hasFinancialPermission } from '@/lib/financial-permissions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PAYMENT_STATUS_LABEL, PAYMENT_STATUS_VARIANT, PAYMENT_STATUS_MESSAGE, formatCurrency, formatDate } from '@/lib/status-labels'

export default async function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user || !user.profile.company_id) redirect('/dealer')
  if (!hasFinancialPermission(user.profile.role, 'view_payments')) redirect('/dealer')

  const { id } = await params
  const supabase = await createClient()

  const { data: payment } = await supabase
    .from('payments')
    .select('*, bank_accounts(bank_name, last_four, account_type)')
    .eq('id', id)
    .maybeSingle()
  if (!payment) notFound()

  const { data: allocations } = await supabase
    .from('payment_allocations')
    .select('*, invoices(invoice_number)')
    .eq('payment_id', id)

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" className="w-fit" render={<Link href="/dealer/financial/payments" />} nativeButton={false}>
        <ArrowLeft size={14} />
        Back to Payment History
      </Button>

      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">{payment.payment_reference}</h1>
        <Badge variant={PAYMENT_STATUS_VARIANT[payment.status]}>{PAYMENT_STATUS_LABEL[payment.status]}</Badge>
      </div>

      <Alert>
        <AlertDescription>{PAYMENT_STATUS_MESSAGE[payment.status]}</AlertDescription>
      </Alert>

      {(payment.status === 'failed' || payment.status === 'returned') && (payment.failure_reason || payment.return_reason) && (
        <Alert variant="destructive">
          <AlertDescription>{payment.failure_reason ?? payment.return_reason}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <DetailCard label="Submitted" value={formatDate(payment.submitted_at)} />
        <DetailCard label="Settled" value={formatDate(payment.settled_at)} />
        <DetailCard label="Applied" value={formatDate(payment.applied_at)} />
        <DetailCard label="Total Amount" value={formatCurrency(payment.total_amount)} />
      </div>

      <div className="rounded-lg border p-6">
        <div className="mb-3 font-semibold">Bank Account</div>
        <p className="text-sm text-muted-foreground">
          {payment.bank_accounts ? `${payment.bank_accounts.bank_name} •••• ${payment.bank_accounts.last_four}` : '—'}
        </p>
        {payment.processor_reference && (
          <p className="mt-1 text-xs text-muted-foreground">Processor Reference: {payment.processor_reference}</p>
        )}
      </div>

      <div className="rounded-lg border">
        <div className="border-b px-6 py-4 font-semibold">Invoice Allocations</div>
        <div className="flex flex-col divide-y">
          {(allocations ?? []).map((alloc) => (
            <div key={alloc.id} className="flex items-center justify-between px-6 py-3 text-sm">
              <Link href={`/dealer/financial/invoices/${alloc.invoice_id}`} className="font-medium hover:underline">
                {alloc.invoices?.invoice_number}
              </Link>
              <span className="font-semibold">{formatCurrency(alloc.amount)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-xs font-semibold uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-bold">{value}</div>
    </div>
  )
}

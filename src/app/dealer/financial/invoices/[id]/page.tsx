import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, MapPin, Receipt } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { hasFinancialPermission } from '@/lib/financial-permissions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DownloadDocumentButton } from '@/components/dealer/financial/DownloadDocumentButton'
import { INVOICE_STATUS_LABEL, INVOICE_STATUS_VARIANT, PAYMENT_TERMS_LABEL, formatCurrency, formatDate } from '@/lib/status-labels'

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user || !user.profile.company_id) redirect('/dealer')
  if (!hasFinancialPermission(user.profile.role, 'view_invoices')) redirect('/dealer')

  const { id } = await params
  const supabase = await createClient()

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, locations(name, address, city, state, postal_code), product_orders(order_number)')
    .eq('id', id)
    .maybeSingle()
  if (!invoice) notFound()

  const [{ data: lineItems }, { data: creditMemos }, { data: allocations }, { data: account }] = await Promise.all([
    supabase.from('invoice_line_items').select('*').eq('invoice_id', id).order('id'),
    supabase.from('credit_memos').select('*').eq('related_invoice_id', id),
    supabase.from('payment_allocations').select('*, payments(payment_reference, status, submitted_at, applied_at)').eq('invoice_id', id),
    supabase.from('credit_accounts').select('payment_terms').eq('company_id', invoice.company_id).maybeSingle(),
  ])

  const eligible = (invoice.status === 'open' || invoice.status === 'past_due') && invoice.remaining_balance > 0

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" className="w-fit" render={<Link href="/dealer/financial/invoices" />} nativeButton={false}>
        <ArrowLeft size={14} />
        Back to Invoices
      </Button>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{invoice.invoice_number}</h1>
            <Badge variant={INVOICE_STATUS_VARIANT[invoice.status]}>{INVOICE_STATUS_LABEL[invoice.status]}</Badge>
          </div>
          {invoice.po_number && <p className="text-muted-foreground">PO Number: {invoice.po_number}</p>}
        </div>
        <DownloadDocumentButton label="Download Invoice" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <DetailCard label="Invoice Date" value={formatDate(invoice.invoice_date)} />
        <DetailCard label="Due Date" value={formatDate(invoice.due_date)} />
        <DetailCard label="Original Amount" value={formatCurrency(invoice.original_amount)} />
        <DetailCard label="Remaining Balance" value={formatCurrency(invoice.remaining_balance)} emphasis />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border p-6">
          <div className="mb-3 flex items-center gap-2 font-semibold">
            <Receipt size={18} />
            Order &amp; Billing
          </div>
          <DetailRow label="Order Number" value={invoice.product_orders?.order_number ?? '—'} />
          <DetailRow label="Payment Terms" value={account?.payment_terms ? PAYMENT_TERMS_LABEL[account.payment_terms] : '—'} />
        </div>
        <div className="rounded-lg border p-6">
          <div className="mb-3 flex items-center gap-2 font-semibold">
            <MapPin size={18} />
            Ordering Location
          </div>
          {invoice.locations ? (
            <div className="text-sm text-muted-foreground">
              <div className="font-medium text-foreground">{invoice.locations.name}</div>
              <div>{invoice.locations.address}</div>
              <div>
                {[invoice.locations.city, invoice.locations.state, invoice.locations.postal_code].filter(Boolean).join(', ')}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">—</p>
          )}
        </div>
      </div>

      <div className="rounded-lg border">
        <div className="border-b px-6 py-4 font-semibold">Line Items</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-xs font-semibold uppercase text-muted-foreground">
              <th className="px-6 py-3">Description</th>
              <th className="px-6 py-3">SKU</th>
              <th className="px-6 py-3 text-center">Qty</th>
              <th className="px-6 py-3 text-right">Unit Price</th>
              <th className="px-6 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {(lineItems ?? []).map((item) => (
              <tr key={item.id} className="border-b last:border-b-0">
                <td className="px-6 py-3">{item.description}</td>
                <td className="px-6 py-3 font-mono text-xs text-muted-foreground">{item.sku ?? '—'}</td>
                <td className="px-6 py-3 text-center">{item.quantity}</td>
                <td className="px-6 py-3 text-right">{formatCurrency(item.unit_price)}</td>
                <td className="px-6 py-3 text-right font-semibold">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {creditMemos && creditMemos.length > 0 && (
        <div className="rounded-lg border">
          <div className="border-b px-6 py-4 font-semibold">Credits &amp; Adjustments</div>
          <div className="flex flex-col divide-y">
            {creditMemos.map((memo) => (
              <div key={memo.id} className="flex items-center justify-between px-6 py-3 text-sm">
                <span>{memo.credit_memo_number}</span>
                <span className="font-semibold">{formatCurrency(memo.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {allocations && allocations.length > 0 && (
        <div className="rounded-lg border">
          <div className="border-b px-6 py-4 font-semibold">Payment Activity</div>
          <div className="flex flex-col divide-y">
            {allocations.map((alloc) => (
              <div key={alloc.id} className="flex items-center justify-between px-6 py-3 text-sm">
                <div>
                  <div className="font-medium">{alloc.payments?.payment_reference}</div>
                  <div className="text-xs text-muted-foreground">Submitted {formatDate(alloc.payments?.submitted_at ?? null)}</div>
                </div>
                <span className="font-semibold">{formatCurrency(alloc.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {eligible && hasFinancialPermission(user.profile.role, 'pay_invoices') && (
        <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
          This invoice is eligible for payment. Invoice payments will be available in a future update.
        </div>
      )}
    </div>
  )
}

function DetailCard({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-xs font-semibold uppercase text-muted-foreground">{label}</div>
      <div className={`mt-1 text-xl font-bold ${emphasis ? '' : ''}`}>{value}</div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b py-2 text-sm last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Receipt } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { hasFinancialPermission } from '@/lib/financial-permissions'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { INVOICE_STATUS_LABEL, INVOICE_STATUS_VARIANT, formatCurrency, formatDate } from '@/lib/status-labels'
import type { Database } from '@/lib/database.types'

type InvoiceStatus = Database['public']['Enums']['invoice_status']
const STATUS_FILTERS: InvoiceStatus[] = ['open', 'past_due', 'payment_processing', 'paid']

export default async function InvoiceCenterPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>
}) {
  const user = await getCurrentUser()
  if (!user || !user.profile.company_id) redirect('/dealer')
  if (!hasFinancialPermission(user.profile.role, 'view_invoices')) redirect('/dealer')

  const { status, q } = await searchParams
  const supabase = await createClient()
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, locations(name), product_orders(order_number)')
    .order('invoice_date', { ascending: false })

  const all = invoices ?? []
  const filtered = all.filter((inv) => {
    if (status && inv.status !== status) return false
    if (q) {
      const needle = q.toLowerCase()
      const haystack = [inv.invoice_number, inv.po_number, inv.product_orders?.order_number].filter(Boolean).join(' ').toLowerCase()
      if (!haystack.includes(needle)) return false
    }
    return true
  })

  function isEligible(inv: (typeof all)[number]) {
    return (inv.status === 'open' || inv.status === 'past_due') && inv.remaining_balance > 0
  }

  const baseParams = new URLSearchParams()
  if (q) baseParams.set('q', q)
  function statusHref(value: string) {
    const params = new URLSearchParams(baseParams)
    if (status === value) params.delete('status')
    else params.set('status', value)
    const qs = params.toString()
    return `/dealer/financial/invoices${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Invoice Center</h1>
        <p className="text-muted-foreground">{all.length} invoice{all.length === 1 ? '' : 's'} on this account.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <form action="/dealer/financial/invoices" className="flex-1 min-w-56">
          {status && <input type="hidden" name="status" value={status} />}
          <Input name="q" defaultValue={q ?? ''} placeholder="Search invoice, order, or PO number" />
        </form>
        <div className="flex gap-2">
          {STATUS_FILTERS.map((s) => (
            <Link
              key={s}
              href={statusHref(s)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${status === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
            >
              {INVOICE_STATUS_LABEL[s]}
            </Link>
          ))}
        </div>
      </div>

      {all.length === 0 ? (
        <EmptyState message="There are no invoices for this account yet." />
      ) : filtered.length === 0 ? (
        <EmptyState message="No invoices match the selected filters." />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs font-semibold uppercase text-muted-foreground">
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Invoice Date</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3 text-right">Original</th>
                <th className="px-4 py-3 text-right">Remaining</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id} className="border-b last:border-b-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link href={`/dealer/financial/invoices/${inv.id}`} className="font-semibold hover:underline">
                      {inv.invoice_number}
                    </Link>
                    {inv.po_number && <div className="text-xs text-muted-foreground">PO: {inv.po_number}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={INVOICE_STATUS_VARIANT[inv.status]}>{INVOICE_STATUS_LABEL[inv.status]}</Badge>
                  </td>
                  <td className="px-4 py-3">{formatDate(inv.invoice_date)}</td>
                  <td className="px-4 py-3">{formatDate(inv.due_date)}</td>
                  <td className="px-4 py-3">{inv.product_orders?.order_number ?? '—'}</td>
                  <td className="px-4 py-3">{inv.locations?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(inv.original_amount)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatCurrency(inv.remaining_balance)}</td>
                  <td className="px-4 py-3 text-right">
                    {isEligible(inv) ? (
                      <Badge variant="outline">Eligible for payment</Badge>
                    ) : inv.status === 'payment_processing' ? (
                      <span className="text-xs text-muted-foreground">Payment pending</span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <Receipt size={40} className="text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  )
}

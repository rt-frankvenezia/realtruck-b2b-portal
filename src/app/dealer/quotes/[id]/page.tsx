import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { QuoteStatusSelect } from '@/components/dealer/QuoteStatusSelect'
import { formatCurrency, formatDate } from '@/lib/status-labels'

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const user = await getCurrentUser()

  const [{ data: quote }, { data: lineItems }] = await Promise.all([
    supabase.from('quotes').select('*').eq('id', id).maybeSingle(),
    supabase.from('quote_line_items').select('*').eq('quote_id', id),
  ])

  if (!quote) notFound()

  const canEdit = user?.profile.role === 'dealer_admin' || user?.profile.role === 'location_admin' || user?.profile.role === 'realtruck_admin'
  const total = (lineItems ?? []).reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{quote.customer_name}</h1>
          <p className="text-muted-foreground">
            {[quote.vehicle_year, quote.vehicle_make, quote.vehicle_model].filter(Boolean).join(' ')} · {formatDate(quote.created_at)}
          </p>
        </div>
        {canEdit && <QuoteStatusSelect quoteId={quote.id} status={quote.status} />}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Email</p>
            <p>{quote.customer_email}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Phone</p>
            <p>{quote.customer_phone ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Address</p>
            <p>{quote.customer_address ?? '—'}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Line items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(lineItems ?? []).map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.sku ?? '—'}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-end border-t p-4 text-sm font-medium">
            Total: {formatCurrency(total)}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

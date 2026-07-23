import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { QuoteStatusActions } from '@/components/dealer/QuoteStatusActions'
import { QuoteActivityTimeline } from '@/components/dealer/QuoteActivityTimeline'
import { QuoteLineItemsEditor } from '@/components/dealer/QuoteLineItemsEditor'
import { QUOTE_STATUS_LABEL, QUOTE_STATUS_VARIANT, formatDate } from '@/lib/status-labels'

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const user = await getCurrentUser()

  const [{ data: quote }, { data: lineItems }, { data: activity }] = await Promise.all([
    supabase.from('quotes').select('*, locations(name)').eq('id', id).maybeSingle(),
    supabase.from('quote_line_items').select('*').eq('quote_id', id).order('type'),
    supabase.from('quote_activity').select('*, users(name)').eq('quote_id', id).order('created_at', { ascending: false }),
  ])

  if (!quote) notFound()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{quote.customer_name}</h1>
          <p className="text-muted-foreground">
            {[quote.vehicle_year, quote.vehicle_make, quote.vehicle_model].filter(Boolean).join(' ')} · {formatDate(quote.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={QUOTE_STATUS_VARIANT[quote.status]}>{QUOTE_STATUS_LABEL[quote.status]}</Badge>
          <QuoteStatusActions quoteId={quote.id} status={quote.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <Field label="Source" value="3D Configurator" />
              <Field label="Location" value={quote.locations?.name ?? null} />
              <Field label="Email" value={quote.customer_email} />
              <Field label="Phone" value={quote.customer_phone} />
              <Field label="Address" value={quote.customer_address} />
              <Field label="Bed Length" value={quote.bed_length} />
              <Field label="Body Type" value={quote.body_type} />
              <Field label="Engine" value={quote.engine} />
              <Field label="Tax Rate" value={quote.tax_rate ? `${(Number(quote.tax_rate) * 100).toFixed(2)}%` : null} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
            </CardHeader>
            <CardContent>
              <QuoteLineItemsEditor quoteId={quote.id} lineItems={lineItems ?? []} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Activity & Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <QuoteActivityTimeline
              quoteId={quote.id}
              entries={activity ?? []}
              canAddInternal={user?.profile.role === 'realtruck_admin'}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p>{value || '—'}</p>
    </div>
  )
}

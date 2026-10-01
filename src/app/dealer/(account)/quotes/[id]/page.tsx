import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { Card, CardContent } from '@/components/ui/card'
import { QuoteStatusActions } from '@/components/dealer/QuoteStatusActions'
import { QuoteActivityTimeline } from '@/components/dealer/QuoteActivityTimeline'
import { QuoteLineItemsEditor } from '@/components/dealer/QuoteLineItemsEditor'
import { AdminQuoteReassignDialog } from '@/components/admin/AdminQuoteReassignDialog'
import { QUOTE_STATUS_LABEL } from '@/lib/status-labels'

function quoteDisplayNum(id: string): string {
  const n = parseInt(id.split('-').pop() ?? '0', 16)
  return `26-${71000 + (n % 1000)}`
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value || '—'}</p>
    </div>
  )
}

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const user = await getCurrentUser()
  const isAdmin = user?.profile.role === 'realtruck_admin'

  const [{ data: quote }, { data: lineItems }, { data: activity }] = await Promise.all([
    supabase.from('quotes').select('*').eq('id', id).maybeSingle(),
    supabase.from('quote_line_items').select('*').eq('quote_id', id).order('type'),
    supabase.from('quote_activity').select('*').eq('quote_id', id).order('created_at', { ascending: false }),
  ])

  if (!quote) notFound()

  // Fetch location for display
  const { data: location } = await supabase
    .from('locations')
    .select('id, name, code, city, state, company_id')
    .eq('id', quote.location_id ?? '')
    .maybeSingle()

  // For admin reassign dialog: fetch all available locations
  const { data: allLocations } = isAdmin
    ? await supabase.from('locations').select('id, name, code, city, state, company_id, companies(name)') as any
    : { data: null }

  const reassignLocations = (allLocations ?? []).map((l: any) => ({
    id: l.id,
    name: l.name,
    code: l.code,
    city: l.city,
    state: l.state,
    company_id: l.company_id,
    company_name: l.companies?.name ?? '',
  }))

  const displayNum = quoteDisplayNum(quote.id)
  const currentLocationName = location ? `${location.code} ${location.city}` : 'Unknown'

  const createdAt = new Date(quote.created_at).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <div className="flex flex-col gap-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link href="/dealer/quotes" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft size={14} />
          Back to Quotes
        </Link>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <AdminQuoteReassignDialog
              quoteId={quote.id}
              quoteDisplayNum={displayNum}
              currentLocationName={currentLocationName}
              locations={reassignLocations}
            />
          )}
          <QuoteStatusActions quoteId={quote.id} status={quote.status} />
        </div>
      </div>

      {/* 3-column cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Customer */}
        <Card>
          <div className="bg-[#1E1E1E] px-4 py-3">
            <h2 className="font-semibold text-white">Customer</h2>
          </div>
          <CardContent className="flex flex-col gap-3 p-4">
            <Field label="Full Name" value={quote.customer_name} />
            <Field label="Email" value={quote.customer_email} />
            <Field label="Phone Number" value={quote.customer_phone} />
          </CardContent>
        </Card>

        {/* Vehicle */}
        <Card>
          <div className="bg-[#1E1E1E] px-4 py-3">
            <h2 className="font-semibold text-white">Vehicle</h2>
          </div>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Year" value={quote.vehicle_year} />
              <Field label="Make" value={quote.vehicle_make} />
              <Field label="Model" value={quote.vehicle_model} />
              <Field label="Bed Length" value={quote.bed_length} />
              <Field label="Body Type" value={quote.body_type} />
              <Field label="Engine" value={quote.engine} />
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <div className="bg-[#1E1E1E] px-4 py-3">
            <h2 className="font-semibold text-white">Summary</h2>
          </div>
          <CardContent className="flex flex-col gap-3 p-4">
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="mt-0.5 text-sm font-medium">{QUOTE_STATUS_LABEL[quote.status]}</p>
            </div>
            <Field label="Quote ID" value={displayNum} />
            <Field label="Created" value={createdAt} />
            {location && <Field label="Location" value={`${location.name} (${location.code})`} />}
          </CardContent>
        </Card>
      </div>

      {/* Line items */}
      <QuoteLineItemsEditor
        quoteId={quote.id}
        lineItems={lineItems ?? []}
        taxRate={quote.tax_rate}
      />

      {/* Message To Customer */}
      <div className="overflow-hidden rounded-lg border">
        <div className="bg-[#1E1E1E] px-4 py-3">
          <h2 className="font-semibold text-white">Message To Customer</h2>
        </div>
        <div className="p-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-muted-foreground">Message</label>
            <textarea
              rows={4}
              placeholder="Enter your message here..."
              className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      {/* Activity */}
      <div className="overflow-hidden rounded-lg border">
        <QuoteActivityTimeline
          quoteId={quote.id}
          entries={(activity ?? []) as any}
          canAddInternal={isAdmin}
        />
      </div>
    </div>
  )
}

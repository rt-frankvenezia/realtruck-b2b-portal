import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { QuoteStatusSelect } from '@/components/dealer/QuoteStatusSelect'
import { QuoteActivityTimeline } from '@/components/dealer/QuoteActivityTimeline'
import { QuoteLineItemsEditor } from '@/components/dealer/QuoteLineItemsEditor'
import { AdminQuoteReassignDialog } from '@/components/admin/AdminQuoteReassignDialog'
import { LeerConfigurePanel } from '@/components/dealer/LeerConfigurePanel'
import { ExternalOrderPanel } from '@/components/dealer/ExternalOrderPanel'
import { QuoteSendButton } from '@/components/dealer/QuoteSendButton'
import { QuoteCartButton } from '@/components/dealer/QuoteCartButton'
import { SendQuotePanel } from '@/components/dealer/SendQuotePanel'
import { QUOTE_SOURCE_LABEL, QUOTE_BRAND_LABEL, ACC_CONFIG_METHODS, FIBERGLASS_CONFIG_METHODS } from '@/lib/quote-config'

const PANEL = 'overflow-hidden rounded border border-[#d5d5d5] bg-white'
const PANEL_HEADER = 'bg-[#1E1E1E] px-4 py-3'
const PANEL_BODY = 'p-4'

const ACC_PORTAL_URL = 'https://acc.leergroup.com'

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
    supabase.from('quote_line_items').select('*').eq('quote_id', id).order('created_at', { ascending: true }),
    supabase.from('quote_activity').select('*').eq('quote_id', id).order('created_at', { ascending: false }),
  ])

  if (!quote) notFound()

  const { data: location } = await supabase
    .from('locations')
    .select('id, name, code, city, state, company_id')
    .eq('id', quote.location_id ?? '')
    .maybeSingle()

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
  const configMethod = (quote as any).configuration_method ?? null
  const isFiberglass = FIBERGLASS_CONFIG_METHODS.has(configMethod)
  const isACC = ACC_CONFIG_METHODS.has(configMethod)
  const hasLineItems = (lineItems ?? []).length > 0

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
          {/* Fiberglass: Add to Cart when quote_sent */}
          {isFiberglass && hasLineItems && (
            <QuoteCartButton
              quoteId={quote.id}
              brand={(quote as any).brand ?? 'LEER'}
              status={quote.status}
              lineItems={(lineItems ?? []) as any}
              configurationSnapshot={(quote as any).configuration_snapshot}
            />
          )}
          {/* Aluminum: ACC portal link when quote_sent */}
          {isACC && quote.status === 'quote_sent' && (
            <a
              href={ACC_PORTAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded border border-input bg-background px-3 py-1.5 text-sm font-semibold hover:bg-muted"
            >
              ACC Order Portal
              <ExternalLink size={13} />
            </a>
          )}
          {/* Send / Resend quote */}
          <QuoteSendButton quoteId={quote.id} status={quote.status} />
        </div>
      </div>

      {/* 3-column panels */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className={PANEL}>
          <div className={PANEL_HEADER}>
            <h2 className="font-semibold text-white">Customer</h2>
          </div>
          <div className={`${PANEL_BODY} flex flex-col gap-3`}>
            <Field label="Full Name" value={quote.customer_name} />
            <Field label="Email" value={quote.customer_email} />
            <Field label="Phone Number" value={quote.customer_phone} />
          </div>
        </div>

        <div className={PANEL}>
          <div className={PANEL_HEADER}>
            <h2 className="font-semibold text-white">Vehicle</h2>
          </div>
          <div className={`${PANEL_BODY} grid grid-cols-2 gap-3`}>
            <Field label="Year" value={quote.vehicle_year} />
            <Field label="Make" value={quote.vehicle_make} />
            <Field label="Model" value={quote.vehicle_model} />
            <Field label="Bed Length" value={quote.bed_length} />
            <Field label="Body Type" value={quote.body_type} />
            <Field label="Engine" value={quote.engine} />
          </div>
        </div>

        <div className={PANEL}>
          <div className={PANEL_HEADER}>
            <h2 className="font-semibold text-white">Summary</h2>
          </div>
          <div className={`${PANEL_BODY} flex flex-col gap-3`}>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <QuoteStatusSelect quoteId={quote.id} status={quote.status} />
            </div>
            <Field label="Quote ID" value={displayNum} />
            <Field label="Created" value={createdAt} />
            {location && <Field label="Location" value={`${location.name} (${location.code})`} />}
            {(quote as any).brand && (
              <Field label="Brand" value={QUOTE_BRAND_LABEL[(quote as any).brand] ?? (quote as any).brand} />
            )}
            {(quote as any).source && (
              <Field label="Source" value={QUOTE_SOURCE_LABEL[(quote as any).source] ?? (quote as any).source} />
            )}
            {(quote as any).original_requested_product && (
              <Field label="Requested Product" value={(quote as any).original_requested_product} />
            )}
          </div>
        </div>
      </div>

      {/* LEER configuration panel */}
      {(quote as any).brand === 'LEER' && (
        <LeerConfigurePanel
          quoteId={quote.id}
          configurationMethod={configMethod}
          originalRequestedProduct={(quote as any).original_requested_product ?? null}
          configurationSnapshot={(quote as any).configuration_snapshot ?? null}
          hasLineItems={hasLineItems}
        />
      )}

      {/* Line items */}
      <QuoteLineItemsEditor
        quoteId={quote.id}
        lineItems={lineItems ?? []}
        taxRate={quote.tax_rate}
        configMethod={configMethod}
      />

      {/* Aluminum → ACC external order number recording */}
      {isACC && (
        <ExternalOrderPanel
          quoteId={quote.id}
          brand={(quote as any).brand ?? 'LEER'}
          initialOrderNumber={(quote as any).external_order_number ?? null}
          orderedAt={(quote as any).ordered_externally_at ?? null}
        />
      )}

      {/* Message to customer */}
      <SendQuotePanel quoteId={quote.id} status={quote.status} />

      {/* Activity */}
      <div className={PANEL}>
        <QuoteActivityTimeline
          quoteId={quote.id}
          entries={(activity ?? []) as any}
          canAddInternal={isAdmin}
        />
      </div>
    </div>
  )
}

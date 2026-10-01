import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { CustomerOrderActions } from '@/components/customer/CustomerOrderActions'
import { CUSTOMER_FACING_STATUS_LABEL, CUSTOMER_FACING_STATUS_VARIANT, formatCurrency, formatDate } from '@/lib/status-labels'

const PANEL = 'overflow-hidden rounded border border-[#d5d5d5] bg-white'
const PANEL_HEADER = 'bg-[#1E1E1E] px-4 py-3'
const PANEL_BODY = 'p-4'

export default async function AccountOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: installation }, { data: confirmation }, { data: status }] = await Promise.all([
    supabase.from('installations').select('*, locations(name, city, state, phone_number)').eq('id', id).maybeSingle(),
    supabase.from('installation_confirmations').select('*').eq('installation_id', id).maybeSingle(),
    supabase.rpc('get_customer_facing_status', { p_installation_id: id }),
  ])

  if (!installation) notFound()

  const awaitingResponse = confirmation?.submitted_at != null && confirmation.status === 'pending'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{installation.order_number}</h1>
          <p className="text-muted-foreground">
            {installation.vehicle_year} {installation.vehicle_make} {installation.vehicle_model}
          </p>
        </div>
        {status && (
          <Badge variant={CUSTOMER_FACING_STATUS_VARIANT[status]} className="text-sm">
            {CUSTOMER_FACING_STATUS_LABEL[status]}
          </Badge>
        )}
      </div>

      {awaitingResponse && (
        <div className={PANEL}>
          <div className={PANEL_HEADER}>
            <h2 className="font-semibold text-white">How did your installation go?</h2>
            <p className="text-sm text-white/70">Your dealer has submitted their documentation — let us know it&apos;s all good, or flag an issue.</p>
          </div>
          <div className={PANEL_BODY}>
            <CustomerOrderActions installationId={installation.id} />
          </div>
        </div>
      )}

      <div className={PANEL}>
        <div className={PANEL_HEADER}>
          <h2 className="font-semibold text-white">Order details</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3 p-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Cap Model</p>
            <p>{installation.cap_model ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Color / Finish</p>
            <p>{[installation.cap_color, installation.cap_finish].filter(Boolean).join(' / ') || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Total</p>
            <p>{formatCurrency(Number(installation.msrp) + Number(installation.installation_fee))}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Order Date</p>
            <p>{formatDate(installation.order_date)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Scheduled Installation</p>
            <p>{formatDate(installation.scheduled_installation_date)}</p>
          </div>
        </div>
      </div>

      {installation.locations && (
        <div className={PANEL}>
          <div className={PANEL_HEADER}>
            <h2 className="font-semibold text-white">Installing dealer</h2>
          </div>
          <div className="text-sm p-4">
            <p className="font-medium">{installation.locations.name}</p>
            <p className="text-muted-foreground">
              {installation.locations.city}, {installation.locations.state}
            </p>
            {installation.locations.phone_number && <p className="text-muted-foreground">{installation.locations.phone_number}</p>}
          </div>
        </div>
      )}
    </div>
  )
}

import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { INSTALLATIONS_ENABLED } from '@/lib/feature-flags'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  DEALER_STATUS_LABEL,
  DEALER_STATUS_VARIANT,
  formatCurrency,
  formatDate,
} from '@/lib/status-labels'
import { VerificationPanel, type VerificationStatus } from '@/components/dealer/VerificationPanel'
import { StatusHistoryTimeline } from '@/components/dealer/StatusHistoryTimeline'
import { PayoutSummary } from '@/components/dealer/PayoutSummary'

export default async function InstallationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!INSTALLATIONS_ENABLED) redirect('/dealer')
  const { id } = await params
  const supabase = await createClient()

  const [
    { data: installation },
    { data: photos },
    { data: checklistItems },
    { data: issues },
    { data: confirmation },
    { data: statusHistory },
    { data: payout },
    { data: verificationStatus },
  ] = await Promise.all([
    supabase.from('installations').select('*').eq('id', id).maybeSingle(),
    supabase.from('installation_photos').select('*').eq('installation_id', id),
    supabase.from('installation_checklist_items').select('*').eq('installation_id', id),
    supabase.from('installation_issues').select('*').eq('installation_id', id).order('reported_at', { ascending: false }),
    supabase.from('installation_confirmations').select('*').eq('installation_id', id).maybeSingle(),
    supabase
      .from('installation_status_history')
      .select('*')
      .eq('installation_id', id)
      .order('created_at', { ascending: false }),
    supabase.from('payouts').select('*').eq('installation_id', id).maybeSingle(),
    supabase.rpc('installation_verification_status', { p_installation_id: id }),
  ])

  if (!installation) notFound()

  const photosWithUrls = await Promise.all(
    (photos ?? []).map(async (photo) => {
      const { data: signed } = await supabase.storage
        .from('installation-photos')
        .createSignedUrl(photo.storage_path, 300)
      return { ...photo, url: signed?.signedUrl ?? null }
    })
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{installation.order_number}</h1>
          <p className="text-muted-foreground">
            {installation.customer_name} · {installation.vehicle_year} {installation.vehicle_make} {installation.vehicle_model}
          </p>
        </div>
        <Badge variant={DEALER_STATUS_VARIANT[installation.dealer_status]} className="text-sm">
          {DEALER_STATUS_LABEL[installation.dealer_status]}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Order details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <Field label="Cap Model" value={installation.cap_model} />
              <Field label="Color / Finish" value={[installation.cap_color, installation.cap_finish].filter(Boolean).join(' / ') || null} />
              <Field label="MSRP" value={formatCurrency(installation.msrp)} />
              <Field label="Installation Fee" value={formatCurrency(installation.installation_fee)} />
              <Field label="Order Date" value={formatDate(installation.order_date)} />
              <Field label="Scheduled Date" value={formatDate(installation.scheduled_installation_date)} />
              <Field label="Customer Email" value={installation.customer_email} />
              <Field label="Customer Phone" value={installation.customer_phone} />
              {installation.dealer_instructions && (
                <div className="col-span-full">
                  <p className="text-xs font-medium text-muted-foreground">Dealer Instructions</p>
                  <p>{installation.dealer_instructions}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <VerificationPanel
            installationId={installation.id}
            dealerStatus={installation.dealer_status}
            photos={photosWithUrls}
            checklistItems={checklistItems ?? []}
            issues={issues ?? []}
            confirmation={confirmation}
            verificationStatus={verificationStatus as VerificationStatus}
          />
        </div>

        <div className="flex flex-col gap-6">
          <PayoutSummary payout={payout} />

          <Card>
            <CardHeader>
              <CardTitle>Status history</CardTitle>
              <CardDescription>Every transition, in order — dealer, ERP, or RT admin sourced.</CardDescription>
            </CardHeader>
            <CardContent>
              <StatusHistoryTimeline entries={statusHistory ?? []} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p>{value || '—'}</p>
      <Separator className="mt-2 sm:hidden" />
    </div>
  )
}

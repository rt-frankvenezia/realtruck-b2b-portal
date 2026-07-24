import Link from 'next/link'
import { AlertTriangle, CheckCircle, Clock, FileText, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { StartApplicationButton } from '@/components/dealer/credit/StartApplicationButton'
import { WithdrawApplicationButton } from '@/components/dealer/credit/WithdrawApplicationButton'
import { RespondToInfoRequestForm } from '@/components/dealer/credit/RespondToInfoRequestForm'
import {
  CREDIT_APPLICATION_STATUS_LABEL,
  CREDIT_APPLICATION_STATUS_VARIANT,
  PAYMENT_TERMS_LABEL,
  formatCurrency,
  formatDate,
} from '@/lib/status-labels'
import type { Database } from '@/lib/database.types'

type CreditApplication = Database['public']['Tables']['credit_applications']['Row']

export async function CreditApplicationStatusView({
  application,
  canEdit,
}: {
  application: CreditApplication
  canEdit: boolean
}) {
  const StatusBadge = (
    <Badge variant={CREDIT_APPLICATION_STATUS_VARIANT[application.status]}>
      {CREDIT_APPLICATION_STATUS_LABEL[application.status]}
    </Badge>
  )

  if (application.status === 'draft') {
    const sections = [
      Boolean(application.legal_business_name && application.business_address && application.ap_contact_email),
      Boolean(application.requested_credit_limit),
      Boolean(application.certified_at),
    ]
    const completed = sections.filter(Boolean).length

    return (
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex items-center gap-3">
            {StatusBadge}
            <span className="text-sm text-muted-foreground">Last saved {formatDate(application.last_saved_at)}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {completed} of {sections.length} sections complete.
          </p>
          <div className="flex gap-3">
            {canEdit && (
              <>
                <Button render={<Link href="/dealer/credit/apply" />} nativeButton={false}>
                  Continue Application
                </Button>
                <WithdrawApplicationButton applicationId={application.id} label="Delete Draft" />
              </>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (application.status === 'submitted') {
    return (
      <Card>
        <CardContent className="flex flex-col gap-3 pt-6">
          <div className="flex items-center gap-3">{StatusBadge}</div>
          <p className="text-sm">Your credit application has been submitted. We will notify you if additional information is needed or when a decision is available.</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs font-semibold uppercase text-muted-foreground">Submitted</div>
              <div>{formatDate(application.submitted_at)}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-muted-foreground">Reference</div>
              <div>{application.reference_number}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (application.status === 'under_review') {
    return (
      <Card>
        <CardContent className="flex flex-col gap-3 pt-6">
          <div className="flex items-center gap-3">{StatusBadge}</div>
          <p className="text-sm text-muted-foreground">
            Your application is under review. No action is needed from you right now.
          </p>
          <div className="text-sm">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Last updated: </span>
            {formatDate(application.reviewed_at ?? application.submitted_at)}
          </div>
          <p className="text-sm text-muted-foreground">
            Questions? Contact your RealTruck sales representative or support at 877-123-4567.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (application.status === 'additional_information_required') {
    const supabase = await createClient()
    const { data: infoRequest } = await supabase
      .from('credit_application_info_requests')
      .select('*')
      .eq('application_id', application.id)
      .eq('status', 'open')
      .order('requested_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const items = (infoRequest?.requested_items ?? []) as { item: string }[]

    return (
      <div className="flex flex-col gap-4">
        <Alert variant="destructive">
          <AlertTriangle size={16} />
          <AlertDescription>
            <span className="font-semibold">Action required.</span>{' '}
            {application.dealer_facing_message ?? 'We need a few more things before we can finish reviewing your application.'}
          </AlertDescription>
        </Alert>
        <Card>
          <CardContent className="flex flex-col gap-4 pt-6">
            <div className="flex items-center gap-3">{StatusBadge}</div>
            {items.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold">Requested items</h3>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {items.map((item, idx) => (
                    <li key={idx}>{item.item}</li>
                  ))}
                </ul>
              </div>
            )}
            {canEdit && (
              <div className="flex gap-3">
                <Button variant="outline" render={<Link href="/dealer/credit/apply" />} nativeButton={false}>
                  Edit Application / Upload Documents
                </Button>
              </div>
            )}
            {canEdit && infoRequest && <RespondToInfoRequestForm requestId={infoRequest.id} />}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (application.status === 'approved_setup_pending') {
    return (
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex items-center gap-3">{StatusBadge}</div>
          <p className="text-sm">
            Your credit application has been approved. We are completing your account setup before terms can be used
            at checkout.
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs font-semibold uppercase text-muted-foreground">Approved Payment Terms</div>
              <div className="font-semibold">{application.approved_payment_terms ? PAYMENT_TERMS_LABEL[application.approved_payment_terms] : '—'}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-muted-foreground">Approved Credit Limit</div>
              <div className="font-semibold">{formatCurrency(application.approved_credit_limit)}</div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            You may continue placing card-paid orders. Terms ordering is not yet available at checkout.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (application.status === 'active') {
    return (
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex items-center gap-3">
            {StatusBadge}
            <CheckCircle size={18} className="text-green-600" />
          </div>
          <p className="text-sm">Credit terms are active. Eligible orders will use your assigned payment terms.</p>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-xs font-semibold uppercase text-muted-foreground">Payment Terms</div>
              <div className="font-semibold">{application.approved_payment_terms ? PAYMENT_TERMS_LABEL[application.approved_payment_terms] : '—'}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-muted-foreground">Credit Limit</div>
              <div className="font-semibold">{formatCurrency(application.approved_credit_limit)}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-muted-foreground">Effective Date</div>
              <div className="font-semibold">{formatDate(application.effective_date)}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (application.status === 'declined') {
    return (
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex items-center gap-3">
            {StatusBadge}
            <XCircle size={18} className="text-destructive" />
          </div>
          <p className="text-sm">
            {application.dealer_facing_message ?? application.decline_reason ?? 'This application was not approved at this time.'}
          </p>
          <p className="text-sm text-muted-foreground">
            Contact your RealTruck sales representative or support at 877-123-4567 with any questions.
          </p>
          {canEdit && <StartApplicationButton companyId={application.company_id} />}
        </CardContent>
      </Card>
    )
  }

  if (application.status === 'withdrawn') {
    return (
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex items-center gap-3">
            {StatusBadge}
            <Clock size={18} className="text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Withdrawn on {formatDate(application.withdrawn_at)}.</p>
          {canEdit && <StartApplicationButton companyId={application.company_id} />}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-6">
        <FileText size={18} />
        {StatusBadge}
      </CardContent>
    </Card>
  )
}

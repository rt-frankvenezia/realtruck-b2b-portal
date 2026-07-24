import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { hasFinancialPermission } from '@/lib/financial-permissions'
import { Button } from '@/components/ui/button'
import { SubmitApplicationButton } from '@/components/dealer/credit/SubmitApplicationButton'
import { formatCurrency, formatDate, PAYMENT_TERMS_LABEL } from '@/lib/status-labels'

export default async function CreditApplicationReviewPage() {
  const user = await getCurrentUser()
  if (!user || !user.profile.company_id) redirect('/dealer')
  if (!hasFinancialPermission(user.profile.role, 'submit_credit_application')) redirect('/dealer/credit')

  const supabase = await createClient()
  const { data: application } = await supabase
    .from('credit_applications')
    .select('*')
    .eq('company_id', user.profile.company_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!application || application.status !== 'draft') redirect('/dealer/credit')

  const { data: documents } = await supabase
    .from('credit_application_documents')
    .select('*')
    .eq('application_id', application.id)
    .order('created_at')

  const officers = (application.officers ?? []) as { name: string; title: string; phone: string }[]
  const tradeReferences = (application.trade_references ?? []) as { name: string; phone: string; address: string; email: string }[]
  const bankReferences = (application.bank_references ?? []) as { name: string; phone: string; address: string; email: string }[]

  const canSubmit = Boolean(
    application.legal_business_name &&
      application.business_address &&
      application.ap_contact_email &&
      application.certified_at &&
      (!application.personal_guarantee_required || application.personal_guarantee_acknowledged_at)
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Review Application</h1>
          <p className="text-muted-foreground">Reference {application.reference_number}</p>
        </div>
        <Button variant="outline" size="sm" render={<Link href="/dealer/credit/apply" />} nativeButton={false}>
          Edit
        </Button>
      </div>

      <ReviewSection title="Business Information">
        <ReviewRow label="Legal Business Name" value={application.legal_business_name} />
        <ReviewRow label="DBA" value={application.dba_name} />
        <ReviewRow label="Legal Structure" value={application.legal_structure} />
        <ReviewRow label="Type of Business" value={application.type_of_business} />
        <ReviewRow label="Address" value={[application.business_address, application.business_city, application.business_state, application.business_postal_code].filter(Boolean).join(', ')} />
        <ReviewRow label="Billing Address" value={[application.billing_address, application.billing_city, application.billing_state, application.billing_postal_code].filter(Boolean).join(', ')} />
      </ReviewSection>

      {officers.filter((o) => o.name).length > 0 && (
        <ReviewSection title="Officers, Owners, or Partners">
          {officers.filter((o) => o.name).map((o, i) => (
            <ReviewRow key={i} label={o.title || 'Officer'} value={`${o.name}${o.phone ? ` — ${o.phone}` : ''}`} />
          ))}
        </ReviewSection>
      )}

      <ReviewSection title="Credit Request">
        <ReviewRow label="Requested Credit Limit" value={formatCurrency(application.requested_credit_limit)} />
        <ReviewRow label="Requested Payment Terms" value={application.requested_payment_terms ? PAYMENT_TERMS_LABEL[application.requested_payment_terms] : null} />
        <ReviewRow label="Estimated Monthly Purchases" value={formatCurrency(application.estimated_monthly_purchases)} />
      </ReviewSection>

      <ReviewSection title="Accounts-Payable Contact">
        <ReviewRow label="Name" value={application.ap_contact_name} />
        <ReviewRow label="Email" value={application.ap_contact_email} />
        <ReviewRow label="Phone" value={application.ap_contact_phone} />
      </ReviewSection>

      {tradeReferences.filter((t) => t.name).length > 0 && (
        <ReviewSection title="Trade References">
          {tradeReferences.filter((t) => t.name).map((t, i) => (
            <ReviewRow key={i} label={t.name} value={[t.phone, t.email].filter(Boolean).join(' • ')} />
          ))}
        </ReviewSection>
      )}

      {bankReferences.filter((b) => b.name).length > 0 && (
        <ReviewSection title="Bank Reference">
          {bankReferences.filter((b) => b.name).map((b, i) => (
            <ReviewRow key={i} label={b.name} value={[b.phone, b.email].filter(Boolean).join(' • ')} />
          ))}
        </ReviewSection>
      )}

      <ReviewSection title="Documents">
        {(documents ?? []).filter((d) => d.file_name).length === 0 && <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>}
        {(documents ?? [])
          .filter((d) => d.file_name)
          .map((d) => (
            <ReviewRow key={d.id} label={d.document_type} value={d.file_name} />
          ))}
      </ReviewSection>

      <ReviewSection title="Certification">
        <ReviewRow label="Authorized Representative" value={application.certified_by_name} />
        <ReviewRow label="Title" value={application.certified_by_title} />
        <ReviewRow label="Certified" value={application.certified_at ? `Yes — ${formatDate(application.certified_at)}` : 'Not yet certified'} />
        <ReviewRow label="Personal Guarantee Acknowledged" value={application.personal_guarantee_acknowledged_at ? 'Yes' : 'Not yet acknowledged'} />
      </ReviewSection>

      <div className="flex items-center justify-between rounded-lg border p-6">
        <p className="text-sm text-muted-foreground">
          {canSubmit
            ? 'Review the information above, then submit your application. We will notify you if additional information is needed or when a decision is available.'
            : 'Complete required business information, accounts-payable contact, certification, and personal-guarantee acknowledgment before submitting.'}
        </p>
        <SubmitApplicationButton applicationId={application.id} disabled={!canSubmit} />
      </div>
    </div>
  )
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2 rounded-lg border p-6">
      <h2 className="mb-2 font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function ReviewRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex items-center justify-between border-b py-2 text-sm last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value || '—'}</span>
    </div>
  )
}

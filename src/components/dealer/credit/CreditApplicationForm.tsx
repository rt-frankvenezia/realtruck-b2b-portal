'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { CreditDocumentUpload } from '@/components/dealer/credit/CreditDocumentUpload'
import type { Database } from '@/lib/database.types'

type CreditApplication = Database['public']['Tables']['credit_applications']['Row']
type CreditDocument = Database['public']['Tables']['credit_application_documents']['Row']
type PaymentTermsCode = Database['public']['Enums']['payment_terms_code']

type Officer = { name: string; title: string; phone: string }
type TradeReference = { name: string; phone: string; address: string; email: string }
type BankReference = { name: string; phone: string; address: string; email: string }

const REQUIRED_DOCUMENT_TYPES = ['Tax-Exempt / Resale Certificate', 'Most Recent Financial Statement']

function emptyOfficer(): Officer {
  return { name: '', title: '', phone: '' }
}
function emptyTradeReference(): TradeReference {
  return { name: '', phone: '', address: '', email: '' }
}
function emptyBankReference(): BankReference {
  return { name: '', phone: '', address: '', email: '' }
}

export function CreditApplicationForm({
  application,
  documents,
}: {
  application: CreditApplication
  documents: CreditDocument[]
}) {
  const router = useRouter()
  const [isSaving, startSaving] = useTransition()
  const [docs, setDocs] = useState<CreditDocument[]>(documents)

  const [form, setForm] = useState({
    legal_business_name: application.legal_business_name ?? '',
    dba_name: application.dba_name ?? '',
    legal_structure: application.legal_structure ?? '',
    type_of_business: application.type_of_business ?? '',
    year_established: application.year_established?.toString() ?? '',
    federal_tax_id_last_four: application.federal_tax_id_last_four ?? '',
    website: application.website ?? '',
    business_phone: application.business_phone ?? '',
    business_address: application.business_address ?? '',
    business_city: application.business_city ?? '',
    business_state: application.business_state ?? '',
    business_postal_code: application.business_postal_code ?? '',
    billing_address: application.billing_address ?? '',
    billing_city: application.billing_city ?? '',
    billing_state: application.billing_state ?? '',
    billing_postal_code: application.billing_postal_code ?? '',
    state_of_registration: application.state_of_registration ?? '',
    resale_number: application.resale_number ?? '',
    referral_source: application.referral_source ?? '',
    purchase_brand: application.purchase_brand ?? '',
    ap_contact_name: application.ap_contact_name ?? '',
    ap_contact_email: application.ap_contact_email ?? '',
    ap_contact_phone: application.ap_contact_phone ?? '',
    requested_credit_limit: application.requested_credit_limit?.toString() ?? '',
    requested_payment_terms: application.requested_payment_terms ?? '',
    estimated_monthly_purchases: application.estimated_monthly_purchases?.toString() ?? '',
    certified_by_name: application.certified_by_name ?? '',
    certified_by_title: application.certified_by_title ?? '',
  })

  const [officers, setOfficers] = useState<Officer[]>(
    application.officers && Array.isArray(application.officers) && application.officers.length > 0
      ? (application.officers as unknown as Officer[])
      : [emptyOfficer()]
  )
  const [tradeReferences, setTradeReferences] = useState<TradeReference[]>(
    application.trade_references && Array.isArray(application.trade_references) && application.trade_references.length > 0
      ? (application.trade_references as unknown as TradeReference[])
      : [emptyTradeReference()]
  )
  const [bankReferences, setBankReferences] = useState<BankReference[]>(
    application.bank_references && Array.isArray(application.bank_references) && application.bank_references.length > 0
      ? (application.bank_references as unknown as BankReference[])
      : [emptyBankReference()]
  )

  const [certified, setCertified] = useState(Boolean(application.certified_at))
  const [guaranteeAcknowledged, setGuaranteeAcknowledged] = useState(Boolean(application.personal_guarantee_acknowledged_at))

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function saveDraft(): Promise<boolean> {
    const supabase = createClient()
    const { error } = await supabase
      .from('credit_applications')
      .update({
        legal_business_name: form.legal_business_name || null,
        dba_name: form.dba_name || null,
        legal_structure: form.legal_structure || null,
        type_of_business: form.type_of_business || null,
        year_established: form.year_established ? parseInt(form.year_established, 10) : null,
        federal_tax_id_last_four: form.federal_tax_id_last_four || null,
        website: form.website || null,
        business_phone: form.business_phone || null,
        business_address: form.business_address || null,
        business_city: form.business_city || null,
        business_state: form.business_state || null,
        business_postal_code: form.business_postal_code || null,
        billing_address: form.billing_address || null,
        billing_city: form.billing_city || null,
        billing_state: form.billing_state || null,
        billing_postal_code: form.billing_postal_code || null,
        state_of_registration: form.state_of_registration || null,
        resale_number: form.resale_number || null,
        referral_source: form.referral_source || null,
        purchase_brand: form.purchase_brand || null,
        ap_contact_name: form.ap_contact_name || null,
        ap_contact_email: form.ap_contact_email || null,
        ap_contact_phone: form.ap_contact_phone || null,
        requested_credit_limit: form.requested_credit_limit ? parseFloat(form.requested_credit_limit) : null,
        requested_payment_terms: (form.requested_payment_terms || null) as PaymentTermsCode | null,
        estimated_monthly_purchases: form.estimated_monthly_purchases ? parseFloat(form.estimated_monthly_purchases) : null,
        officers: officers.filter((o) => o.name.trim()),
        trade_references: tradeReferences.filter((t) => t.name.trim()),
        bank_references: bankReferences.filter((b) => b.name.trim()),
        certified_by_name: form.certified_by_name || null,
        certified_by_title: form.certified_by_title || null,
        certified_at: certified ? (application.certified_at ?? new Date().toISOString()) : null,
        personal_guarantee_acknowledged_at: guaranteeAcknowledged ? (application.personal_guarantee_acknowledged_at ?? new Date().toISOString()) : null,
        last_saved_at: new Date().toISOString(),
      })
      .eq('id', application.id)

    if (error) {
      toast.error(error.message)
      return false
    }
    return true
  }

  function handleSaveDraft() {
    startSaving(async () => {
      const ok = await saveDraft()
      if (ok) toast.success('Draft saved')
      router.refresh()
    })
  }

  function handleContinue() {
    startSaving(async () => {
      const ok = await saveDraft()
      if (ok) router.push(application.status === 'draft' ? '/dealer/credit/review' : '/dealer/credit')
    })
  }

  function docFor(type: string) {
    return docs.find((d) => d.document_type === type && d.file_name) ?? null
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Credit Application</h1>
        <p className="text-muted-foreground">Reference {application.reference_number} — changes save as a draft.</p>
      </div>

      <section className="flex flex-col gap-4 rounded-lg border p-6">
        <h2 className="font-semibold">Business Information</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Legal Business Name" required>
            <Input value={form.legal_business_name} onChange={(e) => setField('legal_business_name', e.target.value)} />
          </Field>
          <Field label="DBA / Trade Name">
            <Input value={form.dba_name} onChange={(e) => setField('dba_name', e.target.value)} />
          </Field>
          <Field label="Legal Structure">
            <select
              value={form.legal_structure}
              onChange={(e) => setField('legal_structure', e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select...</option>
              <option value="corporation">Corporation</option>
              <option value="partnership">Partnership</option>
              <option value="sole_proprietor">Sole Proprietor</option>
            </select>
          </Field>
          <Field label="Type of Business">
            <Input value={form.type_of_business} onChange={(e) => setField('type_of_business', e.target.value)} placeholder="e.g. Truck accessories retailer" />
          </Field>
          <Field label="Year Established">
            <Input type="number" value={form.year_established} onChange={(e) => setField('year_established', e.target.value)} />
          </Field>
          <Field label="Federal Tax ID (last 4 digits)">
            <Input maxLength={4} value={form.federal_tax_id_last_four} onChange={(e) => setField('federal_tax_id_last_four', e.target.value.replace(/\D/g, ''))} />
          </Field>
          <Field label="Website">
            <Input value={form.website} onChange={(e) => setField('website', e.target.value)} />
          </Field>
          <Field label="Business Phone">
            <Input value={form.business_phone} onChange={(e) => setField('business_phone', e.target.value)} />
          </Field>
          <Field label="State of Registration">
            <Input value={form.state_of_registration} onChange={(e) => setField('state_of_registration', e.target.value)} />
          </Field>
          <Field label="Resale / Tax-Exempt Number">
            <Input value={form.resale_number} onChange={(e) => setField('resale_number', e.target.value)} />
          </Field>
          <Field label="How did you learn about RealTruck?">
            <Input value={form.referral_source} onChange={(e) => setField('referral_source', e.target.value)} />
          </Field>
          <Field label="Brand to Purchase From">
            <Input value={form.purchase_brand} onChange={(e) => setField('purchase_brand', e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Field label="Business Address" className="sm:col-span-4">
            <Input value={form.business_address} onChange={(e) => setField('business_address', e.target.value)} />
          </Field>
          <Field label="City">
            <Input value={form.business_city} onChange={(e) => setField('business_city', e.target.value)} />
          </Field>
          <Field label="State">
            <Input value={form.business_state} onChange={(e) => setField('business_state', e.target.value)} />
          </Field>
          <Field label="Postal Code" className="sm:col-span-2">
            <Input value={form.business_postal_code} onChange={(e) => setField('business_postal_code', e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Field label="Mailing / Billing Address" className="sm:col-span-4">
            <Input value={form.billing_address} onChange={(e) => setField('billing_address', e.target.value)} />
          </Field>
          <Field label="City">
            <Input value={form.billing_city} onChange={(e) => setField('billing_city', e.target.value)} />
          </Field>
          <Field label="State">
            <Input value={form.billing_state} onChange={(e) => setField('billing_state', e.target.value)} />
          </Field>
          <Field label="Postal Code" className="sm:col-span-2">
            <Input value={form.billing_postal_code} onChange={(e) => setField('billing_postal_code', e.target.value)} />
          </Field>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-lg border p-6">
        <h2 className="font-semibold">Officers, Owners, or Partners</h2>
        <RepeatingRows
          rows={officers}
          setRows={setOfficers}
          empty={emptyOfficer}
          renderRow={(row, update) => (
            <>
              <Input placeholder="Name" value={row.name} onChange={(e) => update({ ...row, name: e.target.value })} />
              <Input placeholder="Title" value={row.title} onChange={(e) => update({ ...row, title: e.target.value })} />
              <Input placeholder="Phone" value={row.phone} onChange={(e) => update({ ...row, phone: e.target.value })} />
            </>
          )}
        />
      </section>

      <section className="flex flex-col gap-4 rounded-lg border p-6">
        <h2 className="font-semibold">Credit Request</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Requested Credit Limit">
            <Input type="number" value={form.requested_credit_limit} onChange={(e) => setField('requested_credit_limit', e.target.value)} />
          </Field>
          <Field label="Requested Payment Terms">
            <select
              value={form.requested_payment_terms}
              onChange={(e) => setField('requested_payment_terms', e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select...</option>
              <option value="net_15">Net 15</option>
              <option value="net_30">Net 30</option>
              <option value="net_45">Net 45</option>
              <option value="net_60">Net 60</option>
            </select>
          </Field>
          <Field label="Estimated Monthly Purchases">
            <Input type="number" value={form.estimated_monthly_purchases} onChange={(e) => setField('estimated_monthly_purchases', e.target.value)} />
          </Field>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-lg border p-6">
        <h2 className="font-semibold">Accounts-Payable Contact</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Name" required>
            <Input value={form.ap_contact_name} onChange={(e) => setField('ap_contact_name', e.target.value)} />
          </Field>
          <Field label="Email" required>
            <Input type="email" value={form.ap_contact_email} onChange={(e) => setField('ap_contact_email', e.target.value)} />
          </Field>
          <Field label="Phone">
            <Input value={form.ap_contact_phone} onChange={(e) => setField('ap_contact_phone', e.target.value)} />
          </Field>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-lg border p-6">
        <h2 className="font-semibold">Trade References</h2>
        <RepeatingRows
          rows={tradeReferences}
          setRows={setTradeReferences}
          empty={emptyTradeReference}
          renderRow={(row, update) => (
            <>
              <Input placeholder="Name" value={row.name} onChange={(e) => update({ ...row, name: e.target.value })} />
              <Input placeholder="Phone" value={row.phone} onChange={(e) => update({ ...row, phone: e.target.value })} />
              <Input placeholder="Address" value={row.address} onChange={(e) => update({ ...row, address: e.target.value })} />
              <Input placeholder="Email" value={row.email} onChange={(e) => update({ ...row, email: e.target.value })} />
            </>
          )}
        />
      </section>

      <section className="flex flex-col gap-4 rounded-lg border p-6">
        <h2 className="font-semibold">Bank Reference</h2>
        <p className="text-xs text-muted-foreground">
          Provide your bank&apos;s contact information for reference purposes only — do not enter a full account or
          routing number.
        </p>
        <RepeatingRows
          rows={bankReferences}
          setRows={setBankReferences}
          empty={emptyBankReference}
          renderRow={(row, update) => (
            <>
              <Input placeholder="Bank Name" value={row.name} onChange={(e) => update({ ...row, name: e.target.value })} />
              <Input placeholder="Phone" value={row.phone} onChange={(e) => update({ ...row, phone: e.target.value })} />
              <Input placeholder="Address" value={row.address} onChange={(e) => update({ ...row, address: e.target.value })} />
              <Input placeholder="Email" value={row.email} onChange={(e) => update({ ...row, email: e.target.value })} />
            </>
          )}
        />
      </section>

      <section className="flex flex-col gap-4 rounded-lg border p-6">
        <h2 className="font-semibold">Documents</h2>
        <div className="flex flex-col gap-3">
          {REQUIRED_DOCUMENT_TYPES.map((type) => (
            <CreditDocumentUpload
              key={type}
              applicationId={application.id}
              documentType={type}
              isRequired
              existingDocument={docFor(type)}
              onChange={(doc) => setDocs((prev) => [...prev.filter((d) => d.document_type !== type), doc])}
            />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-lg border p-6">
        <h2 className="font-semibold">Certification</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Authorized Representative Name" required>
            <Input value={form.certified_by_name} onChange={(e) => setField('certified_by_name', e.target.value)} />
          </Field>
          <Field label="Title">
            <Input value={form.certified_by_title} onChange={(e) => setField('certified_by_title', e.target.value)} />
          </Field>
        </div>
        <label className="flex items-start gap-3 text-sm">
          <Checkbox checked={certified} onCheckedChange={(v) => setCertified(v === true)} className="mt-0.5" />
          I certify that the information provided in this application is accurate to the best of my knowledge.
        </label>
        <label className="flex items-start gap-3 text-sm">
          <Checkbox checked={guaranteeAcknowledged} onCheckedChange={(v) => setGuaranteeAcknowledged(v === true)} className="mt-0.5" />
          I understand a signed personal guarantee is required for this account and will be provided separately to
          RealTruck — it is not collected through this application.
        </label>
      </section>

      <div className="flex items-center justify-between rounded-lg border p-6">
        <Button variant="outline" render={<Link href="/dealer/credit" />} nativeButton={false}>
          Cancel
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleSaveDraft} disabled={isSaving}>
            Save Draft
          </Button>
          <Button onClick={handleContinue} disabled={isSaving}>
            {application.status === 'draft' ? 'Continue to Review' : 'Save and Return to Status'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string
  required?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={className}>
      <Label className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
    </div>
  )
}

function RepeatingRows<T>({
  rows,
  setRows,
  empty,
  renderRow,
}: {
  rows: T[]
  setRows: (rows: T[]) => void
  empty: () => T
  renderRow: (row: T, update: (row: T) => void) => React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3">
      {rows.map((row, idx) => (
        <div key={idx} className="flex items-center gap-3">
          <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
            {renderRow(row, (updated) => setRows(rows.map((r, i) => (i === idx ? updated : r))))}
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setRows(rows.filter((_, i) => i !== idx))}
            disabled={rows.length === 1}
          >
            <Trash2 size={16} className="text-destructive" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-fit" onClick={() => setRows([...rows, empty()])}>
        <Plus size={14} />
        Add Row
      </Button>
    </div>
  )
}

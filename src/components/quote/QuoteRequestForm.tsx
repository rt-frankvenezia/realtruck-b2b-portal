'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, MapPin, Store, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { actionSubmitQuoteRequest } from '@/lib/actions/quotes'

// ─── Static data ─────────────────────────────────────────────────────────────

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
]

const YEARS = Array.from({ length: 12 }, (_, i) => String(2026 - i))

const COMMON_MAKES = ['Ford','Chevrolet','GMC','Ram','Toyota','Nissan','Honda','Jeep','Other']

const BODY_TYPES = [
  'Regular Cab Pickup',
  'Extended Cab Pickup',
  'Crew Cab Pickup',
  'SuperCrew Cab Pickup',
  'Mega Cab Pickup',
]

const BED_LENGTHS = ["5'0\"", "5'7\"", "6'0\"", "6'5\"", "6'6\"", "8'0\""]

const PRODUCTS = [
  { id: '100S',      tagline: 'Sport Series',   desc: 'Clean, low-profile design with tip-out side windows and finished interior.' },
  { id: '100SCC',    tagline: 'Sport CC',       desc: 'Crew cab cut of the Sport Series — same sleek profile, longer body.' },
  { id: '100XR',     tagline: 'Sport R',        desc: 'Dark-tinted frameless glass and a raised roofline for extra headroom.' },
  { id: '100XL',     tagline: 'Full Walk-In',   desc: 'Maximum cargo height with reinforced floor for heavy hauling.' },
  { id: '100XQ',     tagline: 'Premium',        desc: 'Frameless tip-out glass, hidden hinges, interior headliner, 12V fuse box.' },
  { id: '100XQ Sport', tagline: 'Premium Sport', desc: 'Premium 100XQ with enhanced exterior sport package and roof rack.' },
  { id: '180',       tagline: 'Commercial',     desc: 'Heavy-duty aluminum body with steel-reinforced walls for demanding work.' },
  { id: '180CC',     tagline: 'Commercial CC',  desc: 'Crew cab version of the 180 — commercial durability, longer configuration.' },
]

// ─── Demo data pools ──────────────────────────────────────────────────────────

const DEMO_CUSTOMERS = [
  { firstName: 'Alex',    lastName: 'Martinez',  address: '1234 Timber Ridge Rd', city: 'Denver',       usState: 'CO', zip: '80203' },
  { firstName: 'Sarah',   lastName: 'Chen',      address: '567 Pearl Street',     city: 'Boulder',      usState: 'CO', zip: '80302' },
  { firstName: 'Marcus',  lastName: 'Williams',  address: '890 College Ave',      city: 'Fort Collins',  usState: 'CO', zip: '80521' },
  { firstName: 'Jamie',   lastName: 'O\'Brien',  address: '3301 Mesa Drive',      city: 'Grand Junction',usState: 'CO', zip: '81501' },
  { firstName: 'Taylor',  lastName: 'Nguyen',    address: '415 Broadmoor Ave',    city: 'Colorado Springs', usState: 'CO', zip: '80906' },
  { firstName: 'Jordan',  lastName: 'Patel',     address: '88 River Run Rd',      city: 'Vail',         usState: 'CO', zip: '81657' },
  { firstName: 'Morgan',  lastName: 'Davis',     address: '2200 Canyon Blvd',     city: 'Longmont',     usState: 'CO', zip: '80501' },
  { firstName: 'Casey',   lastName: 'Thompson',  address: '710 South St',         city: 'Loveland',     usState: 'CO', zip: '80537' },
]

const DEMO_VEHICLES = [
  { year: '2025', make: 'Ford',      model: 'F-150',          submodel: 'Lariat',    bodyType: 'SuperCrew Cab Pickup',  bedLength: "5'7\"" },
  { year: '2024', make: 'Chevrolet', model: 'Silverado 1500', submodel: 'LTZ',       bodyType: 'Crew Cab Pickup',       bedLength: "5'8\"" },
  { year: '2025', make: 'Ram',       model: '1500',           submodel: 'Big Horn',  bodyType: 'Crew Cab Pickup',       bedLength: "5'7\"" },
  { year: '2024', make: 'GMC',       model: 'Sierra 1500',    submodel: 'SLT',       bodyType: 'Crew Cab Pickup',       bedLength: "5'8\"" },
  { year: '2023', make: 'Toyota',    model: 'Tacoma',         submodel: 'TRD Pro',   bodyType: 'Crew Cab Pickup',       bedLength: "5'0\"" },
  { year: '2025', make: 'Ford',      model: 'F-250',          submodel: 'XLT',       bodyType: 'SuperCrew Cab Pickup',  bedLength: "6'9\"" },
  { year: '2024', make: 'Chevrolet', model: 'Colorado',       submodel: 'Z71',       bodyType: 'Crew Cab Pickup',       bedLength: "5'2\"" },
  { year: '2023', make: 'Ram',       model: '2500',           submodel: 'Tradesman', bodyType: 'Mega Cab Pickup',       bedLength: "6'4\"" },
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomPhone(): string {
  const area = Math.floor(Math.random() * 800 + 200)
  const mid  = Math.floor(Math.random() * 900 + 100)
  const last = Math.floor(Math.random() * 9000 + 1000)
  return `${area}-${mid}-${last}`
}

function generateDemoData(locations: Location[]): FormData {
  const c = pick(DEMO_CUSTOMERS)
  const v = pick(DEMO_VEHICLES)
  const p = pick(PRODUCTS)
  const dealer = locations[0]
  return {
    firstName: c.firstName,
    lastName: c.lastName,
    phone: randomPhone(),
    email: `${c.firstName.toLowerCase()}.${c.lastName.toLowerCase().replace(/[^a-z]/g, '')}@example.com`,
    address: c.address,
    country: 'United States',
    zip: c.zip,
    city: c.city,
    usState: c.usState,
    marketingConsent: true,
    year: v.year,
    make: v.make,
    model: v.model,
    submodel: v.submodel,
    bodyType: v.bodyType,
    bedLength: v.bedLength,
    product: p.id,
    dealerId: dealer?.id ?? '',
    dealerName: dealer?.name ?? '',
    dealerCity: dealer?.city ?? '',
    dealerState: dealer?.state ?? '',
    dealerAddress: dealer?.address ?? '',
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Location = {
  id: string
  name: string
  code: string
  city: string
  state: string
  address: string
  postal_code: string
  companies?: { name: string }
}

type FormData = {
  firstName: string; lastName: string; phone: string; email: string
  address: string; country: string; zip: string; city: string; usState: string
  marketingConsent: boolean
  year: string; make: string; model: string; submodel: string
  bodyType: string; bedLength: string
  product: string
  dealerId: string; dealerName: string; dealerCity: string; dealerState: string; dealerAddress: string
}

type Step = 'contact' | 'vehicle' | 'product' | 'dealer' | 'summary'
const STEPS: Step[] = ['contact', 'vehicle', 'product', 'dealer', 'summary']
const STEP_LABELS: Record<Step, string> = {
  contact: 'Contact', vehicle: 'Vehicle', product: 'Product', dealer: 'Dealer', summary: 'Summary',
}

function isComplete(step: Step, d: FormData): boolean {
  if (step === 'contact') return !!(d.firstName && d.lastName && d.phone && d.email && d.address && d.zip && d.city && d.usState)
  if (step === 'vehicle') return !!(d.year && d.make && d.model && d.bodyType && d.bedLength)
  if (step === 'product') return !!d.product
  if (step === 'dealer')  return !!d.dealerId
  return true
}

// ─── Shared field primitives ──────────────────────────────────────────────────

const INPUT = 'h-10 w-full rounded border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring'

function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {text}{required && <span className="ml-0.5 text-destructive">*</span>}
    </label>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <div className="flex flex-col gap-1"><Label text={label} required={required} />{children}</div>
}

// ─── Step: Contact ────────────────────────────────────────────────────────────

function ContactStep({ d, set }: { d: FormData; set: (u: Partial<FormData>) => void }) {
  return (
    <div className="rounded-lg border border-[#d5d5d5] bg-white">
      <div className="border-b bg-[#1E1E1E] px-5 py-3">
        <h2 className="font-semibold text-white">Contact Information</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
        <Field label="First Name" required>
          <input className={INPUT} value={d.firstName} onChange={(e) => set({ firstName: e.target.value })} placeholder="First name" />
        </Field>
        <Field label="Last Name" required>
          <input className={INPUT} value={d.lastName} onChange={(e) => set({ lastName: e.target.value })} placeholder="Last name" />
        </Field>
        <Field label="Phone" required>
          <input className={INPUT} type="tel" value={d.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="123-456-7890" />
        </Field>
        <Field label="Email" required>
          <input className={INPUT} type="email" value={d.email} onChange={(e) => set({ email: e.target.value })} placeholder="you@example.com" />
        </Field>
        <Field label="Street Address" required>
          <input className={INPUT} value={d.address} onChange={(e) => set({ address: e.target.value })} placeholder="123 Main St" />
        </Field>
        <Field label="ZIP Code" required>
          <input className={INPUT} value={d.zip} onChange={(e) => set({ zip: e.target.value })} placeholder="80216" />
        </Field>
        <Field label="City" required>
          <input className={INPUT} value={d.city} onChange={(e) => set({ city: e.target.value })} placeholder="Denver" />
        </Field>
        <Field label="State" required>
          <select className={INPUT} value={d.usState} onChange={(e) => set({ usState: e.target.value })}>
            <option value="">Select state…</option>
            {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Country" required>
          <select className={INPUT} value={d.country} onChange={(e) => set({ country: e.target.value })}>
            <option>United States</option>
            <option>Canada</option>
          </select>
        </Field>
        <div className="col-span-full flex items-center gap-2 pt-1">
          <input
            id="mktConsent"
            type="checkbox"
            checked={d.marketingConsent}
            onChange={(e) => set({ marketingConsent: e.target.checked })}
            className="h-4 w-4 rounded border-input accent-[#1E1E1E]"
          />
          <label htmlFor="mktConsent" className="text-sm text-muted-foreground">
            I agree to receive marketing emails about LEER offers and products.
          </label>
        </div>
      </div>
    </div>
  )
}

// ─── Step: Vehicle ────────────────────────────────────────────────────────────

function VehicleStep({ d, set }: { d: FormData; set: (u: Partial<FormData>) => void }) {
  return (
    <div className="rounded-lg border border-[#d5d5d5] bg-white">
      <div className="border-b bg-[#1E1E1E] px-5 py-3">
        <h2 className="font-semibold text-white">Vehicle Information</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
        <Field label="Year" required>
          <select className={INPUT} value={d.year} onChange={(e) => set({ year: e.target.value })}>
            <option value="">Select year…</option>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </Field>
        <Field label="Make" required>
          <select className={INPUT} value={d.make} onChange={(e) => set({ make: e.target.value })}>
            <option value="">Select make…</option>
            {COMMON_MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </Field>
        <Field label="Model" required>
          <input className={INPUT} value={d.model} onChange={(e) => set({ model: e.target.value })} placeholder="e.g. F-150" />
        </Field>
        <Field label="Submodel">
          <input className={INPUT} value={d.submodel} onChange={(e) => set({ submodel: e.target.value })} placeholder="e.g. XLT, Lariat (optional)" />
        </Field>
        <Field label="Body Type" required>
          <select className={INPUT} value={d.bodyType} onChange={(e) => set({ bodyType: e.target.value })}>
            <option value="">Select body type…</option>
            {BODY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Bed Length" required>
          <select className={INPUT} value={d.bedLength} onChange={(e) => set({ bedLength: e.target.value })}>
            <option value="">Select bed length…</option>
            {BED_LENGTHS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </Field>
      </div>
    </div>
  )
}

// ─── Step: Product ────────────────────────────────────────────────────────────

function ProductStep({ d, set }: { d: FormData; set: (u: Partial<FormData>) => void }) {
  const vehicleLabel = [d.year, d.make, d.model].filter(Boolean).join(' ')
  return (
    <div className="space-y-4">
      {vehicleLabel && (
        <p className="text-center text-sm font-medium text-muted-foreground">{vehicleLabel}</p>
      )}
      <div className="rounded-lg border border-[#d5d5d5] bg-white">
        <div className="border-b bg-[#1E1E1E] px-5 py-3">
          <h2 className="font-semibold text-white">Select a Product</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
          {PRODUCTS.map((p) => {
            const selected = d.product === p.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => set({ product: p.id })}
                className={`flex flex-col rounded-lg border-2 p-3 text-left transition-all hover:border-[#1E1E1E] ${
                  selected ? 'border-[#1E1E1E] bg-[#1E1E1E]/5' : 'border-[#e0e0e0] bg-white'
                }`}
              >
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded bg-[#f5f5f5]">
                  <Truck size={20} className="text-muted-foreground" />
                </div>
                <p className={`text-sm font-bold ${selected ? 'text-[#1E1E1E]' : 'text-foreground'}`}>{p.id}</p>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#FFC60B]">{p.tagline}</p>
                <p className="mt-1 text-[11px] leading-tight text-muted-foreground">{p.desc}</p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Step: Dealer ─────────────────────────────────────────────────────────────

function DealerStep({ d, set, locations }: { d: FormData; set: (u: Partial<FormData>) => void; locations: Location[] }) {
  return (
    <div className="rounded-lg border border-[#d5d5d5] bg-white">
      <div className="border-b bg-[#1E1E1E] px-5 py-3">
        <h2 className="font-semibold text-white">Choose a Dealer</h2>
        <p className="mt-0.5 text-xs text-white/50">Select the LEER dealer you'd like to work with.</p>
      </div>
      <div className="flex flex-col gap-2 p-5">
        {locations.map((loc) => {
          const selected = d.dealerId === loc.id
          const companyName = loc.companies?.name ?? ''
          return (
            <button
              key={loc.id}
              type="button"
              onClick={() => set({
                dealerId: loc.id,
                dealerName: loc.name,
                dealerCity: loc.city,
                dealerState: loc.state,
                dealerAddress: loc.address,
              })}
              className={`flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-all hover:border-[#1E1E1E] ${
                selected ? 'border-[#1E1E1E] bg-[#1E1E1E]/5' : 'border-[#e0e0e0]'
              }`}
            >
              <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded ${selected ? 'bg-[#1E1E1E]' : 'bg-[#f5f5f5]'}`}>
                <Store size={16} className={selected ? 'text-white' : 'text-muted-foreground'} />
              </div>
              <div>
                <p className="font-semibold">{companyName}</p>
                <p className="text-sm text-muted-foreground">{loc.name}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin size={10} />
                  {loc.address}, {loc.city}, {loc.state} {loc.postal_code}
                </p>
              </div>
            </button>
          )
        })}
        {locations.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No dealers found.</p>
        )}
      </div>
    </div>
  )
}

// ─── Step: Summary ────────────────────────────────────────────────────────────

function SummarySection({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[#d5d5d5] bg-white">
      <div className="flex items-center justify-between border-b bg-[#1E1E1E] px-5 py-3">
        <h2 className="font-semibold text-white">{title}</h2>
        <button
          type="button"
          onClick={onEdit}
          className="text-xs font-medium text-white/60 hover:text-white underline"
        >
          Edit
        </button>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 p-5 sm:grid-cols-3">{children}</div>
    </div>
  )
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value || '—'}</p>
    </div>
  )
}

function SummaryStep({ d, goToStep }: { d: FormData; goToStep: (s: Step) => void }) {
  const product = PRODUCTS.find((p) => p.id === d.product)
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[#d5d5d5] bg-white px-5 py-4 text-center">
        <p className="text-sm font-semibold text-foreground">Review your quote request, then submit.</p>
        <p className="text-xs text-muted-foreground">Your nearest LEER dealer will follow up with a detailed quote.</p>
      </div>

      <SummarySection title="Contact" onEdit={() => goToStep('contact')}>
        <SummaryField label="Name" value={`${d.firstName} ${d.lastName}`} />
        <SummaryField label="Email" value={d.email} />
        <SummaryField label="Phone" value={d.phone} />
        <SummaryField label="Address" value={d.address} />
        <SummaryField label="City" value={d.city} />
        <SummaryField label="State / ZIP" value={`${d.usState} ${d.zip}`} />
      </SummarySection>

      <SummarySection title="Vehicle" onEdit={() => goToStep('vehicle')}>
        <SummaryField label="Year" value={d.year} />
        <SummaryField label="Make" value={d.make} />
        <SummaryField label="Model" value={d.model} />
        {d.submodel && <SummaryField label="Submodel" value={d.submodel} />}
        <SummaryField label="Body Type" value={d.bodyType} />
        <SummaryField label="Bed Length" value={d.bedLength} />
      </SummarySection>

      <SummarySection title="Product" onEdit={() => goToStep('product')}>
        <div className="col-span-full flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#f5f5f5]">
            <Truck size={24} className="text-muted-foreground" />
          </div>
          <div>
            <p className="font-bold">{product?.id}</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#FFC60B]">{product?.tagline}</p>
          </div>
        </div>
      </SummarySection>

      <SummarySection title="Dealer" onEdit={() => goToStep('dealer')}>
        <div className="col-span-full">
          <p className="font-semibold">{d.dealerName}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {d.dealerAddress && `${d.dealerAddress}, `}{d.dealerCity}, {d.dealerState}
          </p>
        </div>
      </SummarySection>
    </div>
  )
}

// ─── Success screen ───────────────────────────────────────────────────────────

function SuccessScreen({ quoteId, d }: { quoteId: string; d: FormData }) {
  const n = parseInt(quoteId.split('-').pop() ?? '0', 16)
  const displayNum = `26-${71000 + (n % 1000)}`
  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <div className="bg-[#1E1E1E] px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-widest text-white/50">LEER Group</p>
          <p className="mt-0.5 text-lg font-semibold text-white">Request a Quote</p>
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 size={32} className="text-green-600" />
        </div>
        <h1 className="text-2xl font-bold">Quote Request Submitted</h1>
        <p className="mt-2 text-muted-foreground">
          Thank you, {d.firstName}. Your request has been received.
        </p>
        <div className="mx-auto mt-6 max-w-sm rounded-lg border border-[#d5d5d5] bg-white p-5 text-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reference</p>
          <p className="mt-1 font-mono text-lg font-bold">{displayNum}</p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Requested Product</p>
          <p className="mt-1 font-medium">{d.product}</p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Vehicle</p>
          <p className="mt-1 text-sm">{[d.year, d.make, d.model].join(' ')}</p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your Dealer</p>
          <p className="mt-1 text-sm">{d.dealerName}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{d.dealerCity}, {d.dealerState}</p>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Your LEER dealer will follow up within 1 business day.
        </p>
        <div className="mt-8">
          <a
            href="/dealer/quotes"
            className="inline-flex items-center gap-1.5 rounded border border-input bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-muted"
          >
            View in Dealer Portal →
          </a>
        </div>
      </div>
    </div>
  )
}

// ─── Root component ───────────────────────────────────────────────────────────

export function QuoteRequestForm({ locations }: { locations: Location[] }) {
  const [step, setStep] = useState<Step>('contact')
  const [data, setData] = useState<FormData>(() => generateDemoData(locations))
  const [pending, startTransition] = useTransition()
  const [submitted, setSubmitted] = useState<{ quoteId: string; data: FormData } | null>(null)

  const stepIdx = STEPS.indexOf(step)

  function set(updates: Partial<FormData>) {
    setData((prev) => ({ ...prev, ...updates }))
  }

  function goNext() {
    if (stepIdx < STEPS.length - 1) {
      setStep(STEPS[stepIdx + 1])
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function goBack() {
    if (stepIdx > 0) {
      setStep(STEPS[stepIdx - 1])
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function goToStep(s: Step) {
    if (STEPS.indexOf(s) <= stepIdx) {
      setStep(s)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function handleSubmit() {
    startTransition(async () => {
      const id = await actionSubmitQuoteRequest({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email,
        year: data.year,
        make: data.make,
        model: data.model,
        submodel: data.submodel,
        bodyType: data.bodyType,
        bedLength: data.bedLength,
        product: data.product,
        dealerId: data.dealerId,
      })
      setSubmitted({ quoteId: id, data })
    })
  }

  if (submitted) {
    return <SuccessScreen quoteId={submitted.quoteId} d={submitted.data} />
  }

  const canAdvance = isComplete(step, data)

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Header */}
      <div className="bg-[#1E1E1E] px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-widest text-white/50">LEER Group</p>
          <p className="mt-0.5 text-lg font-semibold text-white">Request a Quote</p>
        </div>
      </div>

      {/* Step tabs */}
      <div className="border-b border-[#e0e0e0] bg-white">
        <div className="mx-auto flex max-w-3xl">
          {STEPS.map((s, i) => {
            const isActive  = s === step
            const isPast    = i < stepIdx
            return (
              <button
                key={s}
                type="button"
                onClick={() => isPast && goToStep(s)}
                disabled={!isPast && !isActive}
                className={`flex-1 border-b-2 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-[#1E1E1E] text-[#1E1E1E]'
                    : isPast
                    ? 'cursor-pointer border-transparent text-muted-foreground hover:text-foreground'
                    : 'border-transparent text-muted-foreground/40'
                }`}
              >
                {STEP_LABELS[s]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="mx-auto max-w-3xl px-4 py-8">
        {step === 'contact' && <ContactStep d={data} set={set} />}
        {step === 'vehicle' && <VehicleStep d={data} set={set} />}
        {step === 'product' && <ProductStep d={data} set={set} />}
        {step === 'dealer'  && <DealerStep  d={data} set={set} locations={locations} />}
        {step === 'summary' && <SummaryStep d={data} goToStep={goToStep} />}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          <div className="flex gap-2">
            {stepIdx > 0 && (
              <Button variant="outline" onClick={goBack}>
                <ChevronLeft size={14} className="mr-1" /> Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => { setData(generateDemoData(locations)); setStep('contact'); window.scrollTo({ top: 0 }) }}
            >
              Reset
            </Button>
            {step === 'summary' ? (
              <Button
                disabled={pending}
                onClick={handleSubmit}
                className="bg-[#FFC60B] font-semibold uppercase tracking-wide text-[#1E1E1E] hover:bg-[#FFC60B]/90"
              >
                {pending && <Loader2 size={14} className="mr-1.5 animate-spin" />}
                Submit <ChevronRight size={14} className="ml-1" />
              </Button>
            ) : (
              <Button
                disabled={!canAdvance}
                onClick={goNext}
                className="bg-[#1E1E1E] font-semibold uppercase tracking-wide text-white hover:bg-[#333] disabled:opacity-40"
              >
                Next <ChevronRight size={14} className="ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

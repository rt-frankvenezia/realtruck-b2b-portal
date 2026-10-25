import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Calendar, ShieldCheck, Truck } from 'lucide-react'
import { SERIAL_LOOKUP } from '@/lib/leer/data/serial-lookup'
import { PartsCatalog } from '@/components/dealer/PartsCatalog'

const BRAND_ACCENT: Record<string, string> = {
  LEER: '#FFC60B',
  Century: '#FFC60B',
  Snugtop: '#FFC60B',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default async function SerialResultPage({
  params,
}: {
  params: Promise<{ serial: string }>
}) {
  const { serial } = await params
  const cap = SERIAL_LOOKUP[serial]

  if (!cap) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <p className="text-4xl">🔍</p>
        <h1 className="mt-4 text-2xl font-bold">Serial number not found</h1>
        <p className="mt-2 text-muted-foreground">
          No cap record found for serial{' '}
          <span className="font-mono font-semibold text-foreground">{serial}</span>.
          Verify the number and try again, or contact your{' '}
          <span className="font-semibold">LEER dealer rep</span>.
        </p>
        <Link
          href="/dealer/serial-lookup"
          className="mt-6 inline-flex items-center gap-2 rounded bg-[#1E1E1E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#333]"
        >
          <ArrowLeft size={15} />
          Try another serial
        </Link>
      </div>
    )
  }

  const warrantyExpired = new Date(cap.warranty_expiration) < new Date()

  return (
    <div className="flex flex-col gap-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dealer/serial-lookup" className="hover:text-foreground">
          Serial Lookup
        </Link>
        <span>/</span>
        <span className="font-mono font-medium text-foreground">{cap.serial}</span>
      </div>

      {/* Cap summary card */}
      <div className="overflow-hidden rounded-lg border border-[#e8e8e8]">
        {/* Brand header bar */}
        <div className="flex items-center gap-3 bg-[#1E1E1E] px-6 py-4">
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: BRAND_ACCENT[cap.brand] }}
          >
            {cap.brand}
          </span>
          <span className="text-lg font-semibold text-white">{cap.model}</span>
          <span className="ml-auto font-mono text-sm text-white/50">SN: {cap.serial}</span>
        </div>

        {/* Detail grid */}
        <div className="grid grid-cols-1 divide-y bg-white sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {/* Vehicle */}
          <div className="flex items-start gap-3 px-6 py-5">
            <Truck size={18} className="mt-0.5 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Vehicle
              </p>
              <p className="mt-1 font-semibold text-foreground">
                {cap.truck_year} {cap.truck_make} {cap.truck_model}
              </p>
              <p className="text-sm text-muted-foreground">{cap.bed_length} bed</p>
            </div>
          </div>

          {/* Color & specs */}
          <div className="px-6 py-5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Color
            </p>
            <div className="mt-1 flex items-center gap-2">
              <p className="font-semibold text-foreground">{cap.color}</p>
              <span className="rounded bg-[#f5f5f5] px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                {cap.color_code}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Sold by {cap.dealer}</p>
          </div>

          {/* Dates */}
          <div className="flex items-start gap-3 px-6 py-5">
            <Calendar size={18} className="mt-0.5 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Manufactured
              </p>
              <p className="mt-1 font-semibold text-foreground">{formatDate(cap.manufactured_date)}</p>
              <div className="mt-1.5 flex items-center gap-1.5">
                <ShieldCheck
                  size={13}
                  className={warrantyExpired ? 'text-red-400' : 'text-green-500'}
                />
                <p className="text-sm text-muted-foreground">
                  Warranty {warrantyExpired ? 'expired' : 'through'}{' '}
                  <span className={`font-medium ${warrantyExpired ? 'text-red-600' : 'text-foreground'}`}>
                    {formatDate(cap.warranty_expiration)}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration options */}
      {cap.options.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-[#e8e8e8]">
          <div className="border-b border-[#e8e8e8] bg-[#f8f8f8] px-6 py-3">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              As-Built Configuration
            </h2>
          </div>
          <div className="divide-y divide-[#f0f0f0] bg-white">
            {cap.options.map((opt) => (
              <div key={opt.label} className="flex items-center justify-between px-6 py-2.5">
                <span className="text-sm text-muted-foreground">{opt.label}</span>
                <span className="text-sm font-medium text-foreground">{opt.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Replacement parts */}
      <div>
        <div className="mb-5">
          <h2 className="text-xl font-bold">Replacement Parts</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {cap.parts.length} parts specific to serial{' '}
            <span className="font-mono font-semibold text-foreground">{cap.serial}</span>
          </p>
        </div>
        <PartsCatalog parts={cap.parts} />
      </div>
    </div>
  )
}

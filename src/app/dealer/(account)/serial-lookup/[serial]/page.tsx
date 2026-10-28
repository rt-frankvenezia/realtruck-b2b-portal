import Link from 'next/link'
import { ArrowLeft, Truck, Store, CalendarDays } from 'lucide-react'
import { SERIAL_LOOKUP } from '@/lib/leer/data/serial-lookup'
import { PartsCatalog } from '@/components/dealer/PartsCatalog'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
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

      {/* Cap identity card */}
      <div className="overflow-hidden rounded-lg border border-[#e8e8e8]">
        {/* Dark header: brand + model + serial */}
        <div className="flex items-center justify-between bg-[#1E1E1E] px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="rounded bg-[#FFC60B] px-2 py-0.5 text-[11px] font-bold uppercase tracking-widest text-black">
              {cap.brand}
            </span>
            <span className="text-xl font-bold text-white">{cap.model}</span>
          </div>
          <span className="font-mono text-sm text-white/50">SN: {cap.serial}</span>
        </div>

        {/* Three-column info strip */}
        <div className="grid grid-cols-3 divide-x divide-[#f0f0f0] bg-white">
          {/* Vehicle */}
          <div className="flex flex-col gap-1.5 px-6 py-5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <Truck size={11} />
              Vehicle
            </div>
            <p className="text-base font-semibold text-foreground">
              {cap.truck_year} {cap.truck_make} {cap.truck_model}
            </p>
            <p className="text-sm text-muted-foreground">{cap.bed_length} bed</p>
            <div className="mt-0.5 flex items-center gap-2">
              <p className="text-sm text-muted-foreground">{cap.color}</p>
              <span className="rounded bg-[#f0f0f0] px-1.5 py-0.5 font-mono text-[10px] font-bold text-muted-foreground">
                {cap.color_code}
              </span>
            </div>
          </div>

          {/* Dealer */}
          <div className="flex flex-col gap-1.5 px-6 py-5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <Store size={11} />
              Selling Dealer
            </div>
            <p className="text-base font-semibold text-foreground">{cap.dealer}</p>
          </div>

          {/* Dates */}
          <div className="flex flex-col gap-1.5 px-6 py-5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <CalendarDays size={11} />
              Manufactured
            </div>
            <p className="text-base font-semibold text-foreground">
              {formatDate(cap.manufactured_date)}
            </p>
            <p className={`text-sm ${warrantyExpired ? 'text-red-500' : 'text-muted-foreground'}`}>
              Warranty through {formatDate(cap.warranty_expiration)}
              {warrantyExpired && (
                <span className="ml-1.5 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-600">
                  Expired
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

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

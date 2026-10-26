import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SERIAL_LOOKUP } from '@/lib/leer/data/serial-lookup'
import { PartsCatalog } from '@/components/dealer/PartsCatalog'
import { CapConfigExpander } from '@/components/dealer/CapConfigExpander'

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

      {/* Cap details card */}
      <div className="overflow-hidden rounded-lg border border-[#e8e8e8]">
        {/* Header bar */}
        <div className="flex items-center justify-between bg-[#1E1E1E] px-6 py-3">
          <span className="text-xs font-bold uppercase tracking-widest text-white/60">
            Cap Details
          </span>
          <span className="rounded border border-[#FFC60B]/40 px-2 py-0.5 text-[11px] font-bold uppercase tracking-widest text-[#FFC60B]">
            {cap.brand}
          </span>
        </div>

        {/* Model + serial identity */}
        <div className="border-b border-[#f0f0f0] bg-white px-6 py-5">
          <p className="text-2xl font-bold text-foreground">{cap.model}</p>
          <p className="mt-1 font-mono text-sm text-muted-foreground">SN {cap.serial}</p>
        </div>

        {/* Configuration rows — first 3 preview, expand to see all */}
        {cap.options.length > 0 && (
          <div className="bg-white">
            <div className="border-b border-[#f0f0f0] bg-[#f8f8f8] px-6 py-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Configuration
              </span>
            </div>
            <CapConfigExpander options={cap.options} />
          </div>
        )}
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

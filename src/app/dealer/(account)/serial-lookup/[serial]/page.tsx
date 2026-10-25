import Link from 'next/link'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import { SERIAL_LOOKUP } from '@/lib/leer/data/serial-lookup'
import { PartsCatalog } from '@/components/dealer/PartsCatalog'

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

      {/* Cap identity card */}
      <div className="overflow-hidden rounded-lg border border-[#e8e8e8]">
        {/* Brand / model header */}
        <div className="flex items-center gap-3 bg-[#1E1E1E] px-6 py-4">
          <span className="text-xs font-bold uppercase tracking-widest text-[#FFC60B]">
            {cap.brand}
          </span>
          <span className="text-lg font-semibold text-white">{cap.model}</span>
          <span className="ml-auto font-mono text-sm text-white/50">SN: {cap.serial}</span>
        </div>

        {/* Color row */}
        <div className="flex items-center gap-3 border-b border-[#f0f0f0] bg-white px-6 py-4">
          <span className="text-sm text-muted-foreground">Color</span>
          <span className="font-semibold text-foreground">{cap.color}</span>
          <span className="rounded bg-[#f5f5f5] px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
            {cap.color_code}
          </span>
        </div>

        {/* Expandable configuration — matches configurator row-header style */}
        {cap.options.length > 0 && (
          <details className="group">
            <summary className="flex cursor-pointer select-none items-center justify-between bg-[#f5f5f5] px-6 py-3 [list-style:none] [&::-webkit-details-marker]:hidden">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                As-Built Configuration
              </span>
              <ChevronDown
                size={14}
                className="text-muted-foreground transition-transform duration-150 group-open:rotate-180"
              />
            </summary>
            <div className="divide-y divide-[#f0f0f0] bg-white">
              {cap.options.map((opt, idx) => (
                <div key={opt.label} className="flex items-center gap-2.5 px-4 py-2.5">
                  <span className="w-5 shrink-0 text-center text-xs font-bold text-muted-foreground">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wide text-foreground">
                    {opt.label}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">{opt.value}</span>
                </div>
              ))}
            </div>
          </details>
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

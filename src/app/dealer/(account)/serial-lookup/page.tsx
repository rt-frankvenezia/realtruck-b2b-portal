'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Info, ArrowRight } from 'lucide-react'

const PANEL = 'overflow-hidden rounded border border-[#d5d5d5] bg-white'
const PANEL_HEADER = 'bg-[#1E1E1E] px-4 py-3'

const DEMO_SERIALS = [
  { serial: '7421483', brand: 'LEER', label: '100RCC · 2024 Ford F-150' },
  { serial: '6398201', brand: 'Century', label: '100XQ Sport · 2023 Ram 1500' },
  { serial: '8834715', brand: 'Snugtop', label: 'Rebel · 2024 Chevy Silverado' },
]

export default function SerialLookupPage() {
  const router = useRouter()
  const [value, setValue] = useState('')

  function handleSearch(serial: string) {
    const s = serial.trim()
    if (!s) return
    router.push(`/dealer/serial-lookup/${encodeURIComponent(s)}`)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold">Serial Number Lookup</h1>
        <p className="text-muted-foreground">
          Find specifications and replacement parts for LEER, Century, and Snugtop caps.
        </p>
      </div>

      {/* Search panel */}
      <div className={PANEL}>
        <div className={PANEL_HEADER}>
          <span className="text-sm font-semibold text-white">Enter Serial Number</span>
        </div>
        <div className="p-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                autoFocus
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(value)}
                placeholder="Enter 7-digit serial number…"
                className="h-10 w-full rounded border border-[#d5d5d5] pl-9 pr-4 text-sm focus:border-[#1E1E1E] focus:outline-none"
              />
            </div>
            <button
              onClick={() => handleSearch(value)}
              className="rounded bg-[#FFC60B] px-5 text-sm font-bold uppercase tracking-wide text-[#1E1E1E] transition-colors hover:bg-[#e6b200]"
            >
              Look Up
            </button>
          </div>

          <div className="mt-4 flex items-start gap-2.5 rounded border border-[#e8e8e8] bg-[#f8f8f8] px-4 py-3">
            <Info size={14} className="mt-0.5 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              The serial number is printed on a sticker inside the front overhead panel of the cap,
              typically near the hinge line. It is a 7-digit number unique to each cap.
            </p>
          </div>
        </div>
      </div>

      {/* Sample serials panel */}
      <div className={PANEL}>
        <div className={PANEL_HEADER}>
          <span className="text-sm font-semibold text-white">Try a Sample Serial</span>
        </div>
        <div className="divide-y divide-[#f0f0f0]">
          {DEMO_SERIALS.map(({ serial, brand, label }) => (
            <button
              key={serial}
              onClick={() => handleSearch(serial)}
              className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-[#fafafa]"
            >
              <span className="w-16 shrink-0 rounded border border-[#d5d5d5] px-2 py-0.5 text-center text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                {brand}
              </span>
              <div className="flex-1">
                <span className="font-mono text-sm font-semibold text-foreground">{serial}</span>
                <span className="ml-3 text-sm text-muted-foreground">{label}</span>
              </div>
              <ArrowRight size={14} className="shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Info } from 'lucide-react'

const DEMO_SERIALS = [
  { serial: '7421483', label: 'LEER 100RCC · 2024 Ford F-150' },
  { serial: '6398201', label: 'Century 100XQ Sport · 2023 Ram 1500' },
  { serial: '8834715', label: 'Snugtop Rebel · 2024 Chevy Silverado' },
]

const BRANDS = ['LEER', 'Century', 'Snugtop']

export default function SerialLookupPage() {
  const router = useRouter()
  const [value, setValue] = useState('')

  function handleSearch(serial: string) {
    const s = serial.trim()
    if (!s) return
    router.push(`/dealer/serial-lookup/${encodeURIComponent(s)}`)
  }

  return (
    <div className="mx-auto max-w-2xl py-12">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="mb-3 flex items-center justify-center gap-3">
          {BRANDS.map((b) => (
            <span
              key={b}
              className="rounded border border-[#d5d5d5] px-3 py-1 text-xs font-bold uppercase tracking-widest text-muted-foreground"
            >
              {b}
            </span>
          ))}
        </div>
        <h1 className="font-brand text-4xl uppercase">Serial Number Lookup</h1>
        <p className="mt-3 text-muted-foreground">
          Enter a cap serial number to view its exact specifications and replacement parts.
        </p>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            autoFocus
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(value)}
            placeholder="Enter serial number…"
            className="h-12 w-full rounded border border-[#d5d5d5] pl-10 pr-4 text-base focus:border-[#1E1E1E] focus:outline-none"
          />
        </div>
        <button
          onClick={() => handleSearch(value)}
          className="rounded bg-[#FFC60B] px-6 text-sm font-bold uppercase tracking-wide text-[#1E1E1E] hover:bg-[#e6b200] transition-colors"
        >
          Look up
        </button>
      </div>

      {/* Where to find serial number */}
      <div className="mt-5 flex gap-3 rounded border border-blue-100 bg-blue-50 px-4 py-3">
        <Info size={16} className="mt-0.5 shrink-0 text-blue-500" />
        <p className="text-sm text-blue-800">
          The serial number is printed on a sticker inside the front overhead panel of the cap, typically near the hinge line.
          It is a 7-digit number unique to each cap.
        </p>
      </div>

      {/* Demo serials */}
      <div className="mt-10">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Try a sample serial
        </p>
        <div className="flex flex-col gap-2">
          {DEMO_SERIALS.map(({ serial, label }) => (
            <button
              key={serial}
              onClick={() => handleSearch(serial)}
              className="flex items-center justify-between rounded border border-[#d5d5d5] px-4 py-3 text-left hover:border-[#1E1E1E] hover:bg-muted/10 transition-colors"
            >
              <div>
                <span className="font-mono text-sm font-semibold text-foreground">{serial}</span>
                <span className="ml-3 text-sm text-muted-foreground">{label}</span>
              </div>
              <span className="text-xs text-muted-foreground">→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

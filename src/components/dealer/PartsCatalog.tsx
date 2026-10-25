'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { CapPart } from '@/lib/leer/data/serial-lookup'

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

export function PartsCatalog({ parts }: { parts: CapPart[] }) {
  const categories = ['All', ...Array.from(new Set(parts.map((p) => p.category)))]
  const [active, setActive] = useState('All')

  const filtered = active === 'All' ? parts : parts.filter((p) => p.category === active)

  return (
    <div>
      {/* Category filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={[
              'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
              active === cat
                ? 'border-[#1E1E1E] bg-[#1E1E1E] text-white'
                : 'border-[#d5d5d5] text-muted-foreground hover:border-[#1E1E1E] hover:text-foreground',
            ].join(' ')}
          >
            {cat}
            {cat === 'All' && (
              <span className="ml-1.5 text-xs opacity-60">{parts.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Parts grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((part) => (
          <div
            key={part.part_no}
            className="overflow-hidden rounded border border-[#e8e8e8] bg-white transition-shadow hover:shadow-md"
          >
            {/* Image */}
            <div className="relative aspect-[4/3] w-full bg-[#f8f8f8]">
              {part.image_url ? (
                <Image
                  src={part.image_url}
                  alt={part.description}
                  fill
                  className="object-contain p-4"
                  unoptimized
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  No image
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-4">
              <p className="mb-1 font-mono text-[11px] font-semibold tracking-widest text-muted-foreground">
                {part.part_no}
              </p>
              <p className="text-sm font-semibold leading-snug text-foreground">
                {part.description}
              </p>
              {part.notes && (
                <p className="mt-0.5 text-xs text-muted-foreground">{part.notes}</p>
              )}
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="rounded bg-[#f5f5f5] px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {part.category}
                </span>
                <span className="text-base font-bold text-foreground">
                  {formatCurrency(part.price)}
                </span>
              </div>
              {/* Coming-soon order button */}
              <button
                disabled
                className="mt-3 w-full cursor-not-allowed rounded border border-[#d5d5d5] bg-[#f5f5f5] py-2 text-xs font-bold uppercase tracking-wide text-[#AAAAAA]"
              >
                Request to Order — Coming Soon
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

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
      <div className="mb-4 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={[
              'rounded-full border px-3.5 py-1 text-xs font-medium transition-colors',
              active === cat
                ? 'border-[#1E1E1E] bg-[#1E1E1E] text-white'
                : 'border-[#d5d5d5] text-muted-foreground hover:border-[#1E1E1E] hover:text-foreground',
            ].join(' ')}
          >
            {cat}
            {cat === 'All' && (
              <span className="ml-1 opacity-60">{parts.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Parts list */}
      <div className="overflow-hidden rounded border border-[#d5d5d5] bg-white">
        <div className="divide-y divide-[#f0f0f0]">
          {filtered.map((part) => (
            <div key={part.part_no} className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-[#fafafa]">
              {/* Thumbnail */}
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded border border-[#e8e8e8] bg-[#f8f8f8]">
                {part.image_url ? (
                  <Image
                    src={part.image_url}
                    alt={part.description}
                    fill
                    className="object-contain p-1.5"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                    —
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-[11px] font-semibold tracking-widest text-muted-foreground">
                    {part.part_no}
                  </span>
                  <span className="rounded bg-[#f5f5f5] px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {part.category}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
                  {part.description}
                </p>
                {part.notes && (
                  <p className="text-xs text-muted-foreground">{part.notes}</p>
                )}
              </div>

              {/* Price */}
              <span className="shrink-0 text-sm font-bold text-foreground">
                {formatCurrency(part.price)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

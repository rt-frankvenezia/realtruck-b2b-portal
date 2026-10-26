'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { CapOption } from '@/lib/leer/data/serial-lookup'

const PREVIEW_COUNT = 3

export function CapConfigExpander({ options }: { options: CapOption[] }) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? options : options.slice(0, PREVIEW_COUNT)
  const remaining = options.length - PREVIEW_COUNT

  return (
    <div className="divide-y divide-[#f0f0f0]">
      {visible.map((opt, idx) => (
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
      {remaining > 0 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center gap-1.5 px-6 py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronDown
            size={13}
            className={`transition-transform duration-150 ${expanded ? 'rotate-180' : ''}`}
          />
          {expanded ? 'Show less' : `View ${remaining} more option${remaining === 1 ? '' : 's'}`}
        </button>
      )}
    </div>
  )
}

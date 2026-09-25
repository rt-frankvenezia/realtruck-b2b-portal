'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const NONE = '__none__'

type PricingGroupOption = {
  id: string
  name: string
  base_discount: number
}

export function CompanyPricingGroupSelect({
  companyId,
  pricingGroupId,
  pricingGroups,
}: {
  companyId: string
  pricingGroupId: string | null
  pricingGroups: PricingGroupOption[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const filtered = query
    ? pricingGroups.filter((pg) => pg.name.toLowerCase().includes(query.toLowerCase()))
    : pricingGroups

  const currentLabel = pricingGroups.find((pg) => pg.id === pricingGroupId)?.name ?? 'None'

  function select(next: string) {
    setOpen(false)
    setQuery('')
    if (next === (pricingGroupId ?? NONE)) return

    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase
        .from('companies')
        .update({ pricing_group_id: next === NONE ? null : next })
        .eq('id', companyId)
      if (error) { toast.error(error.message); return }
      toast.success(next === NONE ? 'Pricing group removed' : 'Pricing group updated')
      router.refresh()
    })
  }

  return (
    <div ref={containerRef} className="relative w-64">
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setQuery('') }}
        disabled={isPending}
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm',
          'hover:bg-accent hover:text-accent-foreground disabled:opacity-50',
          open && 'ring-1 ring-ring'
        )}
      >
        <span className={cn(!pricingGroupId && 'text-muted-foreground')}>{currentLabel}</span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          <div className="p-1.5">
            <Input
              autoFocus
              placeholder="Search pricing groups..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="max-h-48 overflow-y-auto p-1">
            <button
              type="button"
              onClick={() => select(NONE)}
              className={cn(
                'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent',
                !pricingGroupId && 'font-medium'
              )}
            >
              <Check className={cn('h-4 w-4', pricingGroupId ? 'invisible' : 'visible')} />
              None
            </button>
            {filtered.length === 0 && (
              <p className="px-2 py-1.5 text-sm text-muted-foreground">No pricing groups found.</p>
            )}
            {filtered.map((pg) => (
              <button
                key={pg.id}
                type="button"
                onClick={() => select(pg.id)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent',
                  pg.id === pricingGroupId && 'font-medium'
                )}
              >
                <Check className={cn('h-4 w-4', pg.id === pricingGroupId ? 'visible' : 'invisible')} />
                <span className="flex-1 text-left">{pg.name}</span>
                <span className="text-xs text-muted-foreground">{pg.base_discount}%</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

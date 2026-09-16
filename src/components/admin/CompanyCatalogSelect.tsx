'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const NONE = '__none__'

type CatalogOption = {
  id: string
  name: string
  pricing_group_id: string | null
  restriction_group_id: string | null
}

export function CompanyCatalogSelect({
  companyId,
  catalogId,
  catalogs,
}: {
  companyId: string
  catalogId: string | null
  catalogs: CatalogOption[]
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
    ? catalogs.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
    : catalogs

  const currentLabel = catalogs.find((c) => c.id === catalogId)?.name ?? 'None'

  function select(next: string) {
    setOpen(false)
    setQuery('')
    if (next === (catalogId ?? NONE)) return

    startTransition(async () => {
      const supabase = createClient()

      if (next === NONE) {
        const { error } = await supabase
          .from('companies')
          .update({ catalog_id: null, pricing_group_id: null, restriction_group_id: null })
          .eq('id', companyId)
        if (error) { toast.error(error.message); return }
        toast.success('Catalog removed')
        router.refresh()
        return
      }

      const catalog = catalogs.find((c) => c.id === next)
      if (!catalog) return

      // Sync pricing_group_id + restriction_group_id so storefront RPCs work unchanged.
      const { error } = await supabase
        .from('companies')
        .update({
          catalog_id: next,
          pricing_group_id: catalog.pricing_group_id,
          restriction_group_id: catalog.restriction_group_id,
        })
        .eq('id', companyId)
      if (error) { toast.error(error.message); return }
      toast.success('Catalog updated')
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
        <span className={cn(!catalogId && 'text-muted-foreground')}>{currentLabel}</span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          <div className="p-1.5">
            <Input
              autoFocus
              placeholder="Search catalogs..."
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
                !catalogId && 'font-medium'
              )}
            >
              <Check className={cn('h-4 w-4', catalogId ? 'invisible' : 'visible')} />
              None
            </button>
            {filtered.length === 0 && (
              <p className="px-2 py-1.5 text-sm text-muted-foreground">No catalogs found.</p>
            )}
            {filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => select(c.id)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent',
                  c.id === catalogId && 'font-medium'
                )}
              >
                <Check className={cn('h-4 w-4', c.id === catalogId ? 'visible' : 'invisible')} />
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

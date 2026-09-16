'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Company = { id: string; name: string; status: string }

export function CatalogDealerAssignment({
  catalogId,
  pricingGroupId,
  restrictionGroupId,
  initialDealers,
}: {
  catalogId: string
  pricingGroupId: string | null
  restrictionGroupId: string | null
  initialDealers: Company[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<Company[]>([])
  const [searched, setSearched] = useState(false)

  async function handleSearch() {
    const supabase = createClient()
    const { data } = await supabase
      .from('companies')
      .select('id, name, status')
      .ilike('name', `%${search.trim()}%`)
      .is('catalog_id', null)
      .order('name')
      .limit(8)
    setResults(data ?? [])
    setSearched(true)
  }

  function handleAssign(company: Company) {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase
        .from('companies')
        .update({
          catalog_id: catalogId,
          pricing_group_id: pricingGroupId,
          restriction_group_id: restrictionGroupId,
        })
        .eq('id', company.id)
      if (error) { toast.error(error.message); return }
      toast.success(`${company.name} assigned`)
      setResults((r) => r.filter((c) => c.id !== company.id))
      router.refresh()
    })
  }

  function handleRemove(company: Company) {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase
        .from('companies')
        .update({ catalog_id: null, pricing_group_id: null, restriction_group_id: null })
        .eq('id', company.id)
      if (error) { toast.error(error.message); return }
      toast.success(`${company.name} removed`)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {initialDealers.length > 0 && (
        <div className="flex flex-col gap-1">
          {initialDealers.map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
              <span className="font-medium">{d.name}</span>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => handleRemove(d)}
                disabled={isPending}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          placeholder="Search companies to add..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="max-w-xs"
        />
        <Button variant="outline" onClick={handleSearch} disabled={!search.trim() || isPending}>
          Search
        </Button>
      </div>

      {searched && results.length === 0 && (
        <p className="text-sm text-muted-foreground">No unassigned companies found.</p>
      )}

      {results.length > 0 && (
        <div className="flex flex-col gap-1">
          {results.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
              <span>{c.name}</span>
              <Button size="sm" variant="outline" onClick={() => handleAssign(c)} disabled={isPending}>
                Add
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

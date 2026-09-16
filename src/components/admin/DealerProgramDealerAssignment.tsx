'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { X, Search } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Company = { id: string; name: string }

export function DealerProgramDealerAssignment({
  dealerProgramId,
  assignedCompanies,
  otherCompanies,
}: {
  dealerProgramId: string
  assignedCompanies: Company[]
  otherCompanies: Company[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')

  const filtered = otherCompanies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  )

  function handleAssign(companyId: string, company: Company) {
    startTransition(async () => {
      const supabase = createClient()

      // Fetch the catalog's pricing/restriction group IDs so we can sync them
      const { data: program } = await supabase
        .from('dealer_programs')
        .select('catalog_id, catalogs(pricing_group_id, restriction_group_id)')
        .eq('id', dealerProgramId)
        .single()

      const catalog = (program?.catalogs as { pricing_group_id: string | null; restriction_group_id: string | null } | null)
      const { error } = await supabase
        .from('companies')
        .update({
          dealer_program_id: dealerProgramId,
          pricing_group_id: catalog?.pricing_group_id ?? null,
          restriction_group_id: catalog?.restriction_group_id ?? null,
        })
        .eq('id', companyId)
      if (error) { toast.error(error.message); return }
      toast.success(`${company.name} added to program`)
      router.refresh()
    })
  }

  function handleRemove(companyId: string, company: Company) {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase
        .from('companies')
        .update({ dealer_program_id: null })
        .eq('id', companyId)
      if (error) { toast.error(error.message); return }
      toast.success(`${company.name} removed from program`)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Assigned dealers */}
      {assignedCompanies.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {assignedCompanies.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1.5 rounded-full border bg-muted px-3 py-1 text-sm"
            >
              {c.name}
              <button
                onClick={() => handleRemove(c.id, c)}
                disabled={isPending}
                className="text-muted-foreground hover:text-foreground"
                title="Remove from program"
              >
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No dealers assigned yet.</p>
      )}

      {/* Search and assign */}
      {otherCompanies.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dealers to assign..."
              className="pl-8"
            />
          </div>
          {filtered.length > 0 && (
            <div className="flex flex-col divide-y rounded-md border">
              {filtered.slice(0, 8).map((c) => (
                <div key={c.id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span>{c.name}</span>
                  <Button size="sm" variant="outline" disabled={isPending} onClick={() => handleAssign(c.id, c)}>
                    Assign
                  </Button>
                </div>
              ))}
              {filtered.length > 8 && (
                <p className="px-3 py-2 text-xs text-muted-foreground">{filtered.length - 8} more — refine your search</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

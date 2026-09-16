'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Company = { id: string; name: string }

export function RestrictionGroupDealerAssignment({
  restrictionGroupId,
  assignedCompanies,
  otherCompanies,
}: {
  restrictionGroupId: string
  assignedCompanies: Company[]
  otherCompanies: Company[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')

  const filtered = otherCompanies.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))

  function assign(companyId: string) {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase
        .from('companies')
        .update({ restriction_group_id: restrictionGroupId })
        .eq('id', companyId)
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Dealer assigned')
      router.refresh()
    })
  }

  function remove(companyId: string) {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase
        .from('companies')
        .update({ restriction_group_id: null })
        .eq('id', companyId)
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Dealer removed')
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {assignedCompanies.length === 0 ? (
        <p className="text-sm text-muted-foreground">No dealers assigned to this group.</p>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Assigned ({assignedCompanies.length})</p>
          <div className="flex flex-wrap gap-2">
            {assignedCompanies.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-sm"
              >
                <span>{c.name}</span>
                <button
                  onClick={() => remove(c.id)}
                  disabled={isPending}
                  className="text-muted-foreground hover:text-destructive"
                  title="Remove"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Add a dealer</p>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        {search && (
          <div className="flex flex-col gap-1">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground">No matching companies.</p>
            ) : (
              filtered.slice(0, 8).map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <span className="text-sm">{c.name}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => { assign(c.id); setSearch('') }}
                  >
                    <UserPlus size={13} className="mr-1" />
                    Assign
                  </Button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

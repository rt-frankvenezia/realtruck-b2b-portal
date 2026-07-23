'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type CompanyOption = { id: string; name: string; pricing_group_id: string | null }

export function PricingGroupDealerAssignment({
  pricingGroupId,
  assignedCompanies,
  otherCompanies,
}: {
  pricingGroupId: string
  assignedCompanies: { id: string; name: string }[]
  otherCompanies: CompanyOption[]
}) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()

  const matches = useMemo(() => {
    if (!search.trim()) return []
    const q = search.toLowerCase()
    return otherCompanies.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 8)
  }, [search, otherCompanies])

  function handleAssign(companyId: string) {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.from('companies').update({ pricing_group_id: pricingGroupId }).eq('id', companyId)
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Dealer assigned — applies to future carts/orders only')
      setSearch('')
      router.refresh()
    })
  }

  function handleRemove(companyId: string) {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.from('companies').update({ pricing_group_id: null }).eq('id', companyId)
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Dealer removed from group')
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative flex flex-col gap-2">
        <Input placeholder="Search dealers by name…" value={search} onChange={(e) => setSearch(e.target.value)} />
        {matches.length > 0 && (
          <div className="flex flex-col gap-1 rounded-md border p-2">
            {matches.map((c) => (
              <button
                key={c.id}
                type="button"
                disabled={isPending}
                onClick={() => handleAssign(c.id)}
                className="flex items-center justify-between rounded-sm px-2 py-1 text-left text-sm hover:bg-muted"
              >
                <span>{c.name}</span>
                {c.pricing_group_id && <span className="text-xs text-muted-foreground">reassign from current group</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Dealer</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignedCompanies.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell>
                <Button size="sm" variant="ghost" onClick={() => handleRemove(c.id)} disabled={isPending}>
                  Remove
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {assignedCompanies.length === 0 && (
            <TableRow>
              <TableCell colSpan={2} className="text-center text-sm text-muted-foreground">
                No dealers assigned to this group yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

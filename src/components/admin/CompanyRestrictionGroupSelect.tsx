'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const NONE = '__none__'

export function CompanyRestrictionGroupSelect({
  companyId,
  restrictionGroupId,
  restrictionGroups,
}: {
  companyId: string
  restrictionGroupId: string | null
  restrictionGroups: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleChange(next: string | null) {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase
        .from('companies')
        .update({ restriction_group_id: next === NONE ? null : next })
        .eq('id', companyId)
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Catalog restrictions updated')
      router.refresh()
    })
  }

  const currentLabel = restrictionGroups.find((g) => g.id === restrictionGroupId)?.name ?? 'None (all products allowed)'

  return (
    <Select value={restrictionGroupId ?? NONE} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger className="w-64">
        <SelectValue>{currentLabel}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>None (all products allowed)</SelectItem>
        {restrictionGroups.map((g) => (
          <SelectItem key={g.id} value={g.id}>
            {g.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

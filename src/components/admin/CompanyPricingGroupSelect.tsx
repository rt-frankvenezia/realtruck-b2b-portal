'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const NONE = '__none__'

export function CompanyPricingGroupSelect({
  companyId,
  pricingGroupId,
  pricingGroups,
}: {
  companyId: string
  pricingGroupId: string | null
  pricingGroups: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleChange(next: string) {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase
        .from('companies')
        .update({ pricing_group_id: next === NONE ? null : next })
        .eq('id', companyId)
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Pricing group updated')
      router.refresh()
    })
  }

  const currentLabel = pricingGroups.find((g) => g.id === pricingGroupId)?.name ?? 'None'

  return (
    <Select value={pricingGroupId ?? NONE} onValueChange={(v) => handleChange(v ?? NONE)} disabled={isPending}>
      <SelectTrigger className="w-56">
        <SelectValue>{currentLabel}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>None</SelectItem>
        {pricingGroups.map((g) => (
          <SelectItem key={g.id} value={g.id}>
            {g.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

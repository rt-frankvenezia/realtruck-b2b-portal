'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const NONE = '__none__'

type DealerProgramOption = {
  id: string
  name: string
  pricing_group_id: string | null
  restriction_group_id: string | null
}

export function CompanyDealerProgramSelect({
  companyId,
  dealerProgramId,
  dealerPrograms,
}: {
  companyId: string
  dealerProgramId: string | null
  dealerPrograms: DealerProgramOption[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleChange(next: string | null) {
    startTransition(async () => {
      const supabase = createClient()

      if (next === NONE || next === null) {
        const { error } = await supabase
          .from('companies')
          .update({ dealer_program_id: null })
          .eq('id', companyId)
        if (error) { toast.error(error.message); return }
        toast.success('Dealer program removed')
        router.refresh()
        return
      }

      const program = dealerPrograms.find((p) => p.id === next)
      if (!program) return

      // Write dealer_program_id and sync the legacy pricing/restriction group IDs
      // so existing storefront RPCs (get_pricing_schedule, check_product_purchase_access,
      // validate_cart_restrictions) continue to work without modification.
      const { error } = await supabase
        .from('companies')
        .update({
          dealer_program_id: next,
          pricing_group_id: program.pricing_group_id,
          restriction_group_id: program.restriction_group_id,
        })
        .eq('id', companyId)
      if (error) { toast.error(error.message); return }
      toast.success('Dealer program updated')
      router.refresh()
    })
  }

  const currentLabel = dealerPrograms.find((p) => p.id === dealerProgramId)?.name ?? 'None'

  return (
    <Select value={dealerProgramId ?? NONE} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger className="w-64">
        <SelectValue>{currentLabel}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>None</SelectItem>
        {dealerPrograms.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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

  function handleChange(next: string | null) {
    startTransition(async () => {
      const supabase = createClient()

      if (next === NONE || next === null) {
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

      // Write catalog_id and sync pricing_group_id / restriction_group_id so existing
      // storefront RPCs (get_pricing_schedule, check_product_purchase_access,
      // validate_cart_restrictions) continue to work without modification.
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

  const currentLabel = catalogs.find((c) => c.id === catalogId)?.name ?? 'None'

  return (
    <Select value={catalogId ?? NONE} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger className="w-64">
        <SelectValue>{currentLabel}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>None</SelectItem>
        {catalogs.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

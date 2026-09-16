'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Tables } from '@/lib/database.types'

type TierForm = { mode: 'idle' } | { mode: 'adding'; minQty: string; discount: string }

export function CatalogPricingSection({
  pricingGroup,
  baseTiers,
}: {
  pricingGroup: Tables<'pricing_groups'>
  baseTiers: Tables<'pricing_group_base_tiers'>[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [baseDiscount, setBaseDiscount] = useState(pricingGroup.base_discount.toString())
  const [tierForm, setTierForm] = useState<TierForm>({ mode: 'idle' })

  const sortedTiers = [...baseTiers].sort((a, b) => a.min_quantity - b.min_quantity)
  const hasChanges = baseDiscount !== pricingGroup.base_discount.toString()

  function handleSave() {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase
        .from('pricing_groups')
        .update({ base_discount: Number(baseDiscount) || 0 })
        .eq('id', pricingGroup.id)
      if (error) { toast.error(error.message); return }
      toast.success('Base discount saved')
      router.refresh()
    })
  }

  function handleAddTier() {
    if (tierForm.mode !== 'adding') return
    const minQty = parseInt(tierForm.minQty)
    const discount = parseFloat(tierForm.discount)
    if (!minQty || minQty < 2 || isNaN(discount)) return
    if (sortedTiers.some((t) => t.min_quantity === minQty)) {
      toast.error(`A tier for ${minQty}+ already exists`)
      return
    }
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.from('pricing_group_base_tiers').insert({
        pricing_group_id: pricingGroup.id,
        min_quantity: minQty,
        discount_percent: discount,
      })
      if (error) { toast.error(error.message); return }
      toast.success('Quantity break added')
      setTierForm({ mode: 'idle' })
      router.refresh()
    })
  }

  function handleDeleteTier(tierId: string) {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.from('pricing_group_base_tiers').delete().eq('id', tierId)
      if (error) { toast.error(error.message); return }
      toast.success('Quantity break removed')
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        The base discount applies when no pricing rule matches. Add per-rule volume tiers in the Pricing Rules section below.
      </p>

      <div className="flex items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Base Discount % (1+ units)</Label>
          <Input
            type="number"
            step="0.01"
            min={0}
            max={100}
            value={baseDiscount}
            onChange={(e) => setBaseDiscount(e.target.value)}
            className="w-32"
          />
        </div>
        <Button onClick={handleSave} disabled={isPending || !hasChanges} size="sm">
          SAVE
        </Button>
        {hasChanges && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBaseDiscount(pricingGroup.base_discount.toString())}
            disabled={isPending}
          >
            CANCEL
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <div className="border-b px-3 py-2">
          <p className="text-sm font-semibold">Base Discount — Quantity Breaks</p>
          <p className="text-xs text-muted-foreground">
            The 1+ rate uses the base discount above. Add breaks for higher quantities.
          </p>
        </div>

        <div className="flex items-center gap-3 px-3 py-2 text-sm border-b bg-muted/30">
          <span className="w-20 font-mono font-semibold">1+</span>
          <span className="flex-1 text-muted-foreground">Base rate</span>
          <span className="font-semibold">{baseDiscount || pricingGroup.base_discount}%</span>
          <span className="w-8" />
        </div>

        {sortedTiers.map((tier) => (
          <div key={tier.id} className="flex items-center gap-3 px-3 py-2 text-sm border-b last:border-b-0">
            <span className="w-20 font-mono font-semibold">{tier.min_quantity}+</span>
            <span className="flex-1" />
            <span className="font-semibold">{tier.discount_percent}%</span>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={isPending}
              onClick={() => handleDeleteTier(tier.id)}
              title="Remove quantity break"
            >
              <X size={14} className="text-destructive" />
            </Button>
          </div>
        ))}

        {tierForm.mode === 'adding' ? (
          <div className="flex items-center gap-2 px-3 py-2 border-t">
            <Input
              type="number"
              min={2}
              placeholder="Min qty (e.g. 5)"
              value={tierForm.minQty}
              onChange={(e) => setTierForm({ ...tierForm, minQty: e.target.value })}
              className="w-36"
            />
            <Input
              type="number"
              step="0.01"
              placeholder="Discount %"
              value={tierForm.discount}
              onChange={(e) => setTierForm({ ...tierForm, discount: e.target.value })}
              className="w-28"
            />
            <Button size="sm" onClick={handleAddTier} disabled={isPending || !tierForm.minQty || !tierForm.discount}>
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setTierForm({ mode: 'idle' })} disabled={isPending}>
              Cancel
            </Button>
          </div>
        ) : (
          <div className="px-3 py-2 border-t">
            <Button
              size="sm"
              variant="ghost"
              className="h-auto px-0 py-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setTierForm({ mode: 'adding', minQty: '', discount: '' })}
            >
              <Plus size={12} className="mr-1" />
              Add quantity break
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

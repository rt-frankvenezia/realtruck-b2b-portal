'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PRICING_GROUP_STATUS_LABEL } from '@/lib/status-labels'
import type { Database, Tables } from '@/lib/database.types'

type PricingGroupStatus = Database['public']['Enums']['pricing_group_status']
const ALL_STATUSES: PricingGroupStatus[] = ['active', 'inactive']

type TierFormState = { mode: 'idle' } | { mode: 'adding'; minQty: string; discount: string }

export function PricingGroupInfoForm({
  group,
  baseTiers,
}: {
  group: Tables<'pricing_groups'>
  baseTiers: Tables<'pricing_group_base_tiers'>[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(group.name)
  const [description, setDescription] = useState(group.description ?? '')
  const [status, setStatus] = useState<PricingGroupStatus>(group.status)
  const [effectiveDate, setEffectiveDate] = useState(group.effective_date)
  const [baseDiscount, setBaseDiscount] = useState(group.base_discount.toString())
  const [tierForm, setTierForm] = useState<TierFormState>({ mode: 'idle' })

  const sortedTiers = [...baseTiers].sort((a, b) => a.min_quantity - b.min_quantity)

  const hasChanges =
    name !== group.name ||
    description !== (group.description ?? '') ||
    status !== group.status ||
    effectiveDate !== group.effective_date ||
    baseDiscount !== group.base_discount.toString()

  function handleSave() {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase
        .from('pricing_groups')
        .update({
          name,
          description: description || null,
          status,
          effective_date: effectiveDate,
          base_discount: Number(baseDiscount) || 0,
        })
        .eq('id', group.id)
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Pricing group updated')
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
        pricing_group_id: group.id,
        min_quantity: minQty,
        discount_percent: discount,
      })
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Quantity break added')
      setTierForm({ mode: 'idle' })
      router.refresh()
    })
  }

  function handleDeleteTier(tierId: string) {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.from('pricing_group_base_tiers').delete().eq('id', tierId)
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Quantity break removed')
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as PricingGroupStatus)}>
            <SelectTrigger>
              <SelectValue>{PRICING_GROUP_STATUS_LABEL[status]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {ALL_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {PRICING_GROUP_STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label>Effective Date</Label>
          <Input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Base Discount %</Label>
          <Input type="number" step="0.01" value={baseDiscount} onChange={(e) => setBaseDiscount(e.target.value)} />
        </div>
      </div>

      {/* Base discount volume tier editor */}
      <div className="rounded-md border">
        <div className="border-b px-3 py-2">
          <p className="text-sm font-semibold">Base Discount — Quantity Breaks</p>
          <p className="text-xs text-muted-foreground">
            The 1+ rate is the Base Discount % above. Add breaks for higher quantities.
          </p>
        </div>

        {/* 1+ tier — always present, reads from the base_discount field */}
        <div className="flex items-center gap-3 px-3 py-2 text-sm border-b bg-muted/30">
          <span className="w-20 font-mono font-semibold">1+</span>
          <span className="flex-1 text-muted-foreground">Base rate (edit above)</span>
          <span className="font-semibold">{baseDiscount || group.base_discount}%</span>
          <span className="w-8" /> {/* placeholder for delete button alignment */}
        </div>

        {sortedTiers.map((tier) => (
          <div key={tier.id} className="flex items-center gap-3 px-3 py-2 text-sm border-b last:border-b-0">
            <span className="w-20 font-mono font-semibold">{tier.min_quantity}+</span>
            <span className="flex-1 text-muted-foreground" />
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
              className="w-32"
            />
            <Input
              type="number"
              step="0.01"
              placeholder="Discount %"
              value={tierForm.discount}
              onChange={(e) => setTierForm({ ...tierForm, discount: e.target.value })}
              className="w-32"
            />
            <Button
              size="sm"
              onClick={handleAddTier}
              disabled={isPending || !tierForm.minQty || !tierForm.discount}
            >
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setTierForm({ mode: 'idle' })}
              disabled={isPending}
            >
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

      <div className="flex justify-end">
        <Button size="sm" onClick={handleSave} disabled={isPending || !hasChanges || !name.trim()}>
          Save Changes
        </Button>
      </div>
    </div>
  )
}

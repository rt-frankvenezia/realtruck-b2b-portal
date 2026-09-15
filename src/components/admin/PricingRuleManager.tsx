'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PRICING_TARGET_TYPE_LABEL } from '@/lib/status-labels'
import type { Database, Tables } from '@/lib/database.types'

type PricingTargetType = Database['public']['Enums']['pricing_target_type']
const ALL_TARGET_TYPES: PricingTargetType[] = ['product-line', 'category', 'brand']

const PRIORITY_LABEL: Record<PricingTargetType, string> = {
  'product-line': '1st priority',
  category: '2nd priority',
  brand: '3rd priority',
}

type RuleWithTiers = Tables<'pricing_rules'> & {
  pricing_rule_tiers: Tables<'pricing_rule_tiers'>[]
}

type TierFormState =
  | { mode: 'idle' }
  | { mode: 'adding'; ruleId: string; minQty: string; discount: string }

export function PricingRuleManager({
  pricingGroupId,
  rules,
}: {
  pricingGroupId: string
  rules: RuleWithTiers[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // New-rule form state
  const [targetType, setTargetType] = useState<PricingTargetType>('brand')
  const [targetValue, setTargetValue] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [discountPercent, setDiscountPercent] = useState('')

  // Tier-add form state (at most one open at a time)
  const [tierForm, setTierForm] = useState<TierFormState>({ mode: 'idle' })

  const sortedRules = [...rules].sort((a, b) => {
    const order: Record<PricingTargetType, number> = { 'product-line': 0, category: 1, brand: 2 }
    return order[a.target_type] - order[b.target_type]
  })

  // --- Rule operations ---

  function handleAddRule() {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.from('pricing_rules').insert({
        pricing_group_id: pricingGroupId,
        target_type: targetType,
        target_value: targetValue,
        display_name: displayName,
        discount_percent: Number(discountPercent) || 0,
      })
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Rule added')
      setTargetValue('')
      setDisplayName('')
      setDiscountPercent('')
      router.refresh()
    })
  }

  function handleDeleteRule(id: string) {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.from('pricing_rules').delete().eq('id', id)
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Rule removed')
      if (tierForm.mode === 'adding' && tierForm.ruleId === id) setTierForm({ mode: 'idle' })
      router.refresh()
    })
  }

  // --- Tier operations ---

  function handleAddTier(rule: RuleWithTiers) {
    if (tierForm.mode !== 'adding' || tierForm.ruleId !== rule.id) return
    const minQty = parseInt(tierForm.minQty)
    const discount = parseFloat(tierForm.discount)
    if (!minQty || minQty < 2 || isNaN(discount)) return
    if (rule.pricing_rule_tiers.some((t) => t.min_quantity === minQty)) {
      toast.error(`A tier for ${minQty}+ already exists on this rule`)
      return
    }
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.from('pricing_rule_tiers').insert({
        pricing_rule_id: rule.id,
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
      const { error } = await supabase.from('pricing_rule_tiers').delete().eq('id', tierId)
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Quantity break removed')
      router.refresh()
    })
  }

  // --- Helpers ---

  function tierSummary(rule: RuleWithTiers): string {
    const tiers = rule.pricing_rule_tiers
    if (tiers.length === 0) return `${rule.discount_percent}%`
    const sorted = [...tiers].sort((a, b) => a.min_quantity - b.min_quantity)
    const max = sorted[sorted.length - 1].discount_percent
    return `${rule.discount_percent}% – ${max}% · ${tiers.length + 1} tiers`
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Rules list */}
      {sortedRules.length === 0 ? (
        <p className="rounded-md border px-4 py-6 text-center text-sm text-muted-foreground">
          No rules yet — the base discount applies to everything.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {sortedRules.map((rule) => {
            const sortedTiers = [...rule.pricing_rule_tiers].sort(
              (a, b) => a.min_quantity - b.min_quantity,
            )
            const isAddingTier = tierForm.mode === 'adding' && tierForm.ruleId === rule.id

            return (
              <div key={rule.id} className="rounded-md border">
                {/* Rule header */}
                <div className="flex items-center justify-between gap-3 px-3 py-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="shrink-0 rounded-sm bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground">
                      {PRICING_TARGET_TYPE_LABEL[rule.target_type]}
                    </span>
                    <span className="font-semibold truncate">{rule.display_name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground hidden sm:inline">
                      ({PRIORITY_LABEL[rule.target_type]})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm text-muted-foreground">{tierSummary(rule)}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteRule(rule.id)}
                      disabled={isPending}
                      className="h-auto px-2 py-1"
                    >
                      Remove
                    </Button>
                  </div>
                </div>

                {/* Tier rows */}
                <div className="border-t divide-y">
                  {/* 1+ tier — always present, immutable here (edit by removing & re-adding the rule) */}
                  <div className="flex items-center gap-3 px-3 py-2 text-sm bg-muted/30">
                    <span className="w-16 font-mono font-semibold">1+</span>
                    <span className="flex-1 text-xs text-muted-foreground">Base rate</span>
                    <span className="font-semibold">{rule.discount_percent}%</span>
                    <span className="w-7" />
                  </div>

                  {sortedTiers.map((tier) => (
                    <div key={tier.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                      <span className="w-16 font-mono font-semibold">{tier.min_quantity}+</span>
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

                  {/* Add tier form or button */}
                  {isAddingTier ? (
                    <div className="flex items-center gap-2 px-3 py-2">
                      <Input
                        type="number"
                        min={2}
                        placeholder="Min qty (e.g. 5)"
                        value={tierForm.minQty}
                        onChange={(e) =>
                          setTierForm({ ...tierForm, minQty: e.target.value })
                        }
                        className="w-36"
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Discount %"
                        value={tierForm.discount}
                        onChange={(e) =>
                          setTierForm({ ...tierForm, discount: e.target.value })
                        }
                        className="w-28"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleAddTier(rule)}
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
                    <div className="px-3 py-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-auto px-0 py-0 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() =>
                          setTierForm({ mode: 'adding', ruleId: rule.id, minQty: '', discount: '' })
                        }
                      >
                        <Plus size={12} className="mr-1" />
                        Add quantity break
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add new rule form */}
      <div className="rounded-md border p-3">
        <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Add Rule</p>
        <div className="grid grid-cols-5 gap-2">
          <Select value={targetType} onValueChange={(v) => setTargetType(v as PricingTargetType)}>
            <SelectTrigger>
              <SelectValue>{PRICING_TARGET_TYPE_LABEL[targetType]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {ALL_TARGET_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {PRICING_TARGET_TYPE_LABEL[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input placeholder="Target value (e.g. Retrax)" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} />
          <Input placeholder="Display name (e.g. Retrax)" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          <Input
            type="number"
            step="0.01"
            placeholder="Discount %"
            value={discountPercent}
            onChange={(e) => setDiscountPercent(e.target.value)}
          />
          <Button onClick={handleAddRule} disabled={isPending || !targetValue.trim() || !displayName.trim() || !discountPercent}>
            Add Rule
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Target value must match the exact brand name, category slug, or product-line slug used in the catalog.
          Use the Pricing Preview below to verify.
        </p>
      </div>
    </div>
  )
}

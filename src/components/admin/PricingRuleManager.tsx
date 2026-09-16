'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Pencil, Trash2, Tag } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

  // Add-rule form visibility
  const [addRuleOpen, setAddRuleOpen] = useState(false)

  // Inline edit state per rule (discount_percent only)
  const [editState, setEditState] = useState<{ mode: 'idle' } | { mode: 'editing'; ruleId: string; discount: string }>({ mode: 'idle' })

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
    if (!window.confirm('Remove this pricing rule?')) return
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.from('pricing_rules').delete().eq('id', id)
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Rule removed')
      if (tierForm.mode === 'adding' && tierForm.ruleId === id) setTierForm({ mode: 'idle' })
      if (editState.mode === 'editing' && editState.ruleId === id) setEditState({ mode: 'idle' })
      router.refresh()
    })
  }

  function handleEditRule(ruleId: string) {
    if (editState.mode === 'editing' && editState.ruleId === ruleId) return
    const rule = rules.find((r) => r.id === ruleId)
    if (!rule) return
    setEditState({ mode: 'editing', ruleId, discount: rule.discount_percent.toString() })
  }

  function handleSaveEdit(ruleId: string) {
    if (editState.mode !== 'editing') return
    const discount = parseFloat(editState.discount)
    if (isNaN(discount)) return
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase
        .from('pricing_rules')
        .update({ discount_percent: discount })
        .eq('id', ruleId)
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Rule updated')
      setEditState({ mode: 'idle' })
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
      {/* Section header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Rules override the base discount. Priority: Product Line → Brand → Category
        </p>
        <Button
          size="sm"
          onClick={() => { setAddRuleOpen(true); setEditState({ mode: 'idle' }) }}
          disabled={addRuleOpen}
        >
          <Plus size={14} className="mr-1" />
          ADD RULE
        </Button>
      </div>

      {/* New rule form */}
      {addRuleOpen && (
        <div className="rounded-md border p-4">
          <p className="mb-3 font-semibold">New Pricing Rule</p>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Label>% off *</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g. 20"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                className="w-32"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Add targets to this rule</Label>
              <div className="flex gap-2">
                <Select value={targetType} onValueChange={(v) => setTargetType(v as PricingTargetType)}>
                  <SelectTrigger className="w-40">
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
                <Input
                  placeholder="e.g. Retrax"
                  value={targetValue}
                  onChange={(e) => { setTargetValue(e.target.value); setDisplayName(e.target.value) }}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Must match the exact brand name, category slug, or product-line slug in the catalog.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleAddRule}
                disabled={isPending || !targetValue.trim() || !discountPercent}
              >
                SAVE
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setAddRuleOpen(false); setTargetValue(''); setDisplayName(''); setDiscountPercent('') }}
                disabled={isPending}
              >
                CANCEL
              </Button>
            </div>
          </div>
        </div>
      )}

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
            const isEditing = editState.mode === 'editing' && editState.ruleId === rule.id

            return (
              <div key={rule.id} className="rounded-md border">
                {/* Rule header */}
                <div className="flex items-start justify-between gap-3 px-4 py-3">
                  <div>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={editState.discount}
                          onChange={(e) => setEditState({ ...editState, discount: e.target.value })}
                          className="w-24 h-8"
                        />
                        <span className="text-sm text-muted-foreground">% off</span>
                        <Button size="sm" onClick={() => handleSaveEdit(rule.id)} disabled={isPending} className="h-8">
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditState({ mode: 'idle' })} disabled={isPending} className="h-8">
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <p className="text-lg font-semibold text-green-600">{rule.discount_percent}% off</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">1 target</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={isPending}
                      onClick={() => handleEditRule(rule.id)}
                      title="Edit discount"
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={isPending}
                      onClick={() => handleDeleteRule(rule.id)}
                      title="Remove rule"
                    >
                      <Trash2 size={14} className="text-destructive" />
                    </Button>
                  </div>
                </div>

                {/* Target chip */}
                <div className="border-t px-4 py-2 flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                    <Tag size={10} />
                    {rule.display_name}
                    <span className="text-muted-foreground/60">({PRICING_TARGET_TYPE_LABEL[rule.target_type]})</span>
                  </span>
                </div>

                {/* Tier rows */}
                <div className="border-t divide-y">
                  <div className="flex items-center gap-3 px-4 py-2 text-sm bg-muted/30">
                    <span className="w-16 font-mono font-semibold">1+</span>
                    <span className="flex-1 text-xs text-muted-foreground">Base rate</span>
                    <span className="font-semibold">{rule.discount_percent}%</span>
                    <span className="w-7" />
                  </div>

                  {sortedTiers.map((tier) => (
                    <div key={tier.id} className="flex items-center gap-3 px-4 py-2 text-sm">
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

                  {isAddingTier ? (
                    <div className="flex items-center gap-2 px-4 py-2">
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
                      <Button size="sm" onClick={() => handleAddTier(rule)} disabled={isPending || !tierForm.minQty || !tierForm.discount}>
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setTierForm({ mode: 'idle' })} disabled={isPending}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="px-4 py-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-auto px-0 py-0 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => setTierForm({ mode: 'adding', ruleId: rule.id, minQty: '', discount: '' })}
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
    </div>
  )
}

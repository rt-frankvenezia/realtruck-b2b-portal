'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PRICING_TARGET_TYPE_LABEL } from '@/lib/status-labels'
import type { Database, Tables } from '@/lib/database.types'

type PricingTargetType = Database['public']['Enums']['pricing_target_type']
const ALL_TARGET_TYPES: PricingTargetType[] = ['product-line', 'category', 'brand']

// Matches the priority order calculate_pricing_discount enforces server-side —
// shown here purely so admins understand why a rule may never take effect.
const PRIORITY_LABEL: Record<PricingTargetType, string> = {
  'product-line': '1st priority',
  category: '2nd priority',
  brand: '3rd priority',
}

export function PricingRuleManager({ pricingGroupId, rules }: { pricingGroupId: string; rules: Tables<'pricing_rules'>[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [targetType, setTargetType] = useState<PricingTargetType>('brand')
  const [targetValue, setTargetValue] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [discountPercent, setDiscountPercent] = useState('')

  function handleAdd() {
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

  function handleDelete(id: string) {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.from('pricing_rules').delete().eq('id', id)
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Rule removed')
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Target</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Discount</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules.map((rule) => (
            <TableRow key={rule.id}>
              <TableCell>{rule.display_name}</TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {PRICING_TARGET_TYPE_LABEL[rule.target_type]} ({PRIORITY_LABEL[rule.target_type]})
              </TableCell>
              <TableCell className="text-right">{rule.discount_percent}%</TableCell>
              <TableCell>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(rule.id)} disabled={isPending}>
                  Remove
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {rules.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                No rules yet — the base discount applies to everything.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="grid grid-cols-5 gap-2 rounded-md border p-3">
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
        <Input placeholder="Target value (e.g. are)" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} />
        <Input placeholder="Display name (e.g. A.R.E.)" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        <Input
          type="number"
          step="0.01"
          placeholder="Discount %"
          value={discountPercent}
          onChange={(e) => setDiscountPercent(e.target.value)}
        />
        <Button onClick={handleAdd} disabled={isPending || !targetValue.trim() || !displayName.trim() || !discountPercent}>
          Add Rule
        </Button>
      </div>
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
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

export function PricingGroupInfoForm({ group }: { group: Tables<'pricing_groups'> }) {
  const router = useRouter()
  const [name, setName] = useState(group.name)
  const [description, setDescription] = useState(group.description ?? '')
  const [status, setStatus] = useState<PricingGroupStatus>(group.status)
  const [effectiveDate, setEffectiveDate] = useState(group.effective_date)
  const [baseDiscount, setBaseDiscount] = useState(group.base_discount.toString())
  const [isPending, startTransition] = useTransition()

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
      <div className="flex justify-end">
        <Button size="sm" onClick={handleSave} disabled={isPending || !hasChanges || !name.trim()}>
          Save Changes
        </Button>
      </div>
    </div>
  )
}

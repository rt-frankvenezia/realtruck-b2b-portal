'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Tag, Trash2, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PRICING_TARGET_TYPE_LABEL } from '@/lib/status-labels'
import { PURCHASE_ACCESS_LABEL } from '@/lib/restrictions'
import type { Tables, Database } from '@/lib/database.types'
import type { PurchaseAccess } from '@/lib/restrictions'

type TargetType = Database['public']['Enums']['pricing_target_type']
type RestrictionRule = Tables<'restriction_rules'>

const ALL_TARGET_TYPES: TargetType[] = ['product-line', 'brand', 'category']

const PRIORITY_LABEL: Record<TargetType, string> = {
  'product-line': '1st priority (most specific)',
  brand: '2nd priority',
  category: '3rd priority',
}

export function RestrictionRuleManager({
  restrictionGroupId,
  rules,
  defaultAccess,
}: {
  restrictionGroupId: string
  rules: RestrictionRule[]
  defaultAccess: PurchaseAccess
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [addOpen, setAddOpen] = useState(false)
  const [targetType, setTargetType] = useState<TargetType>('brand')
  const [targetValue, setTargetValue] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [access, setAccess] = useState<PurchaseAccess>('allowed')

  const [editState, setEditState] = useState<
    { mode: 'idle' } | { mode: 'editing'; ruleId: string; access: PurchaseAccess }
  >({ mode: 'idle' })

  const sortedRules = [...rules].sort((a, b) => {
    const order: Record<TargetType, number> = { 'product-line': 0, brand: 1, category: 2 }
    return order[a.target_type] - order[b.target_type]
  })

  function handleAdd() {
    if (!targetValue.trim()) return
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.from('restriction_rules').insert({
        restriction_group_id: restrictionGroupId,
        target_type: targetType,
        target_value: targetValue.trim(),
        display_name: (displayName.trim() || targetValue.trim()),
        access,
      })
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Rule added')
      setTargetValue('')
      setDisplayName('')
      setAccess('allowed')
      setAddOpen(false)
      router.refresh()
    })
  }

  function handleDelete(id: string) {
    if (!window.confirm('Remove this restriction rule?')) return
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.from('restriction_rules').delete().eq('id', id)
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Rule removed')
      if (editState.mode === 'editing' && editState.ruleId === id) setEditState({ mode: 'idle' })
      router.refresh()
    })
  }

  function handleSaveEdit(ruleId: string) {
    if (editState.mode !== 'editing') return
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase
        .from('restriction_rules')
        .update({ access: editState.access })
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Rules override the default. Priority: Product Line → Brand → Category → Default
        </p>
        <Button size="sm" onClick={() => { setAddOpen(true); setEditState({ mode: 'idle' }) }} disabled={addOpen}>
          <Plus size={14} className="mr-1" />
          ADD RULE
        </Button>
      </div>

      {addOpen && (
        <div className="rounded-md border p-4">
          <p className="mb-3 font-semibold">New Restriction Rule</p>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Purchase Access *</Label>
              <Select value={access} onValueChange={(v) => setAccess(v as PurchaseAccess)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="allowed">Allowed</SelectItem>
                  <SelectItem value="not_allowed">Not Allowed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Scope *</Label>
              <div className="flex gap-2">
                <Select value={targetType} onValueChange={(v) => setTargetType(v as TargetType)}>
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
                  placeholder={targetType === 'brand' ? 'e.g. Retrax' : targetType === 'category' ? 'e.g. truck-bed-covers' : 'e.g. retraxpro-xr'}
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
              <Button size="sm" onClick={handleAdd} disabled={isPending || !targetValue.trim()}>
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setAddOpen(false); setTargetValue(''); setDisplayName(''); setAccess('allowed') }}
                disabled={isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {sortedRules.length === 0 ? (
        <p className="rounded-md border px-4 py-6 text-center text-sm text-muted-foreground">
          No rules yet — the default ({PURCHASE_ACCESS_LABEL[defaultAccess]}) applies to everything.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {sortedRules.map((rule) => {
            const isEditing = editState.mode === 'editing' && editState.ruleId === rule.id
            return (
              <div key={rule.id} className="rounded-md border">
                <div className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Select
                          value={editState.access}
                          onValueChange={(v) => setEditState({ ...editState, access: v as PurchaseAccess })}
                        >
                          <SelectTrigger className="h-8 w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="allowed">Allowed</SelectItem>
                            <SelectItem value="not_allowed">Not Allowed</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button size="sm" onClick={() => handleSaveEdit(rule.id)} disabled={isPending} className="h-8">
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditState({ mode: 'idle' })} disabled={isPending} className="h-8">
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <p className={`font-semibold ${rule.access === 'allowed' ? 'text-green-600' : 'text-destructive'}`}>
                        {PURCHASE_ACCESS_LABEL[rule.access]}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-muted-foreground">{PRIORITY_LABEL[rule.target_type]}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={isPending}
                      onClick={() => setEditState({ mode: 'editing', ruleId: rule.id, access: rule.access })}
                      title="Edit access"
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={isPending}
                      onClick={() => handleDelete(rule.id)}
                      title="Remove rule"
                    >
                      <Trash2 size={14} className="text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="border-t px-4 py-2">
                  <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                    <Tag size={10} />
                    {rule.display_name}
                    <span className="text-muted-foreground/60">({PRICING_TARGET_TYPE_LABEL[rule.target_type]})</span>
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="rounded-md bg-muted/40 px-4 py-3 text-sm">
        <span className="font-medium">Default: </span>
        <span className={defaultAccess === 'allowed' ? 'text-green-700' : 'text-destructive'}>
          {PURCHASE_ACCESS_LABEL[defaultAccess]}
        </span>
        <span className="ml-2 text-muted-foreground">— applies when no rule matches</span>
      </div>
    </div>
  )
}
